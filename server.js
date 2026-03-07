const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const messages = {};

function chatKey(a, b) {
  return [a, b].sort().join(':');
}

io.on('connection', (socket) => {
  let currentUser = null;

  socket.on('login', (name) => {
    currentUser = name;
    socket.join(name);
  });

  socket.on('load-chat', ({ with: partner }) => {
    const key = chatKey(currentUser, partner);
    socket.emit('chat-history', messages[key] || []);
  });

  socket.on('send-message', ({ to, text }) => {
    if (!currentUser || !text.trim()) return;
    const key = chatKey(currentUser, to);
    const msg = { from: currentUser, text: text.trim(), time: Date.now() };
    if (!messages[key]) messages[key] = [];
    messages[key].push(msg);
    io.to(currentUser).to(to).emit('new-message', { chatKey: key, message: msg });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
