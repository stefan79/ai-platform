import { Logger } from '@nestjs/common';
import type { KafkaContext } from '@nestjs/microservices';
import { KafkaController } from './kafka.controller';

describe('KafkaController', () => {
  const producer = {
    publishDeadLetter: jest.fn().mockResolvedValue(undefined),
  };
  const strategy = {
    handle: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    producer.publishDeadLetter.mockReset();
    strategy.handle.mockReset();
  });

  it('skips messages with empty values', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const controller = new KafkaController(producer as any, strategy as any);
    const context = {
      getMessage: () => ({ value: null }),
    } as unknown as KafkaContext;

    await controller.handleMessage({} as any, context);

    expect(strategy.handle).not.toHaveBeenCalled();
    expect(producer.publishDeadLetter).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('Skipping kafka message with empty value');
    warnSpy.mockRestore();
  });

  it('routes failures to the dead-letter topic', async () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const controller = new KafkaController(producer as any, strategy as any);
    const context = {
      getMessage: () => ({ value: Buffer.from('{bad') }),
    } as unknown as KafkaContext;

    const payload = { value: 'raw' };
    await controller.handleMessage(payload as any, context);

    expect(producer.publishDeadLetter).toHaveBeenCalledWith(
      payload,
      expect.stringContaining('Unexpected token'),
    );
    errorSpy.mockRestore();
  });

  it('processes valid messages', async () => {
    const controller = new KafkaController(producer as any, strategy as any);
    const context = {
      getMessage: () => ({
        value: JSON.stringify({
          id: 'evt-1',
          ts: 123,
          type: 'user.message',
          body: { timestamp: 123, body: 'hello' },
          sessionId: 'session-1',
          userId: 'b3d3f1e6-5d6f-4f13-8c6e-9a88b2c3d4e5',
          messageType: 'user.message',
          topic: 'ai-platform-messages',
          partition: 0,
          offset: 0,
        }),
      }),
    } as unknown as KafkaContext;

    await controller.handleMessage({} as any, context);

    expect(strategy.handle).toHaveBeenCalled();
    expect(producer.publishDeadLetter).not.toHaveBeenCalled();
  });
});
