import { Inject } from '@nestjs/common';
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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly sessions = new Map<string, Socket>();

  constructor(
    @Inject(KafkaProducerService) private readonly kafka: KafkaProducerService,
  ) {}

  handleConnection(socket: Socket) {
    const sessionId = randomUUID();
    const userIdQuery = socket.handshake.query.userId;
    const userId = Array.isArray(userIdQuery) ? userIdQuery[0] : userIdQuery;

    socket.data.sessionId = sessionId;
    socket.data.userId = typeof userId === 'string' ? userId : undefined;
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

    console.log('Received WS message:', payload);

    try {
      const sessionId = socket.data.sessionId as string | undefined;
      const userId = socket.data.userId as string | undefined;

      if (!sessionId) {
        throw new Error('Session not initialized');
      }

      if (!userId) {
        throw new Error('Missing userId query');
      }

      console.log('Parsing WS envelope');
      const envelope: WsEnvelope = parseWsEnvelope(payload);
      console.log('Envelope parsed:', envelope);

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

      const key = 'threadId' in envelope.body ? envelope.body.threadId : sessionId;
      await this.kafka.publish(kafkaEnvelope, key);
      console.log('Published to Kafka:', kafkaEnvelope);

      return { status: 'ok' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to handle WS message:', error);
      socket.emit('message.error', { status: 'error', message });
      return { status: 'error', message };
    }
  }
}
