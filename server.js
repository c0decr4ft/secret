const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (e) { /* ignore */ }
  return {
    accounts: {
      luca:   { id: 'luca',   displayName: 'Luca',   password: null },
      matteo: { id: 'matteo', displayName: 'Matteo', password: null },
      nora:   { id: 'nora',   displayName: 'Nora',   password: null }
    },
    chats: {}
  };
}

let data = loadData();

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function chatKey(a, b) {
  return [a, b].sort().join(':');
}

save();

app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  let userId = null;

  socket.on('get-accounts', () => {
    const list = Object.values(data.accounts).map(a => ({
      id: a.id,
      displayName: a.displayName,
      hasPassword: !!a.password
    }));
    socket.emit('accounts-list', list);
  });

  socket.on('login', ({ id, password }) => {
    const acct = data.accounts[id];
    if (!acct) return socket.emit('login-error', 'Account not found');
    if (acct.password && acct.password !== password) {
      return socket.emit('login-error', 'Wrong password');
    }
    userId = id;
    socket.join(id);
    socket.emit('login-ok', {
      id: acct.id,
      displayName: acct.displayName,
      hasPassword: !!acct.password
    });
  });

  socket.on('load-chat', ({ with: partnerId }) => {
    if (!userId) return;
    const key = chatKey(userId, partnerId);
    socket.emit('chat-history', {
      partner: partnerId,
      messages: data.chats[key] || []
    });
  });

  socket.on('send-message', ({ to, text }) => {
    if (!userId || !text || !text.trim()) return;
    const key = chatKey(userId, to);
    if (!data.chats[key]) data.chats[key] = [];

    const msg = {
      from: userId,
      text: text.trim(),
      time: Date.now()
    };
    data.chats[key].push(msg);
    save();

    io.to(userId).to(to).emit('new-message', { chatKey: key, message: msg });
  });

  socket.on('update-settings', ({ displayName, newPassword, removePassword }) => {
    if (!userId) return;
    const acct = data.accounts[userId];
    if (!acct) return;

    if (displayName && displayName.trim()) {
      acct.displayName = displayName.trim().substring(0, 20);
    }
    if (removePassword) {
      acct.password = null;
    } else if (newPassword !== undefined && newPassword !== null) {
      acct.password = newPassword;
    }
    save();
    socket.emit('settings-ok', {
      id: acct.id,
      displayName: acct.displayName,
      hasPassword: !!acct.password
    });
    io.emit('account-updated', {
      id: acct.id,
      displayName: acct.displayName
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
