const rooms = new Map();
//roomname -> set of usernames

export const joinChatRoom = (roomName, username) => {
    if(!rooms.has(roomName)) {
        rooms.set(roomName, new Set());
    }

    rooms.get(roomName).add(username);
};

export const leaveChatRoom = (roomName, username) => {
    if (!rooms.has(roomName)) return;

    const roomUsers = rooms.get(roomName);
    if (!roomUsers) return;

    roomUsers.delete(username);

    //clean empty room
    if(roomUsers.size === 0) {
        rooms.delete(roomName);
    }
};

export const getRoomUsers = (roomName) => {
    return rooms.get(roomName) || new Set();
};

export const isUserInRoom = (roomName, username) => {
    return rooms.has(roomName) && rooms.get(roomName).has(username);
};

export const getAllRooms = () => {
    return rooms;
}
