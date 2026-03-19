import WebSocket from 'ws';

import {
  joinChatRoom,
  leaveChatRoom,
  getRoomUsers,
  isUserInRoom
} from "../chatRooms/roomManager.js"

export function setupWebSocket(wss) {
  const users = new Map();

  //ws on connection
  wss.on('connection', (ws) => {
    console.log('New Client Connected');
    let username = null;
    let currentRoom = null;

    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected' }));

    // ws on message
    ws.on('message', (message) => {
      let parsed
      try {
        parsed = JSON.parse(message.toString());
      } catch (err) {
        ws.send(JSON.stringify({
          type: 'system',
          message: 'Invalid JSON format',
        }));
        return;
      }

      // user will join
      if (parsed.type === 'join') {

        if (!parsed.username || typeof parsed.username !== 'string') {
          ws.send(JSON.stringify({
            type: 'system',
            message: 'Invalid username'
          }));
          return;
        }

        const requestedUsername = parsed.username.toLowerCase();


        if (users.has(requestedUsername)) {
          const existingWs = users.get(requestedUsername);
          if (existingWs.readyState === WebSocket.OPEN) {
            existingWs.send(JSON.stringify({
              type: 'system',
              message: 'You were disconnected: logged in from another session',
            }));
            existingWs.terminate();
          }
          users.delete(requestedUsername);
        }

        username = requestedUsername;
        users.set(username, ws);

        ws.send(JSON.stringify({
          type: 'system',
          message: `Welcome ${username}`,
          timestamp: new Date().toISOString(),
        }));

        users.forEach((clientWs, clientName) => {
          if (clientName !== username && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'system',
              message: `${username} has joined the chat`,
              timestamp: new Date().toISOString(),
            }));
          }
        });

        return;
      }

      //  user will join-room
      if (parsed.type === 'join-room') {
        if (!username) {
          ws.send(JSON.stringify({
            type: 'system',
            message: 'You must join first'
          }));
          return;
        }

        const roomName = parsed.room?.toLowerCase();

        if (!roomName) {
          ws.send(JSON.stringify({
            type: 'system',
            message: 'Invalid room name'
          }));
          return;
        }

        // leave previous room
        if (currentRoom) {
          leaveChatRoom(currentRoom, username);
        }

        currentRoom = roomName;
        joinChatRoom(roomName, username);

        ws.send(JSON.stringify({
          type: 'system',
          message: `Joined room: ${roomName}`,
          timestamp: new Date().toISOString()
        }));

        // notify users in the room
        const roomUsers = getRoomUsers(roomName);

        roomUsers.forEach((user) => {
          if (user !== username) {
            const clientWs = users.get(user);

            if (clientWs?.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({
                type: 'system',
                message: `${username} joined room ${roomName}`,
                timestamp: new Date().toISOString()
              }));
            }
          }
        });

        const userList = [...getRoomUsers(roomName)];

        userList.forEach((user) => {
          const clientWs = users.get(user);

          if(clientWs?.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'room-users',
              room: roomName,
              users: userList,
              timestamp: new Date().toISOString()
            }));
          }
        });

        return;
      }
      

      // private
      if (parsed.type === 'private') {
        if (!username) {
          ws.send(JSON.stringify({ type: 'system', message: 'YOU MUST JOIN FIRST' }));
          return;
        }

        const timestamp = new Date().toISOString();
        const targetUsername = parsed.to?.toLowerCase();
        const targetWs = users.get(targetUsername);

        if (!targetWs || targetWs.readyState !== WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'system',
            message: `${targetUsername} is not Online`,
          }));
          return;
        }

        ws.send(JSON.stringify({
          type: 'self',
          username,
          message: parsed.message,
          to: targetUsername,
          timestamp,
        }));

        targetWs.send(JSON.stringify({
          type: 'private',
          username,
          message: parsed.message,
          to: targetUsername,
          timestamp,
        }));

        console.log(`${username} -> ${targetUsername}: ${parsed.message}`);
        return;
      }

      //chat
      if (parsed.type === 'chat') {
        const timestamp = new Date().toISOString();

        if (!username) {
          ws.send(JSON.stringify({
            type: 'system',
            message: 'You Must Join First!!!',
          }));
          return;
        }

        if(!currentRoom) {
          ws.send(JSON.stringify ({
            type: 'system',
            message: 'You must join a room to chat',
          }));
          return;
        }

        if(parsed.type === 'chat-room'){
          if(!username) {
            ws.send(JSON.stringify({
              type: 'system',
              message:'you must join first'
            }));
            return;
          }

          if(!currentRoom) {
            ws.send(JSON.stringify({
              type: 'system',
              message: 'You must join a Chat Room'
            }));
            return;
          }
        }

        const chatMessageForSender = {
          type: 'self',
          username,
          message: parsed.message,
          room: currentRoom,
          timestamp,
        };

        const chatMessageForOthers = {
          type: 'chat-room',
          username,
          message: parsed.message,
          room: currentRoom,
          timestamp,
        };

        // send to everyone in the room
        const roomUsers = getRoomUsers(currentRoom);

        roomUsers.forEach((user) => {
          const clientWs = users.get(user);
          if(!clientWs) return;

          if(clientWs?.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify(chatMessageForSender))
          } else {
            clientWs.send(JSON.stringify(chatMessageForOthers));
          }
        });

        console.log(`${username} [${currentRoom}: ${parsed.message}]`);

        // users.forEach((clientWs, clientName) => {
        //   if (clientWs.readyState === WebSocket.OPEN) {
        //     if (clientName === username) {
        //       clientWs.send(JSON.stringify(chatMessageForSender));
        //     } else {
        //       clientWs.send(JSON.stringify(chatMessageForOthers));
        //     }
        //   }
        // });

        console.log(`${username} : ${parsed.message}`);
      }
      });

    //ws on close
    ws.on('close', () => {
      console.log(`${username || 'Unknown'} has disconnected`);

      if (username) {
        const timestamp = new Date().toISOString();
        users.delete(username);

        users.forEach((clientWs) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({
              type: 'system',
              timestamp,
              message: `${username} has left the chat`,
            }));
          }
        });
      }
    });

    //ws on error
    ws.on('error', (err) => {
      console.error('Error with user', username, err);
    });
  });

  console.log('WebSocket setup complete');
}

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);
