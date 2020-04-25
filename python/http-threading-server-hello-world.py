# python http-threading-server.py

from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'Hello, World!')


    def log_message(self, format, *args):
        return

def run():
    ThreadingHTTPServer(('', 8000), Handler).serve_forever()


if __name__ == '__main__':
    run()
