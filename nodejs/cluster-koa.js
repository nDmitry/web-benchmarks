const cluster = require('cluster');
const Koa = require('koa');
const Router = require('@koa/router');
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

    const app = new Koa();
    const router = new Router();

    app.use(async (ctx, next) => {
        try {
            await next();
        } catch (err) {
            ctx.status = err.status || 500;
            ctx.body = err.message;
            ctx.app.emit('error', err, ctx);
        }
    });

    router.get('/', async (ctx) => {
        const result = await db.query('SELECT * FROM "user";');

        const users = result.rows.map((row) => {
            row.address = common.caesarCipher(row.address);

            return new common.User(row);
        });

        ctx.body = users;
    });

    app.use(router.routes())
    app.use(router.allowedMethods())
    app.listen(8000);
}
