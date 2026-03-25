import express from "express";
import bcrypt from 'bcrypt';
import crypto from  'crypto';
import http from "http";
import { WebSocketServer } from "ws";
import { setupWebSocket } from "./src/routes/webSocket.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

app.use(express.json());

const users = new Map();
const sessions = new Map();

app.post('/register', (req, res) =>{
  const {username, password} = req.body;
  if(!username || !password) {
    return res.json({ success: false, message: "Username and Password is required"})
  }
  if(users.has(username)) {
    return res.json({ success: false, message: "User already exists"})
  }
  const hash = bcrypt.hashSync(password, 10)
  users.set(username, hash);
  res.json({ success: true, message: "User Registered Successfully"});
});

app.post('/login', (req, res) => {
  const { username, password} = req.body;
  if(!username || !password) {
    return res.json({ success: false, message: "Username and password required"});
  }
  const hash = users.get(username);
  if(!hash || !bcrypt.compareSync(password, hash)) {
    return res.json({ success: false, message:"invalid credentials"})
  }
  const token = crypto.randomUUID();
  sessions.set(username, token);
  res.json({ success: true, message: " login successful!!!", token });
})

//websocket setup
const wss = new WebSocketServer({ server });

//  serve frontend
app.use(express.static(path.join(__dirname, "frontend")));

setupWebSocket(wss);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

server.listen(8000, () => {
  console.log("HTTP + WS running on http://localhost:8000");
});

export {sessions};