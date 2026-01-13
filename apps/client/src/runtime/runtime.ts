import {
  parseServerDetailsResponse,
  parseThreadMessagesResponse,
} from '@ai-platform/protocol-rest';
import { eventSchemas, parseEventEnvelope } from '@ai-platform/protocol-generated';
import { parseEventPayload } from '@ai-platform/protocol-generated';
import { match } from 'ts-pattern';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { logger } from '../logger';
import type { AppStore } from './store';
import type { AppState, BootstrapSnapshot, EventEnvelope, MessageEnvelope } from './types';
import { fetchJson } from '../api/client';
import type { ThreadBus } from './thread-bus';

export type AppRuntimeConfig = {
  restBaseUrl: string;
  snapshotPath: string;
  wsBaseUrl: string;
  userId?: string;
  getToken?: () => Promise<string | null>;
};

export type AppRuntime = {
  start: () => Promise<void>;
  stop: () => void;
  sendCommand: (type: string, body: unknown) => boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isMessageEnvelope = (value: unknown): value is MessageEnvelope => {
  if (!isRecord(value)) {
    return false;
  }
  return typeof value.type === 'string' && 'payload' in value;
};

const coerceBootstrapSnapshot = (payload: unknown): BootstrapSnapshot => {
  if (!isRecord(payload)) {
    return {};
  }

  return {
    ui: isRecord(payload.ui) ? (payload.ui as Partial<AppState['ui']>) : undefined,
    lastEventId: typeof payload.lastEventId === 'string' ? payload.lastEventId : undefined,
  };
};

const resolveSocketConfig = (wsBaseUrl: string) => {
  try {
    const url = new URL(wsBaseUrl);
    const query = Object.fromEntries(url.searchParams.entries());
    url.search = '';
    return {
      url: url.toString(),
      query,
    };
  } catch {
    return {
      url: wsBaseUrl,
      query: undefined,
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

  const getAuthToken = async (): Promise<string> => {
    if (!config.getToken) {
      throw new Error('Missing auth token provider');
    }
    const token = await config.getToken();
    if (!token) {
      throw new Error('Missing auth token');
    }
    return token;
  };

  const getAuthHeaders = async (): Promise<HeadersInit> => ({
    Authorization: `Bearer ${await getAuthToken()}`,
  });

  const bootstrap = async (): Promise<void> => {
    dispatchStatus('bootstrapping');
    if (!config.userId) {
      throw new Error('Missing userId');
    }
    const payload = await fetchJson(config.restBaseUrl, config.snapshotPath, {
      headers: await getAuthHeaders(),
    });
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
      if (isMessageEnvelope(envelope.body)) {
        const inner = envelope.body;
        const parsed =
          inner.type in eventSchemas
            ? parseEventPayload(inner.type as never, inner.payload)
            : inner.payload;
        const threadId =
          typeof (parsed as { threadId?: string }).threadId === 'string'
            ? (parsed as { threadId: string }).threadId
            : '';
        threadBus.publish({
          kind: 'envelope',
          threadId,
          envelope: { type: inner.type, payload: parsed },
        });
        return;
      }
      match(envelope.type)
        .with('assistant.message', () => {
          const parsed = parseEventPayload('assistant.message', envelope.body);
          threadBus.publish({
            kind: 'envelope',
            threadId: parsed.threadId,
            envelope: { type: 'assistant.message', payload: parsed },
          });
        })
        .with('user.message', () => {
          const parsed = parseEventPayload('user.message', envelope.body);
          threadBus.publish({
            kind: 'envelope',
            threadId: parsed.threadId,
            envelope: { type: 'user.message', payload: parsed },
          });
        })
        .otherwise(() => {
          store.dispatch({ type: 'event.received', event: envelope });
        });
    } catch (error) {
      logger.warn({ error }, 'Ignoring non-event payload');
    }
  };

  const connectSocket = async () => {
    const socketConfig = resolveSocketConfig(config.wsBaseUrl);
    const token = await getAuthToken();
    socket = io(socketConfig.url, {
      transports: ['websocket'],
      autoConnect: false,
      query: socketConfig.query,
      auth: {
        token,
      },
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

    socket.io.on('reconnect_attempt', async () => {
      try {
        socket!.auth = {
          token: await getAuthToken(),
        };
      } catch (error) {
        logger.warn({ error }, 'Failed to refresh WS auth token');
      }
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
      if (event.kind !== 'envelope' || event.envelope.type !== 'user.message') {
        return;
      }
      if (!socket || !socket.connected) {
        return;
      }
      const envelope = {
        v: 1,
        id: crypto.randomUUID(),
        ts: Date.now(),
        type: 'message',
        body: event.envelope,
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

  const loadThreadHistory = async (): Promise<void> => {
    const threadId = store.getState().ui.threadList.selectedThreadId;
    if (!threadId) {
      return;
    }
    if (!config.userId) {
      throw new Error('Missing userId');
    }
    const path = `/api/v1/users/${config.userId}/threads/${threadId}/messages?limit=50&direction=backward`;
    const payload = await fetchJson(config.restBaseUrl, path, {
      headers: await getAuthHeaders(),
    });
    const response = parseThreadMessagesResponse(payload);
    threadBus.publish({
      kind: 'history',
      threadId,
      envelopes: response.items,
    });
  };

  const bootstrapAndEnable = async (): Promise<void> => {
    try {
      await bootstrap();
      try {
        await loadThreadHistory();
      } catch (error) {
        logger.warn({ error }, 'Failed to load thread history');
      }
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
      try {
        await bootstrapAndEnable();
        if (stopped) {
          return;
        }
        await connectSocket();
        subscribeThreadBus();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Runtime start failed';
        dispatchStatus('error', message);
        logger.error({ error }, 'Failed to start runtime');
      }
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
