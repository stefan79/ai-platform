import { z } from 'zod';
import { coreEnvelopeSchema } from '@ai-platform/protocol-core';

export const wsEnvelopeSchema = coreEnvelopeSchema.extend({
  v: z.number(),
  direction: z.enum(['client', 'server']),
  connectionId: z.string().optional(),
  sessionId: z.string().optional(),
});

export type WsEnvelope = z.infer<typeof wsEnvelopeSchema>;
export type WsMessage = WsEnvelope;

export function parseWsEnvelope(payload: unknown): WsEnvelope {
  return wsEnvelopeSchema.parse(payload);
}
