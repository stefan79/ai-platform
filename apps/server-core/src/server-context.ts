import { Injectable } from '@nestjs/common';
import { P } from 'ts-pattern';
import type { CoreMessageBody, KafkaEnvelope } from '@ai-platform/protocol-core';
import { createDomainEventRecord } from './domain/events';
import type { ReductionResult } from './reducers/reducer-chain.service';
import type { ReduceContext } from './reducers/reducer.types';
import { createOutboxRecord } from './domain/outbox';
import { kafkaConfig } from './config';
import { randomUUID } from 'crypto';

export type ReducerPattern<T extends CoreMessageBody = CoreMessageBody> = {
  pattern: P.Pattern<T>;
  reduce: (message: T, context: ReduceContext) => ReductionResult;
};

type UserMessagePattern = {
  timestamp: number;
  body: string;
};

const userMessagePattern: P.Pattern<UserMessagePattern> = {
  timestamp: P.number,
  body: P.string,
};

type AssistantMessagePattern = {
  assistantId: string;
  timestamp: number;
  body: string;
};

const assistantMessagePattern: P.Pattern<AssistantMessagePattern> = {
  assistantId: P.string,
  timestamp: P.number,
  body: P.string,
};

@Injectable()
export class ServerContext {
  readonly userReducers: ReducerPattern[] = [];
  readonly serverReducers: ReducerPattern[] = [];
  readonly threadReducers: ReducerPattern[] = [
    {
      pattern: assistantMessagePattern,
      reduce: (assistantMessage, context) => {
        const outgoingEnvelope: KafkaEnvelope = {
          id: randomUUID(),
          ts: Date.now(),
          type: 'assistant.message',
          body: assistantMessage,
          sessionId: context.sessionId,
          userId: context.userId ?? context.sessionId,
          messageType: 'assistant.message',
          topic: kafkaConfig.outboxTopic,
          partition: 0,
          offset: 0,
        };

        return {
          domainEvents: [
            createDomainEventRecord(context.userId ?? context.sessionId, 'user', assistantMessage),
          ],
          outboxRecords: [createOutboxRecord('kafka.echo', outgoingEnvelope)],
        };
      },
    },
    {
      pattern: userMessagePattern,
      reduce: (userMessage, context) => ({
        domainEvents: [
          createDomainEventRecord(context.userId ?? context.sessionId, 'user', userMessage),
        ],
        outboxRecords: [],
      }),
    },
  ];
}
