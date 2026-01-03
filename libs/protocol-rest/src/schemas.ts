import { z } from 'zod';
import type { ContextState } from '@ai-platform/context-core';

export const versionResponseSchema = z.object({
  version: z.string()
});

export type VersionResponse = z.infer<typeof versionResponseSchema>;

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  version: z.string()
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export function createVersionResponse(context: Pick<ContextState, 'version'>): VersionResponse {
  return versionResponseSchema.parse({ version: context.version });
}

export function createHealthResponse(context: ContextState): HealthResponse {
  return healthResponseSchema.parse({
    status: context.health.status,
    version: context.version
  });
}

export function parseVersionResponse(payload: unknown): VersionResponse {
  return versionResponseSchema.parse(payload);
}

export function parseHealthResponse(payload: unknown): HealthResponse {
  return healthResponseSchema.parse(payload);
}
