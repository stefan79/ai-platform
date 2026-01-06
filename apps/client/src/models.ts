import * as Schema from '@effect/schema/Schema';

type Model<State> = {
  readonly stateSchema: Schema.Schema<State>;
  readonly defaultState: State;
  readonly events: readonly string[];
};

const model = <State>(
  stateSchema: Schema.Schema<State>,
  defaultState: State,
  events: readonly string[],
): Model<State> => ({
  stateSchema,
  defaultState,
  events,
});

const appShellStateSchema = Schema.Struct({
  layoutMode: Schema.Literal('split', 'focused'),
  activePane: Schema.Literal('sidebar', 'main'),
  lastEventId: Schema.String,
});

export type AppShellState = Schema.To<typeof appShellStateSchema>;

const sidebarStateSchema = Schema.Struct({
  isCollapsed: Schema.Boolean,
  activePanel: Schema.Literal('threads', 'actors', 'files', 'settings'),
  lastEventId: Schema.String,
});

export type SidebarState = Schema.To<typeof sidebarStateSchema>;

const sidebarToggleStateSchema = Schema.Struct({
  isCollapsed: Schema.Boolean,
  isEnabled: Schema.Boolean,
});

export type SidebarToggleState = Schema.To<typeof sidebarToggleStateSchema>;

const threadListItemStateSchema = Schema.Struct({
  threadId: Schema.String,
  title: Schema.String,
  unreadCount: Schema.Number,
  isSelected: Schema.Boolean,
});

export type ThreadListItemState = Schema.To<typeof threadListItemStateSchema>;

const threadListStateSchema = Schema.Struct({
  threads: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      title: Schema.String,
    }),
  ),
  selectedThreadId: Schema.String,
  filter: Schema.String,
  lastEventId: Schema.String,
});

export type ThreadListState = Schema.To<typeof threadListStateSchema>;

const actorPanelStateSchema = Schema.Struct({
  actors: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      role: Schema.Literal('system', 'user', 'assistant'),
    }),
  ),
  selectedActorId: Schema.String,
  isEditable: Schema.Boolean,
});

export type ActorPanelState = Schema.To<typeof actorPanelStateSchema>;

const filePanelStateSchema = Schema.Struct({
  files: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      status: Schema.String,
    }),
  ),
  selectedFileId: Schema.String,
  isEditable: Schema.Boolean,
});

export type FilePanelState = Schema.To<typeof filePanelStateSchema>;

const settingsPanelStateSchema = Schema.Struct({
  settings: Schema.Struct({
    theme: Schema.String,
    density: Schema.String,
    sound: Schema.Boolean,
  }),
  dirtyKeys: Schema.Array(Schema.String),
  isEditable: Schema.Boolean,
});

export type SettingsPanelState = Schema.To<typeof settingsPanelStateSchema>;

const mainPaneStateSchema = Schema.Struct({
  activeThreadId: Schema.String,
  viewMode: Schema.Literal('timeline', 'details'),
  lastEventId: Schema.String,
});

export type MainPaneState = Schema.To<typeof mainPaneStateSchema>;

const systemStateBarStateSchema = Schema.Struct({
  systemStatus: Schema.Literal('ok', 'degraded', 'down'),
  labels: Schema.Array(Schema.String),
  lastUpdatedAt: Schema.String,
});

export type SystemStateBarState = Schema.To<typeof systemStateBarStateSchema>;

const threadHeaderStateSchema = Schema.Struct({
  threadId: Schema.String,
  title: Schema.String,
  status: Schema.String,
  lastEventId: Schema.String,
});

export type ThreadHeaderState = Schema.To<typeof threadHeaderStateSchema>;

const threadTitleStateSchema = Schema.Struct({
  threadId: Schema.String,
  title: Schema.String,
  isEditable: Schema.Boolean,
});

export type ThreadTitleState = Schema.To<typeof threadTitleStateSchema>;

const threadActionsStateSchema = Schema.Struct({
  availableActions: Schema.Array(Schema.String),
  lastInvokedAction: Schema.String,
});

export type ThreadActionsState = Schema.To<typeof threadActionsStateSchema>;

const messageTimelineStateSchema = Schema.Struct({
  threadId: Schema.String,
  messageIds: Schema.Array(Schema.String),
  scrollAnchor: Schema.String,
  lastEventId: Schema.String,
});

