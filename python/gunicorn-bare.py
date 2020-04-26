import os

import orjson
import psycopg2.extras
import psycopg2.pool

from common import User, pool_size

db = psycopg2.pool.ThreadedConnectionPool(
    pool_size,
    pool_size,
    host=f'localhost',
    dbname='fakes',
    user=os.getenv('PG_USER'),
    password=os.getenv('PG_PASS')
)


def get_users():
    query = 'SELECT * FROM "user";'
    conn = db.getconn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute(query)

    users = [User(
        username=row['username'],
        name=row['name'],
        sex=row['sex'],
        address=row['address'],
        mail=row['mail'],
        birthdate=row['birthdate'].isoformat(),
    ) for row in cur]

    cur.close()
    db.putconn(conn)

    return users


def app(environ, start_response):
    users_response = orjson.dumps(get_users(), option=orjson.OPT_SERIALIZE_DATACLASS)

    start_response('200 OK', [
        ('Content-Type', 'application/json')
    ])

    return iter([users_response])
