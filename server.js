import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { setupWebSocket } from "./src/routes/webSocket.js";

const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server });

const PORT = 8000;

app.get("/", (req, res) => {
    res.send("Server is running");
});

setupWebSocket(wss);

server.listen(PORT, () => {
    console.log(`HTTP + WS server running on http://localhost:${PORT}`);
});