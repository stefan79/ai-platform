import { z } from 'zod';

export const coreMessageTypeSchema = z.string();

export const coreMessageBodySchema = z.unknown();
export type CoreMessageBody = z.infer<typeof coreMessageBodySchema>;

export const coreEnvelopeSchema = z
  .object({
    id: z.string(),
    ts: z.number(),
    type: coreMessageTypeSchema,
    body: coreMessageBodySchema,
  })
  .strict();

export type CoreEnvelope = z.infer<typeof coreEnvelopeSchema>;

export function parseCoreEnvelope(payload: unknown): CoreEnvelope {
  return coreEnvelopeSchema.parse(payload);
}

export const eventKafkaEnvelopeSchema = coreEnvelopeSchema
  .extend({
    sessionId: z.string(),
    userId: z.string().uuid(),
    messageType: coreMessageTypeSchema,
    topic: z.string(),
    partition: z.number().int().nonnegative(),
    offset: z.number().int().nonnegative(),
    headers: z.record(z.string()).optional(),
  })
  .strict();

export type EventKafkaEnvelope = z.infer<typeof eventKafkaEnvelopeSchema>;

export function parseEventKafkaEnvelope(payload: unknown): EventKafkaEnvelope {
  return eventKafkaEnvelopeSchema.parse(payload);
}
