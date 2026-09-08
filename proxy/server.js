const http = require('http');
const net = require('net');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT || 10000);
const TARGET_HOST = process.env.TARGET_HOST || 'ArMaCraftnet.aternos.me';
const TARGET_PORT = Number(process.env.TARGET_PORT || 60107);

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/health') {
    res.writeHead(200, {'content-type':'text/plain; charset=utf-8'});
    res.end(`ArMaCraft WSS proxy OK\nTarget: ${TARGET_HOST}:${TARGET_PORT}\n`);
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  const tcp = new net.Socket();
  let closed = false;

  const closeBoth = () => {
    if (closed) return;
    closed = true;
    try { tcp.destroy(); } catch {}
    try { if (ws.readyState === ws.OPEN || ws.readyState === ws.CLOSING) ws.close(); } catch {}
  };

  tcp.setTimeout(120000, closeBoth);
  tcp.connect(TARGET_PORT, TARGET_HOST, () => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({type:'proxy-ready'}));
  });

  tcp.on('data', (chunk) => {
    if (ws.readyState === ws.OPEN) ws.send(chunk, { binary: true });
  });
  tcp.on('error', closeBoth);
  tcp.on('close', closeBoth);

  ws.on('message', (data, isBinary) => {
    if (closed) return;
    if (Buffer.isBuffer(data)) tcp.write(data);
    else if (isBinary) tcp.write(Buffer.from(data));
    else {
      // JSON control messages are ignored; the bridge forwards binary payloads only.
      try { const msg = JSON.parse(String(data)); if (msg.type === 'ping') ws.send(JSON.stringify({type:'pong'})); } catch {}
    }
  });
  ws.on('close', closeBoth);
  ws.on('error', closeBoth);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`WSS proxy listening on :${PORT}`);
  console.log(`TCP target ${TARGET_HOST}:${TARGET_PORT}`);
});
