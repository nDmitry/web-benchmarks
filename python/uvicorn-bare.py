import os

import asyncpg
import orjson

from common import User, pool_size


class App:
    db = None

    async def get_users(self):
        async with self.db.acquire() as conn:
            rows = await conn.fetch('SELECT * FROM "user";')

        return [User(
            username=row['username'],
            name=row['name'],
            sex=row['sex'],
            address=row['address'],
            mail=row['mail'],
            birthdate=row['birthdate'].isoformat(),
        ) for row in rows]

    async def __call__(self, scope, receive, send):
        if self.db is None:
            self.db = await asyncpg.create_pool(
                min_size=pool_size,
                max_size=pool_size,
                host=f'localhost',
                port=os.getenv('PG_PORT'),
                database=os.getenv('PG_DB'),
                user=os.getenv('PG_USER'),
                password=os.getenv('PG_PASS')
            )

        assert scope['type'] == 'http'

        users = await self.get_users()
        users_response = orjson.dumps(users, option=orjson.OPT_SERIALIZE_DATACLASS)

        await send({
            'type': 'http.response.start',
            'status': 200,
            'headers': [
                [b'content-type', b'application/json'],
            ]
        })

        await send({
            'type': 'http.response.body',
            'body': users_response,
        })


app = App()
