import { Inject, Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import type { Socket } from 'socket.io';
import { parseWsEnvelope } from '@ai-platform/protocol-ws';
import { kafkaConfig } from './config';
import { KafkaProducerService } from './kafka.service';
import type { WsEnvelope } from '@ai-platform/protocol-ws';
import type { EventKafkaEnvelope } from '@ai-platform/protocol-core';
import { verifyClerkJwt } from './auth/clerk-jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly sessions = new Map<string, Socket>();
  private readonly logger = new Logger(WsGateway.name);

  constructor(@Inject(KafkaProducerService) private readonly kafka: KafkaProducerService) {}

  private resolveToken(socket: Socket): string | undefined {
    const auth = socket.handshake.auth;
    if (!auth || typeof auth !== 'object') {
      return undefined;
    }
    return typeof auth.token === 'string' ? auth.token : undefined;
  }

  private resolveBodyUserId(payload: WsEnvelope['body']): string | undefined {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return undefined;
    }
    const candidate = (payload as Record<string, unknown>).userId;
    return typeof candidate === 'string' ? candidate : undefined;
  }

  async handleConnection(socket: Socket) {
    const token = this.resolveToken(socket);
    if (!token) {
      this.logger.warn('Missing auth token in socket handshake');
      socket.disconnect(true);
      return;
    }

    let userId: string;
    try {
      const verified = await verifyClerkJwt(token);
      userId = verified.userId;
    } catch (error) {
      this.logger.warn({ error }, 'Failed to verify socket auth token');
      socket.disconnect(true);
      return;
    }

    const sessionId = randomUUID();

    socket.data.sessionId = sessionId;
    socket.data.userId = userId;
    this.sessions.set(sessionId, socket);
    socket.emit('session.started', { sessionId, userId });
  }

  handleDisconnect(socket: Socket) {
    const sessionId = socket.data.sessionId as string | undefined;
    if (sessionId) {
      this.sessions.delete(sessionId);
    }
  }

  emitToSession(sessionId: string, payload: WsEnvelope): boolean {
    const socket = this.sessions.get(sessionId);
    if (!socket) {
      return false;
    }

    socket.emit('message', payload);
    return true;
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() payload: unknown, @ConnectedSocket() socket: Socket) {
    this.logger.debug(`Received WS message: ${JSON.stringify(payload)}`);

    try {
      const sessionId = socket.data.sessionId as string | undefined;
      const userId = socket.data.userId as string | undefined;

      if (!sessionId) {
        throw new Error('Session not initialized');
      }

      if (!userId) {
        throw new Error('Missing verified userId');
      }

      this.logger.debug('Parsing WS envelope');
      const envelope: WsEnvelope = parseWsEnvelope(payload);
      this.logger.debug(`Envelope parsed: ${JSON.stringify(envelope)}`);

      const bodyUserId = this.resolveBodyUserId(envelope.body);
      if (bodyUserId && bodyUserId !== userId) {
        throw new Error('UserId mismatch');
      }

      const kafkaEnvelope: EventKafkaEnvelope = {
        id: envelope.id,
        ts: envelope.ts,
        type: envelope.type,
        body: envelope.body,
        sessionId,
        userId,
        messageType: envelope.type,
        topic: kafkaConfig.eventsTopic,
        partition: 0,
        offset: 0,
      };

      const body = envelope.body as Record<string, unknown> | null;
      const threadId =
        body && typeof body === 'object' && typeof body.threadId === 'string'
          ? body.threadId
          : undefined;
      const key = threadId ?? sessionId;
      await this.kafka.publish(kafkaEnvelope, key);
      this.logger.debug(`Published to Kafka: ${JSON.stringify(kafkaEnvelope)}`);

      return { status: 'ok' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        'Failed to handle WS message',
        error instanceof Error ? error.stack : String(error),
      );
      socket.emit('message.error', { status: 'error', message });
      return { status: 'error', message };
    }
  }
}
