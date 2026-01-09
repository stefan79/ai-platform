import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { AssistantMessageBody, CommandKafkaEnvelope, EventKafkaEnvelope } from '@ai-platform/protocol-core';
import { kafkaConfig } from '../../config';
import { createDomainEventRecord } from '../../domain/events';
import { createOutboxRecord } from '../../domain/outbox';
import type { CommandHandler } from './command-handler';
import type { ReduceContext } from '../../domain/reducers/reducer.types';
import type { ReductionResult } from '../../domain/reducers/reducer-chain.service';
import type { ServerContext } from '../../domain/server-context';

@Injectable()
export class ReplyWithAssistantMessageCommandHandler
  implements CommandHandler
{
  private context?: ServerContext;

  register(context: ServerContext): void {
    this.context = context;
    context.registerThreadCommandReducer({
      pattern: { type: 'command.generate-assistant-response' },
      reduce: (envelope, reduceContext) => this.reduce(envelope, reduceContext),
    });
  }

  async reduce(envelope: CommandKafkaEnvelope, context: ReduceContext): Promise<ReductionResult> {
    const payload = envelope.payload as { prompt?: unknown };
    if (typeof payload.prompt !== 'string') {
      throw new Error('Missing prompt for assistant response');
    }
    if (!this.context) {
      throw new Error('ServerContext not registered for reply command handler');
    }

    const responseText = await this.context.assistantResponse.generate(payload.prompt);
    const message: AssistantMessageBody = {
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
      domainEvents: [
        createDomainEventRecord(context.userId ?? context.sessionId, 'user', message),
      ],
      outboxRecords: [createOutboxRecord('kafka.echo', outgoingEnvelope)],
    };
  }
}
