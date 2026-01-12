import { randomUUID } from 'crypto';
import type { IEvent } from '@nestjs/cqrs';
import { z } from 'zod';

export type DomainAggregateType = 'server' | 'user' | 'thread';

export type DomainEventType =
  | 'server.setting-updated'
  | 'server.user-added'
  | 'user.profile-updated'
  | 'user.thread-added'
  | 'thread.message-added'
  | 'thread.title-updated'
  | 'thread.metadata-updated';

export type DomainEventPayloadMap = {
  'server.setting-updated': { key: string; value: string };
  'server.user-added': { userId: string };
  'user.profile-updated': { displayName?: string; avatarUrl?: string };
  'user.thread-added': { threadId: string };
  'thread.message-added': {
    messageId: string;
    authorId: string;
    timestamp: number;
    body: string;
  };
  'thread.title-updated': { title: string };
  'thread.metadata-updated': { key: string; value: string };
};

export type DomainEventEnvelope<T extends DomainEventType = DomainEventType> = {
  eventId: string;
  occurredAt: number;
  aggregateId: string;
  aggregateType: DomainAggregateType;
  type: T;
  payload: DomainEventPayloadMap[T];
  version?: number;
};

const settingUpdatedSchema = z
  .object({
    key: z.string(),
    value: z.string(),
  })
  .strict();

const serverUserAddedSchema = z
  .object({
    userId: z.string(),
  })
  .strict();

const userProfileUpdatedSchema = z
  .object({
    displayName: z.string().optional(),
    avatarUrl: z.string().url().optional(),
  })
  .strict();

const userThreadAddedSchema = z
  .object({
    threadId: z.string(),
  })
  .strict();

const threadMessageAddedSchema = z
  .object({
    messageId: z.string(),
    authorId: z.string(),
    timestamp: z.number().int().nonnegative(),
    body: z.string(),
  })
  .strict();

const threadTitleUpdatedSchema = z
  .object({
    title: z.string(),
  })
  .strict();

const threadMetadataUpdatedSchema = z
  .object({
    key: z.string(),
    value: z.string(),
  })
  .strict();

export const domainEventDefinitions = [
  { type: 'server.setting-updated', schema: settingUpdatedSchema },
  { type: 'server.user-added', schema: serverUserAddedSchema },
  { type: 'user.profile-updated', schema: userProfileUpdatedSchema },
  { type: 'user.thread-added', schema: userThreadAddedSchema },
  { type: 'thread.message-added', schema: threadMessageAddedSchema },
  { type: 'thread.title-updated', schema: threadTitleUpdatedSchema },
  { type: 'thread.metadata-updated', schema: threadMetadataUpdatedSchema },
] as const;

const aggregateTypeSchema = z.enum(['server', 'user', 'thread']);

const domainEventEnvelopeOptions = domainEventDefinitions.map((definition) =>
  z
    .object({
      eventId: z.string(),
      occurredAt: z.number().int().nonnegative(),
      aggregateId: z.string(),
      aggregateType: aggregateTypeSchema,
      type: z.literal(definition.type),
      payload: definition.schema,
      version: z.number().int().nonnegative().optional(),
    })
    .strict(),
);

export const domainEventEnvelopeSchema = z.discriminatedUnion(
  'type',
  domainEventEnvelopeOptions as unknown as [
    z.ZodDiscriminatedUnionOption<'type'>,
    ...z.ZodDiscriminatedUnionOption<'type'>[],
  ],
);

export type DomainEventEnvelopeSchema = z.infer<typeof domainEventEnvelopeSchema>;

export function parseDomainEventEnvelope(payload: unknown): DomainEventEnvelopeSchema {
  return domainEventEnvelopeSchema.parse(payload);
}

export class MessageReducedEvent implements IEvent {
  readonly id = randomUUID();
  constructor(public readonly record: DomainEventEnvelope) {}
}

export const createDomainEventEnvelope = <T extends DomainEventType>(input: {
  aggregateId: string;
  aggregateType: DomainAggregateType;
  type: T;
  payload: DomainEventPayloadMap[T];
  occurredAt?: number;
  eventId?: string;
  version?: number;
}): DomainEventEnvelope<T> => ({
  eventId: input.eventId ?? randomUUID(),
  occurredAt: input.occurredAt ?? Date.now(),
  aggregateId: input.aggregateId,
  aggregateType: input.aggregateType,
  type: input.type,
  payload: input.payload,
  version: input.version,
});
