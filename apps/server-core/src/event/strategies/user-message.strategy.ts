import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type {
  CommandKafkaEnvelope,
  CommandEnvelope,
  EventKafkaEnvelope,
} from '@ai-platform/protocol-core';
import { z } from 'zod';
import { kafkaConfig } from '../../config';
import type { EventHandler } from './event-handler';
import type { ServerContext } from '../../domain/server-context';

const userMessageBodySchema = z
  .object({
    messageId: z.string().uuid(),
    threadId: z.string(),
    timestamp: z.number().int().nonnegative(),
    body: z.string(),
  })
  .strict();

export const assistantMessageSchema = z
  .object({
    messageId: z.string().uuid(),
    responseTo: z.string().uuid(),
    threadId: z.string(),
    assistantId: z.string().uuid(),
    timestamp: z.number().int().nonnegative(),
    body: z.string(),
  })
  .strict();

export const eventDefinitions = [
  {
    type: 'user.message',
    schema: userMessageBodySchema,
  },
  {
    type: 'assistant.message',
    schema: assistantMessageSchema,
  },
] as const;

@Injectable()
export class UserMessageStrategy implements EventHandler<EventKafkaEnvelope> {
  private readonly logger = new Logger(UserMessageStrategy.name);
  private readonly userMessageBodySchema = userMessageBodySchema;

  private context?: ServerContext;

  register(context: ServerContext): void {
    this.context = context;
    eventDefinitions.forEach((definition) =>
      context.eventSchemaRegistry.register(definition.type, definition.schema),
    );
    context.registerEventHandler(this);
  }

  match(envelope: EventKafkaEnvelope): boolean {
    return envelope.type === 'user.message';
  }

  async handle(envelope: EventKafkaEnvelope): Promise<void> {
    if (!this.match(envelope)) {
      this.logger.debug(`No strategy for message type ${envelope.type}`);
      return;
    }

    const userMessage = this.userMessageBodySchema.parse(envelope.body);
    const saveCommand: CommandEnvelope = {
      id: randomUUID(),
      ts: Date.now(),
      type: 'command.save-user-message',
      sessionId: envelope.sessionId,
      userId: envelope.userId,
      payload: userMessage,
    };

    const generateResponseCommand: CommandEnvelope = {
      id: randomUUID(),
      ts: Date.now(),
      type: 'command.generate-assistant-response',
      sessionId: envelope.sessionId,
      userId: envelope.userId,
      payload: {
        prompt: userMessage.body,
        responseTo: userMessage.messageId,
        threadId: userMessage.threadId,
      },
    };

    const saveEnvelope: CommandKafkaEnvelope = {
      ...saveCommand,
      commandType: saveCommand.type,
      topic: kafkaConfig.commandsTopic,
      partition: 0,
      offset: 0,
    };

    const generateEnvelope: CommandKafkaEnvelope = {
      ...generateResponseCommand,
      commandType: generateResponseCommand.type,
      topic: kafkaConfig.commandsTopic,
      partition: 0,
      offset: 0,
    };

    const producer = this.context?.commandProducer;
    if (!producer) {
      this.logger.error('Missing ServerContext command producer');
      return;
    }

    await producer.publish(saveEnvelope, envelope.sessionId);
    await producer.publish(generateEnvelope, envelope.sessionId);
  }
}
