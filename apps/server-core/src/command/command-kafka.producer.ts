import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { kafkaConfig } from '../config';
import type { CommandKafkaEnvelope } from '@ai-platform/protocol-core';

@Injectable()
export class CommandKafkaProducer implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject('KAFKA_CLIENT') private readonly client: ClientKafka) {}

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  publish(message: CommandKafkaEnvelope, key?: string) {
    return this.client.emit(message.topic, key ? { key, value: message } : message);
  }

  publishDeadLetter(payload: unknown, reason: string) {
    return this.client.emit(kafkaConfig.deadLetterTopic, {
      id: 'dlq-' + Date.now(),
      ts: Date.now(),
      reason,
      payload,
    });
  }
}
