import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { CommandKafkaEnvelope, EventKafkaEnvelope } from '@ai-platform/protocol-core';
import { z } from 'zod';
import { kafkaConfig } from '../../config';
import { createDomainEventRecord } from '../../domain/events';
import { createOutboxRecord } from '../../domain/outbox';
import { assistantMessageSchema } from '../../event/strategies/user-message.strategy';
import type { CommandHandler } from './command-handler';
import type { ReduceContext } from '../../domain/reducers/reducer.types';
import type { ReductionResult } from '../../domain/reducers/reducer-chain.service';
import type { ServerContext } from '../../domain/server-context';

@Injectable()
export class ReplyWithAssistantMessageCommandHandler implements CommandHandler {
  private context?: ServerContext;

  register(context: ServerContext): void {
    this.context = context;
    context.commandSchemaRegistry.register(
      'command.generate-assistant-response',
      z.object({ prompt: z.string(), responseTo: z.string().uuid(), threadId: z.string() }),
    );
    context.registerThreadCommandReducer({
      pattern: { type: 'command.generate-assistant-response' },
      reduce: (envelope, reduceContext) => this.reduce(envelope, reduceContext),
    });
  }

  async reduce(envelope: CommandKafkaEnvelope, context: ReduceContext): Promise<ReductionResult> {
    if (!this.context) {
      throw new Error('ServerContext not registered for reply command handler');
    }
    const command = this.context.commandSchemaRegistry.parse<{
      prompt: string;
      responseTo: string;
      threadId: string;
    }>(
      envelope,
      'command.generate-assistant-response',
    );
    const responseText = await this.context.assistantResponse.generate(command.payload.prompt);
    const message: z.infer<typeof assistantMessageSchema> = {
      messageId: randomUUID(),
      responseTo: command.payload.responseTo,
      threadId: command.payload.threadId,
      assistantId: randomUUID(),
      timestamp: Date.now(),
      body: responseText,
    };

    const outgoingEnvelope: EventKafkaEnvelope = {
      id: randomUUID(),
      ts: Date.now(),
      type: 'assistant.message',
      body: message,
      sessionId: context.sessionId,
      userId: context.userId ?? context.sessionId,
      messageType: 'assistant.message',
      topic: kafkaConfig.outboxTopic,
      partition: 0,
      offset: 0,
    };

    return {
      domainEvents: [createDomainEventRecord(context.userId ?? context.sessionId, 'user', message)],
      outboxRecords: [createOutboxRecord('kafka.echo', outgoingEnvelope)],
    };
  }
}
