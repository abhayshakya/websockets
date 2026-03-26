import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { setupWebSocket } from "./src/routes/webSocket.js";
import path from "path";
import { fileURLToPath } from "url";
import loginRoute from "./src/routes/login.js"
import  registerRoute  from "./src/routes/register.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(express.json());

const users = new Map();

//websocket setup

const wss = new WebSocketServer({ server });

//  serve frontend
app.use(express.static(path.join(__dirname, "frontend")));

app.use("/login", loginRoute);
app.use("/register", registerRoute);

setupWebSocket(wss);

// Serve frontend folder as static
app.use(express.static(path.join(__dirname, "frontend")));

// Send index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`HTTP + WS running on http://localhost:${PORT}`);
});

export { users };