export type MessageTimelineState = Schema.To<typeof messageTimelineStateSchema>;

const messageBubbleStateSchema = Schema.Struct({
  messageId: Schema.String,
  actorRole: Schema.Literal('assistant', 'user', 'system'),
  timestamp: Schema.String,
  status: Schema.String,
});

export type MessageBubbleState = Schema.To<typeof messageBubbleStateSchema>;

const messageContentStateSchema = Schema.Struct({
  messageId: Schema.String,
  content: Schema.String,
  format: Schema.Literal('text', 'markdown'),
  attachments: Schema.Array(Schema.String),
});

export type MessageContentState = Schema.To<typeof messageContentStateSchema>;

const messageContextMenuStateSchema = Schema.Struct({
  messageId: Schema.String,
  isOpen: Schema.Boolean,
  anchor: Schema.String,
});

export type MessageContextMenuState = Schema.To<typeof messageContextMenuStateSchema>;

const messageComposerStateSchema = Schema.Struct({
  draftText: Schema.String,
  selectedActors: Schema.Array(Schema.String),
  isSubmitting: Schema.Boolean,
  lastEventId: Schema.String,
});

export type MessageComposerState = Schema.To<typeof messageComposerStateSchema>;

const composerInputStateSchema = Schema.Struct({
  draftText: Schema.String,
  isFocused: Schema.Boolean,
  cursorPosition: Schema.Number,
});

export type ComposerInputState = Schema.To<typeof composerInputStateSchema>;

const composerToolbarStateSchema = Schema.Struct({
  availableCommands: Schema.Array(Schema.String),
  activeCommandId: Schema.String,
});

export type ComposerToolbarState = Schema.To<typeof composerToolbarStateSchema>;

const commandPaletteStateSchema = Schema.Struct({
  isOpen: Schema.Boolean,
  query: Schema.String,
  results: Schema.Array(Schema.String),
  highlightedIndex: Schema.Number,
});

export type CommandPaletteState = Schema.To<typeof commandPaletteStateSchema>;

const threadOverviewDrawerStateSchema = Schema.Struct({
  threadId: Schema.String,
  isOpen: Schema.Boolean,
  sections: Schema.Array(Schema.String),
  activeSectionId: Schema.String,
});

export type ThreadOverviewDrawerState = Schema.To<typeof threadOverviewDrawerStateSchema>;

const messageDetailsPanelStateSchema = Schema.Struct({
  messageId: Schema.String,
  isOpen: Schema.Boolean,
  details: Schema.Struct({
    tokens: Schema.Number,
    latencyMs: Schema.Number,
  }),
});

export type MessageDetailsPanelState = Schema.To<typeof messageDetailsPanelStateSchema>;

const soundNotifierStateSchema = Schema.Struct({
  isEnabled: Schema.Boolean,
  lastSoundId: Schema.String,
  volume: Schema.Number,
});

export type SoundNotifierState = Schema.To<typeof soundNotifierStateSchema>;

const overlayManagerStateSchema = Schema.Struct({
  activeOverlays: Schema.Array(Schema.String),
  zStack: Schema.Array(Schema.String),
  lastEventId: Schema.String,
});

export type OverlayManagerState = Schema.To<typeof overlayManagerStateSchema>;

export const appShellModel = model<AppShellState>(
  appShellStateSchema,
  { layoutMode: 'split', activePane: 'main', lastEventId: 'evt-0' },
  ['ShellLayoutChanged', 'ShellActivePaneChanged'],
);

export const sidebarModel = model<SidebarState>(
  sidebarStateSchema,
  { isCollapsed: false, activePanel: 'threads', lastEventId: 'evt-0' },
  ['SidebarToggled', 'SidebarPanelSelected'],
);

export const sidebarToggleModel = model<SidebarToggleState>(
  sidebarToggleStateSchema,
  { isCollapsed: false, isEnabled: true },
  ['SidebarToggleClicked'],
);

export const threadListModel = model<ThreadListState>(
  threadListStateSchema,
  {
    threads: [
      { id: 't-1', title: 'Project Alpha' },
      { id: 't-2', title: 'Runtime Notes' },
    ],
    selectedThreadId: 't-1',
    filter: '',
    lastEventId: 'evt-0',
  },
  ['ThreadListLoaded', 'ThreadSelected', 'ThreadFilterChanged'],
);

