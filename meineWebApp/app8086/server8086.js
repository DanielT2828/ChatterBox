const http = require('http');
const fs = require('fs');
const path = require('path');

const hostname = '0.0.0.0'; // Wichtig: Verwenden Sie 0.0.0.0 statt 127.0.0.1
const port = 8088;

const server = http.createServer((req, res) => {
    // Pfad zur index.html Datei
    const filePath = path.join(__dirname, 'index.html');

    // Lesen und Senden der index.html Datei
    fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
        if (err) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end('Fehler beim Laden der Seite');
        } else {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(data);
        }
    });
});

server.listen(port, hostname, () => {
    console.log(`Server läuft unter http://${hostname}:${port}/`);
});
