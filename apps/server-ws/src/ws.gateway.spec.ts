import { Test } from '@nestjs/testing';
import { WsGateway } from './ws.gateway';
import { KafkaProducerService } from './kafka.service';
import type { Socket } from 'socket.io';

describe('WsGateway', () => {
  const kafka = {
    publish: jest.fn(),
  };

  beforeEach(() => {
    kafka.publish.mockReset();
  });

  it('routes valid websocket messages to Kafka', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        WsGateway,
        {
          provide: KafkaProducerService,
          useValue: kafka,
        },
      ],
    }).compile();

    const gateway = moduleRef.get(WsGateway);
    const now = 1735689600000;
    const payload = {
      v: 1,
      id: 'evt-1',
      ts: now,
      type: 'user.message',
      direction: 'client',
      body: {
        timestamp: now,
        body: 'Hello from client',
      },
    };

    const socket = {
      data: {
        sessionId: 'session-1',
        userId: 'b3d3f1e6-5d6f-4f13-8c6e-9a88b2c3d4e5',
      },
      emit: jest.fn(),
    } as unknown as Socket;

    const result = await gateway.handleMessage(payload, socket);

    expect(kafka.publish).toHaveBeenCalledWith({
      id: payload.id,
      ts: payload.ts,
      type: payload.type,
      body: payload.body,
      sessionId: 'session-1',
      userId: 'b3d3f1e6-5d6f-4f13-8c6e-9a88b2c3d4e5',
      messageType: payload.type,
      topic: 'ai-platform-events',
      partition: 0,
      offset: 0,
    }, 'session-1');
    expect(result).toEqual({ status: 'ok' });
  });

  it('rejects invalid websocket messages', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        WsGateway,
        {
          provide: KafkaProducerService,
          useValue: kafka,
        },
      ],
    }).compile();

    const gateway = moduleRef.get(WsGateway);
    const payload = {
      id: 'evt-2',
      ts: 1735689600000,
    };

    const socket = {
      data: {
        sessionId: 'session-1',
        userId: 'b3d3f1e6-5d6f-4f13-8c6e-9a88b2c3d4e5',
      },
      emit: jest.fn(),
    } as unknown as Socket;

    await expect(gateway.handleMessage(payload, socket)).resolves.toEqual(
      expect.objectContaining({ status: 'error' }),
    );
    expect(kafka.publish).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'message.error',
      expect.objectContaining({ status: 'error' }),
    );
  });
});
