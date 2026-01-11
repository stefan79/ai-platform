import { randomUUID } from 'crypto';
import { z } from 'zod';
import { eventKafkaEnvelopeSchema } from '@ai-platform/protocol-core';
import type { EventKafkaEnvelope } from '@ai-platform/protocol-core';
import type { DomainChangeEnvelope } from './domain-change';
import { domainChangeEnvelopeSchema } from './domain-change';

export type OutboxEffectType = 'kafka.echo' | 'kafka.domain-change';

export type OutboxPayloadMap = {
  'kafka.echo': EventKafkaEnvelope;
  'kafka.domain-change': DomainChangeEnvelope;
};

type OutboxRecordBase = {
  readonly id: string;
  readonly pk: string;
  readonly sk: string;
  readonly createdAt: number;
};

export type OutboxRecordOf<T extends OutboxEffectType> = OutboxRecordBase & {
  readonly type: T;
  readonly payload: OutboxPayloadMap[T];
};

export type OutboxRecord =
  | OutboxRecordOf<'kafka.echo'>
  | OutboxRecordOf<'kafka.domain-change'>;

const outboxPk = (id: string) => `OUTBOX#${id}`;
const outboxSk = (createdAt: number) => `OUTBOX#${createdAt}`;

export function createOutboxRecord(
  type: 'kafka.echo',
  payload: OutboxPayloadMap['kafka.echo'],
): OutboxRecordOf<'kafka.echo'>;
export function createOutboxRecord(
  type: 'kafka.domain-change',
  payload: OutboxPayloadMap['kafka.domain-change'],
): OutboxRecordOf<'kafka.domain-change'>;
export function createOutboxRecord<T extends OutboxEffectType>(
  type: T,
  payload: OutboxPayloadMap[T],
): OutboxRecordOf<T> {
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
}

const outboxRecordBaseSchema = z
  .object({
    id: z.string(),
    pk: z.string(),
    sk: z.string(),
    createdAt: z.number().int().nonnegative(),
  })
  .strict();

export const outboxRecordSchema = z.discriminatedUnion('type', [
  outboxRecordBaseSchema.extend({
    type: z.literal('kafka.echo'),
    payload: eventKafkaEnvelopeSchema,
  }),
  outboxRecordBaseSchema.extend({
    type: z.literal('kafka.domain-change'),
    payload: domainChangeEnvelopeSchema,
  }),
]);
