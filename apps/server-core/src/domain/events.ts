import { randomUUID } from 'crypto';
import type { IEvent } from '@nestjs/cqrs';
import type { CoreMessageBody } from '@ai-platform/protocol-core';

export interface DomainEventRecord {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly aggregateType: 'server' | 'user' | 'thread';
  readonly domainEvent: true;
  readonly payload: CoreMessageBody;
  readonly occurredAt: number;
}

export class MessageReducedEvent implements IEvent {
  readonly id = randomUUID();
  constructor(public readonly record: DomainEventRecord) {}
}

export const createDomainEventRecord = (
  aggregateId: string,
  aggregateType: DomainEventRecord['aggregateType'],
  payload: CoreMessageBody,
): DomainEventRecord => ({
  eventId: randomUUID(),
  aggregateId,
  aggregateType,
  domainEvent: true,
  payload,
  occurredAt: Date.now(),
});
