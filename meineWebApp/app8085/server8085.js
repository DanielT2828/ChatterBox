const http = require('http');

const hostname = '0.0.0.0'; // Wichtig: Verwenden Sie 0.0.0.0 statt 127.0.0.1
const port = 8087;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hallo Welt von Server 8088\n');
});

server.listen(port, hostname, () => {
  console.log(`Server läuft unter http://${hostname}:${port}/`);
});
