const http = require('http');
const net = require('net');
const express = require('express');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = Number(process.env.PORT || 10000);
const HOST = process.env.HOST || '0.0.0.0';
const MC_HOST = process.env.MC_HOST || 'ArMaCraftnet.aternos.me';
const MC_PORT = Number(process.env.MC_PORT || 60107);
const WS_PATH = process.env.WS_PATH || '/arma';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '';

app.get('/', (_req, res) => res.json({ ok: true, service: 'mainmet ArMaCraft WSS proxy', path: WS_PATH, target: `${MC_HOST}:${MC_PORT}` }));
app.get('/health', (_req, res) => res.status(200).send('ok'));

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true, maxPayload: 2 * 1024 * 1024 });

function allowed(req) {
  if (!ALLOWED_ORIGIN) return true;
  const origin = req.headers.origin || '';
  return origin === ALLOWED_ORIGIN;
}

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname !== WS_PATH || !allowed(req)) {
    socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
});

wss.on('connection', (ws) => {
  const tcp = net.createConnection({ host: MC_HOST, port: MC_PORT });
  let closed = false;

  const shutdown = () => {
    if (closed) return;
    closed = true;
    try { tcp.destroy(); } catch {}
    try { if (ws.readyState === ws.OPEN || ws.readyState === ws.CLOSING) ws.close(); } catch {}
  };

  tcp.setTimeout(120000);
  tcp.on('connect', () => {});
  tcp.on('data', data => {
    if (ws.readyState === ws.OPEN) ws.send(data, { binary: true });
  });
  tcp.on('timeout', shutdown);
  tcp.on('error', shutdown);
  tcp.on('close', shutdown);

  ws.on('message', (data, isBinary) => {
    if (closed || !tcp.writable) return;
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
    tcp.write(buf);
  });
  ws.on('close', shutdown);
  ws.on('error', shutdown);
});

server.listen(PORT, HOST, () => {
  console.log(`ArMaCraft WSS proxy listening on ${HOST}:${PORT}${WS_PATH}`);
  console.log(`TCP target: ${MC_HOST}:${MC_PORT}`);
});
