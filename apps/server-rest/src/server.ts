import Fastify from 'fastify';
import cors from '@fastify/cors';
import type { ContextState } from '@ai-platform/context-core';
import {
  createHealthResponse,
  createServerDetailsResponse,
  createVersionResponse,
} from '@ai-platform/protocol-rest';
import { createLogger } from './logger';

export function buildServer(contextState: ContextState) {
  const server = Fastify({
    logger: createLogger(),
  });

  server.register(cors, {
    origin: ['http://localhost:4300'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  server.get('/api/health', async (_request, reply) => {
    const payload = createHealthResponse(contextState);
    return reply.send(payload);
  });

  server.get('/api/version', async (_request, reply) => {
    const payload = createVersionResponse(contextState);
    return reply.send(payload);
  });

  server.get('/api/v1/server', async (_request, reply) => {
    const payload = createServerDetailsResponse({
      name: 'Agent Platform',
      version: contextState.version,
      status: contextState.health.status,
    });
    return reply.send(payload);
  });

  return server;
}
