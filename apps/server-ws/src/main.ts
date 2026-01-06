import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

export async function startServer() {
  const server = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  const port = Number(process.env.WS_PORT ?? process.env.PORT ?? 3001);
  const host = process.env.WS_HOST ?? process.env.HOST ?? '0.0.0.0';

  try {
    await server.listen(port, host);
    return server;
  } catch (error) {
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
