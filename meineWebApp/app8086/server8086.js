const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '0.0.0.0'; //Nicht 127.0.0.1
const port = 8088;

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

    // Einfache Route für /login
    if (req.url === '/login') {
        filePath = path.join(__dirname, 'login.html');
    }

    fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
        if (err) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Seite nicht gefunden');
        } else {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
        }
    });
});

server.listen(port, hostname, () => {
    console.log(`Server läuft unter http://${hostname}:${port}/`);
});
