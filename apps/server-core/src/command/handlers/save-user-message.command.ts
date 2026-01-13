import { Injectable } from '@nestjs/common';
import type { CommandKafkaEnvelope } from '@ai-platform/protocol-core';
import { z } from 'zod';
import { createDomainEventEnvelope } from '../../domain/events';
import { applyThreadEvent } from '../../domain/snapshots';
import type { CommandHandler } from './command-handler';
import type { ReduceContext } from '../../domain/reducers/reducer.types';
import type { ReductionResult } from '../../domain/reducers/reducer-chain.service';
import type { ServerContext } from '../../domain/server-context';
import { DynamoDomainRepository } from '../../domain/repository/domain-repository';

@Injectable()
export class SaveUserMessageCommandHandler implements CommandHandler {
  private context?: ServerContext;
  private readonly userMessageBodySchema = z
    .object({
      messageId: z.string().uuid(),
      threadId: z.string(),
      timestamp: z.number().int().nonnegative(),
      body: z.string(),
    })
    .strict();

  constructor(private readonly repository: DynamoDomainRepository) {}

  register(context: ServerContext): void {
    this.context = context;
    context.commandSchemaRegistry.register('command.save-user-message', this.userMessageBodySchema);
    context.registerThreadCommandReducer({
      pattern: { type: 'command.save-user-message' },
      reduce: (envelope, reduceContext) => this.reduce(envelope, reduceContext),
    });
  }

  async reduce(envelope: CommandKafkaEnvelope, context: ReduceContext): Promise<ReductionResult> {
    if (!this.context) {
      throw new Error('ServerContext not registered for save user message handler');
    }
    const command = this.context.commandSchemaRegistry.parse<
      z.infer<typeof this.userMessageBodySchema>
    >(envelope, 'command.save-user-message');
    const payload = this.context.eventSchemaRegistry.parsePayload<
      z.infer<typeof this.userMessageBodySchema>
    >('user.message', command.payload);
    const authorId = context.userId ?? context.sessionId;
    const messageEnvelope = {
      type: 'user.message',
      payload,
    };
    const event = createDomainEventEnvelope({
      aggregateId: payload.threadId,
      aggregateType: 'thread',
      type: 'thread.message-added',
      payload: {
        authorId,
        message: messageEnvelope,
      },
    });
    const thread = await this.repository.loadThread(payload.threadId);
    if (!thread) {
      throw new Error('Thread not found');
    }
    const nextThread = applyThreadEvent(thread, event);
    return {
      domainEvents: [event],
      snapshots: [nextThread],
      outboxRecords: [],
    };
  }
}
