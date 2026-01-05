import { buildServer } from './server';

describe('server-ws', () => {
  it('starts without REST routes', async () => {
    const app = buildServer();
    const response = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(response.statusCode).toBe(404);
  });
});
