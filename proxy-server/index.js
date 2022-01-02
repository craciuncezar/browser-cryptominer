const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io");
const { createProxyMiddleware } = require("http-proxy-middleware");

const socketProxy = createProxyMiddleware("/websocket", {
  target: "wss://webminer.moneroocean.stream/",
  changeOrigin: true,
  ws: true,
  logLevel: "debug",
});

app.use(socketProxy);
app.use(express.static("../dist"));
io(http);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
