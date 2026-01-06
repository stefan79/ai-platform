import { Injectable } from '@nestjs/common';
import { Effect } from 'effect';
import type { CoreMessageBody } from '@ai-platform/protocol-core';
import type { OutboxRecord } from '../domain/outbox';
import type { DomainEventRecord } from '../domain/events';
import type { Reducer } from './reducer.types';
import { ServerReducer } from './server.reducer';
import { UserReducer } from './user.reducer';
import { ThreadReducer } from './thread.reducer';

export interface ReductionResult {
  domainEvents: DomainEventRecord[];
  outboxRecords: OutboxRecord[];
}

const emptyReduction: ReductionResult = {
  domainEvents: [],
  outboxRecords: [],
};

@Injectable()
export class ReducerChainService {
  private readonly reducers: Reducer[];

  constructor(server: ServerReducer, user: UserReducer, thread: ThreadReducer) {
    this.reducers = [server, user, thread];
  }

  reduce(message: CoreMessageBody) {
    return Effect.tryPromise({
      try: async () => {
        let result = emptyReduction;

        for (const reducer of this.reducers) {
          const reduction = await reducer.reduce(message);

          if (!reduction) {
            continue;
          }

          result = {
            domainEvents: [...result.domainEvents, ...reduction.domainEvents],
            outboxRecords: [...result.outboxRecords, ...reduction.outboxRecords],
          };
        }

        return result;
      },
      catch: (error) => error as Error,
    });
  }
}
