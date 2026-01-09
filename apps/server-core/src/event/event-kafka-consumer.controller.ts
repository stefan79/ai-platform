import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import type { KafkaMessage } from '@nestjs/microservices/external/kafka.interface';
import { parseEventKafkaEnvelope } from '@ai-platform/protocol-core';
import { kafkaConfig } from '../config';
import { EventKafkaProducer } from './event-kafka.producer';
import { ServerContextRepository } from '../domain/server-context.repository';

@Controller()
export class EventKafkaConsumer {
  private readonly logger = new Logger(EventKafkaConsumer.name);

  constructor(
    private readonly producer: EventKafkaProducer,
    private readonly contextRepository: ServerContextRepository,
  ) {}

  @EventPattern(kafkaConfig.eventsTopic)
  async handleMessage(@Payload() _payload: KafkaMessage, @Ctx() context: KafkaContext) {
    try {
      const message = context.getMessage();
      const raw = message?.value;
      if (raw == null) {
        this.logger.warn('Skipping kafka message with empty value');
        return;
      }
      const value =
        typeof raw === 'string'
          ? JSON.parse(raw)
          : Buffer.isBuffer(raw)
            ? JSON.parse(raw.toString('utf8'))
            : raw;

      const envelope = parseEventKafkaEnvelope(value);
      const serverContext = this.contextRepository.load();
      const validated = serverContext.eventSchemaRegistry.parse(envelope);
      let matched = false;
      for (const handler of serverContext.eventHandlers) {
        if (!handler.match(validated)) {
          continue;
        }
        await handler.handle(validated);
        matched = true;
      }

      if (!matched) {
        this.logger.debug(`No strategy for message type ${envelope.type}`);
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to handle kafka message', error as Error);
      await this.producer.publishDeadLetter(_payload, reason);
      return;
    }
  }
}
