import { Injectable } from '@nestjs/common';
import type { CommandKafkaEnvelope, UserMessageBody } from '@ai-platform/protocol-core';
import { createDomainEventRecord } from '../../domain/events';
import type { CommandHandler } from './command-handler';
import type { ReduceContext } from '../../domain/reducers/reducer.types';
import type { ReductionResult } from '../../domain/reducers/reducer-chain.service';
import type { ServerContext } from '../../domain/server-context';

@Injectable()
export class SaveUserMessageCommandHandler implements CommandHandler {
  register(context: ServerContext): void {
    context.registerThreadCommandReducer({
      pattern: { type: 'command.save-user-message' },
      reduce: (envelope, reduceContext) => this.reduce(envelope, reduceContext),
    });
  }

  reduce(envelope: CommandKafkaEnvelope, context: ReduceContext): ReductionResult {
    const payload = envelope.payload as UserMessageBody;
    return {
      domainEvents: [
        createDomainEventRecord(context.userId ?? context.sessionId, 'user', payload),
      ],
      outboxRecords: [],
    };
  }
}
