import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { KafkaMessage } from '@nestjs/microservices/external/kafka.interface';
import { MessageProcessorService } from './message-processor.service';
import { kafkaConfig } from './config';

@Controller()
export class KafkaController {
  private readonly logger = new Logger(KafkaController.name);

  constructor(private readonly processor: MessageProcessorService) {}

  @EventPattern(kafkaConfig.topic)
  async handleMessage(@Payload() payload: KafkaMessage) {
    try {
      const value =
        typeof payload?.value === 'string'
          ? JSON.parse(payload.value)
          : Buffer.isBuffer(payload?.value)
            ? JSON.parse(payload.value.toString('utf8'))
            : payload?.value;

      await this.processor.process(value);
    } catch (error) {
      this.logger.error('Failed to process kafka message', error as Error);
      throw error;
    }
  }
}
