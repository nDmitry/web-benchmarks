const cluster = require('cluster');
const http = require('http');
const {Pool} = require('pg');
const common = require('./common');

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    for (let i = 0; i < common.cpus; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died:`, code, signal);
    });
} else {
    const db = new Pool({
        host: 'localhost',
        port: process.env.PG_PORT,
        database: process.env.PG_DB,
        user: process.env.PG_USER,
        password: process.env.PG_PASS,
        min: common.poolSize,
        max: common.poolSize,
    });

    async function handle(req, res) {
        try {
            const result = await db.query('SELECT * FROM "user";');

            const users = result.rows.map((row) => {
                row.address = common.caesarCipher(row.address);

                return new common.User(row);
            });

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(users));
        } catch(e) {
            console.error(e);
            res.writeHead(500);
            res.end();
        }
    }

    http.createServer(handle).listen(8000);
}
