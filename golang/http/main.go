package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/pgxpool"

	"web-benchmarks/golang/common"
)

func getUsers(pool *pgxpool.Pool) ([]common.User, error) {
	var id int
	var username, name, sex, address, mail *string
	var birthdate time.Time

	rows, err := pool.Query(context.Background(), "SELECT * FROM \"user\";")

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	users := make([]common.User, 0)

	for rows.Next() {
		err := rows.Scan(&id, &username, &name, &sex, &address, &mail, &birthdate)

		if err != nil {
			return nil, err
		}

		users = append(users, common.User{
			Username:  *username,
			Name:      *name,
			Sex:       *sex,
			Address:   *address,
			Mail:      *mail,
			Birthdate: birthdate.Format(time.RFC3339),
		})
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

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		users, err := getUsers(pool)

		if err != nil {
			log.Fatal(err)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(users)
	})

	log.Fatal(http.ListenAndServe(":8000", nil))
}
