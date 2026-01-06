import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { match, P } from 'ts-pattern';
import type { CoreMessageBody, KafkaEnvelope } from '@ai-platform/protocol-core';
import { createDomainEventRecord } from '../domain/events';
import { createOutboxRecord } from '../domain/outbox';
import { kafkaConfig } from '../config';
import type { ReductionResult } from './reducer-chain.service';
import type { Reducer } from './reducer.types';

@Injectable()
export class ThreadReducer implements Reducer {
  async reduce(message: CoreMessageBody): Promise<ReductionResult | null> {
    return match(message)
      .with(
        {
          messageId: P.string,
          threadId: P.string,
          content: P.string,
        },
        (chatMessage) => {
          const domainEvent = createDomainEventRecord(chatMessage.threadId, 'thread', chatMessage);
          const echoEnvelope: KafkaEnvelope = {
            id: randomUUID(),
            ts: Date.now(),
            type: 'assistant.message',
            body: {
              assistantId: randomUUID(),
              timestamp: Date.now(),
              body: `echo:${chatMessage.content}`,
            },
            messageType: 'assistant.message',
            topic: kafkaConfig.topic,
            partition: 0,
            offset: 0,
          };

          return {
            domainEvents: [domainEvent],
            outboxRecords: [createOutboxRecord('kafka.echo', echoEnvelope)],
          };
        },
      )
      .otherwise(() => null);
  }
}
