import WebSocket from "ws";
import readline from "readline";

const ws = new WebSocket("ws://localhost:8000");

let joinedRoom = false;

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
    console.log("Received:", data.toString());
    rl.prompt();
});

ws.on("close", () => {
    console.log("Received:", data.toString());
    process.exit(0);
})

ws.on("error", (err) => {
    console.error("Connection error", err.message);
    process.exit(0);
});

rl.on("line", (line) => {
    line = line.trim();
    if (!line) return rl.prompt();

    const args = line.split(" ");
    const command = args[0].toLowerCase();

    switch (command) {
        case "join": {
            const username = args[1];
            if (!username) {
                console.log("Usage: join <username>");
                break;
            }
            ws.send(JSON.stringify({ type: "join", username }));
            break;
        }
        case "room": {
            const roomName = args[1];
            if (!roomName) {
                console.log("Usage: room <roomname>");
                break;
            }
            ws.send(JSON.stringify({ type: "join-room", room: roomName }));
            joinedRoom = true;
            break;
        }
        case "private": {
            const target = args[1];
            const message = args.slice(2).join(" ");
            if (!target || !message) {
                console.log("Usage: private <user> <message>");
                break;
            }
            ws.send(JSON.stringify({ type: "private", to: target, message }));
            break;
        }
        case "chat": {
            if (!joinedRoom) {
                console.log("You must join a room first.");
                break;
            }
            const message = args.slice(1).join(" ");
            if (!message) {
                console.log("Usage: chat <message>");
                break;
            }
            ws.send(JSON.stringify({ type: "chat", message }));
            break;
        }
        default: {
            // If already joined a room, treat anything typed as a chat message
            if (joinedRoom) {
                ws.send(JSON.stringify({ type: "chat", message: line }));
            } else {
                console.log("Unknown command. Use join, room, chat, private");
            }
        }
    }

    rl.prompt();
});