import express from "express";
import { createServer } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import { Server } from "socket.io";

const app = express();
const http = createServer(app);

const socketProxy = createProxyMiddleware("/socket", {
  target: "wss://webminer.moneroocean.stream/",
  changeOrigin: true,
  ws: true,
  logLevel: "debug",
});

app.use(socketProxy);
new Server(http, {
  destroyUpgrade: false,
  cors: {
    origin: "*",
  },
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
