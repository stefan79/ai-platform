import Fastify from 'fastify';
import type { ContextState } from '@ai-platform/context-core';
import { createHealthResponse, createVersionResponse } from '@ai-platform/protocol-rest';
import { createLogger } from './logger';

export function buildServer(contextState: ContextState) {
  const server = Fastify({
    logger: createLogger(),
  });

  server.get('/api/health', async (_request, reply) => {
    const payload = createHealthResponse(contextState);
    return reply.send(payload);
  });

  server.get('/api/version', async (_request, reply) => {
    const payload = createVersionResponse(contextState);
    return reply.send(payload);
  });

  return server;
}
