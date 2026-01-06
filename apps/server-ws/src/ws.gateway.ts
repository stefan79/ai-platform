import { Inject } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { parseWsEnvelope } from '@ai-platform/protocol-ws';
import { kafkaConfig } from './config';
import { KafkaProducerService } from './kafka.service';
import type { WsEnvelope } from '@ai-platform/protocol-ws';
import type { KafkaEnvelope } from '@ai-platform/protocol-core';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WsGateway {
  constructor(
    @Inject(KafkaProducerService) private readonly kafka: KafkaProducerService,
  ) {}

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() payload: unknown) {
    let envelope: WsEnvelope;

    try {
      envelope = parseWsEnvelope(payload);
    } catch (error) {
      throw new WsException('Invalid websocket payload');
    }

    const kafkaEnvelope: KafkaEnvelope = {
      ...envelope,
      messageType: envelope.type,
      topic: kafkaConfig.topic,
      partition: 0,
      offset: 0,
    };

    await this.kafka.publish(kafkaEnvelope);

    return { status: 'ok' };
  }
}
