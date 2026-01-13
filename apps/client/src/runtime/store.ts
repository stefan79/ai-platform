import type {
  AppState,
  BootstrapSnapshot,
  ConnectionStatus,
  EventEnvelope,
  MessageEnvelope,
  ThreadEvent,
  ThreadMessage,
  UiStatePatchPayload,
} from './types';
import { applyUiStatePatch, createDefaultUiState, mergeUiState } from './ui-state';

type AppAction =
  | {
      type: 'snapshot.loaded';
      snapshot: BootstrapSnapshot;
    }
  | {
      type: 'connection.status';
      status: ConnectionStatus;
      error?: string;
    }
  | {
      type: 'connection.session';
      sessionId: string;
      userId?: string;
    }
  | {
      type: 'event.received';
      event: EventEnvelope;
    }
  | {
      type: 'thread.event';
      event: ThreadEvent;
    };

export type AppStore = {
  getState: () => AppState;
  dispatch: (action: AppAction) => void;
  subscribe: (listener: () => void) => () => void;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const coerceUiStatePatch = (body: unknown): UiStatePatchPayload | null => {
  if (!isRecord(body)) {
    return null;
  }

  if (typeof body.path === 'string') {
    return {
      path: body.path,
      value: body.value,
    };
  }

  if (isRecord(body.partial)) {
    return {
      partial: body.partial as Partial<AppState['ui']>,
    };
  }

  return null;
};

const createInitialState = (): AppState => ({
  ui: createDefaultUiState(),
  connection: {
    status: 'idle',
  },
  messages: [],
  composerLocked: false,
});

const toThreadMessage = (envelope: MessageEnvelope): ThreadMessage | null => {
  if (envelope.type === 'user.message') {
    const payload = envelope.payload as {
      messageId: string;
      threadId: string;
      timestamp: number;
      body: string;
    };
    return {
      id: payload.messageId,
      role: 'user',
      timestamp: payload.timestamp,
      body: payload.body,
      status: 'complete',
      threadId: payload.threadId,
    };
  }
  if (envelope.type === 'assistant.message') {
    const payload = envelope.payload as {
      messageId: string;
      responseTo: string;
      threadId: string;
      assistantId: string;
      timestamp: number;
      body: string;
    };
    return {
      id: payload.messageId,
      role: 'assistant',
      timestamp: payload.timestamp,
      body: payload.body,
      status: 'complete',
      responseTo: payload.responseTo,
      assistantId: payload.assistantId,
      threadId: payload.threadId,
    };
  }
  return null;
};

const reduce = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'snapshot.loaded': {
      const snapshot = action.snapshot;
      return {
        ...state,
        ui: mergeUiState(state.ui, snapshot.ui),
        connection: {
          ...state.connection,
          lastEventId: snapshot.lastEventId ?? state.connection.lastEventId,
          error: undefined,
        },
      };
    }
    case 'connection.status': {
      return {
        ...state,
        connection: {
          ...state.connection,
          status: action.status,
          error: action.error,
        },
      };
    }
    case 'connection.session': {
      return {
        ...state,
        connection: {
          ...state.connection,
          sessionId: action.sessionId,
          userId: action.userId ?? state.connection.userId,
        },
      };
    }
    case 'event.received': {
      const event = action.event;
      let nextUi = state.ui;
      if (event.type === 'ui.state.patch') {
        const patch = coerceUiStatePatch(event.body);
        if (patch) {
          nextUi = applyUiStatePatch(nextUi, patch);
        }
      }

      return {
        ...state,
        ui: nextUi,
        connection: {
          ...state.connection,
          lastEventId: event.id,
        },
      };
    }
    case 'thread.event': {
      const event = action.event;
      if (event.kind === 'history') {
        const sorted = event.envelopes
          .map((envelope) => toThreadMessage(envelope))
          .filter((message): message is ThreadMessage => Boolean(message))
          .sort((left, right) => left.timestamp - right.timestamp);
        return {
          ...state,
          messages: sorted,
          composerLocked: false,
        };
      }

      const envelopes = event.kind === 'batch' ? event.envelopes : [event.envelope];
      const messages = envelopes
        .map((envelope) => toThreadMessage(envelope))
        .filter((message): message is ThreadMessage => Boolean(message));

      if (messages.length === 0) {
        return state;
      }

      const userMessages = messages.filter((message) => message.role === 'user');
      const assistantMessages = messages.filter((message) => message.role === 'assistant');

      const nextMessages = [...state.messages, ...userMessages];
      const placeholders =
        event.kind === 'envelope' && userMessages.length > 0
          ? [
              {
                id: crypto.randomUUID(),
                role: 'assistant',
                timestamp: Date.now(),
                body: 'Waiting for assistant response…',
                status: 'pending',
                responseTo: userMessages[0].id,
                threadId: userMessages[0].threadId,
              } satisfies ThreadMessage,
            ]
          : [];

      if (placeholders.length > 0) {
        nextMessages.push(...placeholders);
      }

      const updated = nextMessages.map((message) => {
        const matchPayload = assistantMessages.find(
          (assistant) =>
            message.role === 'assistant' &&
            message.status === 'pending' &&
            message.responseTo === assistant.responseTo,
        );
        if (matchPayload) {
          return matchPayload;
        }
        return message;
      });

      const appended = assistantMessages.filter(
        (assistant) => !updated.some((message) => message.id === assistant.id),
      );

      return {
        ...state,
        messages: [...updated, ...appended],
        composerLocked: event.kind === 'envelope' ? userMessages.length > 0 : state.composerLocked,
      };
    }
    default:
      return state;
  }
};

export const createAppStore = (): AppStore => {
  let state = createInitialState();
  const listeners = new Set<() => void>();

  const emit = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    getState: () => state,
    dispatch: (action) => {
      const nextState = reduce(state, action);
      if (nextState !== state) {
        state = nextState;
        emit();
      }
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
