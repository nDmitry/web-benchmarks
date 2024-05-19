package common

import (
	"bytes"
	"context"
	"time"
	"unicode"

	"github.com/jackc/pgx/v4/pgxpool"
)

var PoolSize int = 100

type User struct {
	ID        int       `json:"id"`
	Username  string    `json:"username"`
	Name      string    `json:"name"`
	Sex       string    `json:"sex"`
	Address   string    `json:"address"`
	Mail      string    `json:"mail"`
	Birthdate time.Time `json:"birthdate"`
}

//easyjson:json
type Users []User

func GetUsers(ctx context.Context, pool *pgxpool.Pool) (Users, error) {
	rows, err := pool.Query(ctx, "SELECT * FROM \"user\";")

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	users := make(Users, 0, 100)

	for rows.Next() {
		user := User{}

		if err := rows.Scan(
			&user.ID, &user.Username, &user.Name, &user.Sex, &user.Address, &user.Mail, &user.Birthdate,
		); err != nil {
			return nil, err
		}

		user.Address = CaesarCipher(user.Address)
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func CaesarCipher(in string) string {
	key := 14
	var buf bytes.Buffer

	for _, r := range in {
		newByte := int(r)

		if newByte >= 0 && newByte <= unicode.MaxASCII {
			newByte += key

			if newByte > unicode.MaxASCII {
				newByte -= 26
			} else if newByte < 0 {
				newByte += 26
			}
		}

		buf.WriteByte(byte(newByte))
	}

	return buf.String()
}
