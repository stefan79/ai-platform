import type { CoreMessageBody } from '@ai-platform/protocol-core';
import type { ReductionResult } from './reducer-chain.service';

export interface Reducer {
  reduce(message: CoreMessageBody): Promise<ReductionResult | null>;
}
