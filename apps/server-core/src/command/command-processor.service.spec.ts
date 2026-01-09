import { Effect } from 'effect';
import { CommandProcessorService } from './command-processor.service';
import { MessageReducedEvent } from '../domain/events';

describe('MessageProcessorService', () => {
  it('passes session context to reducers and dispatches outbox', async () => {
    const reducerChain = {
      reduce: jest.fn(),
    };
    const outbox = {
      persistAndDispatch: jest.fn(),
    };
    const eventBus = {
      publish: jest.fn(),
    };

    const reduction = {
      domainEvents: [
        {
          eventId: 'event-1',
          aggregateId: 'user-1',
          aggregateType: 'user' as const,
          domainEvent: true as const,
          payload: { timestamp: 1, body: 'hello' },
          occurredAt: 1,
        },
      ],
      outboxRecords: [],
    };

    reducerChain.reduce.mockReturnValue(Effect.succeed(reduction));
    outbox.persistAndDispatch.mockReturnValue(Effect.succeed(undefined));

    const service = new CommandProcessorService(
      reducerChain as any,
      outbox as any,
      eventBus as any,
    );

    await service.process({
      id: 'evt-1',
      ts: 123,
      type: 'command.save-user-message',
      commandType: 'command.save-user-message',
      sessionId: 'session-1',
      userId: 'b3d3f1e6-5d6f-4f13-8c6e-9a88b2c3d4e5',
      payload: { timestamp: 123, body: 'hello' },
      topic: 'ai-platform-commands',
      partition: 0,
      offset: 0,
    });

    expect(reducerChain.reduce).toHaveBeenCalledWith(
      {
        id: 'evt-1',
        ts: 123,
        type: 'command.save-user-message',
        commandType: 'command.save-user-message',
        sessionId: 'session-1',
        userId: 'b3d3f1e6-5d6f-4f13-8c6e-9a88b2c3d4e5',
        payload: { timestamp: 123, body: 'hello' },
        topic: 'ai-platform-commands',
        partition: 0,
        offset: 0,
      },
      {
        sessionId: 'session-1',
        userId: 'b3d3f1e6-5d6f-4f13-8c6e-9a88b2c3d4e5',
      },
    );
    expect(eventBus.publish).toHaveBeenCalledWith(expect.any(MessageReducedEvent));
    const published = eventBus.publish.mock.calls[0][0] as MessageReducedEvent;
    expect(published.record.eventId).toBe('event-1');
    expect(outbox.persistAndDispatch).toHaveBeenCalledWith(reduction);
  });

  it('throws on invalid kafka envelope', async () => {
    const reducerChain = {
      reduce: jest.fn(),
    };
    const outbox = {
      persistAndDispatch: jest.fn(),
    };
    const eventBus = {
      publish: jest.fn(),
    };

    const service = new CommandProcessorService(
      reducerChain as any,
      outbox as any,
      eventBus as any,
    );

    await expect(service.process({})).rejects.toThrow('Invalid command envelope');
  });
});
