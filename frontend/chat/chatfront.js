const wsUrl = window.CHAT_WS_URL || (() => {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${window.location.host}`;
})();

const ws = new WebSocket(wsUrl);

let username = "";
let currentRoom = "";

const chatBox = document.getElementById("chat");
const usernameInput = document.getElementById("username");
const roomInput = document.getElementById("room");
const messageInput = document.getElementById("message");

function log(message) {
  const div = document.createElement("div");
  div.innerText = message;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// connect
ws.onopen = () => {
  log("✅ Connected to server");
};

// receive messages
ws.onmessage = (event) => {
let data;
try {
  data = JSON.parse(event.data);
} catch (e) {
  log('Received invalid message from server');
  return;
}

  if (data.type === "system") log(`⚙️ ${data.message}`);
  if (data.type === "self") log(`🟢 You: ${data.message}`);
  if (data.type === "chat-room") log(`🔵 ${data.username}: ${data.message}`);
  if (data.type === "private") log(`🔒 ${data.username} (private): ${data.message}`);
  if (data.type === "room-users") log(`👥 Users in room: ${data.users.join(", ")}`);
};

// Trigger join on Enter
usernameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    join();
  }
});
roomInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    joinRoom();
  }
});
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
});

// join user
function join() {
  username = usernameInput.value.trim();
  if (!username) return;
  ws.send(JSON.stringify({ type: "join", username }));
}

// join room
function joinRoom() {
  currentRoom = roomInput.value.trim();
  if (!currentRoom) return;
  ws.send(JSON.stringify({ type: "join-room", room: currentRoom }));
}

// send message
function sendMessage() {
  const message = messageInput.value.trim();
  if (!message || !currentRoom) return;
  ws.send(JSON.stringify({ type: "chat", message }));
  messageInput.value = "";
}