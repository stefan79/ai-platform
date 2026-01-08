import type { CoreMessageBody } from '@ai-platform/protocol-core';
import type { ReductionResult } from './reducer-chain.service';

export interface ReduceContext {
  sessionId: string;
  userId?: string;
}

export interface Reducer {
  //TODO: We need to define a server object, it will house the users (look up via user id) , the threads (lookup via user and thread id) and allow the retrievel of messages from the thread. Also it will contain a context with three lists of the reducers (server, user, thread) and needs to be updated if domain events change the server state.
  reduce(message: CoreMessageBody, context: ReduceContext): Promise<ReductionResult | null>;
}
