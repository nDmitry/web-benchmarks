const http = require('http');
const common = require('./common');

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
