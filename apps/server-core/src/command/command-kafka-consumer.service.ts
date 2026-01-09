import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';
import { kafkaConfig } from '../config';
import { CommandProcessorService } from './command-processor.service';
import { CommandKafkaProducer } from './command-kafka.producer';

@Injectable()
export class CommandKafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CommandKafkaConsumer.name);
  private readonly kafka = new Kafka({
    clientId: `${kafkaConfig.clientId}-commands`,
    brokers: kafkaConfig.brokers,
  });
  private readonly consumer = this.kafka.consumer({ groupId: kafkaConfig.commandsGroupId });

  constructor(
    private readonly processor: CommandProcessorService,
    private readonly producer: CommandKafkaProducer,
  ) {}

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: kafkaConfig.commandsTopic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const raw = message.value;
        if (!raw) {
          this.logger.warn('Skipping command message with empty value');
          return;
        }

        try {
          const parsed =
            typeof raw === 'string'
              ? JSON.parse(raw)
              : Buffer.isBuffer(raw)
                ? JSON.parse(raw.toString('utf8'))
                : raw;

          await this.processor.process(parsed);
        } catch (error) {
          const reason = error instanceof Error ? error.message : 'Unknown error';
          this.logger.error('Failed to process command message', error as Error);
          await this.producer.publishDeadLetter(raw, reason);
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }
}
