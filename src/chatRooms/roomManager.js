const rooms = new Map(); // roomName -> Set(username)

export const joinChatRoom = (roomName, username) => {
  if (!rooms.has(roomName)) {
    rooms.set(roomName, new Set());
  }
  rooms.get(roomName).add(username);
};

export const leaveChatRoom = (roomName, username) => {
  if (!rooms.has(roomName)) return;

  const users = rooms.get(roomName);
  users.delete(username);

  if (users.size === 0) {
    rooms.delete(roomName);
  }
};

export const getRoomUsers = (roomName) => {
  return rooms.get(roomName) || new Set();
};

export const isUserInRoom = (roomName, username) => {
  return rooms.has(roomName) && rooms.get(roomName).has(username);
};