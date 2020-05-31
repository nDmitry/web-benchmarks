const cluster = require('cluster');
const express = require('express');
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

    const app = express();

    async function handle(req, res, next) {
        try {
            const result = await db.query('SELECT * FROM "user";');

            const users = result.rows.map((row) => {
                row.address = common.caesarCipher(row.address);

                return new common.User(row);
            });

            res.json(users);
        } catch(e) {
            console.error(e);
            next(e);
        }
    }

    app.get('/', handle);
    app.listen(8000);
}
