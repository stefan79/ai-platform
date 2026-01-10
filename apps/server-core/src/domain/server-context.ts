import { P } from 'ts-pattern';
import type { CommandKafkaEnvelope, EventKafkaEnvelope } from '@ai-platform/protocol-core';
import type { EventHandler } from '../event/strategies/event-handler';
import type { ReductionResult } from './reducers/reducer-chain.service';
import type { ReduceContext } from './reducers/reducer.types';
import type { CommandKafkaProducer } from '../command/command-kafka.producer';
import type { AssistantResponseService } from '../command/assistant-response.service';
import type { EventKafkaProducer } from '../event/event-kafka.producer';
import type { CommandSchemaRegistry } from './registries/command-schema.registry';
import type { EventSchemaRegistry } from './registries/event-schema.registry';

export type ReducerPattern<T = CommandKafkaEnvelope> = {
  pattern: P.Pattern<T>;
  reduce: (message: T, context: ReduceContext) => Promise<ReductionResult> | ReductionResult;
};

export class ServerContext {
  private readonly handlers: EventHandler<EventKafkaEnvelope>[];
  private readonly userReducers: ReducerPattern[];
  private readonly serverReducers: ReducerPattern[];
  private readonly threadReducers: ReducerPattern[];

  constructor(
    eventHandlers: EventHandler<EventKafkaEnvelope>[],
    readonly commandProducer: CommandKafkaProducer,
    readonly assistantResponse: AssistantResponseService,
    readonly eventProducer: EventKafkaProducer,
    readonly commandSchemaRegistry: CommandSchemaRegistry,
    readonly eventSchemaRegistry: EventSchemaRegistry,
    userCommandReducers: ReducerPattern[],
    serverCommandReducers: ReducerPattern[],
    threadCommandReducers: ReducerPattern[],
  ) {
    this.handlers = [...eventHandlers];
    this.userReducers = [...userCommandReducers];
    this.serverReducers = [...serverCommandReducers];
    this.threadReducers = [...threadCommandReducers];
  }

  get eventHandlers(): EventHandler<EventKafkaEnvelope>[] {
    return this.handlers;
  }

  registerEventHandler(handler: EventHandler<EventKafkaEnvelope>): void {
    this.handlers.push(handler);
  }

  get userCommandReducers(): ReducerPattern[] {
    return this.userReducers;
  }

  get serverCommandReducers(): ReducerPattern[] {
    return this.serverReducers;
  }

  get threadCommandReducers(): ReducerPattern[] {
    return this.threadReducers;
  }

  registerThreadCommandReducer(reducer: ReducerPattern): void {
    this.threadReducers.push(reducer);
  }
}
