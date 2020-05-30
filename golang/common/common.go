package common

import (
	"bytes"
	"time"
	"unicode"
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
