import WebSocket from 'ws';

export function setupWebSocket(wss) {
  const users = new Map();

  wss.on('connection', (ws) => {
    console.log('New Client Connected');
    let username = null;

    ws.send(JSON.stringify({ type: 'welcome', message: 'Connected' }));

    ws.on('message', (message) => {
      const parsed = JSON.parse(message.toString());

      if (parsed.type === 'join') {
        const requestedUsername = parsed.username;

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

      if (parsed.type === 'private') {
        if (!username) {
          ws.send(JSON.stringify({ type: 'system', message: 'YOU MUST JOIN FIRST' }));
          return;
        }

        const timestamp = new Date().toISOString();
        const targetUsername = parsed.to;
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

      if (parsed.type === 'chat') {
        const timestamp = new Date().toISOString();

        if (!username) {
          ws.send(JSON.stringify({
            type: 'system',
            message: 'You Must Join First!!!',
          }));
          return;
        }

        const chatMessageForSender = {
          type: 'self',
          username,
          message: parsed.message,
          timestamp,
        };

        const chatMessageForOthers = {
          type: 'chat',
          username,
          message: parsed.message,
          timestamp,
        };

        users.forEach((clientWs, clientName) => {
          if (clientWs.readyState === WebSocket.OPEN) {
            if (clientName === username) {
              clientWs.send(JSON.stringify(chatMessageForSender));
            } else {
              clientWs.send(JSON.stringify(chatMessageForOthers));
            }
          }
        });

        console.log(`${username} : ${parsed.message}`);
      }
    });

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

    ws.on('error', (err) => {
      console.error('Error with user', username, err);
    });
  });

  console.log('WebSocket setup complete');
}

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);
