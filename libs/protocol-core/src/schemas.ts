import { z } from 'zod';

export const chatRoleSchema = z.enum(['system', 'user', 'assistant', 'tool']);

export const chatMessageBodySchema = z.object({
  messageId: z.string(),
  threadId: z.string(),
  role: chatRoleSchema,
  content: z.string(),
  createdAt: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export type ChatMessageBody = z.infer<typeof chatMessageBodySchema>;

export const userMessageBodySchema = z.object({
  userId: z.string().uuid(),
  timestamp: z.number().int().nonnegative(),
  body: z.string(),
});

export type UserMessageBody = z.infer<typeof userMessageBodySchema>;

export const assistantMessageBodySchema = z.object({
  assistantId: z.string().uuid(),
  timestamp: z.number().int().nonnegative(),
  body: z.string(),
});

export type AssistantMessageBody = z.infer<typeof assistantMessageBodySchema>;

export const coreMessageTypeSchema = z.enum(['chat.message', 'user.message', 'assistant.message']);

export const coreMessageBodySchema = z.union([
  chatMessageBodySchema,
  userMessageBodySchema,
  assistantMessageBodySchema,
]);
export type CoreMessageBody = z.infer<typeof coreMessageBodySchema>;

export const coreEnvelopeSchema = z.object({
  id: z.string(),
  ts: z.number(),
  type: coreMessageTypeSchema,
  body: coreMessageBodySchema,
});

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
  messageType: coreMessageTypeSchema,
  topic: z.string(),
  partition: z.number().int().nonnegative(),
  offset: z.number().int().nonnegative(),
  key: z.string().optional(),
  headers: z.record(z.string()).optional(),
});

export type KafkaEnvelope = z.infer<typeof kafkaEnvelopeSchema>;

export function parseKafkaEnvelope(payload: unknown): KafkaEnvelope {
  return kafkaEnvelopeSchema.parse(payload);
}
