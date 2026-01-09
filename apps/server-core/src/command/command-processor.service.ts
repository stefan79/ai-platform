import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Effect, pipe } from 'effect';
import { parseCommandKafkaEnvelope, type CommandKafkaEnvelope } from '@ai-platform/protocol-core';
import { ReducerChainService } from '../domain/reducers/reducer-chain.service';
import { OutboxService } from './outbox.service';
import { MessageReducedEvent } from '../domain/events';

@Injectable()
export class CommandProcessorService {
  constructor(
    private readonly reducerChain: ReducerChainService,
    private readonly outbox: OutboxService,
    private readonly eventBus: EventBus,
  ) {}

  async process(raw: unknown): Promise<void> {
    console.log('Processing command:', JSON.stringify(raw));
    const program = pipe(
      Effect.try({
        try: () => parseCommandKafkaEnvelope(raw),
        catch: (error) => new Error(`Invalid command envelope: ${(error as Error).message}`),
      }),
      Effect.flatMap((envelope) => this.reduceCommand(envelope)),
      Effect.tap((result) =>
        Effect.forEach(result.domainEvents, (record) =>
          Effect.sync(() => this.eventBus.publish(new MessageReducedEvent(record))),
        ),
      ),
      Effect.flatMap((result) => this.outbox.persistAndDispatch(result)),
    );

    await Effect.runPromise(program);
  }

  private reduceCommand(envelope: CommandKafkaEnvelope) {
    const reduceContext = {
      sessionId: envelope.sessionId,
      userId: envelope.userId,
    };

    return this.reducerChain.reduce(envelope, reduceContext);
  }
}
