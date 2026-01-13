import Fastify from 'fastify';
import cors from '@fastify/cors';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { ContextState } from '@ai-platform/context-core';
import {
  createHealthResponse,
  createServerDetailsResponse,
  createThreadMessagesResponse,
  createVersionResponse,
} from '@ai-platform/protocol-rest';
import { eventSchemas, parseEventPayload } from '@ai-platform/protocol-generated';
import { createLogger } from './logger';
import { verifyClerkJwt } from './auth/clerk-jwt';

declare module 'fastify' {
  interface FastifyRequest {
    auth?: {
      userId: string;
      token: string;
      claims: Record<string, unknown>;
    };
  }
}

const dynamoConfig = {
  region: process.env.AWS_REGION ?? 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8000',
  domainTable: process.env.DYNAMODB_DOMAIN_TABLE ?? 'ai-platform-domain-events',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? 'local',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? 'local',
};

const aggregatePk = (threadId: string) => `AGG#thread#${threadId}`;
const encodeCursor = (key?: Record<string, unknown>) =>
  key ? Buffer.from(JSON.stringify(key)).toString('base64') : undefined;
const decodeCursor = (cursor?: string) =>
  cursor
    ? (JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')) as Record<string, unknown>)
    : undefined;

export function buildServer(contextState: ContextState) {
  const dynamoClient = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: dynamoConfig.region,
      endpoint: dynamoConfig.endpoint,
      credentials: {
        accessKeyId: dynamoConfig.accessKeyId,
        secretAccessKey: dynamoConfig.secretAccessKey,
      },
    }),
    {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    },
  );
  const server = Fastify({
    logger: createLogger(),
  });

  const defaultOrigins = [
    'http://localhost:4300',
    'http://ai-platform.local:8080',
    'https://ai-platform.local:8443',
  ];
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : defaultOrigins;

  server.register(cors, {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['authorization', 'content-type'],
  });

  const extractBearerToken = (header?: string): string | undefined => {
    if (!header) {
      return undefined;
    }
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return undefined;
    }
    return token;
  };

  server.addHook('preHandler', async (request, reply) => {
    if (!request.url.startsWith('/api/v1')) {
      return;
    }

    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      request.log.warn({ path: request.url }, 'Missing bearer token');
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      const { userId, claims } = await verifyClerkJwt(token);
      request.auth = { userId, claims, token };
    } catch (error) {
      request.log.warn({ error, path: request.url }, 'Failed to verify JWT');
      return reply.status(401).send({ error: 'Invalid token' });
    }
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

  server.get('/api/v1/users/:userId/threads/:threadId/messages', async (request, reply) => {
    const { threadId, userId } = request.params as { userId: string; threadId: string };
    if (request.auth?.userId !== userId) {
      request.log.warn(
        { path: request.url, userId, authUserId: request.auth?.userId },
        'User mismatch for thread messages',
      );
      return reply.status(403).send({ error: 'Forbidden' });
    }
    const query = request.query as Partial<{
      limit: string;
      cursor: string;
      direction: 'forward' | 'backward';
    }>;
    const limit = Math.min(Number(query.limit ?? 50), 200);
    const direction = query.direction ?? 'backward';
    const scanForward = direction === 'forward';

    const result = await dynamoClient.send(
      new QueryCommand({
        TableName: dynamoConfig.domainTable,
        KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :skPrefix)',
        ExpressionAttributeNames: {
          '#pk': 'pk',
          '#sk': 'sk',
          '#type': 'type',
        },
        ExpressionAttributeValues: {
          ':pk': aggregatePk(threadId),
          ':skPrefix': 'EVENT#',
          ':messageType': 'thread.message-added',
        },
        FilterExpression: '#type = :messageType',
        Limit: Number.isFinite(limit) && limit > 0 ? limit : 50,
        ScanIndexForward: scanForward,
        ExclusiveStartKey: decodeCursor(query.cursor),
      }),
    );

    const items = (result.Items ?? []) as Array<{
      payload?: {
        message?: {
          type?: string;
          payload?: unknown;
        };
      };
    }>;

    const messages = items
      .map((item) => {
        const envelope = item.payload?.message;
        if (!envelope?.type) {
          return null;
        }
        if (!(envelope.type in eventSchemas)) {
          throw new Error(`Unsupported message type: ${envelope.type}`);
        }
        const payload = parseEventPayload(envelope.type as never, envelope.payload);
        return {
          type: envelope.type,
          payload,
        };
      })
      .filter((message): message is NonNullable<typeof message> => Boolean(message));

    const orderedMessages = scanForward ? messages : [...messages].reverse();
    const payload = createThreadMessagesResponse({
      items: orderedMessages,
      cursor: encodeCursor(result.LastEvaluatedKey as Record<string, unknown> | undefined),
    });
    return reply.send(payload);
  });

  return server;
}
