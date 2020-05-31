const cluster = require('cluster');
const Hapi = require('@hapi/hapi');
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
    async function handler() {
        const users = await common.getUsers();

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
