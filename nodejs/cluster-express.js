const cluster = require('cluster');
const express = require('express');
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
    const app = express();

    async function handler(req, res, next) {
        try {
            const users = await common.getUsers();

            res.json(users);
        } catch(e) {
            console.error(e);
            next(e);
        }
    }

    app.get('/', handler);
    app.listen(8000);
}
