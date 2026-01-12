import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

export async function startServer() {
  const server = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  const port = Number(process.env.WS_PORT ?? process.env.PORT ?? 3001);
  const host = process.env.WS_HOST ?? process.env.HOST ?? '0.0.0.0';

  await server.listen(port, host);
  // eslint-disable-next-line no-console
  console.log(`server-ws listening at http://${host}:${port}`);
  return server;
}

function registerShutdownSignals(app: NestFastifyApplication) {
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    // eslint-disable-next-line no-console
    console.log(`server-ws received ${signal}, shutting down...`);
    try {
      await app.close();
      // eslint-disable-next-line no-console
      console.log('server-ws shutdown complete.');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('server-ws shutdown failed.', error);
      process.exitCode = 1;
    } finally {
      process.exit();
    }
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

if (require.main === module) {
  startServer()
    .then((server) => {
      registerShutdownSignals(server);
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error);
      process.exit(1);
    });
}
