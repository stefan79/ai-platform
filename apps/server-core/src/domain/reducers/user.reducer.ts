import { Injectable } from '@nestjs/common';
import type { CommandKafkaEnvelope } from '@ai-platform/protocol-core';
import type { ReductionResult } from './reducer-chain.service';
import type { ReduceContext, Reducer } from './reducer.types';
import { isMatching } from 'ts-pattern';
import { ServerContextRepository } from '../server-context.repository';

@Injectable()
export class UserReducer implements Reducer {
  constructor(private readonly contextRepository: ServerContextRepository) {}

  async reduce(message: CommandKafkaEnvelope, context: ReduceContext): Promise<ReductionResult | null> {
    const serverContext = this.contextRepository.load();
    for (const entry of serverContext.userCommandReducers) {
      const matches = isMatching(entry.pattern);
      if (matches(message)) {
        return entry.reduce(message, context);
      }
    }

    return null;
  }
}
