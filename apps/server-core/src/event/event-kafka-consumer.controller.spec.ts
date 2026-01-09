import { Logger } from '@nestjs/common';
import type { KafkaContext } from '@nestjs/microservices';
import { EventKafkaConsumer } from './event-kafka-consumer.controller';

describe('EventKafkaConsumer', () => {
  const producer = {
    publishDeadLetter: jest.fn().mockResolvedValue(undefined),
  };
  const strategy = {
    handle: jest.fn().mockResolvedValue(undefined),
  };
  const contextRepository = {
    load: () => ({
      eventHandlers: [
        {
          match: () => true,
          handle: strategy.handle,
        },
      ],
    }),
  };

  beforeEach(() => {
    producer.publishDeadLetter.mockReset();
    strategy.handle.mockReset();
  });

  it('skips messages with empty values', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const controller = new EventKafkaConsumer(producer as any, contextRepository as any);
    const kafkaContext = {
      getMessage: () => ({ value: null }),
    } as unknown as KafkaContext;

    await controller.handleMessage({} as any, kafkaContext);

    expect(strategy.handle).not.toHaveBeenCalled();
    expect(producer.publishDeadLetter).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('Skipping kafka message with empty value');
    warnSpy.mockRestore();
  });

  it('routes failures to the dead-letter topic', async () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const controller = new EventKafkaConsumer(producer as any, contextRepository as any);
    const kafkaContext = {
      getMessage: () => ({ value: Buffer.from('{bad') }),
    } as unknown as KafkaContext;

    const payload = { value: 'raw' };
    await controller.handleMessage(payload as any, kafkaContext);

    expect(producer.publishDeadLetter).toHaveBeenCalledWith(
      payload,
      expect.stringContaining('Unexpected token'),
    );
    errorSpy.mockRestore();
  });

  it('processes valid messages', async () => {
    const controller = new EventKafkaConsumer(producer as any, contextRepository as any);
    const kafkaContext = {
      getMessage: () => ({
        value: JSON.stringify({
          id: 'evt-1',
          ts: 123,
          type: 'user.message',
          body: { timestamp: 123, body: 'hello' },
          sessionId: 'session-1',
          userId: 'b3d3f1e6-5d6f-4f13-8c6e-9a88b2c3d4e5',
          messageType: 'user.message',
          topic: 'ai-platform-events',
          partition: 0,
          offset: 0,
        }),
      }),
    } as unknown as KafkaContext;

    await controller.handleMessage({} as any, kafkaContext);

    expect(strategy.handle).toHaveBeenCalled();
    expect(producer.publishDeadLetter).not.toHaveBeenCalled();
  });
});
