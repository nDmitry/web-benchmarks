There are many benchmarks comparing different languages and platforms performance to each other, but not all of them are doing this right. It's easy to find benchmarks comparing Golang working on all cores with node.js started in a single process. Or utilising DB connection pools in one language/framework and not doing it in another.

The goal of this project is to write simple and fare(-ish) benchmarks for a smaller set of languages I understand how to use efficiently and demonstrate that the difference in performance may not be that dramatic (how it is sometimes shown on the internet). No fine tuning is done to run each language/server at a maximum possible speed, rather they all run at default settings and use easily available features of their platforms.

## Notes

- Go can handle I/O in non-blocking fashion and schedule blocking operations to be run in parallel on different cores. node.js is using `libuv` for executing I/O operations asynchronously in a single threaded event loop. Python can run blocking I/O operations on threads or utilize its `asyncio` module similar to node.js approach. Both node.js and Python web servers should be run in several processes to handle CPU-bound tasks more efficiently.
- node.js is utilizing all available cores with `cluster` module or `pm2` cluster mode. node.js is handling I/O asynchronously by default with `libuv` under the hood.
- For the Python synchronous server variant I picked `gunicorn` (workers and threads are set to a number of cores available on the system).
- For the asynchronous Python server `uvicorn` is used with workers utilizing all CPU cores as well. I also test with two different event loop implementations: default `asyncio` loop and `uvloop`.
- Golang is scaling itself on all cores by default since Go 1.5, explicit `GOMAXPROCS` setting is used for clarity.
- PostgreSQL 9.6 is used as a database containing the same generated data set for all benchmarks. Servers connect to the database using connection pools (maxed at 100 connections) provided by DB libraries.
- Absolute results obtained don't matter and will vary a lot depending on your workload, this bench is about relative performance for the similar workload.
- For running the benchmarks I chose Apache HTTP server benchmarking tool (`ab`) because of its handling of TCP connections being more [realistic](http://gwan.com/en_apachebench_httperf.html) comparing to `wrk`.
- By default `net.core.somaxconn` in Linux is set to 128, so all the tests are running at a concurrency level of 128 (`ab -c` option).
- HTTP requests logging is always disabled.

## Workload

All benchmarks maintain a similar workload across languages, which includes:

- Handling HTTP requests and pooled database connections.
- CPU bound operations (e.g. serializing JSON, parsing HTTP headers).
- Memory allocation and garbage collection (e.g. creating DTO-like structures for each row in the database and discarding them).

Basically, each benchmark is running on all cores with a database connection pool(s) and on each request it simply fetches a 1000 fake users from the database, creates a class instance/structure for each row converting a datetime object to ISO string, serializes resulting array to JSON and responds with this payload. This gives near-100% CPU utilization for all languages used.

## Running servers and benchmarks

### Servers

Golang:
- `PG_USER= PG_PASS= GOMAXPROCS=$(nproc) go run http/main.go`

node.js:
- `PG_USER= PG_PASS= node cluster-http.js`
- `PG_USER= PG_PASS= pm2 start pm2-http.js --instances max`

Python:
- `PG_USER= PG_PASS= gunicorn --workers $(nproc) --threads $(nproc) --log-level warning gunicorn-bare:app`
- `PG_USER= PG_PASS= uvicorn --workers $(nproc) --loop asyncio --log-level warning uvicorn-bare:app`
- `PG_USER= PG_PASS= uvicorn --workers $(nproc) --loop uvloop --log-level warning uvicorn-bare:app`

### Benchmark

`ab -n 10000 -c 128 http://localhost:8000/`

## Results

### Specs

Tests were executed on a virtual machine running Ubuntu 19.10 in VirtualBox:

- CPU: AMD Ryzen 5 2600 (6 out of 12 cores available to the VM)
- RAM: Corsair CMW16GX4M2C3000C15 DDR4-3000 16gb (8gb available to the VM)
- SSD: Samsung SSD 970 EVO Plus

### Golang 1.14

```
Concurrency Level:      128
Time taken for tests:   7.822 seconds
Complete requests:      10000
Failed requests:        0
Total transferred:      1825660000 bytes
HTML transferred:       1824780000 bytes
Requests per second:    1278.47 [#/sec] (mean)
Time per request:       100.120 [ms] (mean)
Time per request:       0.782 [ms] (mean, across all concurrent requests)
Transfer rate:          227934.10 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.2      0       3
Processing:     3   99  72.0     87     582
Waiting:        3   99  71.8     86     582
Total:          3  100  72.0     87     582

Percentage of the requests served within a certain time (ms)
  50%     87
  66%    112
  75%    136
  80%    150
  90%    194
  95%    242
  98%    290
  99%    333
 100%    582 (longest request)
```

### node.js 14

`cluster` module:

```
Concurrency Level:      128
Time taken for tests:   11.802 seconds
Complete requests:      10000
Failed requests:        0
Total transferred:      1865840000 bytes
HTML transferred:       1864770000 bytes
Requests per second:    847.32 [#/sec] (mean)
Time per request:       151.064 [ms] (mean)
Time per request:       1.180 [ms] (mean, across all concurrent requests)
Transfer rate:          154391.16 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.2      0       2
Processing:    23  150  11.9    147     293
Waiting:       23  148  11.7    146     291
Total:         26  150  12.0    147     294

Percentage of the requests served within a certain time (ms)
  50%    147
  66%    150
  75%    152
  80%    154
  90%    159
  95%    165
  98%    175
  99%    192
 100%    294 (longest request)
```

pm2:

```
Concurrency Level:      128
Time taken for tests:   12.512 seconds
Complete requests:      10000
Failed requests:        0
Total transferred:      1865840000 bytes
HTML transferred:       1864770000 bytes
Requests per second:    799.26 [#/sec] (mean)
Time per request:       160.148 [ms] (mean)
Time per request:       1.251 [ms] (mean, across all concurrent requests)
Transfer rate:          145634.38 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.2      0       2
Processing:    26  159  13.5    156     291
Waiting:       26  157  13.4    154     291
Total:         27  159  13.6    156     293

Percentage of the requests served within a certain time (ms)
  50%    156
  66%    160
  75%    164
  80%    167
  90%    174
  95%    180
  98%    189
  99%    201
 100%    293 (longest request)
```

### Python 3.8

gunicorn:

```
Concurrency Level:      128
Time taken for tests:   25.031 seconds
Complete requests:      10000
Failed requests:        0
Total transferred:      1816090000 bytes
HTML transferred:       1814770000 bytes
Requests per second:    399.50 [#/sec] (mean)
Time per request:       320.402 [ms] (mean)
Time per request:       2.503 [ms] (mean, across all concurrent requests)
Transfer rate:          70852.03 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.2      0       4
Processing:    11  318 185.9    288     946
Waiting:       11  311 185.8    282     927
Total:         11  318 185.9    288     946

Percentage of the requests served within a certain time (ms)
  50%    288
  66%    365
  75%    412
  80%    448
  90%    600
  95%    702
  98%    788
  99%    840
 100%    946 (longest request)
```

uvicorn (`asyncio`):

```
Concurrency Level:      128
Time taken for tests:   10.081 seconds
Complete requests:      10000
Failed requests:        0
Total transferred:      1816240000 bytes
HTML transferred:       1814910000 bytes
Requests per second:    991.93 [#/sec] (mean)
Time per request:       129.041 [ms] (mean)
Time per request:       1.008 [ms] (mean, across all concurrent requests)
Transfer rate:          175936.00 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.2      0       3
Processing:     5  128  62.7    120     479
Waiting:        5  111  58.6    101     462
Total:          5  128  62.7    120     480

Percentage of the requests served within a certain time (ms)
  50%    120
  66%    142
  75%    160
  80%    172
  90%    206
  95%    250
  98%    288
  99%    322
 100%    480 (longest request)
```

uvicorn (`uvloop`):

```
Concurrency Level:      128
Time taken for tests:   9.667 seconds
Complete requests:      10000
Failed requests:        0
Total transferred:      1816240000 bytes
HTML transferred:       1814910000 bytes
Requests per second:    1034.46 [#/sec] (mean)
Time per request:       123.736 [ms] (mean)
Time per request:       0.967 [ms] (mean, across all concurrent requests)
Transfer rate:          183479.00 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0    0   0.4      0       5
Processing:     4  122  50.5    117     445
Waiting:        4  109  48.5    102     432
Total:          4  123  50.6    117     445

Percentage of the requests served within a certain time (ms)
  50%    117
  66%    136
  75%    148
  80%    158
  90%    183
  95%    217
  98%    254
  99%    277
 100%    445 (longest request)
```
