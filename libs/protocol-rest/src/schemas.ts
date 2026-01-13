import { z } from 'zod';
import type { ContextState } from '@ai-platform/context-core';
const restCoreEnvelopeSchema = z
  .object({
    id: z.string(),
    ts: z.number(),
    type: z.string(),
    body: z.unknown(),
  })
  .strict();

export const versionResponseSchema = z.object({
  version: z.string(),
});

export type VersionResponse = z.infer<typeof versionResponseSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  version: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const serverDetailsSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.null()]),
);

export type ServerDetails = z.infer<typeof serverDetailsSchema>;

export const threadMessageSchema = z
  .object({
    type: z.string(),
    payload: z.unknown(),
  })
  .strict();

export type ThreadMessage = z.infer<typeof threadMessageSchema>;

export const threadMessagesResponseSchema = z
  .object({
    items: z.array(threadMessageSchema),
    cursor: z.string().optional(),
  })
  .strict();

export type ThreadMessagesResponse = z.infer<typeof threadMessagesResponseSchema>;

export function createVersionResponse(context: Pick<ContextState, 'version'>): VersionResponse {
  return versionResponseSchema.parse({ version: context.version });
}

export function createHealthResponse(context: ContextState): HealthResponse {
  return healthResponseSchema.parse({
    status: context.health.status,
    version: context.version,
  });
}

export function createServerDetailsResponse(details: ServerDetails): ServerDetails {
  return serverDetailsSchema.parse(details);
}

export function createThreadMessagesResponse(
  response: ThreadMessagesResponse,
): ThreadMessagesResponse {
  return threadMessagesResponseSchema.parse(response);
}

export function parseVersionResponse(payload: unknown): VersionResponse {
  return versionResponseSchema.parse(payload);
}

export function parseHealthResponse(payload: unknown): HealthResponse {
  return healthResponseSchema.parse(payload);
}

export function parseServerDetailsResponse(payload: unknown): ServerDetails {
  return serverDetailsSchema.parse(payload);
}

export function parseThreadMessagesResponse(payload: unknown): ThreadMessagesResponse {
  return threadMessagesResponseSchema.parse(payload);
}

export const restEnvelopeSchema = restCoreEnvelopeSchema.extend({
  requestId: z.string(),
});

export type RestEnvelope = z.infer<typeof restEnvelopeSchema>;

export function parseRestEnvelope(payload: unknown): RestEnvelope {
  return restEnvelopeSchema.parse(payload);
}
