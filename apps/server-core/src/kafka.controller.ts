import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import type { KafkaMessage } from '@nestjs/microservices/external/kafka.interface';
import { MessageProcessorService } from './message-processor.service';
import { kafkaConfig } from './config';
import { KafkaProducerService } from './kafka.producer';

@Controller()
export class KafkaController {
  private readonly logger = new Logger(KafkaController.name);

  constructor(
    private readonly processor: MessageProcessorService,
    private readonly producer: KafkaProducerService,
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

      await this.processor.process(value);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to process kafka message', error as Error);
      await this.producer.publishDeadLetter(_payload, reason);
      return;
    }
  }
}
