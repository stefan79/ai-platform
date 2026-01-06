import type { ReactNode } from 'react';
import { uiModels } from './models';

type CardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  events?: readonly string[];
  footer?: ReactNode;
  layout?: 'column' | 'row';
  ariaLabel?: string;
};

const Card = ({ title, subtitle, children, events = [], footer, layout = 'column', ariaLabel }: CardProps) => (
  <section
    aria-label={ariaLabel ?? title}
    className="rounded-lg border border-border bg-surface p-4 shadow-md"
  >
    <div className={`flex ${layout === 'row' ? 'items-center justify-between' : 'flex-col gap-2'}`}>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">{subtitle ?? 'Component'}</p>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {events.length > 0 && (
        <div className="flex flex-wrap gap-2 text-[11px] text-muted">
          {events.map((event) => (
            <span key={event} className="rounded-full border border-border px-2 py-0.5">
              {event}
            </span>
          ))}
        </div>
      )}
    </div>
    <div className="mt-3 space-y-3">{children}</div>
    {footer && <div className="mt-3 border-t border-border pt-3 text-sm text-muted">{footer}</div>}
  </section>
);

function SidebarToggle({ isCollapsed, isEnabled }: { isCollapsed: boolean; isEnabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <div className="space-y-1">
        <p className="text-sm font-medium">Sidebar Toggle</p>
        <p className="text-xs text-muted">
          State: {isCollapsed ? 'Collapsed' : 'Expanded'} • {isEnabled ? 'Enabled' : 'Disabled'}
        </p>
      </div>
      <span className="rounded-full bg-border px-3 py-1 text-xs uppercase tracking-wide text-muted">Static</span>
    </div>
  );
}

