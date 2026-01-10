import { z } from 'zod';

export const userMessageBodySchema = z
  .object({
    messageId: z.string().uuid(),
    threadId: z.string(),
    timestamp: z.number().int().nonnegative(),
    body: z.string(),
  })
  .strict();

export const assistantMessageSchema = z
  .object({
    messageId: z.string().uuid(),
    responseTo: z.string().uuid(),
    threadId: z.string(),
    assistantId: z.string().uuid(),
    timestamp: z.number().int().nonnegative(),
    body: z.string(),
  })
  .strict();

export const eventDefinitions = [
  { type: 'user.message', schema: userMessageBodySchema },
  { type: 'assistant.message', schema: assistantMessageSchema },
] as const;

export const eventSchemas = {
  'user.message': userMessageBodySchema,
  'assistant.message': assistantMessageSchema,
} as const;

export type EventType = keyof typeof eventSchemas;

export type EventPayloadMap = {
  [K in EventType]: z.infer<(typeof eventSchemas)[K]>;
};

export type EventEnvelope<T extends EventType = EventType> = {
  id: string;
  ts: number;
  type: T;
  body: EventPayloadMap[T];
};

export const parseEventPayload = <T extends EventType>(
  type: T,
  payload: unknown,
): EventPayloadMap[T] => eventSchemas[type].parse(payload);

export const eventEnvelopeSchema = z.object({
  id: z.string(),
  ts: z.number(),
  type: z.string(),
  body: z.unknown(),
});

export type RawEventEnvelope = z.infer<typeof eventEnvelopeSchema>;

export const parseEventEnvelope = (payload: unknown): RawEventEnvelope =>
  eventEnvelopeSchema.parse(payload);
