There are many benchmarks comparing different languages and platforms performance to each other, but not all of them are doing this right. It's easy to find benchmarks comparing Golang working on all cores with node.js started in a single process. Or utilizing DB connection pools in one language/framework and not doing it in another.

The goal of this project is to write simple and fare(-ish) benchmarks for a smaller set of languages I understand how to use efficiently and demonstrate that the difference in performance may not be that dramatic (how it is sometimes shown on the internet). No fine tuning is done to run each language/server at a maximum possible speed, rather they all run at default settings and use easily available features of their platforms.

## Notes

- Go can handle I/O in non-blocking fashion and schedule blocking operations to be run in parallel on different cores. node.js is using `libuv` for executing I/O operations asynchronously in a single threaded event loop. Python can run blocking I/O operations on threads or utilize its `asyncio` module similar to node.js approach. Both node.js and Python web servers should be run in several processes to handle CPU-bound tasks more efficiently.
- node.js is utilizing all available cores with `cluster` module or `pm2` cluster mode. node.js is handling I/O asynchronously by default with `libuv` under the hood.
- For the Python synchronous server variant I picked `gunicorn` (workers and threads are set to a number of cores available on the system).
- For the asynchronous Python server `uvicorn` is used with workers utilizing all CPU cores as well. I also test with two different event loop implementations: default `asyncio` loop and `uvloop`.
- Golang is scaling itself on all cores by default since Go 1.5, explicit `GOMAXPROCS` setting is used for clarity.
- PostgreSQL 12.2 is used as a database containing the same generated data set for all benchmarks. Servers connect to the database using connection pools (maxed at 100 connections) provided by DB libraries.
- Absolute results obtained don't matter and will vary a lot depending on your workload, this bench is about relative performance for the similar workload.
- For running the benchmarks I chose Apache HTTP server benchmarking tool (`ab`) because of its handling of TCP connections being more [realistic](http://gwan.com/en_apachebench_httperf.html) comparing to `wrk`.
- By default `net.core.somaxconn` in Linux is set to 128, so all the tests are running at a concurrency level of 128 (`ab -c` option).
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

Golang:
- `cd golang/http`
- `cd golang/httpeasyjson`
- `export $(cat ../../.env | xargs) && GOMAXPROCS=$(nproc) go run main.go`

node.js:
- `cd nodejs`
- `npm i`
- `export $(cat ../.env | xargs) && node cluster-http.js`
- `export $(cat ../.env | xargs) && pm2 start pm2-http.js --instances max`
- `export $(cat ../.env | xargs) && node cluster-express.js`

Python:
- `cd python`
- `python -m venv env`
- `source env/bin/activate`
- `pip install -r requirements.txt`
- `export $(cat ../.env | xargs) && gunicorn --workers $(nproc) --threads $(nproc) --log-level warning gunicorn-bare:app`
- `export $(cat ../.env | xargs) && uvicorn --workers $(nproc) --loop asyncio --log-level warning uvicorn-bare:app`
- `export $(cat ../.env | xargs) && uvicorn --workers $(nproc) --loop uvloop --log-level warning uvicorn-bare:app`
- `export $(cat ../.env | xargs) && gunicorn --workers $(nproc) --threads $(nproc) --log-level warning flask-app:app`

### Benchmark

`sudo apt install apache2-utils`
`ab -n 10000 -c 128 http://localhost:8000/`

Results of a third run are used below.

## Results

### Specs

Tests were executed on a virtual machine running Ubuntu 19.10 in VirtualBox:

- CPU: AMD Ryzen 5 2600 (6 out of 12 cores available to the VM)
- RAM: Corsair CMW16GX4M2C3000C15 DDR4-3000 16gb (8gb available to the VM)
- SSD: Samsung SSD 970 EVO Plus

| Language/platform | Server/framework   | Requests per second  | Time per request (ms) |
| ----------------- | ------------------ | --------------------:| ---------------------:|
| Golang 1.14       | net/http           | 7619                 | 0.131                 |
| Golang 1.14       | net/http, easyjson | 15956                | 0.063                 |
| node.js 14.3      | cluster, http      | 3685                 | 0.271                 |
| node.js 14.3      | pm2, http          | 3599                 | 0.278                 |
| node.js 14.3      | cluster, express   | 2983                 | 0.340                 |
| Python 3.8        | gunicorn           | 1532                 | 0.652                 |
| Python 3.8        | gunicorn/flask     | 1413                 | 0.708                 |
| Python 3.8        | uvicorn/asyncio    | 2517                 | 0.397                 |
| Python 3.8        | uvicorn/uvloop     | 2765                 | 0.362                 |
