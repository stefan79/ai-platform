import { uiModels } from '../models';
import type { UiState, UiStatePatchPayload } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isArrayIndex = (value: string): boolean => /^\d+$/.test(value);

const setAtPath = <State>(state: State, path: string, value: unknown): State => {
  if (!path) {
    return state;
  }

  const segments = path.split('.').filter(Boolean);
  if (segments.length === 0) {
    return state;
  }

  const rootClone = Array.isArray(state) ? ([...state] as unknown[]) : { ...(state as {}) };
  let cursor: unknown = rootClone;
  let current: unknown = state;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const key =
      Array.isArray(current) && isArrayIndex(segment) ? Number(segment) : segment;

    const nextCurrent =
      current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : {};
    const nextClone = Array.isArray(nextCurrent)
      ? [...nextCurrent]
      : isRecord(nextCurrent)
        ? { ...nextCurrent }
        : {};

    if (cursor && typeof cursor === 'object') {
      (cursor as Record<string, unknown>)[key] = nextClone;
    }

    cursor = nextClone;
    current = nextCurrent;
  }

  const lastSegment = segments[segments.length - 1];
  const lastKey =
    Array.isArray(current) && isArrayIndex(lastSegment) ? Number(lastSegment) : lastSegment;

  if (cursor && typeof cursor === 'object') {
    (cursor as Record<string, unknown>)[lastKey] = value;
  }

  return rootClone as State;
};

export const createDefaultUiState = (): UiState => ({
  appShell: uiModels.appShell.defaultState,
  sidebar: uiModels.sidebar.defaultState,
  sidebarToggle: uiModels.sidebarToggle.defaultState,
  threadList: uiModels.threadList.defaultState,
  threadItems: uiModels.threadItems.map((model) => model.defaultState),
  actorPanel: uiModels.actorPanel.defaultState,
  filePanel: uiModels.filePanel.defaultState,
  settingsPanel: uiModels.settingsPanel.defaultState,
  mainPane: uiModels.mainPane.defaultState,
  systemStateBar: uiModels.systemStateBar.defaultState,
  threadHeader: uiModels.threadHeader.defaultState,
  threadTitle: uiModels.threadTitle.defaultState,
  threadActions: uiModels.threadActions.defaultState,
  messageTimeline: uiModels.messageTimeline.defaultState,
  messageBubbles: uiModels.messageBubbles.map((model) => model.defaultState),
  messageContents: uiModels.messageContents.map((model) => model.defaultState),
  messageContextMenus: uiModels.messageContextMenus.map((model) => model.defaultState),
  messageComposer: uiModels.messageComposer.defaultState,
  composerInput: uiModels.composerInput.defaultState,
  composerToolbar: uiModels.composerToolbar.defaultState,
  commandPalette: uiModels.commandPalette.defaultState,
  threadOverviewDrawer: uiModels.threadOverviewDrawer.defaultState,
  messageDetailsPanel: uiModels.messageDetailsPanel.defaultState,
  soundNotifier: uiModels.soundNotifier.defaultState,
  overlayManager: uiModels.overlayManager.defaultState,
});

export const mergeUiState = (state: UiState, partial?: Partial<UiState>): UiState => {
  if (!partial) {
    return state;
  }

  const nextState: UiState = { ...state };
  (Object.entries(partial) as Array<[keyof UiState, UiState[keyof UiState]]>).forEach(
    ([key, value]) => {
      if (value === undefined) {
        return;
      }

      const existing = nextState[key];
      if (isRecord(existing) && isRecord(value)) {
        nextState[key] = {
          ...existing,
          ...value,
        } as UiState[keyof UiState];
        return;
      }

      nextState[key] = value;
    },
  );

  return nextState;
};

export const applyUiStatePatch = (state: UiState, patch: UiStatePatchPayload): UiState => {
  if ('partial' in patch) {
    return mergeUiState(state, patch.partial);
  }

  return setAtPath(state, patch.path, patch.value);
};
