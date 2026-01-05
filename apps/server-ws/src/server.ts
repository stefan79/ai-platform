import Fastify from 'fastify';
import { createLogger } from './logger';

export function buildServer() {
  const server = Fastify({
    logger: createLogger(),
  });

  return server;
}
