import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { setupWebSocket } from "./src/routes/webSocket.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server });

// ✅ serve frontend
app.use(express.static(path.join(__dirname, "frontend")));

setupWebSocket(wss);

server.listen(8000, () => {
  console.log("HTTP + WS running on http://localhost:8000");
});