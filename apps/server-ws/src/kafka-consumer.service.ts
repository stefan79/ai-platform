import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Kafka, type ConsumerConfig } from 'kafkajs';
import { parseEventKafkaEnvelope } from '@ai-platform/protocol-core';
import type { WsEnvelope } from '@ai-platform/protocol-ws';
import { kafkaConfig } from './config';
import { WsGateway } from './ws.gateway';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private readonly kafka = new Kafka({
    clientId: `${kafkaConfig.clientId}-outbox`,
    brokers: kafkaConfig.brokers,
  });
  private readonly consumer = this.kafka.consumer({
    groupId: kafkaConfig.outboxGroupId,
    ...(kafkaConfig.outboxGroupInstanceId
      ? { groupInstanceId: kafkaConfig.outboxGroupInstanceId }
      : {}),
  } as ConsumerConfig);

  constructor(private readonly gateway: WsGateway) {}

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: kafkaConfig.outboxTopic, fromBeginning: false });

    await this.consumer.run({
      eachMessage: async ({ message }) => {
        const raw = message.value;
        if (!raw) {
          return;
        }

        try {
          const parsed =
            typeof raw === 'string'
              ? JSON.parse(raw)
              : Buffer.isBuffer(raw)
                ? JSON.parse(raw.toString('utf8'))
                : raw;

          const envelope = parseEventKafkaEnvelope(parsed);
          const wsEnvelope: WsEnvelope = {
            v: 1,
            id: envelope.id,
            ts: envelope.ts,
            type: envelope.type,
            body: envelope.body,
            direction: 'server',
          };

          const delivered = this.gateway.emitToSession(envelope.sessionId, wsEnvelope);
          if (!delivered) {
            this.logger.warn(`No active socket for sessionId ${envelope.sessionId}`);
          }
        } catch (error) {
          this.logger.error('Failed to handle outbox message', error as Error);
        }
      },
    });
  }

  async onModuleDestroy() {
    await this.consumer.stop();
    await this.consumer.disconnect();
  }
}
