package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/jackc/pgx/v4/pgxpool"

	"github.com/nDmitry/web-benchmarks/golang/common"
)

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
		users, err := common.GetUsers(r.Context(), pool)

		if err != nil {
			log.Fatal(err)
		}

		resp, err := users.MarshalJSON()

		if err != nil {
			log.Fatal(err)
		}

		w.Header().Set("Content-Type", "application/json")

		if _, err := w.Write(resp); err != nil {
			log.Fatal(err)
		}
	})

	log.Fatal(http.ListenAndServe(":8000", nil))
}
