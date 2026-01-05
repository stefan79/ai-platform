import { createContextState } from '@ai-platform/context-core';
import { buildServer } from './server';

describe('server REST endpoints', () => {
  const contextState = createContextState({ version: '0.1.0-test' });

  it('responds to /api/health', async () => {
    const app = buildServer(contextState);
    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok', version: '0.1.0-test' });
  });

  it('responds to /api/version', async () => {
    const app = buildServer(contextState);
    const response = await app.inject({
      method: 'GET',
      url: '/api/version',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ version: '0.1.0-test' });
  });
});
