import { randomUUID } from 'crypto';
import type { DomainEventEnvelope, DomainAggregateType } from './events';

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
