There are many benchmarks comparing different languages and platforms performance to each other, but not all of them are doing this right. It's easy to find benchmarks comparing Golang working on all cores with node.js started in a single process. Or utilizing DB connection pools in one language/framework and not doing it in another.

The goal of this project is to write simple and fare(-ish) benchmarks for a smaller set of languages I understand how to use efficiently and demonstrate that the difference in performance may not be that dramatic (how it is sometimes shown on the internet). No fine tuning is done to run each language/server at a maximum possible speed, rather they all run at default settings and use easily available features of their platforms.

## Notes

- Go can handle I/O in non-blocking fashion and schedule blocking operations to be run in parallel on different cores. node.js is using `libuv` for executing I/O operations asynchronously in a single threaded event loop. Python can run blocking I/O operations on threads or utilize its `asyncio` module similar to node.js approach. Both node.js and Python web servers should be run in several processes to handle CPU-bound tasks more efficiently.
- node.js is utilizing all available cores with `cluster` module or `pm2` cluster mode. node.js is handling I/O asynchronously by default with `libuv` under the hood.
- For the Python synchronous server variant I picked `gunicorn` (workers and threads are set to a number of cores available on the system).
- For the asynchronous Python server `uvicorn` is used with workers utilizing all CPU cores as well. I also test with two different event loop implementations: default `asyncio` loop and `uvloop`.
- Golang is scaling itself on all cores by default since Go 1.5, explicit `GOMAXPROCS` setting is used for clarity.
- PostgreSQL 16.3 is used as a database containing the same generated data set for all benchmarks. Servers connect to the database using connection pools (maxed at 100 connections) provided by DB libraries.
- Absolute results obtained don't matter and will vary a lot depending on your workload, this bench is about relative performance for the similar workload.
- For running the benchmarks I chose Apache HTTP server benchmarking tool (`ab`) because of its handling of TCP connections being more [realistic](http://gwan.com/en_apachebench_httperf.html) comparing to `wrk`.
- HTTP requests logging is always disabled.

## Workload

All benchmarks maintain a similar workload across languages, which includes:

- Handling HTTP requests and pooled database connections.
- CPU bound operations (e.g. serializing JSON, parsing HTTP headers, encrypting strings using Caesar cypher algorithm).
- Memory allocation and garbage collection (e.g. creating DTO-like structures for each row in the database and discarding them).

Basically, each benchmark is running on all cores with a database connection pool(s) and on each request it simply fetches a 100 fake users from the database, creates a class instance/structure for each row converting a datetime object to an ISO string and encrypting one of the fields with Caesar cypher, serializes resulting array to JSON and responds with this payload.

This gives us a near-100% CPU utilization for all languages used and measures both CPU and IO-bound performance. The workload between CPU and IO-bound tasks was adjusted so that neither of them become an obvious bottleneck.

## Running servers and benchmarks

Run `docker-compose up` in the root dir to create and initialize the DB.

### Servers

In MacOS use `sysctl -n hw.physicalcpu` instead of `nproc`.

Golang:

- `cd golang/...`
- `eval export $(cat ../../.env) && GOMAXPROCS=$(nproc) go run main.go`

node.js:

- `cd nodejs`
- `npm i`
- `eval export $(cat ../.env) && node cluster-http.js`
- `eval export $(cat ../.env) && pm2 start pm2-http.js --instances max`
- `eval export $(cat ../.env) && node cluster-express.js`
- `eval export $(cat ../.env) && node cluster-koa.js`
- `eval export $(cat ../.env) && node cluster-hapi.js`
- `eval export $(cat ../.env) && node cluster-fastify.js`

Python:

- `cd python`
- `python3 -m venv env`
- `source env/bin/activate`
- `pip install -r requirements.txt`
- `eval export $(cat ../.env) && gunicorn --workers $(nproc) --threads $(nproc) --log-level warning gunicorn-bare:app`
- `eval export $(cat ../.env) && gunicorn --workers $(nproc) --threads $(nproc) --log-level warning flask-app:app`
- `eval export $(cat ../.env) && uvicorn --workers $(nproc) --loop asyncio --log-level warning uvicorn-bare:app`
- `eval export $(cat ../.env) && uvicorn --workers $(nproc) --loop uvloop --log-level warning uvicorn-bare:app`
- `eval export $(cat ../.env) && gunicorn --workers $(nproc) --threads $(nproc) --log-level warning --worker-class aiohttp.GunicornWebWorker aiohttp-app:app`

### Benchmark

On MacOS ApacheBench is installed by default. On Linux it can be installed via a package manager, e.g.: `sudo apt install apache2-utils`

The bench was run using this command: `ab -n 1000 -c 128 http://127.0.0.1:8000/`
Results of a fifth run are used below.

## Results

Tests were executed on a MacBook Air M1 2020 with 16 Gb of RAM.

| Language/platform | Server/framework    | Requests per second | Time per request (ms) |
| ----------------- | ------------------- | ------------------: | --------------------: |
| Golang 1.22.3     | net/http, json      |                6671 |                 0.150 |
| Golang 1.22.3     | net/http, json, chi |                6177 |                 0.162 |
| Golang 1.22.3     | net/http, easyjson  |                7384 |                 0.135 |
| Golang 1.22.3     | fasthttp, easyjson  |                8054 |                 0.124 |
| node.js 22.2      | cluster, http       |                3950 |                 0.252 |
| node.js 22.2      | pm2, http           |                3949 |                 0.253 |
| node.js 22.2      | cluster, express 4  |                3467 |                 0.288 |
| node.js 22.2      | cluster, koa 2      |                3717 |                 0.269 |
| node.js 22.2      | cluster, hapi 19    |                3349 |                 0.299 |
| Python 3.12.3     | gunicorn            |                1994 |                 0.501 |
| Python 3.12.3     | gunicorn, flask     |                1931 |                 0.518 |
| Python 3.12.3     | uvicorn, asyncio    |                3486 |                 0.287 |
| Python 3.12.3     | uvicorn, uvloop     |                3664 |                 0.273 |
| Python 3.12.3     | gunicorn, aiohttp   |                3276 |                 0.305 |
