import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Effect, pipe } from 'effect';
import { parseKafkaEnvelope, type CoreMessageBody } from '@ai-platform/protocol-core';
import { ReducerChainService } from './reducers/reducer-chain.service';
import { OutboxService } from './outbox.service';
import { MessageReducedEvent } from './domain/events';

@Injectable()
export class MessageProcessorService {
  constructor(
    private readonly reducerChain: ReducerChainService,
    private readonly outbox: OutboxService,
    private readonly eventBus: EventBus,
  ) {}

  async process(raw: unknown): Promise<void> {
    const program = pipe(
      Effect.try({
        try: () => parseKafkaEnvelope(raw),
        catch: (error) => new Error(`Invalid kafka envelope: ${(error as Error).message}`),
      }),
      Effect.map((envelope) => envelope.body as CoreMessageBody),
      Effect.flatMap((body) => this.reducerChain.reduce(body)),
      Effect.tap((result) =>
        Effect.forEach(result.domainEvents, (record) =>
          Effect.sync(() => this.eventBus.publish(new MessageReducedEvent(record))),
        ),
      ),
      Effect.flatMap((result) => this.outbox.persistAndDispatch(result)),
    );

    await Effect.runPromise(program);
  }
}
