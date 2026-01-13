import { z } from 'zod';
export const commandTypeSchema = z.string();

const commandEnvelopeBaseSchema = z
  .object({
    id: z.string(),
    ts: z.number(),
    sessionId: z.string(),
    userId: z.string(),
  })
  .strict();

export const commandEnvelopeSchema = commandEnvelopeBaseSchema
  .extend({
    type: z.string(),
    payload: z.unknown(),
  })
  .strict();

export type CommandEnvelope = z.infer<typeof commandEnvelopeSchema>;

export function parseCommandEnvelope(payload: unknown): CommandEnvelope {
  return commandEnvelopeSchema.parse(payload);
}

export const commandKafkaEnvelopeSchema = commandEnvelopeSchema
  .extend({
    commandType: commandTypeSchema,
    topic: z.string(),
    partition: z.number().int().nonnegative(),
    offset: z.number().int().nonnegative(),
    headers: z.record(z.string()).optional(),
  })
  .strict();

export type CommandKafkaEnvelope = z.infer<typeof commandKafkaEnvelopeSchema>;

export function parseCommandKafkaEnvelope(payload: unknown): CommandKafkaEnvelope {
  return commandKafkaEnvelopeSchema.parse(payload);
}
