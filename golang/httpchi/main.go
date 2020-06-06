package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/go-chi/chi"
	"github.com/jackc/pgx/v4/pgxpool"

	"github.com/nDmitry/web-benchmarks/golang/common"
)

func getUsers(pool *pgxpool.Pool) ([]common.User, error) {
	rows, err := pool.Query(context.Background(), "SELECT * FROM \"user\";")

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	users := make([]common.User, 0, 100)

	for rows.Next() {
		user := common.User{}

		if err := rows.Scan(
			&user.ID, &user.Username, &user.Name, &user.Sex, &user.Address, &user.Mail, &user.Birthdate,
		); err != nil {
			return nil, err
		}

		user.Address = common.CaesarCipher(user.Address)
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func main() {
	dsn := []string{
		fmt.Sprintf("user=%s", os.Getenv("PG_USER")),
		fmt.Sprintf("password=%s", os.Getenv("PG_PASS")),
		fmt.Sprintf("host=%s", "localhost"),
		fmt.Sprintf("port=%s", os.Getenv("PG_PORT")),
		fmt.Sprintf("dbname=%s", os.Getenv("PG_DB")),
		fmt.Sprintf("pool_min_conns=%d", common.PoolSize),
		fmt.Sprintf("pool_max_conns=%d", common.PoolSize),
	}

	pool, err := pgxpool.Connect(context.Background(), strings.Join(dsn, " "))

	if err != nil {
		log.Fatal(err)
	}

	r := chi.NewRouter()

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		users, err := getUsers(pool)

		if err != nil {
			log.Fatal(err)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(users)
	})

	log.Fatal(http.ListenAndServe(":8000", r))
}
