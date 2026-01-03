import { buildServer } from './server';

export async function startServer() {
  const server = buildServer();
  const port = Number(process.env.WS_PORT ?? process.env.PORT ?? 3001);
  const host = process.env.HOST ?? '0.0.0.0';

  try {
    await server.listen({ port, host });
    return server;
  } catch (error) {
    server.log.error(error);
    throw error;
  }
}

if (require.main === module) {
  startServer().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
}
