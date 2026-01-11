import { randomUUID } from 'crypto';
import type { EventKafkaEnvelope } from '@ai-platform/protocol-core';
import type { DomainChangeEnvelope } from './domain-change';

export type OutboxEffectType = 'kafka.echo' | 'kafka.domain-change';

export type OutboxPayloadMap = {
  'kafka.echo': EventKafkaEnvelope;
  'kafka.domain-change': DomainChangeEnvelope;
};

export interface OutboxRecord<T extends OutboxEffectType = OutboxEffectType> {
  readonly id: string;
  readonly pk: string;
  readonly sk: string;
  readonly type: T;
  readonly payload: OutboxPayloadMap[T];
  readonly createdAt: number;
}

const outboxPk = (id: string) => `OUTBOX#${id}`;
const outboxSk = (createdAt: number) => `OUTBOX#${createdAt}`;

export const createOutboxRecord = <T extends OutboxEffectType>(
  type: T,
  payload: OutboxPayloadMap[T],
): OutboxRecord<T> => {
  const id = randomUUID();
  const createdAt = Date.now();
  return {
    id,
    pk: outboxPk(id),
    sk: outboxSk(createdAt),
    type,
    payload,
    createdAt,
  };
};
