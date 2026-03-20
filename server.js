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

// Serve frontend folder as static
app.use(express.static(path.join(__dirname, "frontend")));

// Send index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Setup WebSocket
setupWebSocket(wss);

// Start server
server.listen(8000, () => {
  console.log("HTTP + WS running on http://localhost:8000");
});