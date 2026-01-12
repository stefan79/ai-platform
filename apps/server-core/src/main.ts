import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { KafkaOptions, MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { kafkaConfig } from './config';

async function bootstrap() {
  const logger = new Logger('server-core');
  logger.debug('Starting server-core microservice...');
  logger.debug(`Using Kafka Config: ${JSON.stringify(kafkaConfig)}`);
  const consumerConfig = {
    groupId: kafkaConfig.groupId,
    ...(kafkaConfig.groupInstanceId ? { groupInstanceId: kafkaConfig.groupInstanceId } : {}),
  } as NonNullable<KafkaOptions['options']>['consumer'];
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: kafkaConfig.clientId,
        brokers: kafkaConfig.brokers,
      },
      consumer: consumerConfig,
      subscribe: {
        topics: [kafkaConfig.eventsTopic],
        fromBeginning: false,
      },
    },
  });

  await app.listen();
  return app;
}

function registerShutdownSignals(app: { close: () => Promise<void> }) {
  let shuttingDown = false;
  const logger = new Logger('server-core');
  const shutdown = async (signal: string) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.log(`server-core received ${signal}, shutting down...`);
    try {
      await app.close();
      logger.log('server-core shutdown complete.');
    } catch (error) {
      logger.error('server-core shutdown failed.', error as Error);
      process.exitCode = 1;
    } finally {
      process.exit();
    }
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap()
  .then((app) => {
    registerShutdownSignals(app);
  })
  .catch((error) => {
    const logger = new Logger('server-core');
    logger.error(error instanceof Error ? error.stack : String(error));
    process.exit(1);
  });
