const { io } = require('socket.io-client');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const ROOM = process.env.ROOM || 'workspace-test-room';
const NUM_CLIENTS = parseInt(process.env.CLIENTS || '3', 10);

async function run() {
  const clients = [];
  let received = 0;
  let ready = 0;

  function finish(code) {
    clients.forEach(c => {
      try { c.sock.disconnect(); } catch (_) {}
    });
    process.exit(code);
  }

  for (let i = 0; i < NUM_CLIENTS; i++) {
    const sock = io(API_URL, { transports: ['websocket', 'polling'] });
    const index = i + 1;
    clients.push({ index, sock });

    sock.on('connect', () => {
      sock.emit('authenticate', { token: 'demo_token_123' });
    });

    sock.on('authenticated', () => {
      sock.emit('join-room', { workspaceSlug: ROOM });
      setTimeout(() => {
        ready++;
        if (ready === NUM_CLIENTS) {
          clients[0].sock.emit('chat-message', { content: 'hello-all', workspaceSlug: ROOM });
        }
      }, 300);
    });

    sock.on('new-message', (msg) => {
      if (msg && msg.content === 'hello-all') {
        received++;
        console.log(`client ${index} got message`);
        if (received === NUM_CLIENTS) {
          console.log('ALL_RECEIVED');
          finish(0);
        }
      }
    });

    sock.on('connect_error', (err) => {
      console.error('connect_error', err.message);
    });
  }

  setTimeout(() => {
    console.error('TIMEOUT waiting for all clients to receive message');
    finish(1);
  }, 10000);
}

run();


