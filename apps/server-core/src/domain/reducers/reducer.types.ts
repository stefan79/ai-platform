import type { CommandKafkaEnvelope } from '@ai-platform/protocol-core';
import type { ReductionResult } from './reducer-chain.service';

export interface ReduceContext {
  sessionId: string;
  userId?: string;
}

export interface Reducer {
  reduce(message: CommandKafkaEnvelope, context: ReduceContext): Promise<ReductionResult | null>;
}
