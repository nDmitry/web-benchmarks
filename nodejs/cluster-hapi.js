const cluster = require('cluster');
const Hapi = require('@hapi/hapi');
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

    async function handler() {
        const result = await db.query('SELECT * FROM "user";');

        const users = result.rows.map((row) => {
            row.address = common.caesarCipher(row.address);

            return new common.User(row);
        });

        return users;
    }

    async function init() {
        const server = Hapi.server({port: 8000});

        server.route({
            method: 'GET',
            path: '/',
            handler,
        });

        await server.start();
    };

    process.on('unhandledRejection', (e) => {
        console.error(e);
        process.exit(1);
    });

    init();
}
