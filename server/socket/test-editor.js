const { io } = require('socket.io-client');

const API_URL = process.env.API_URL || 'http://localhost:5000';
const ROOM = process.env.ROOM || 'workspace-editor-test';

async function run() {
  const a = io(API_URL, { transports: ['websocket', 'polling'] });
  const b = io(API_URL, { transports: ['websocket', 'polling'] });

  let aReady = false;
  let bReady = false;
  let updatesToSee = 2; // both should see an update

  const finish = (code) => {
    [a,b].forEach(s => { try { s.disconnect(); } catch(_) {} });
    process.exit(code);
  };

  function authAndJoin(sock) {
    sock.on('connect', () => {
      sock.emit('authenticate', { token: 'demo_token_123' });
    });
    sock.on('authenticated', () => {
      sock.emit('join-room', { workspaceSlug: ROOM });
    });
  }

  authAndJoin(a);
  authAndJoin(b);

  a.on('recent-messages', () => {});
  b.on('recent-messages', () => {});

  a.on('editor-content', () => { aReady = true; maybeStart(); });
  b.on('editor-content', () => { bReady = true; maybeStart(); });

  function maybeStart() {
    if (aReady && bReady) {
      // A sends an update
      a.emit('editor-update', { content: 'hello world', workspaceSlug: ROOM, version: 1 });
    }
  }

  function handleUpdated(from) {
    return (data) => {
      if (data.content === 'hello world' && typeof data.version === 'number') {
        updatesToSee -= 1;
        if (updatesToSee === 0) {
          console.log('EDITOR_OK');
          finish(0);
        }
      }
    };
  }

  a.on('editor-updated', handleUpdated('a'));
  b.on('editor-updated', handleUpdated('b'));

  setTimeout(() => {
    console.error('EDITOR_TIMEOUT');
    finish(1);
  }, 10000);
}

run();


