import { randomUUID } from 'crypto';
import { z } from 'zod';
import type { DomainEventEnvelope, DomainAggregateType } from './events';
import { domainEventEnvelopeSchema } from './events';

//TODO: Envelope in an Envelope? Is this necessary?
export type DomainChangeEnvelope = {
  id: string;
  ts: number;
  type: 'domain.change';
  aggregateType: DomainAggregateType;
  aggregateId: string;
  domainEvent: DomainEventEnvelope;
};

export const createDomainChangeEnvelope = (
  domainEvent: DomainEventEnvelope,
): DomainChangeEnvelope => ({
  id: randomUUID(),
  ts: Date.now(),
  type: 'domain.change',
  aggregateType: domainEvent.aggregateType,
  aggregateId: domainEvent.aggregateId,
  domainEvent,
});

export const domainChangeEnvelopeSchema = z
  .object({
    id: z.string(),
    ts: z.number().int().nonnegative(),
    type: z.literal('domain.change'),
    aggregateType: z.enum(['server', 'user', 'thread']),
    aggregateId: z.string(),
    domainEvent: domainEventEnvelopeSchema,
  })
  .strict();
