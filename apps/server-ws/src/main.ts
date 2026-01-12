import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

const logger = new Logger('server-ws');

export async function startServer() {
  const server = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  const port = Number(process.env.WS_PORT ?? process.env.PORT ?? 3001);
  const host = process.env.WS_HOST ?? process.env.HOST ?? '0.0.0.0';

  await server.listen(port, host);
  logger.debug(`server-ws listening at http://${host}:${port}`);
  return server;
}

<<<<<<< HEAD
function registerShutdownSignals(app: NestFastifyApplication) {
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.log(`server-ws received ${signal}, shutting down...`);
    try {
      await app.close();
      logger.log('server-ws shutdown complete.');
    } catch (error) {
      logger.error('server-ws shutdown failed.', error as Error);
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
      logger.error(error instanceof Error ? error.stack : String(error));
      process.exit(1);
    });
}
