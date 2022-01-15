const cluster = require('cluster');
const fastify = require('fastify');
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
    async function handler(req, res) {
        try {
            const users = await common.getUsers();

            res.send(users);
        } catch(e) {
            console.error(e);
            res.code(500);
        }
    }

    const server = fastify()

    server.listen(8000);
    server.get('/', handler)
}
