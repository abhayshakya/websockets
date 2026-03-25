import WebSocket from "ws";
import readline from "readline";
import fetch from "node-fetch"; // to call REST login

// ---- CONFIG ----
const REST_URL = "http://localhost:8000/login"; // REST login endpoint
const WS_URL = "ws://localhost:8000";           // WebSocket server

// ---- STATE ----
let username = "";
let token = "";
let currentRoom = "";

// ---- LOGIN FIRST ----
async function loginUser() {
  const rlLogin = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rlLogin.question("Username: ", (u) => {
      rlLogin.question("Password: ", async (p) => {
        username = u.trim();

        try {
          // Auto-register the user so that "invalid credentials" won't happen 
          // on a fresh server restart where the in-memory database is empty.
          await fetch("http://localhost:8000/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password: p.trim() })
          });

          // Now attempt to login
          const res = await fetch(REST_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password: p.trim() })
          });
          const data = await res.json();

          if (data.success) {
            token = data.token;
            console.log("✅ Login successful, token received:", token);
            rlLogin.close();
            resolve();
          } else {
            console.log("❌ Login failed:", data.message || "Invalid credentials");
            process.exit(1);
          }
        } catch (err) {
          console.error("Error logging in:", err);
          process.exit(1);
        }
      });
    });
  });
}

// ---- MAIN CHAT ----
async function startChat() {
  const ws = new WebSocket(WS_URL);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "> "
  });

  ws.on("open", () => {
    console.log("Connected to server");
    rl.prompt();
  });

  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString());
    console.log("Received:", msg);
    rl.prompt();
  });

  rl.on("line", (line) => {
    const input = line.trim();

    if (input.startsWith("room ")) {
      currentRoom = input.split(" ")[1];
      ws.send(JSON.stringify({
        type: "join-room",
        room: currentRoom,
        username,
        token
      }));

    } else if (input.startsWith("chat ")) {
      const message = input.slice(5);
      if (!currentRoom) {
        console.log("⚠️ Join a room first");
      } else {
        ws.send(JSON.stringify({
          type: "chat",
          message,
          room: currentRoom,
          username,
          token
        }));
      }

    } else if (input.startsWith("private ")) {
      const [, to, ...msg] = input.split(" ");
      ws.send(JSON.stringify({
        type: "private",
        to,
        message: msg.join(" "),
        username,
        token
      }));

    } else {
      console.log("Commands: room <name>, chat <msg>, private <user> <msg>");
    }

    rl.prompt();
  });
}

// ---- RUN ----
await loginUser();
await startChat();
