import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { setupWebSocket } from "./src/routes/webSocket.js";

const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server });

app.get("/", (req, res) => {
  res.send("Server running");
});

setupWebSocket(wss);

server.listen(8000, () => {
  console.log("HTTP + WS running on http://localhost:8000");
});