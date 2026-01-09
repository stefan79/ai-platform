import { z } from 'zod';

export const chatRoleSchema = z.enum(['system', 'user', 'assistant', 'tool']);

export const chatMessageBodySchema = z
  .object({
  messageId: z.string(),
  threadId: z.string(),
  role: chatRoleSchema,
  content: z.string(),
  createdAt: z.string(),
  metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export type ChatMessageBody = z.infer<typeof chatMessageBodySchema>;

export const userMessageBodySchema = z
  .object({
    timestamp: z.number().int().nonnegative(),
    body: z.string(),
  })
  .strict();

export type UserMessageBody = z.infer<typeof userMessageBodySchema>;

export const assistantMessageBodySchema = z
  .object({
  assistantId: z.string().uuid(),
  timestamp: z.number().int().nonnegative(),
  body: z.string(),
  })
  .strict();

export type AssistantMessageBody = z.infer<typeof assistantMessageBodySchema>;

export const coreMessageTypeSchema = z.enum(['chat.message', 'user.message', 'assistant.message']);

export const coreMessageBodySchema = z.union([
  chatMessageBodySchema,
  userMessageBodySchema,
  assistantMessageBodySchema,
]);
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

export function parseChatMessageBody(payload: unknown): ChatMessageBody {
  return chatMessageBodySchema.parse(payload);
}

export function parseUserMessageBody(payload: unknown): UserMessageBody {
  return userMessageBodySchema.parse(payload);
}

export function parseAssistantMessageBody(payload: unknown): AssistantMessageBody {
  return assistantMessageBodySchema.parse(payload);
}

export function parseCoreEnvelope(payload: unknown): CoreEnvelope {
  return coreEnvelopeSchema.parse(payload);
}

export const kafkaEnvelopeSchema = coreEnvelopeSchema.extend({
  sessionId: z.string(),
  userId: z.string().uuid(),
  messageType: coreMessageTypeSchema,
  topic: z.string(),
  partition: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  headers: z.record(z.string()).optional(),
}).strict();

export type KafkaEnvelope = z.infer<typeof kafkaEnvelopeSchema>;

export function parseKafkaEnvelope(payload: unknown): KafkaEnvelope {
  return kafkaEnvelopeSchema.parse(payload);
}

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
