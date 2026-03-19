import WebSocket from "ws";

import {
  joinChatRoom,
  leaveChatRoom,
  getRoomUsers
} from "../chatRooms/roomManager.js";

export function setupWebSocket(wss) {
  const users = new Map(); // username -> ws

  wss.on("connection", (ws) => {
    console.log("New Client Connected");

    let username = null;
    let currentRoom = null;

    ws.send(JSON.stringify({
      type: "welcome",
      message: "Connected"
    }));

    ws.on("message", (message) => {
      let parsed;

      try {
        parsed = JSON.parse(message.toString());
      } catch {
        ws.send(JSON.stringify({
          type: "system",
          message: "Invalid JSON"
        }));
        return;
      }

      // ---------------- JOIN ----------------
      if (parsed.type === "join") {
        if (!parsed.username || typeof parsed.username !== "string") {
          ws.send(JSON.stringify({
            type: "system",
            message: "Invalid username"
          }));
          return;
        }

        const requestedUsername = parsed.username.toLowerCase();

        // handle duplicate
        if (users.has(requestedUsername)) {
          const existing = users.get(requestedUsername);

          if (existing.readyState === WebSocket.OPEN) {
            existing.send(JSON.stringify({
              type: "system",
              message: "Disconnected: logged in elsewhere"
            }));
            existing.terminate();
          }

          users.delete(requestedUsername);
        }

        username = requestedUsername;
        users.set(username, ws);

        ws.send(JSON.stringify({
          type: "system",
          message: `Welcome ${username}`,
          timestamp: new Date().toISOString()
        }));

        return;
      }

      // ---------------- JOIN ROOM ----------------
      if (parsed.type === "join-room") {
        if (!username) {
          ws.send(JSON.stringify({
            type: "system",
            message: "You must join first"
          }));
          return;
        }

        const roomName = parsed.room?.toLowerCase();

        if (!roomName) {
          ws.send(JSON.stringify({
            type: "system",
            message: "Invalid room"
          }));
          return;
        }

        // leave previous
        if (currentRoom) {
          leaveChatRoom(currentRoom, username);
        }

        currentRoom = roomName;
        joinChatRoom(roomName, username);

        const timestamp = new Date().toISOString();

        ws.send(JSON.stringify({
          type: "system",
          message: `Joined room: ${roomName}`,
          timestamp
        }));

        // notify room users
        const roomUsers = getRoomUsers(roomName);

        roomUsers.forEach((user) => {
          if (user !== username) {
            const client = users.get(user);

            if (client?.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: "system",
                message: `${username} joined room ${roomName}`,
                timestamp
              }));
            }
          }
        });

        // send room user list
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

      // ---------------- CHAT ROOM ----------------
      if (parsed.type === "chat") {
        if (!username) {
          ws.send(JSON.stringify({
            type: "system",
            message: "Join first"
          }));
          return;
        }

        if (!currentRoom) {
          ws.send(JSON.stringify({
            type: "system",
            message: "Join a room first"
          }));
          return;
        }

        const timestamp = new Date().toISOString();

        const roomUsers = getRoomUsers(currentRoom);

        roomUsers.forEach((user) => {
          const client = users.get(user);
          if (!client || client.readyState !== WebSocket.OPEN) return;

          if (user === username) {
            client.send(JSON.stringify({
              type: "self",
              username,
              message: parsed.message,
              room: currentRoom,
              timestamp
            }));
          } else {
            client.send(JSON.stringify({
              type: "chat-room",
              username,
              message: parsed.message,
              room: currentRoom,
              timestamp
            }));
          }
        });

        console.log(`${username} [${currentRoom}]: ${parsed.message}`);
        return;
      }

      // ---------------- PRIVATE ----------------
      if (parsed.type === "private") {
        if (!username) return;

        const target = parsed.to?.toLowerCase();
        const targetWs = users.get(target);

        if (!targetWs) {
          ws.send(JSON.stringify({
            type: "system",
            message: "User not online"
          }));
          return;
        }

        const timestamp = new Date().toISOString();

        ws.send(JSON.stringify({
          type: "self",
          username,
          message: parsed.message,
          to: target,
          timestamp
        }));

        targetWs.send(JSON.stringify({
          type: "private",
          username,
          message: parsed.message,
          to: target,
          timestamp
        }));
      }
    });

    // ---------------- CLOSE ----------------
    ws.on("close", () => {
      if (username) {
        users.delete(username);

        if (currentRoom) {
          leaveChatRoom(currentRoom, username);
        }
      }
    });
  });

  console.log("WebSocket ready");
}