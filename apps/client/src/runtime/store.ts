import type {
  AppState,
  BootstrapSnapshot,
  ConnectionStatus,
  EventEnvelope,
  ThreadEvent,
  ThreadMessage,
  UiStatePatchPayload,
} from './types';
import { match } from 'ts-pattern';
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
        const sorted = [...event.messages].sort((left, right) => left.timestamp - right.timestamp);
        return {
          ...state,
          messages: sorted,
          composerLocked: false,
        };
      }

      const payloads =
        event.kind === 'batch' ? event.payloads : event.kind === 'single' ? [event.payload] : [];

      return match(event.payloadType)
        .with('user.message', () => {
          const userMessages: ThreadMessage[] = payloads.map((payload) => ({
            id: payload.messageId,
            role: 'user',
            timestamp: payload.timestamp,
            body: payload.body,
            status: 'complete',
            threadId: payload.threadId,
          }));
          const placeholders: ThreadMessage[] =
            event.kind === 'single'
              ? [
                  {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    timestamp: Date.now(),
                    body: 'Waiting for assistant response…',
                    status: 'pending',
                    responseTo: payloads[0]?.messageId,
                    threadId: payloads[0]?.threadId ?? '',
                  },
                ]
              : [];
          return {
            ...state,
            messages: [...state.messages, ...userMessages, ...placeholders],
            composerLocked: event.kind === 'single' ? true : state.composerLocked,
          };
        })
        .with('assistant.message', () => {
          const updated = state.messages.map((message) => {
            const matchPayload = payloads.find(
              (payload) =>
                message.role === 'assistant' &&
                message.status === 'pending' &&
                message.responseTo === payload.responseTo,
            );
            if (matchPayload) {
              return {
                id: matchPayload.messageId,
                role: 'assistant',
                timestamp: matchPayload.timestamp,
                body: matchPayload.body,
                status: 'complete',
                responseTo: matchPayload.responseTo,
                assistantId: matchPayload.assistantId,
                threadId: matchPayload.threadId,
              } satisfies ThreadMessage;
            }
            return message;
          });
          const appended = payloads.filter(
            (payload) => !updated.some((message) => message.id === payload.messageId),
          );
          const nextMessages = [
            ...updated,
            ...appended.map(
              (payload) =>
                ({
                  id: payload.messageId,
                  role: 'assistant',
                  timestamp: payload.timestamp,
                  body: payload.body,
                  status: 'complete',
                  responseTo: payload.responseTo,
                  assistantId: payload.assistantId,
                  threadId: payload.threadId,
                }) satisfies ThreadMessage,
            ),
          ];
          return {
            ...state,
            messages: nextMessages,
            composerLocked: false,
          };
        })
        .otherwise(() => state);
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
