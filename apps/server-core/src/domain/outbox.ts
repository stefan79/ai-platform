import { randomUUID } from 'crypto';
import type { EventKafkaEnvelope } from '@ai-platform/protocol-core';

export type OutboxEffectType = 'kafka.echo';

export interface OutboxRecord {
  readonly id: string;
  readonly type: OutboxEffectType;
  readonly payload: EventKafkaEnvelope;
  readonly createdAt: number;
}

export const createOutboxRecord = (
  type: OutboxEffectType,
  payload: EventKafkaEnvelope,
): OutboxRecord => ({
  id: randomUUID(),
  type,
  payload,
  createdAt: Date.now(),
});
