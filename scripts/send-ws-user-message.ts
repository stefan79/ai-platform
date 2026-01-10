import { io } from 'socket.io-client';
import { randomUUID } from 'node:crypto';
import type { WsEnvelope } from '@ai-platform/protocol-ws';

const wsUrl = process.env.WS_URL ?? 'http://localhost:3001';
const userId = process.env.USER_ID ?? randomUUID();
const threadId = process.env.THREAD_ID ?? 'thread-1';
const content = process.env.MESSAGE_BODY ?? 'Hello from client';

const now = Date.now();
const message: WsEnvelope = {
  v: 1,
  id: `evt-${now}`,
  ts: now,
  type: 'user.message',
  direction: 'client',
  body: {
    userId,
    timestamp: now,
    body: content,
  },
};

const socket = io(wsUrl, { transports: ['websocket'] });
const timeoutMs = Number(process.env.WS_TIMEOUT_MS ?? 3000);

socket.on('connect', () => {
  socket.timeout(timeoutMs).emit('message', message, (error: unknown, response: unknown) => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error('WS response timeout:', error);
    } else {
      // eslint-disable-next-line no-console
      console.log('WS response:', response);
    }
    socket.close();
  });
});

socket.on('connect_error', (error) => {
  // eslint-disable-next-line no-console
  console.error('WS connection error:', error);
  socket.close();
});

setTimeout(() => {
  if (socket.connected) {
    socket.close();
  }
}, timeoutMs + 1000);
