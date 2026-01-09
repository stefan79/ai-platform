import { z } from 'zod';
import { userMessageBodySchema } from './event-schema';

export const commandTypeSchema = z.enum([
  'command.save-user-message',
  'command.generate-assistant-response',
]);

export const saveUserMessageCommandSchema = z.object({
  type: z.literal('command.save-user-message'),
  payload: userMessageBodySchema,
});

export const generateAssistantResponseCommandSchema = z.object({
  type: z.literal('command.generate-assistant-response'),
  payload: z.object({
    prompt: z.string(),
  }),
});

const commandEnvelopeBaseSchema = z
  .object({
    id: z.string(),
    ts: z.number(),
    sessionId: z.string(),
    userId: z.string().uuid(),
  })
  .strict();

export const commandEnvelopeSchema = z.discriminatedUnion('type', [
  commandEnvelopeBaseSchema
    .extend(saveUserMessageCommandSchema.shape)
    .strict(),
  commandEnvelopeBaseSchema
    .extend(generateAssistantResponseCommandSchema.shape)
    .strict(),
]);

export type CommandEnvelope = z.infer<typeof commandEnvelopeSchema>;

export function parseCommandEnvelope(payload: unknown): CommandEnvelope {
  return commandEnvelopeSchema.parse(payload);
}

const commandKafkaEnvelopeBaseSchema = commandEnvelopeBaseSchema
  .extend({
    commandType: commandTypeSchema,
    topic: z.string(),
    partition: z.number().int().nonnegative(),
    offset: z.number().int().nonnegative(),
    headers: z.record(z.string()).optional(),
  })
  .strict();

const commandKafkaSaveSchema = commandKafkaEnvelopeBaseSchema
  .extend(saveUserMessageCommandSchema.shape)
  .strict();

const commandKafkaGenerateSchema = commandKafkaEnvelopeBaseSchema
  .extend(generateAssistantResponseCommandSchema.shape)
  .strict();

export const commandKafkaEnvelopeSchema = z.discriminatedUnion('type', [
  commandKafkaSaveSchema,
  commandKafkaGenerateSchema,
]);

export type CommandKafkaEnvelope = z.infer<typeof commandKafkaEnvelopeSchema>;

export function parseCommandKafkaEnvelope(payload: unknown): CommandKafkaEnvelope {
  return commandKafkaEnvelopeSchema.parse(payload);
}
