import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { KafkaOptions, MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { kafkaConfig } from './config';

async function bootstrap() {
  console.log('Starting server-core microservice...');
  console.log('Using Kafka Config:', kafkaConfig);
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
  const shutdown = async (signal: string) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    // eslint-disable-next-line no-console
    console.log(`server-core received ${signal}, shutting down...`);
    try {
      await app.close();
      // eslint-disable-next-line no-console
      console.log('server-core shutdown complete.');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('server-core shutdown failed.', error);
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
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });
