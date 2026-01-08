import { Injectable } from '@nestjs/common';
import { isMatching } from 'ts-pattern';
import type { CoreMessageBody } from '@ai-platform/protocol-core';
import type { ReductionResult } from './reducer-chain.service';
import type { ReduceContext, Reducer } from './reducer.types';
import { ServerContext } from '../server-context';

@Injectable()
export class ThreadReducer implements Reducer {
  constructor(private readonly context: ServerContext) {}

  async reduce(message: CoreMessageBody, context: ReduceContext): Promise<ReductionResult | null> {
    for (const entry of this.context.threadReducers) {
      const matches = isMatching(entry.pattern) as (
        value: CoreMessageBody,
      ) => value is Parameters<typeof entry.reduce>[0];
      if (matches(message)) {
        return entry.reduce(message, context);
      }
    }

    return null;
  }
}
