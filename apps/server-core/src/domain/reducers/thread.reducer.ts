import { Injectable } from '@nestjs/common';
import { isMatching } from 'ts-pattern';
import type { CommandKafkaEnvelope } from '@ai-platform/protocol-core';
import type { ReductionResult } from './reducer-chain.service';
import type { ReduceContext, Reducer } from './reducer.types';
import { ServerContextRepository } from '../server-context.repository';

@Injectable()
export class ThreadReducer implements Reducer {
  constructor(private readonly contextRepository: ServerContextRepository) {}

  async reduce(message: CommandKafkaEnvelope, context: ReduceContext): Promise<ReductionResult | null> {
    const serverContext = this.contextRepository.load();
    for (const entry of serverContext.threadCommandReducers) {
      const matches = isMatching(entry.pattern) as (
        value: CommandKafkaEnvelope,
      ) => value is Parameters<typeof entry.reduce>[0];
      if (matches(message)) {
        return entry.reduce(message, context);
      }
    }

    return null;
  }
}
