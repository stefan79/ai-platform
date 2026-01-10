import { describe, expect, it } from 'vitest';
import { createContextState } from '@ai-platform/context-core';
import {
  createHealthResponse,
  createVersionResponse,
  healthResponseSchema,
  parseHealthResponse,
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
});
