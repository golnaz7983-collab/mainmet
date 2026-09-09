import http from "node:http";
import net from "node:net";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 10000);
const MC_HOST = process.env.MC_HOST || "ArMaCraftnet.aternos.me";
const MC_PORT = Number(process.env.MC_PORT || 60107);
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://golnaz7983-collab.github.io";
const MAX_CONNECTIONS = Number(process.env.MAX_CONNECTIONS || 12);

let active = 0;

const httpServer = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({
      ok: true,
      service: "ArMaCraft WSS Proxy",
      target: `${MC_HOST}:${MC_PORT}`,
      activeConnections: active
    }));
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 8 * 1024 * 1024 });

httpServer.on("upgrade", (req, socket, head) => {
  const origin = req.headers.origin || "";
  if (origin && origin !== ALLOWED_ORIGIN) {
    socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }
  if (active >= MAX_CONNECTIONS) {
    socket.write("HTTP/1.1 503 Service Unavailable\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }

  const url = new URL(req.url || "/", "http://proxy.local");
  if (url.pathname !== "/arma") {
    socket.write("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, ws => wss.emit("connection", ws, req));
});

wss.on("connection", (ws) => {
  active++;
  let closed = false;
  const mc = net.createConnection({ host: MC_HOST, port: MC_PORT });

  const closeBoth = () => {
    if (closed) return;
    closed = true;
    active = Math.max(0, active - 1);
    try { mc.destroy(); } catch {}
    try { ws.close(); } catch {}
  };

  mc.setTimeout(30000);
  mc.on("connect", () => {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "proxy", status: "connected" }));
  });
  mc.on("data", data => {
    if (ws.readyState === ws.OPEN) ws.send(data, { binary: true });
  });
  mc.on("timeout", closeBoth);
  mc.on("error", closeBoth);
  mc.on("close", closeBoth);

  ws.on("message", (data, isBinary) => {
    if (closed) return;
    if (isBinary || Buffer.isBuffer(data)) {
      mc.write(data);
      return;
    }
    try {
      const msg = JSON.parse(data.toString());
      if (msg?.type === "ping") ws.send(JSON.stringify({ type: "pong" }));
    } catch {
      // Ignore non-binary control text. Minecraft traffic must be binary.
    }
  });

  ws.on("close", closeBoth);
  ws.on("error", closeBoth);
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`ArMaCraft WSS proxy listening on ${PORT}`);
  console.log(`Minecraft target: ${MC_HOST}:${MC_PORT}`);
});
