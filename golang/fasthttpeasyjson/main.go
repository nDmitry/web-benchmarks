package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/valyala/fasthttp"

	"github.com/nDmitry/web-benchmarks/golang/common"
)

func getUsers(pool *pgxpool.Pool) (common.Users, error) {
	rows, err := pool.Query(context.Background(), "SELECT * FROM \"user\" LIMIT;")

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	users := make(common.Users, 0, 100)

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

	log.Fatal(fasthttp.ListenAndServe(":8000", func(ctx *fasthttp.RequestCtx) {
		users, err := getUsers(pool)
		resp, err := users.MarshalJSON()

		if err != nil {
			log.Fatal(err)
		}

		ctx.Response.Header.Set("Content-Type", "application/json")
		ctx.SetBody(resp)
	}))
}
