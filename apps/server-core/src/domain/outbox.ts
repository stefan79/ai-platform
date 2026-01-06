import { randomUUID } from 'crypto';
import type { KafkaEnvelope } from '@ai-platform/protocol-core';

export type OutboxEffectType = 'kafka.echo';

export interface OutboxRecord {
  readonly id: string;
  readonly type: OutboxEffectType;
  readonly payload: KafkaEnvelope;
  readonly createdAt: number;
}

export const createOutboxRecord = (type: OutboxEffectType, payload: KafkaEnvelope): OutboxRecord => ({
  id: randomUUID(),
  type,
  payload,
  createdAt: Date.now(),
});
