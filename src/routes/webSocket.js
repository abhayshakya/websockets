import WebSocket from "ws";
import { validateToken } from "../auth/authManager.js";
import { joinChatRoom, leaveChatRoom, getRoomUsers } from "../chatRooms/roomManager.js";

export function setupWebSocket(wss) {
  const users = new Map(); // username -> ws

  wss.on("connection", (ws) => {
    console.log("New Client Connected");

    ws.send(JSON.stringify({ type: "welcome", message: "Connected" }));

    ws.on("message", (message) => {
      let parsed;
      try {
        parsed = JSON.parse(message.toString());
      } catch {
        ws.send(JSON.stringify({ type: "system", message: "Invalid JSON" }));
        return;
      }

      // ---------------- JOIN ROOM ----------------
      if (parsed.type === "join-room") {
        const { username, room, token } = parsed;
        if (!validateToken(username, token)) {
          ws.send(JSON.stringify({ type: "system", message: "Unauthorized" }));
          return;
        }

        ws.username = username;
        const roomName = room?.toLowerCase();
        if (!roomName) {
          ws.send(JSON.stringify({ type: "system", message: "Invalid room" }));
          return;
        }

        if (ws.currentRoom) {
          leaveChatRoom(ws.currentRoom, ws.username);
        }

        ws.currentRoom = roomName;
        users.set(ws.username, ws);
        joinChatRoom(roomName, ws.username);

        const timestamp = new Date().toISOString();
        ws.send(JSON.stringify({
          type: "system",
          message: `Joined room: ${roomName}`,
          timestamp
        }));

        const roomUsers = getRoomUsers(roomName);
        const userList = Array.from(roomUsers);

        roomUsers.forEach((user) => {
          const client = users.get(user);
          if (client?.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "room-users",
              room: roomName,
              users: userList,
              timestamp
            }));
          }
        });
        return;
      }

      // ---------------- CHAT ----------------
      if (parsed.type === "chat") {
        const { message, room, token, username } = parsed;
        const chatUsername = username || ws.username;
        if (!ws.username || !validateToken(chatUsername, token)) {
          ws.send(JSON.stringify({ type: "system", message: "Unauthorized" }));
          return;
        }
        if (!ws.currentRoom) {
          ws.send(JSON.stringify({ type: "system", message: "Join a room first" }));
          return;
        }

        const timestamp = new Date().toISOString();
        const roomUsers = getRoomUsers(ws.currentRoom);

        roomUsers.forEach((user) => {
          const client = users.get(user);
          if (!client || client.readyState !== WebSocket.OPEN) return;

          client.send(JSON.stringify({
            type: user === ws.username ? "self" : "chat-room",
            username: ws.username,
            message,
            room: ws.currentRoom,
            timestamp
          }));
        });

        // console.log(`${ws.username} [${ws.currentRoom}]: ${message}`);
        return;
      }
    });

    ws.on("close", () => {
      if (ws.username && ws.currentRoom) {
        users.delete(ws.username);
        leaveChatRoom(ws.currentRoom, ws.username);

        const timestamp = new Date().toISOString();
        const roomUsers = getRoomUsers(ws.currentRoom);
        
        // Notify the remaining users in the room
        roomUsers.forEach((user) => {
          const client = users.get(user);
          if (client?.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: "system",
              message: `${ws.username} has left the chat`,
              timestamp
            }));
          }
        });
      }
    });
  });

  console.log("WebSocket ready");
}
