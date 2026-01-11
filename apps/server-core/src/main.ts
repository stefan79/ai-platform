import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { kafkaConfig } from './config';

async function bootstrap() {
  const logger = new Logger('server-core');
  logger.debug('Starting server-core microservice...');
  logger.debug(`Using Kafka Config: ${JSON.stringify(kafkaConfig)}`);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: kafkaConfig.clientId,
        brokers: kafkaConfig.brokers,
      },
      consumer: {
        groupId: kafkaConfig.groupId,
      },
      subscribe: {
        topics: [kafkaConfig.eventsTopic],
        fromBeginning: false,
      },
    },
  });

  await app.listen();
}

bootstrap().catch((error) => {
  const logger = new Logger('server-core');
  logger.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
