import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { match } from 'ts-pattern';
import type { CommandEnvelope, KafkaEnvelope, UserMessageBody } from '@ai-platform/protocol-core';
import { kafkaConfig } from '../config';
import { KafkaProducerService } from '../kafka.producer';

@Injectable()
export class UserMessageStrategy {
  private readonly logger = new Logger(UserMessageStrategy.name);

  constructor(private readonly producer: KafkaProducerService) {}

  //TODO: Should not be receviving the full KafkaEnvelope, only the relevant parts
  async handle(envelope: KafkaEnvelope): Promise<void> {
    await match(envelope)
      .with({ type: 'user.message' }, async (message) => {
        const userMessage = message.body as UserMessageBody;
        const saveCommand: CommandEnvelope = {
          id: randomUUID(),
          ts: Date.now(),
          type: 'command.save-user-message',
          sessionId: message.sessionId,
          userId: message.userId,
          payload: userMessage,
        };

        const generateResponseCommand: CommandEnvelope = {
          id: randomUUID(),
          ts: Date.now(),
          type: 'command.generate-assistant-response',
          sessionId: message.sessionId,
          userId: message.userId,
          payload: {
            prompt: userMessage.body,
          },
        };

        await this.producer.publishTo(
          kafkaConfig.commandsTopic,
          saveCommand,
          message.sessionId,
        );
        await this.producer.publishTo(
          kafkaConfig.commandsTopic,
          generateResponseCommand,
          message.sessionId,
        );
      })
      .otherwise(() => {
        this.logger.debug(`No strategy for message type ${envelope.type}`);
      });
  }
}