export const threadListItemModels: ReadonlyArray<Model<ThreadListItemState>> = [
  model<ThreadListItemState>(
    threadListItemStateSchema,
    { threadId: 't-1', title: 'Project Alpha', unreadCount: 2, isSelected: true },
    ['ThreadItemSelected', 'ThreadItemMarkedRead'],
  ),
  model<ThreadListItemState>(
    threadListItemStateSchema,
    { threadId: 't-2', title: 'Runtime Notes', unreadCount: 0, isSelected: false },
    ['ThreadItemSelected', 'ThreadItemMarkedRead'],
  ),
];

export const actorPanelModel = model<ActorPanelState>(
  actorPanelStateSchema,
  {
    actors: [
      { id: 'a-1', name: 'System', role: 'system' },
      { id: 'a-2', name: 'Operator', role: 'user' },
      { id: 'a-3', name: 'Assistant', role: 'assistant' },
    ],
    selectedActorId: 'a-3',
    isEditable: false,
  },
  ['ActorListLoaded', 'ActorSelected', 'ActorEdited'],
);

export const filePanelModel = model<FilePanelState>(
  filePanelStateSchema,
  {
    files: [
      { id: 'f-1', name: 'design.md', status: 'synced' },
      { id: 'f-2', name: 'notes.txt', status: 'draft' },
    ],
    selectedFileId: 'f-1',
    isEditable: false,
  },
  ['FileListLoaded', 'FileSelected', 'FileMetadataEdited'],
);

export const settingsPanelModel = model<SettingsPanelState>(
  settingsPanelStateSchema,
  {
    settings: { theme: 'light', density: 'comfortable', sound: true },
    dirtyKeys: [],
    isEditable: false,
  },
  ['SettingsLoaded', 'SettingChanged', 'SettingsSaved'],
);

export const mainPaneModel = model<MainPaneState>(
  mainPaneStateSchema,
  { activeThreadId: 't-1', viewMode: 'timeline', lastEventId: 'evt-0' },
  ['MainThreadChanged', 'MainViewModeChanged'],
);

export const systemStateBarModel = model<SystemStateBarState>(
  systemStateBarStateSchema,
  { systemStatus: 'ok', labels: ['local', 'mocked'], lastUpdatedAt: '2026-01-01T00:00:00Z' },
  ['SystemStateUpdated'],
);

export const threadHeaderModel = model<ThreadHeaderState>(
  threadHeaderStateSchema,
  { threadId: 't-1', title: 'Project Alpha', status: 'active', lastEventId: 'evt-0' },
  ['ThreadHeaderUpdated'],
);

export const threadTitleModel = model<ThreadTitleState>(
  threadTitleStateSchema,
  { threadId: 't-1', title: 'Project Alpha', isEditable: false },
  ['ThreadTitleEdited'],
);

export const threadActionsModel = model<ThreadActionsState>(
  threadActionsStateSchema,
  { availableActions: ['pin', 'mute', 'archive'], lastInvokedAction: 'none' },
  ['ThreadActionInvoked'],
);

export const messageTimelineModel = model<MessageTimelineState>(
  messageTimelineStateSchema,
  { threadId: 't-1', messageIds: ['m-1', 'm-2'], scrollAnchor: 'bottom', lastEventId: 'evt-0' },
  ['TimelineLoaded', 'TimelineScrolled'],
);

export const messageBubbleModels: ReadonlyArray<Model<MessageBubbleState>> = [
  model<MessageBubbleState>(
    messageBubbleStateSchema,
    {
      messageId: 'm-1',
      actorRole: 'assistant',
      timestamp: '2026-01-01T00:00:10Z',
      status: 'delivered',
    },
    ['MessageBubbleFocused', 'MessageBubbleHighlighted'],
  ),
  model<MessageBubbleState>(
    messageBubbleStateSchema,
    { messageId: 'm-2', actorRole: 'user', timestamp: '2026-01-01T00:00:20Z', status: 'delivered' },
    ['MessageBubbleFocused', 'MessageBubbleHighlighted'],
  ),
];

export const messageContentModels: ReadonlyArray<Model<MessageContentState>> = [
  model<MessageContentState>(
    messageContentStateSchema,
    { messageId: 'm-1', content: 'Mocked message content.', format: 'text', attachments: [] },
    ['MessageContentUpdated'],
  ),
  model<MessageContentState>(
    messageContentStateSchema,
    {
      messageId: 'm-2',
      content: 'Acknowledged receipt of the draft design. Ready for review steps.',
      format: 'markdown',
      attachments: [],
    },
    ['MessageContentUpdated'],
  ),
];

