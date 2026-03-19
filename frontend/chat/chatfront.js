const ws = new WebSocket("ws://localhost:8000");

let username = "";
let currentRoom = "";

const chatBox = document.getElementById("chat");

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
  const data = JSON.parse(event.data);

  if (data.type === "system") {
    log(`⚙️ ${data.message}`);
  }

  if (data.type === "self") {
    log(`🟢 You: ${data.message}`);
  }

  if (data.type === "chat-room") {
    log(`🔵 ${data.username}: ${data.message}`);
  }

  if (data.type === "private") {
    log(`🔒 ${data.username} (private): ${data.message}`);
  }

  if (data.type === "room-users") {
    log(`👥 Users in room: ${data.users.join(", ")}`);
  }
};

// join user
function join() {
  username = document.getElementById("username").value;

  ws.send(JSON.stringify({
    type: "join",
    username
  }));
}

// join room
function joinRoom() {
  currentRoom = document.getElementById("room").value;

  ws.send(JSON.stringify({
    type: "join-room",
    room: currentRoom
  }));
}

// send message
function sendMessage() {
  const messageInput = document.getElementById("message");
  const message = messageInput.value;

  ws.send(JSON.stringify({
    type: "chat",
    message
  }));

  messageInput.value = "";
}