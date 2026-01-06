import { Injectable } from '@nestjs/common';
import { match, P } from 'ts-pattern';
import type { CoreMessageBody } from '@ai-platform/protocol-core';
import { createDomainEventRecord } from '../domain/events';
import type { ReductionResult } from './reducer-chain.service';
import type { Reducer } from './reducer.types';

@Injectable()
export class ServerReducer implements Reducer {
  async reduce(message: CoreMessageBody): Promise<ReductionResult | null> {
    return match(message)
      .with(
        {
          role: 'system',
          messageId: P.string,
          threadId: P.string,
        },
        (chatMessage) => ({
          domainEvents: [
            createDomainEventRecord(chatMessage.threadId, 'server', chatMessage),
          ],
          outboxRecords: [],
        }),
      )
      .otherwise(() => null);
  }
}
