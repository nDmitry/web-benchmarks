const cluster = require('cluster');
const http = require('http');
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

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(users));
        } catch(e) {
            console.error(e);
            res.writeHead(500);
            res.end();
        }
    }

    http.createServer(handler).listen(8000);
}
