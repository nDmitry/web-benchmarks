package common

var PoolSize int = 100

type User struct {
	Username  string `json:"username"`
	Name      string `json:"name"`
	Sex       string `json:"sex"`
	Address   string `json:"address"`
	Mail      string `json:"mail"`
	Birthdate string `json:"birthdate"`
}
