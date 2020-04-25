# uvicorn --workers $(nproc) --loop asyncio --log-level warning http-uvicorn-server:app
# uvicorn --workers $(nproc) --loop uvloop --log-level warning http-uvicorn-server:app

async def app(scope, receive, send):
    await send({
        'type': 'http.response.start',
        'status': 200,
        'headers': [
            [b'content-type', b'text/plain'],
        ]
    })

    await send({
        'type': 'http.response.body',
        'body': b'Hello, World!',
    })
