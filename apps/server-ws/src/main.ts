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

if (require.main === module) {
  startServer().catch((error) => {
    logger.error(error instanceof Error ? error.stack : String(error));
    process.exit(1);
  });
}