function ThreadListItem({
  title,
  unreadCount,
  isSelected,
}: {
  title: string;
  unreadCount: number;
  isSelected: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md border px-3 py-2 ${isSelected ? 'border-accent/70 bg-accent/10' : 'border-border bg-background/40'}`}
    >
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted">{isSelected ? 'Selected thread' : 'Available thread'}</p>
      </div>
      <span className="rounded-full bg-border px-2 py-1 text-xs text-muted">{unreadCount} unread</span>
    </div>
  );
}

function ThreadList() {
  const list = uiModels.threadList.defaultState;
  const items = uiModels.threadItems.map((model) => model.defaultState);
  return (
    <Card title="ThreadList" subtitle="Sidebar" events={uiModels.threadList.events} ariaLabel="Thread list">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Filter: &quot;{list.filter || 'none'}&quot;</span>
        <span>Selected: {list.selectedThreadId}</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <ThreadListItem
            key={item.threadId}
            title={item.title}
            unreadCount={item.unreadCount}
            isSelected={item.isSelected}
          />
        ))}
      </div>
    </Card>
  );
}

function ActorPanel() {
  const state = uiModels.actorPanel.defaultState;
  return (
    <Card title="ActorPanel" subtitle="Sidebar" events={uiModels.actorPanel.events} ariaLabel="Actor panel">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Selected actor: {state.selectedActorId}</span>
        <span>{state.isEditable ? 'Editable' : 'Read only'}</span>
      </div>
      <ul className="space-y-2">
        {state.actors.map((actor) => (
          <li key={actor.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <p className="font-medium">{actor.name}</p>
              <p className="text-xs text-muted">Role: {actor.role}</p>
            </div>
            <span className="rounded-full bg-border px-2 py-1 text-xs uppercase text-muted">{actor.id}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function FilePanel() {
  const state = uiModels.filePanel.defaultState;
  return (
    <Card title="FilePanel" subtitle="Sidebar" events={uiModels.filePanel.events} ariaLabel="File panel">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Selected file: {state.selectedFileId}</span>
        <span>{state.isEditable ? 'Editable' : 'Read only'}</span>
      </div>
      <ul className="space-y-2">
        {state.files.map((file) => (
          <li key={file.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-muted">Status: {file.status}</p>
            </div>
            <span className="rounded-full bg-border px-2 py-1 text-xs uppercase text-muted">{file.id}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SettingsPanel() {
  const state = uiModels.settingsPanel.defaultState;
  return (
    <Card title="SettingsPanel" subtitle="Sidebar" events={uiModels.settingsPanel.events} ariaLabel="Settings panel">
      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <dt className="text-muted">Theme</dt>
          <dd className="font-medium">{state.settings.theme}</dd>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <dt className="text-muted">Density</dt>
          <dd className="font-medium">{state.settings.density}</dd>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <dt className="text-muted">Sound</dt>
          <dd className="font-medium">{state.settings.sound ? 'Enabled' : 'Disabled'}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted">
        Dirty keys: {state.dirtyKeys.length ? state.dirtyKeys.join(', ') : 'none'} • {state.isEditable ? 'Editable' : 'Read only'}
      </p>
    </Card>
  );
}

function SystemStateBar() {
  const state = uiModels.systemStateBar.defaultState;
  return (
    <Card
      title="SystemStateBar"
      subtitle="Main Pane"
      events={uiModels.systemStateBar.events}
      layout="row"
      ariaLabel="System state bar"
    >
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full bg-border px-3 py-1 uppercase tracking-wide text-muted">
          Status: {state.systemStatus}
        </span>
        <span className="rounded-full bg-border px-3 py-1 text-xs text-muted">
          Labels: {state.labels.join(' • ')}
        </span>
        <span className="text-xs text-muted">Last updated: {state.lastUpdatedAt}</span>
      </div>
    </Card>
  );
}

function ThreadHeader() {
  const header = uiModels.threadHeader.defaultState;
  const title = uiModels.threadTitle.defaultState;
  const actions = uiModels.threadActions.defaultState;
  return (
    <Card
      title="ThreadHeader"
      subtitle="Main Pane"
      events={[...uiModels.threadHeader.events, ...uiModels.threadTitle.events, ...uiModels.threadActions.events]}
      ariaLabel="Thread header"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">ThreadTitle</p>
          <p className="text-xl font-semibold">{title.title}</p>
          <p className="text-xs text-muted">
            Editable: {title.isEditable ? 'yes' : 'no'} • Thread ID: {title.threadId}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions.availableActions.map((action) => (
            <span key={action} className="rounded-full border border-border px-3 py-1 text-xs uppercase text-muted">
              {action}
            </span>
          ))}
          <span className="rounded-full bg-border px-3 py-1 text-xs text-muted">Last: {actions.lastInvokedAction}</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          ThreadHeader: {header.title} ({header.threadId})
        </span>
        <span>Status: {header.status}</span>
      </div>
    </Card>
  );
}

function MessageBubble({
  bubble,
  content,
  contextMenuLabel,
}: {
  bubble: { messageId: string; actorRole: string; timestamp: string; status: string };
  content: { messageId: string; content: string; format: string };
  contextMenuLabel: string;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-background/40 p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
        <span>
          {bubble.actorRole} • {bubble.timestamp}
        </span>
        <span className="rounded-full bg-border px-2 py-1 text-[11px] text-muted">{bubble.status}</span>
      </div>
      <p className="text-sm">{content.content}</p>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Format: {content.format}</span>
        <span>Context menu: {contextMenuLabel}</span>
      </div>
    </div>
  );
}

function MessageTimeline() {
  const timeline = uiModels.messageTimeline.defaultState;
  const bubbles = new Map(uiModels.messageBubbles.map((model) => [model.defaultState.messageId, model.defaultState]));
  const contents = new Map(uiModels.messageContents.map((model) => [model.defaultState.messageId, model.defaultState]));
  const contextMenus = new Map(
    uiModels.messageContextMenus.map((model) => [model.defaultState.messageId, model.defaultState]),
  );

  return (
    <Card
      title="MessageTimeline"
      subtitle="Main Pane"
      events={uiModels.messageTimeline.events}
      ariaLabel="Message timeline"
    >
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Thread: {timeline.threadId}</span>
        <span>Anchor: {timeline.scrollAnchor}</span>
      </div>
      <div className="space-y-3">
        {timeline.messageIds.map((id) => (
          <MessageBubble
            key={id}
            bubble={bubbles.get(id)!}
            content={contents.get(id)!}
            contextMenuLabel={contextMenus.get(id)?.isOpen ? 'Open' : 'Closed'}
          />
        ))}
      </div>
    </Card>
  );
}

function Composer() {
  const composer = uiModels.messageComposer.defaultState;
  const input = uiModels.composerInput.defaultState;
  const toolbar = uiModels.composerToolbar.defaultState;
  const palette = uiModels.commandPalette.defaultState;

  return (
    <Card
      title="MessageComposer"
      subtitle="Main Pane"
      events={[...uiModels.messageComposer.events, ...uiModels.composerInput.events, ...uiModels.composerToolbar.events]}
      ariaLabel="Message composer"
    >
      <div className="rounded-md border border-border bg-background/40 p-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Draft length: {composer.draftText.length} • Cursor: {input.cursorPosition}</span>
          <span>Actors: {composer.selectedActors.join(', ')}</span>
        </div>
        <div className="mt-2 rounded-md border border-dashed border-border bg-surface/70 px-3 py-2 text-sm text-muted">
          ComposerInput: &quot;{input.draftText || 'Empty draft'}&quot; ({input.isFocused ? 'Focused' : 'Blurred'})
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {toolbar.availableCommands.map((command) => (
            <span
              key={command}
              className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
                toolbar.activeCommandId === command ? 'border-accent text-accent' : 'border-border text-muted'
              }`}
            >
              {command}
            </span>
          ))}
          <span className="rounded-full bg-border px-3 py-1 text-xs text-muted">
            Active: {toolbar.activeCommandId}
          </span>
        </div>
      </div>
      <div className="rounded-md border border-border bg-background/40 p-3">
        <p className="text-sm font-semibold">CommandPalette</p>
        <div className="mt-2 flex items-center justify-between text-xs text-muted">
          <span>Open: {palette.isOpen ? 'Yes' : 'No'}</span>
          <span>
            Query: &quot;{palette.query || 'empty'}&quot; • Highlighted: {palette.highlightedIndex + 1}/{palette.results.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {palette.results.map((result) => (
            <span key={result} className="rounded-md border border-border px-3 py-1 text-xs text-muted">
              {result}
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted">
        Submission: {composer.isSubmitting ? 'Pending' : 'Idle'} • Last event: {composer.lastEventId}
      </p>
    </Card>
  );
}

function ThreadOverviewDrawer() {
  const drawer = uiModels.threadOverviewDrawer.defaultState;
  return (
    <Card
      title="ThreadOverviewDrawer"
      subtitle="Main Pane"
      events={uiModels.threadOverviewDrawer.events}
      ariaLabel="Thread overview drawer"
    >
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Thread: {drawer.threadId}</span>
        <span>Open: {drawer.isOpen ? 'Yes' : 'No'}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {drawer.sections.map((section) => (
          <span
            key={section}
            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wide ${
              drawer.activeSectionId === section ? 'border-accent text-accent' : 'border-border text-muted'
            }`}
          >
            {section}
          </span>
        ))}
      </div>
    </Card>
  );
}

function Sidebar() {
  const sidebar = uiModels.sidebar.defaultState;
  const toggle = uiModels.sidebarToggle.defaultState;
  return (
    <aside className="space-y-4" aria-label="Sidebar">
      <Card title="Sidebar" subtitle="Control Panel" events={uiModels.sidebar.events} ariaLabel="Sidebar shell">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Collapsed: {sidebar.isCollapsed ? 'Yes' : 'No'}</span>
          <span>Active panel: {sidebar.activePanel}</span>
        </div>
        <SidebarToggle isCollapsed={toggle.isCollapsed} isEnabled={toggle.isEnabled} />
      </Card>
      <ThreadList />
      <ActorPanel />
      <FilePanel />
      <SettingsPanel />
    </aside>
  );
}

function MessageDetailsPanel() {
  const panel = uiModels.messageDetailsPanel.defaultState;
  return (
    <Card
      title="MessageDetailsPanel"
      subtitle="Additional Panel"
      events={uiModels.messageDetailsPanel.events}
      ariaLabel="Message details panel"
    >
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Message: {panel.messageId}</span>
        <span>Open: {panel.isOpen ? 'Yes' : 'No'}</span>
      </div>
      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
        <span>Tokens: {panel.details.tokens}</span>
        <span>Latency: {panel.details.latencyMs}ms</span>
      </div>
    </Card>
  );
}

function SoundNotifier() {
  const notifier = uiModels.soundNotifier.defaultState;
  return (
    <Card
      title="SoundNotifier"
      subtitle="Additional Panel"
      events={uiModels.soundNotifier.events}
      ariaLabel="Sound notifier"
    >
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Enabled: {notifier.isEnabled ? 'Yes' : 'No'}</span>
        <span>Volume: {Math.round(notifier.volume * 100)}%</span>
      </div>
      <p className="text-xs text-muted">Last sound: {notifier.lastSoundId}</p>
    </Card>
  );
}

function OverlayManager() {
  const overlay = uiModels.overlayManager.defaultState;
  return (
    <Card
      title="OverlayManager"
      subtitle="Additional Panel"
      events={uiModels.overlayManager.events}
      ariaLabel="Overlay manager"
    >
      <p className="text-sm text-muted">Active overlays: {overlay.activeOverlays.length || 'None'}</p>
      <p className="text-xs text-muted">Z-stack: {overlay.zStack.length ? overlay.zStack.join(', ') : 'Empty'}</p>
      <p className="text-xs text-muted">Last event: {overlay.lastEventId}</p>
    </Card>
  );
}

function MainPane() {
  const mainPane = uiModels.mainPane.defaultState;
  const systemState = <SystemStateBar />;
  const threadHeader = <ThreadHeader />;
  const timeline = <MessageTimeline />;
  const composer = <Composer />;
  const overviewDrawer = <ThreadOverviewDrawer />;

  return (
    <section className="space-y-4" aria-label="Main pane">
      <Card title="MainPane" subtitle="AppShell" events={uiModels.mainPane.events} ariaLabel="Main pane summary">
        <div className="flex items-center justify-between text-sm text-muted">
          <span>Active thread: {mainPane.activeThreadId}</span>
          <span>View mode: {mainPane.viewMode}</span>
        </div>
        <p className="text-xs text-muted">Last event: {mainPane.lastEventId}</p>
      </Card>
      {systemState}
      {threadHeader}
      {timeline}
      {composer}
      {overviewDrawer}
    </section>
  );
}

function AppShell() {
  const shell = uiModels.appShell.defaultState;
  return (
    <header className="flex items-center justify-between rounded-lg border border-border bg-surface px-5 py-4 shadow-md">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">AppShell</p>
        <h1 className="text-2xl font-semibold">AI Platform – Mocked Client</h1>
        <p className="text-sm text-muted">
          Layout: {shell.layoutMode} • Active pane: {shell.activePane} • Last event: {shell.lastEventId}
        </p>
      </div>
      <div className="flex flex-wrap justify-end gap-2 text-[11px] text-muted">
        {uiModels.appShell.events.map((event) => (
          <span key={event} className="rounded-full border border-border px-3 py-1 uppercase tracking-wide">
            {event}
          </span>
        ))}
      </div>
    </header>
  );
}

function App() {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <AppShell />

        <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
          <Sidebar />
          <MainPane />
        </div>

        <div className="grid gap-4 lg:grid-cols-3" aria-label="Additional panels">
          <MessageDetailsPanel />
          <SoundNotifier />
          <OverlayManager />
        </div>
      </div>
    </main>
  );
}

export default App;
