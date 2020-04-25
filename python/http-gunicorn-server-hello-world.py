# gunicorn --workers $(nproc) http-gunicorn-server:app

def app(environ, start_response):
    data = b'Hello, World!\n'

    start_response('200 OK', [
        ('Content-Type', 'text/plain')
    ])

    return iter([data])