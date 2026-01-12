import { describe, expect, it } from 'vitest';
import { createContextState } from '@ai-platform/context-core';
import {
  createHealthResponse,
  createThreadMessagesResponse,
  createVersionResponse,
  healthResponseSchema,
  parseHealthResponse,
  parseThreadMessagesResponse,
  parseVersionResponse,
} from './schemas';

describe('protocol-rest schemas', () => {
  const context = createContextState({ version: '0.1.0' });

  it('creates typed responses from context', () => {
    expect(createVersionResponse(context)).toEqual({ version: '0.1.0' });
    expect(createHealthResponse(context)).toEqual({ status: 'ok', version: '0.1.0' });
  });

  it('parses responses with validation', () => {
    expect(parseVersionResponse({ version: '1.2.3' }).version).toBe('1.2.3');
    expect(parseHealthResponse({ status: 'ok', version: '1.2.3' }).status).toBe('ok');
    expect(() => healthResponseSchema.parse({ status: 'bad', version: '1.2.3' })).toThrow();
  });

  it('creates and parses thread messages responses', () => {
    const response = createThreadMessagesResponse({
      items: [
        {
          messageId: '550e8400-e29b-41d4-a716-446655440000',
          threadId: 'thread-1',
          authorId: 'user-1',
          timestamp: 123,
          body: 'hello',
        },
      ],
    });
    expect(parseThreadMessagesResponse(response).items).toHaveLength(1);
  });
});
