import os

from flask import Flask
import orjson
import psycopg2.extras
import psycopg2.pool

from common import User, pool_size, caesarCipher


app = Flask(__name__)

db = psycopg2.pool.ThreadedConnectionPool(
    pool_size,
    pool_size,
    host=f'localhost',
    port=os.getenv('PG_PORT'),
    dbname=os.getenv('PG_DB'),
    user=os.getenv('PG_USER'),
    password=os.getenv('PG_PASS')
)


def get_users():
    query = 'SELECT * FROM "user";'
    conn = db.getconn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(query)

    users = [User(
        id=row['id'],
        username=row['username'],
        name=row['name'],
        sex=row['sex'],
        address=caesarCipher(row['address']),
        mail=row['mail'],
        birthdate=row['birthdate'].isoformat(),
    ) for row in cur]

    cur.close()
    db.putconn(conn)

    return users


@app.route('/')
def handler():
    users_response = orjson.dumps(get_users(), option=orjson.OPT_SERIALIZE_DATACLASS)

    return users_response, 200, {'Content-Type': 'application/json'}
