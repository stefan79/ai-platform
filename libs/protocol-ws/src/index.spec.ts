import { describe, expect, it } from 'vitest';
import { protocolVersion, WsEnvelope } from './index';

describe('protocol-ws placeholder', () => {
  it('exposes the protocol version', () => {
    expect(protocolVersion).toBe('0.1.0');
  });

  it('describes an envelope shape', () => {
    const envelope: WsEnvelope<{ text: string }> = {
      v: 1,
      id: 'abc',
      ts: Date.now(),
      type: 'client.hello',
      payload: { text: 'hello' },
    };

    expect(envelope.payload.text).toBe('hello');
  });
});
