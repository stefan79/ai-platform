import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Effect, pipe } from 'effect';
import { randomUUID } from 'crypto';
import {
  parseCommandEnvelope,
  type CoreMessageBody,
  type CommandEnvelope,
} from '@ai-platform/protocol-core';
import { ReducerChainService } from './reducers/reducer-chain.service';
import { OutboxService } from './outbox.service';
import { MessageReducedEvent } from './domain/events';
import { AssistantResponseService } from './assistant-response.service';

@Injectable()
export class CommandProcessorService {
  constructor(
    private readonly reducerChain: ReducerChainService,
    private readonly outbox: OutboxService,
    private readonly eventBus: EventBus,
    private readonly assistant: AssistantResponseService,
  ) {}

  async process(raw: unknown): Promise<void> {
    console.log('Processing command:', JSON.stringify(raw));
    const program = pipe(
      Effect.try({
        try: () => parseCommandEnvelope(raw),
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

  private reduceCommand(envelope: CommandEnvelope) {
    const context = {
      sessionId: envelope.sessionId,
      userId: envelope.userId,
    };

    if (envelope.type === 'command.save-user-message') {
      const body = envelope.payload as CoreMessageBody;
      return this.reducerChain.reduce(body, context);
    }

    return pipe(
      Effect.tryPromise({
        try: () => this.assistant.generate(envelope.payload.prompt),
        catch: (error) => new Error(`Failed to generate assistant response: ${(error as Error).message}`),
      }),
      Effect.map(
        (responseText): CoreMessageBody => ({
          assistantId: randomUUID(),
          timestamp: Date.now(),
          body: responseText,
        }),
      ),
      Effect.flatMap((body) => this.reducerChain.reduce(body, context)),
    );
  }
}
