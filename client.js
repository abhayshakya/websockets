import WebSocket from "ws";
import readline from "readline";

const ws = new WebSocket("ws://localhost:8000");

let isJoined = false;

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

  if (msg.type === "system" && msg.message.startsWith("Welcome")) {
    isJoined = true;
  }

  rl.prompt();
});

rl.on("line", (line) => {
  const input = line.trim();

  if (input.startsWith("join ")) {
    const username = input.split(" ")[1];

    ws.send(JSON.stringify({
      type: "join",
      username
    }));

  } else if (input.startsWith("room ")) {

    if (!isJoined) {
      console.log("⚠️ Join first");
      rl.prompt();
      return;
    }

    const room = input.split(" ")[1];

    ws.send(JSON.stringify({
      type: "join-room",
      room
    }));

  } else if (input.startsWith("chat ")) {
    const message = input.slice(5);

    ws.send(JSON.stringify({
      type: "chat",
      message
    }));

  } else if (input.startsWith("private ")) {
    const [, to, ...msg] = input.split(" ");

    ws.send(JSON.stringify({
      type: "private",
      to,
      message: msg.join(" ")
    }));

  } else {
    console.log("Commands: join, room, chat, private");
  }

  rl.prompt();
});