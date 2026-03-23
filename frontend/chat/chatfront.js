const wsUrl = window.CHAT_WS_URL || (() => {
  if (window.location.host) {
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${window.location.host}`;
  }
  // Direct file:// open fallback (still default old behavior for local dev)
  return "ws://localhost:8000";
})();

const ws = new WebSocket(wsUrl);

let username = "";
let currentRoom = "";

const chatBox = document.getElementById("chat");
const usernameInput = document.getElementById("username");
const roomInput = document.getElementById("room");
const messageInput = document.getElementById("message");

// helper to show messages
function log(message) {
  const div = document.createElement("div");
  div.innerText = message;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// connected
ws.onopen = () => {
  console.log("Connected");
  log("✅ Connected to server");
};

ws.onclose = (e) =>{
  console.log("Close", e.code, e.reason);
};

ws.onerror = (e) => {
  console.error("Error", e);
}

// receive messages
ws.onmessage = (event) => {
  let data;

  try {
    data = JSON.parse(event.data);
  } catch {
    log("❌ Invalid message from server");
    return;
  }

  switch (data.type) {
    case "system":
      log(`⚙️ ${data.message}`);
      break;

    case "self":
      log(`🟢 You: ${data.message}`);
      break;

    case "chat-room":
      log(`🔵 ${data.username}: ${data.message}`);
      break;

    case "private":
      log(`🔒 ${data.username}: ${data.message}`);
      break;

    case "room-users":
      log(`👥 Room users: ${data.users.join(", ")}`);
      break;

    default:
      log(`📩 ${JSON.stringify(data)}`);
  }
};

// join user
function join() {
  const value = usernameInput.value.trim();
  if (!value) return;

  username = value;

  ws.send(JSON.stringify({
    type: "join",
    username
  }));
}

// join room
function joinRoom() {
  const value = roomInput.value.trim();
  if (!value) return;

  currentRoom = value;

  ws.send(JSON.stringify({
    type: "join-room",
    room: currentRoom
  }));
}

// send message
function sendMessage() {
  const message = messageInput.value.trim();

  if (!message) return;
  if (!currentRoom) {
    log("⚠️ Join a room first");
    return;
  }

  ws.send(JSON.stringify({
    type: "chat",
    message
  }));

  messageInput.value = "";
}

// ✅ Enter key support
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

// (optional) expose buttons if you have them
window.join = join;
window.joinRoom = joinRoom;
window.sendMessage = sendMessage;