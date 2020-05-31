import os

from aiohttp import web
import asyncpg
import orjson

from common import User, pool_size, caesarCipher


async def init_pg(app):
    app['pg'] = await asyncpg.create_pool(
        min_size=pool_size,
        max_size=pool_size,
        host=f'localhost',
        port=os.getenv('PG_PORT'),
        database=os.getenv('PG_DB'),
        user=os.getenv('PG_USER'),
        password=os.getenv('PG_PASS')
    )


async def handler(request):
    async with request.app['pg'].acquire() as conn:
        rows = await conn.fetch('SELECT * FROM "user";')

    users = [User(
        id=row['id'],
        username=row['username'],
        name=row['name'],
        sex=row['sex'],
        address=caesarCipher(row['address']),
        mail=row['mail'],
        birthdate=row['birthdate'].isoformat(),
    ) for row in rows]

    result = orjson.dumps(users, option=orjson.OPT_SERIALIZE_DATACLASS)

    return web.Response(body=result, content_type='application/json')

app = web.Application()

app.router.add_get('/', handler)
app.on_startup.append(init_pg)
