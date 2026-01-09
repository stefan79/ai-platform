import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import type { KafkaMessage } from '@nestjs/microservices/external/kafka.interface';
import { parseKafkaEnvelope } from '@ai-platform/protocol-core';
import { kafkaConfig } from './config';
import { KafkaProducerService } from './kafka.producer';
import { UserMessageStrategy } from './strategies/user-message.strategy';

@Controller()
export class KafkaController {
  private readonly logger = new Logger(KafkaController.name);

  constructor(
    private readonly producer: KafkaProducerService,
    private readonly strategy: UserMessageStrategy,
  ) {}

  @EventPattern(kafkaConfig.topic)
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

      const envelope = parseKafkaEnvelope(value);
      await this.strategy.handle(envelope);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to handle kafka message', error as Error);
      await this.producer.publishDeadLetter(_payload, reason);
      return;
    }
  }
}
