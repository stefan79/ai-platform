import { Injectable } from '@nestjs/common';
import type { CommandKafkaEnvelope } from '@ai-platform/protocol-core';
import { z } from 'zod';
import { createDomainEventRecord } from '../../domain/events';
import type { CommandHandler } from './command-handler';
import type { ReduceContext } from '../../domain/reducers/reducer.types';
import type { ReductionResult } from '../../domain/reducers/reducer-chain.service';
import type { ServerContext } from '../../domain/server-context';

@Injectable()
export class SaveUserMessageCommandHandler implements CommandHandler {
  private context?: ServerContext;
  private readonly userMessageBodySchema = z
    .object({
      timestamp: z.number().int().nonnegative(),
      body: z.string(),
    })
    .strict();

  register(context: ServerContext): void {
    this.context = context;
    context.commandSchemaRegistry.register(
      'command.save-user-message',
      this.userMessageBodySchema,
    );
    context.registerThreadCommandReducer({
      pattern: { type: 'command.save-user-message' },
      reduce: (envelope, reduceContext) => this.reduce(envelope, reduceContext),
    });
  }

  reduce(envelope: CommandKafkaEnvelope, context: ReduceContext): ReductionResult {
    if (!this.context) {
      throw new Error('ServerContext not registered for save user message handler');
    }
    const command = this.context
      .commandSchemaRegistry
      .parse<z.infer<typeof this.userMessageBodySchema>>(
        envelope,
        'command.save-user-message',
      );
    const payload = command.payload;
    return {
      domainEvents: [
        createDomainEventRecord(context.userId ?? context.sessionId, 'user', payload),
      ],
      outboxRecords: [],
    };
  }
}
