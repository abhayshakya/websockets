const wsUrl = (() => {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${window.location.host}`;
})();

const ws = new WebSocket(wsUrl);

let token = localStorage.getItem("chatToken");
let username = localStorage.getItem("chatUser");
let currentRoom = "";

const chatBox = document.getElementById("chat");
const roomInput = document.getElementById("room");
const messageInput = document.getElementById("message");

function log(message) {
  const div = document.createElement("div");
  div.innerText = message;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

ws.onopen = () => log("✅ Connected to server");
ws.onclose = (e) => console.log("Close", e.code, e.reason);
ws.onerror = (e) => console.error("Error", e);

ws.onmessage = (event) => {
  let data;
  try { data = JSON.parse(event.data); }
  catch { log("❌ Invalid message from server"); return; }

  switch (data.type) {
    case "system": log(`⚙️ ${data.message}`); 
    break;
    case "self": log(`🟢 You: ${data.message}`); 
    break;
    case "chat-room": log(`🔵 ${data.username}: ${data.message}`); 
    break;
    case "private": log(`🔒 ${data.username}: ${data.message}`); 
    break;
    case "room-users": log(`👥 Room users: ${data.users.join(", ")}`); 
    break;
    default: log('📩 Welcome to One Time Chat');
  }
};

function joinRoom() {
  const value = roomInput.value.trim();
  if (!value || !token || !username) {
    log("⚠️ Must log in first!");
    return;
  }
  currentRoom = value;
  console.log("Sending join-room:", { room: currentRoom, username, token });
  ws.send(JSON.stringify({ type: "join-room", room: currentRoom, username, token }));
}

function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;
  if (!currentRoom) { log("⚠️ Join a room first"); return; }
  console.log("Sending chat:", { room: currentRoom, username, message });
  ws.send(JSON.stringify({ type: "chat", message, room: currentRoom, username, token }));
  messageInput.value = "";
}

roomInput.addEventListener("keypress", (e) => { if (e.key === "Enter") joinRoom(); });
messageInput.addEventListener("keypress", (e) => { if (e.key === "Enter") sendMessage(); });

window.joinRoom = joinRoom;
window.sendMessage = sendMessage;