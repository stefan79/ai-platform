import { parseServerDetailsResponse } from '@ai-platform/protocol-rest';
import { parseEventEnvelope } from '@ai-platform/protocol-generated';
import { parseEventPayload } from '@ai-platform/protocol-generated';
import { match } from 'ts-pattern';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { logger } from '../logger';
import type { AppStore } from './store';
import type { AppState, BootstrapSnapshot, EventEnvelope } from './types';
import { fetchJson } from '../api/client';
import type { ThreadBus } from './thread-bus';

export type AppRuntimeConfig = {
  restBaseUrl: string;
  snapshotPath: string;
  wsBaseUrl: string;
  userId: string;
};

export type AppRuntime = {
  start: () => Promise<void>;
  stop: () => void;
  sendCommand: (type: string, body: unknown) => boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const coerceBootstrapSnapshot = (payload: unknown): BootstrapSnapshot => {
  if (!isRecord(payload)) {
    return {};
  }

  return {
    ui: isRecord(payload.ui) ? (payload.ui as Partial<AppState['ui']>) : undefined,
    lastEventId: typeof payload.lastEventId === 'string' ? payload.lastEventId : undefined,
  };
};

const resolveSocketConfig = (wsBaseUrl: string, userId?: string) => {
  try {
    const url = new URL(wsBaseUrl);
    const query = Object.fromEntries(url.searchParams.entries());
    if (userId) {
      query.userId = query.userId ?? userId;
    }
    url.search = '';
    return {
      url: url.toString(),
      query,
    };
  } catch {
    return {
      url: wsBaseUrl,
      query: userId ? { userId } : undefined,
    };
  }
};

export const createAppRuntime = (options: {
  store: AppStore;
  config: AppRuntimeConfig;
  threadBus: ThreadBus;
}): AppRuntime => {
  const { store, config, threadBus } = options;
  let stopped = false;
  let socket: Socket | null = null;
  let unsubscribeBus: (() => void) | null = null;

  const dispatchStatus = (status: AppState['connection']['status'], error?: string) => {
    store.dispatch({ type: 'connection.status', status, error });
  };

  const bootstrap = async (): Promise<void> => {
    dispatchStatus('bootstrapping');
    const payload = await fetchJson(config.restBaseUrl, config.snapshotPath);
    let snapshot = coerceBootstrapSnapshot(payload);
    try {
      const serverDetails = parseServerDetailsResponse(payload);
      snapshot = {
        ...snapshot,
        ui: {
          ...(snapshot.ui ?? {}),
          appShell: {
            ...(snapshot.ui?.appShell ?? {}),
            title: typeof serverDetails.name === 'string' ? serverDetails.name : undefined,
          },
        },
      };
    } catch (error) {
      logger.warn({ error }, 'REST payload is not server details');
    }
    store.dispatch({ type: 'snapshot.loaded', snapshot });
  };

  const handleIncomingMessage = (payload: unknown) => {
    try {
      const envelope = parseEventEnvelope(payload) as EventEnvelope;
      match(envelope.type)
        .with('assistant.message', () => {
          const parsed = parseEventPayload('assistant.message', envelope.body);
          threadBus.publish({
            threadId: parsed.threadId,
            payloadType: 'assistant.message',
            payload: parsed,
          });
        })
        .with('user.message', () => {
          const parsed = parseEventPayload('user.message', envelope.body);
          threadBus.publish({
            threadId: parsed.threadId,
            payloadType: 'user.message',
            payload: parsed,
          });
        })
        .otherwise(() => {
          store.dispatch({ type: 'event.received', event: envelope });
        });
    } catch (error) {
      logger.warn({ error }, 'Ignoring non-event payload');
    }
  };

  const connectSocket = () => {
    const socketConfig = resolveSocketConfig(config.wsBaseUrl, config.userId);
    socket = io(socketConfig.url, {
      transports: ['websocket'],
      autoConnect: false,
      query: socketConfig.query,
    });

    socket.on('connect', () => {
      if (stopped) {
        return;
      }
      dispatchStatus('connected');
    });

    socket.on('disconnect', (reason) => {
      if (stopped) {
        return;
      }
      dispatchStatus(socket?.active ? 'reconnecting' : 'disconnected', reason);
    });

    socket.io.on('reconnect', () => {
      if (stopped) {
        return;
      }
      void bootstrapAndEnable();
    });

    socket.on('connect_error', (error) => {
      if (stopped) {
        return;
      }
      dispatchStatus('error', error.message);
    });

    socket.on('session.started', (payload: unknown) => {
      if (!isRecord(payload) || typeof payload.sessionId !== 'string') {
        return;
      }

      store.dispatch({
        type: 'connection.session',
        sessionId: payload.sessionId,
        userId: typeof payload.userId === 'string' ? payload.userId : undefined,
      });
    });

    socket.on('message', handleIncomingMessage);

    socket.on('message.error', (payload: unknown) => {
      const message =
        isRecord(payload) && typeof payload.message === 'string'
          ? payload.message
          : 'Message error';
      logger.warn({ message }, 'WS message error');
    });

    dispatchStatus('connecting');
    socket.connect();
  };

  const subscribeThreadBus = () => {
    unsubscribeBus?.();
    unsubscribeBus = threadBus.subscribe((event) => {
      if (event.payloadType !== 'user.message') {
        return;
      }
      if (!socket || !socket.connected) {
        return;
      }
      const envelope = {
        v: 1,
        id: crypto.randomUUID(),
        ts: Date.now(),
        type: event.payloadType,
        body: event.payload,
        direction: 'client',
      };
      socket.emit('message', envelope);
    });
  };

  const createEnvelope = (type: string, body: unknown) => ({
    v: 1,
    id: crypto.randomUUID(),
    ts: Date.now(),
    type,
    body,
    direction: 'client',
  });

  const bootstrapAndEnable = async (): Promise<void> => {
    try {
      await bootstrap();
      dispatchStatus('connected');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bootstrap failed';
      dispatchStatus('error', message);
      logger.error({ error }, 'Failed to bootstrap runtime');
    }
  };

  return {
    start: async () => {
      stopped = false;
      await bootstrapAndEnable();
      if (stopped) {
        return;
      }
      connectSocket();
      subscribeThreadBus();
    },
    stop: () => {
      stopped = true;
      unsubscribeBus?.();
      unsubscribeBus = null;
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
      }
    },
    sendCommand: (type: string, body: unknown) => {
      if (stopped || !socket || !socket.connected) {
        return false;
      }

      socket.emit('message', createEnvelope(type, body));
      return true;
    },
  };
};
