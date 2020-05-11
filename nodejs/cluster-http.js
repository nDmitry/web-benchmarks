const cluster = require('cluster');
const http = require('http');
const os = require('os');
const {Pool} = require('pg');

const cpus = os.cpus().length;
const poolSize = Math.floor(100 / cpus);

class User {
    constructor(obj) {
        this.username = obj.username;
        this.name = obj.name;
        this.sex = obj.sex;
        this.address = obj.address;
        this.mail = obj.mail;
        this.birthdate = obj.birthdate.toISOString();
    }
}

if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);

    for (let i = 0; i < cpus; i++) {
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
        min: poolSize,
        max: poolSize,
    });

    async function handle(req, res) {
        try {
            const result = await db.query('SELECT * FROM "user";');
            const users = result.rows.map((row) => new User(row))

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
