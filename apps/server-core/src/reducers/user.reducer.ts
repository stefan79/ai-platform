import { Injectable } from '@nestjs/common';
import { match, P } from 'ts-pattern';
import type { CoreMessageBody } from '@ai-platform/protocol-core';
import { createDomainEventRecord } from '../domain/events';
import type { ReductionResult } from './reducer-chain.service';
import type { Reducer } from './reducer.types';

@Injectable()
export class UserReducer implements Reducer {
  async reduce(message: CoreMessageBody): Promise<ReductionResult | null> {
    return match(message)
      .with(
        {
          userId: P.string,
          timestamp: P.number,
          body: P.string,
        },
        (userMessage) => ({
          domainEvents: [
            createDomainEventRecord(userMessage.userId, 'user', userMessage),
          ],
          outboxRecords: [],
        }),
      )
      .otherwise(() => null);
  }
}
