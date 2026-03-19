const ws = new WebSocket("ws://localhost:8000");

let username = "";

const chatBox = document.getElementById("chat");

function addMessage(text, className) {
  const div = document.createElement("div");
  div.className = `message ${className}`;
  div.innerText = text;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

ws.onopen = () => {
  addMessage("Connected to server", "system");
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "system") {
    addMessage(data.message, "system");
  }

  if (data.type === "self") {
    addMessage(`You: ${data.message}`, "self");
  }

  if (data.type === "chat-room") {
    addMessage(`${data.username}: ${data.message}`, "other");
  }

  if (data.type === "private") {
    addMessage(`(Private) ${data.username}: ${data.message}`, "private");
  }

  if (data.type === "room-users") {
    addMessage(`Users: ${data.users.join(", ")}`, "system");
  }
};

// actions
function join() {
  username = document.getElementById("username").value;

  ws.send(JSON.stringify({
    type: "join",
    username
  }));
}

function joinRoom() {
  const room = document.getElementById("room").value;

  ws.send(JSON.stringify({
    type: "join-room",
    room
  }));
}

function sendMessage() {
  const input = document.getElementById("message");
  const message = input.value;

  ws.send(JSON.stringify({
    type: "chat",
    message
  }));

  input.value = "";
}