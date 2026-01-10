import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import type { EventKafkaEnvelope } from '@ai-platform/protocol-core';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject('KAFKA_CLIENT') private readonly client: ClientKafka) {}

  async onModuleInit() {
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  publish(message: EventKafkaEnvelope, key?: string) {
    return this.client.emit(message.topic, key ? { key, value: message } : message);
  }
}
