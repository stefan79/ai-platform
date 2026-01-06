import { describe, expect, it } from 'vitest';
import { parseWsEnvelope, WsEnvelope } from './index';

describe('protocol-ws schemas', () => {
  it('parses a websocket envelope', () => {
    const envelope: WsEnvelope = {
      v: 1,
      id: 'evt-1',
      ts: Date.now(),
      type: 'chat.message',
      body: {
        messageId: 'msg-1',
        threadId: 'thread-1',
        role: 'assistant',
        content: 'Hello from WS',
        createdAt: new Date().toISOString(),
      },
    };

    expect(parseWsEnvelope(envelope)).toEqual(envelope);
  });
});