export const messageContextMenuModels: ReadonlyArray<Model<MessageContextMenuState>> = [
  model<MessageContextMenuState>(
    messageContextMenuStateSchema,
    { messageId: 'm-1', isOpen: false, anchor: 'none' },
    ['MessageContextMenuOpened', 'MessageContextMenuClosed', 'MessageContextMenuAction'],
  ),
  model<MessageContextMenuState>(
    messageContextMenuStateSchema,
    { messageId: 'm-2', isOpen: false, anchor: 'none' },
    ['MessageContextMenuOpened', 'MessageContextMenuClosed', 'MessageContextMenuAction'],
  ),
];

export const messageComposerModel = model<MessageComposerState>(
  messageComposerStateSchema,
  { draftText: '', selectedActors: ['a-3'], isSubmitting: false, lastEventId: 'evt-0' },
  ['ComposerDraftChanged', 'ComposerSubmitted', 'ComposerCleared'],
);

export const composerInputModel = model<ComposerInputState>(
  composerInputStateSchema,
  { draftText: '', isFocused: false, cursorPosition: 0 },
  ['ComposerInputChanged', 'ComposerInputFocused', 'ComposerInputBlurred'],
);

export const composerToolbarModel = model<ComposerToolbarState>(
  composerToolbarStateSchema,
  { availableCommands: ['/help', '/assign', '/summarize'], activeCommandId: 'none' },
  ['ComposerCommandSelected'],
);

export const commandPaletteModel = model<CommandPaletteState>(
  commandPaletteStateSchema,
  { isOpen: false, query: '', results: ['/help', '/assign', '/summarize'], highlightedIndex: 0 },
  [
    'CommandPaletteOpened',
    'CommandPaletteClosed',
    'CommandPaletteQueryChanged',
    'CommandPaletteResultSelected',
  ],
);

export const threadOverviewDrawerModel = model<ThreadOverviewDrawerState>(
  threadOverviewDrawerStateSchema,
  {
    threadId: 't-1',
    isOpen: false,
    sections: ['summary', 'actors', 'files'],
    activeSectionId: 'summary',
  },
  ['ThreadOverviewOpened', 'ThreadOverviewClosed', 'ThreadOverviewSectionSelected'],
);

export const messageDetailsPanelModel = model<MessageDetailsPanelState>(
  messageDetailsPanelStateSchema,
  { messageId: 'm-1', isOpen: false, details: { tokens: 42, latencyMs: 120 } },
  ['MessageDetailsOpened', 'MessageDetailsClosed', 'MessageDetailsUpdated'],
);

export const soundNotifierModel = model<SoundNotifierState>(
  soundNotifierStateSchema,
  { isEnabled: true, lastSoundId: 'none', volume: 0.6 },
  ['SoundNotificationQueued', 'SoundNotificationPlayed', 'SoundSettingsChanged'],
);

export const overlayManagerModel = model<OverlayManagerState>(
  overlayManagerStateSchema,
  { activeOverlays: [], zStack: [], lastEventId: 'evt-0' },
  ['OverlayOpened', 'OverlayClosed', 'OverlayFocused'],
);

export const uiModels = {
  appShell: appShellModel,
  sidebar: sidebarModel,
  sidebarToggle: sidebarToggleModel,
  threadList: threadListModel,
  threadItems: threadListItemModels,
  actorPanel: actorPanelModel,
  filePanel: filePanelModel,
  settingsPanel: settingsPanelModel,
  mainPane: mainPaneModel,
  systemStateBar: systemStateBarModel,
  threadHeader: threadHeaderModel,
  threadTitle: threadTitleModel,
  threadActions: threadActionsModel,
  messageTimeline: messageTimelineModel,
  messageBubbles: messageBubbleModels,
  messageContents: messageContentModels,
  messageContextMenus: messageContextMenuModels,
  messageComposer: messageComposerModel,
  composerInput: composerInputModel,
  composerToolbar: composerToolbarModel,
  commandPalette: commandPaletteModel,
  threadOverviewDrawer: threadOverviewDrawerModel,
  messageDetailsPanel: messageDetailsPanelModel,
  soundNotifier: soundNotifierModel,
  overlayManager: overlayManagerModel,
};
