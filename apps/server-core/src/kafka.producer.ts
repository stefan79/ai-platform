import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { kafkaConfig } from './config';
import type { KafkaEnvelope } from '@ai-platform/protocol-core';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject('KAFKA_CLIENT') private readonly client: ClientKafka) {}

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  publishTo(topic: string, payload: unknown, key?: string) {
    return this.client.emit(topic, key ? { key, value: payload } : payload);
  }

  publish(message: KafkaEnvelope, key?: string) {
    return this.publishTo(message.topic, message, key);
  }

  publishDeadLetter(payload: unknown, reason: string) {
    return this.publishTo(kafkaConfig.deadLetterTopic, {
      id: 'dlq-' + Date.now(),
      ts: Date.now(),
      reason,
      payload,
    });
  }
}
