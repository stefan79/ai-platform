import { Injectable } from '@nestjs/common';
import type { CoreMessageBody } from '@ai-platform/protocol-core';
import type { ReductionResult } from './reducer-chain.service';
import type { ReduceContext, Reducer } from './reducer.types';
import { isMatching } from 'ts-pattern';
import { ServerContext } from '../server-context';

@Injectable()
export class ServerReducer implements Reducer {
  constructor(private readonly context: ServerContext) {}

  async reduce(message: CoreMessageBody, context: ReduceContext): Promise<ReductionResult | null> {
    for (const entry of this.context.serverReducers) {
      const matches = isMatching(entry.pattern);
      if (matches(message)) {
        return entry.reduce(message, context);
      }
    }

    return null;
  }
}
