import { Injectable, Logger } from '@nestjs/common';
import { Effect } from 'effect';
import type { CommandKafkaEnvelope } from '@ai-platform/protocol-core';
import type { OutboxRecord } from '../outbox';
import type { DomainEventEnvelope } from '../events';
import type { ServerSnapshot, ThreadSnapshot, UserSnapshot } from '../snapshots';
import type { Reducer, ReduceContext } from './reducer.types';
import { ServerReducer } from './server.reducer';
import { UserReducer } from './user.reducer';
import { ThreadReducer } from './thread.reducer';

export interface ReductionResult {
  domainEvents: DomainEventEnvelope[];
  snapshots: Array<ServerSnapshot | UserSnapshot | ThreadSnapshot>;
  outboxRecords: OutboxRecord[];
}

const emptyReduction: ReductionResult = {
  domainEvents: [],
  snapshots: [],
  outboxRecords: [],
};

@Injectable()
export class ReducerChainService {
  private readonly reducers: Reducer[];
  private readonly logger = new Logger(ReducerChainService.name);

  constructor(server: ServerReducer, user: UserReducer, thread: ThreadReducer) {
    this.reducers = [server, user, thread];
  }

  reduce(message: CommandKafkaEnvelope, context: ReduceContext) {
    return Effect.tryPromise({
      try: async () => {
        let result = emptyReduction;

        for (const reducer of this.reducers) {
          const reduction = await reducer.reduce(message, context);

          if (!reduction) {
            continue;
          }

          this.logger.debug(
            `Reducer ${reducer.constructor.name} produced ${JSON.stringify(reduction)}`,
          );

          result = {
            domainEvents: [...result.domainEvents, ...reduction.domainEvents],
            snapshots: [...result.snapshots, ...reduction.snapshots],
            outboxRecords: [...result.outboxRecords, ...reduction.outboxRecords],
          };
        }

        return result;
      },
      catch: (error) => error as Error,
    });
  }
}
