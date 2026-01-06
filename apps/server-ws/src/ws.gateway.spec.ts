import { Test } from '@nestjs/testing';
import { WsException } from '@nestjs/websockets';
import { WsGateway } from './ws.gateway';
import { KafkaProducerService } from './kafka.service';

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
        userId: 'b3d3f1e6-5d6f-4f13-8c6e-9a88b2c3d4e5',
        timestamp: now,
        body: 'Hello from client',
      },
    };

    const result = await gateway.handleMessage(payload);

    expect(kafka.publish).toHaveBeenCalledWith({
      ...payload,
      messageType: payload.type,
      topic: 'ai-platform-messages',
      partition: 0,
      offset: 0,
    });
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

    await expect(gateway.handleMessage(payload)).rejects.toBeInstanceOf(WsException);
    expect(kafka.publish).not.toHaveBeenCalled();
  });
});
