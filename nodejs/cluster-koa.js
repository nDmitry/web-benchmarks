const cluster = require('cluster');
const Koa = require('koa');
const Router = require('@koa/router');
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
        const users = await common.getUsers();

        ctx.body = users;
    });

    app.use(router.routes())
    app.use(router.allowedMethods())
    app.listen(8000);
}
