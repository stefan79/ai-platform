import type {
  ActorPanelState,
  AppShellState,
  CommandPaletteState,
  ComposerInputState,
  ComposerToolbarState,
  FilePanelState,
  MainPaneState,
  MessageBubbleState,
  MessageComposerState,
  MessageContentState,
  MessageContextMenuState,
  MessageDetailsPanelState,
  MessageTimelineState,
  OverlayManagerState,
  SettingsPanelState,
  SidebarState,
  SidebarToggleState,
  SoundNotifierState,
  SystemStateBarState,
  ThreadActionsState,
  ThreadHeaderState,
  ThreadListItemState,
  ThreadListState,
  ThreadOverviewDrawerState,
  ThreadTitleState,
} from '../models';
import type { RawEventEnvelope } from '@ai-platform/protocol-generated';

export type UiState = {
  appShell: AppShellState;
  sidebar: SidebarState;
  sidebarToggle: SidebarToggleState;
  threadList: ThreadListState;
  threadItems: ThreadListItemState[];
  actorPanel: ActorPanelState;
  filePanel: FilePanelState;
  settingsPanel: SettingsPanelState;
  mainPane: MainPaneState;
  systemStateBar: SystemStateBarState;
  threadHeader: ThreadHeaderState;
  threadTitle: ThreadTitleState;
  threadActions: ThreadActionsState;
  messageTimeline: MessageTimelineState;
  messageBubbles: MessageBubbleState[];
  messageContents: MessageContentState[];
  messageContextMenus: MessageContextMenuState[];
  messageComposer: MessageComposerState;
  composerInput: ComposerInputState;
  composerToolbar: ComposerToolbarState;
  commandPalette: CommandPaletteState;
  threadOverviewDrawer: ThreadOverviewDrawerState;
  messageDetailsPanel: MessageDetailsPanelState;
  soundNotifier: SoundNotifierState;
  overlayManager: OverlayManagerState;
};

export type BootstrapSnapshot = {
  ui?: Partial<UiState>;
  lastEventId?: string;
};

export type ConnectionStatus =
  | 'idle'
  | 'bootstrapping'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

export type ConnectionState = {
  status: ConnectionStatus;
  sessionId?: string;
  userId?: string;
  lastEventId?: string;
  error?: string;
};

export type AppState = {
  ui: UiState;
  connection: ConnectionState;
  messages: ThreadMessage[];
  composerLocked: boolean;
};

export type ThreadMessage = {
  id: string;
  role: 'user' | 'assistant';
  timestamp: number;
  body: string;
  status: 'pending' | 'complete';
  responseTo?: string;
  assistantId?: string;
  threadId: string;
};

export type EventEnvelope = RawEventEnvelope;

export type MessageEnvelope = {
  type: string;
  payload: unknown;
};

export type ThreadEvent =
  | {
      kind: 'envelope';
      threadId: string;
      envelope: MessageEnvelope;
    }
  | {
      kind: 'batch';
      threadId: string;
      envelopes: MessageEnvelope[];
    }
  | {
      kind: 'history';
      threadId: string;
      envelopes: MessageEnvelope[];
    };

export type UiStatePatchPayload =
  | {
      path: string;
      value: unknown;
    }
  | {
      partial: Partial<UiState>;
    };
