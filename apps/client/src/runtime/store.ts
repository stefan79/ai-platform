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
      return match(event.payloadType)
        .with('user.message', () => {
          const userPayload = event.payload as {
            messageId: string;
            threadId: string;
            timestamp: number;
            body: string;
          };
          const userMessage: ThreadMessage = {
            id: userPayload.messageId,
            role: 'user',
            timestamp: userPayload.timestamp,
            body: userPayload.body,
            status: 'complete',
            threadId: userPayload.threadId,
          };
          const placeholder: ThreadMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            timestamp: Date.now(),
            body: 'Waiting for assistant response…',
            status: 'pending',
            responseTo: userPayload.messageId,
            threadId: userPayload.threadId,
          };
          return {
            ...state,
            messages: [...state.messages, userMessage, placeholder],
            composerLocked: true,
          };
        })
        .with('assistant.message', () => {
          const assistantPayload = event.payload as {
            messageId: string;
            responseTo: string;
            threadId: string;
            assistantId: string;
            timestamp: number;
            body: string;
          };
          const updated = state.messages.map((message) => {
            if (
              message.role === 'assistant' &&
              message.status === 'pending' &&
              message.responseTo === assistantPayload.responseTo
            ) {
              return {
                id: assistantPayload.messageId,
                role: 'assistant',
                timestamp: assistantPayload.timestamp,
                body: assistantPayload.body,
                status: 'complete',
                responseTo: assistantPayload.responseTo,
                assistantId: assistantPayload.assistantId,
                threadId: assistantPayload.threadId,
              } satisfies ThreadMessage;
            }
            return message;
          });
          const hasReplacement = updated.some(
            (message) => message.id === assistantPayload.messageId,
          );
          const nextMessages = hasReplacement
            ? updated
            : [
                ...updated,
                {
                  id: assistantPayload.messageId,
                  role: 'assistant',
                  timestamp: assistantPayload.timestamp,
                  body: assistantPayload.body,
                  status: 'complete',
                  responseTo: assistantPayload.responseTo,
                  assistantId: assistantPayload.assistantId,
                  threadId: assistantPayload.threadId,
                } satisfies ThreadMessage,
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
