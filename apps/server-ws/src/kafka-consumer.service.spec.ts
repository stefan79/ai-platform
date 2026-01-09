import { Logger } from '@nestjs/common';
import type { WsGateway } from './ws.gateway';
import { KafkaConsumerService } from './kafka-consumer.service';
import { kafkaConfig } from './config';

let connectMock: jest.Mock;
let subscribeMock: jest.Mock;
let runMock: jest.Mock;
let disconnectMock: jest.Mock;
let consumerMock: {
  connect: jest.Mock;
  subscribe: jest.Mock;
  run: jest.Mock;
  disconnect: jest.Mock;
};

jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    consumer: jest.fn(() => consumerMock),
  })),
}));

describe('KafkaConsumerService', () => {
  let gateway: jest.Mocked<WsGateway>;

  beforeEach(() => {
    connectMock = jest.fn().mockResolvedValue(undefined);
    subscribeMock = jest.fn().mockResolvedValue(undefined);
    runMock = jest.fn().mockResolvedValue(undefined);
    disconnectMock = jest.fn().mockResolvedValue(undefined);
    consumerMock = {
      connect: connectMock,
      subscribe: subscribeMock,
      run: runMock,
      disconnect: disconnectMock,
    };

    gateway = {
      emitToSession: jest.fn(),
    } as unknown as jest.Mocked<WsGateway>;
  });

  it('connects, subscribes, and routes messages to the session', async () => {
    const service = new KafkaConsumerService(gateway);

    await service.onModuleInit();

    expect(connectMock).toHaveBeenCalled();
    expect(subscribeMock).toHaveBeenCalledWith({
      topic: kafkaConfig.outboxTopic,
      fromBeginning: false,
    });
    expect(runMock).toHaveBeenCalledTimes(1);

    const eachMessage = runMock.mock.calls[0][0].eachMessage as (args: {
      message: { value: Buffer | string | null };
    }) => Promise<void>;

    const envelope = {
      id: 'evt-1',
      ts: 123,
      type: 'user.message',
      body: {
        timestamp: 123,
        body: 'hello',
      },
      sessionId: 'session-1',
      userId: 'b3d3f1e6-5d6f-4f13-8c6e-9a88b2c3d4e5',
      messageType: 'user.message',
      topic: kafkaConfig.outboxTopic,
      partition: 0,
      offset: 0,
    };

    gateway.emitToSession.mockReturnValue(true);
    await eachMessage({
      message: { value: Buffer.from(JSON.stringify(envelope)) },
    });

    expect(gateway.emitToSession).toHaveBeenCalledWith('session-1', {
      v: 1,
      id: 'evt-1',
      ts: 123,
      type: 'user.message',
      body: envelope.body,
      direction: 'server',
    });
  });

  it('warns when no socket is active for the session', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const service = new KafkaConsumerService(gateway);

    await service.onModuleInit();

    const eachMessage = runMock.mock.calls[0][0].eachMessage as (args: {
      message: { value: Buffer | string | null };
    }) => Promise<void>;

    const envelope = {
      id: 'evt-2',
      ts: 456,
      type: 'assistant.message',
      body: {
        assistantId: 'c4d5b7a6-6b5d-4c3d-a08d-5904c37fd8d0',
        timestamp: 456,
        body: 'response',
      },
      sessionId: 'session-missing',
      userId: 'b3d3f1e6-5d6f-4f13-8c6e-9a88b2c3d4e5',
      messageType: 'assistant.message',
      topic: kafkaConfig.outboxTopic,
      partition: 0,
      offset: 0,
    };

    gateway.emitToSession.mockReturnValue(false);
    await eachMessage({
      message: { value: JSON.stringify(envelope) },
    });

    expect(warnSpy).toHaveBeenCalledWith('No active socket for sessionId session-missing');
    warnSpy.mockRestore();
  });

  it('logs errors for invalid payloads', async () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const service = new KafkaConsumerService(gateway);

    await service.onModuleInit();

    const eachMessage = runMock.mock.calls[0][0].eachMessage as (args: {
      message: { value: Buffer | string | null };
    }) => Promise<void>;

    await eachMessage({ message: { value: Buffer.from('{bad') } });

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('disconnects on module destroy', async () => {
    const service = new KafkaConsumerService(gateway);

    await service.onModuleInit();
    await service.onModuleDestroy();

    expect(disconnectMock).toHaveBeenCalled();
  });
});
