import type { ReactNode } from 'react';
import { uiModels } from './models';
import { cn } from './lib/utils';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

type CardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  events?: readonly string[];
  footer?: ReactNode;
  layout?: 'column' | 'row';
  ariaLabel?: string;
  className?: string;
  mockId?: string;
};

const Panel = ({
  title,
  subtitle,
  children,
  events = [],
  footer,
  layout = 'column',
  ariaLabel,
  className,
  mockId,
}: CardProps) => (
  <Card
    aria-label={ariaLabel ?? title}
    className={cn('panel', className)}
    data-mock-id={mockId ?? title}
  >
    <CardHeader
      className={cn(
        layout === 'row'
          ? 'flex-row items-center justify-between gap-4 space-y-0'
          : 'flex-col gap-2 space-y-0',
      )}
    >
      <div>
        <CardDescription>{subtitle ?? 'Component'}</CardDescription>
        <CardTitle>{title}</CardTitle>
        {mockId && (
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            ID: {mockId}
          </p>
        )}
      </div>
      {events.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {events.map((event) => (
            <Badge key={event} variant="outline">
              {event}
            </Badge>
          ))}
        </div>
      )}
    </CardHeader>
    <CardContent className="space-y-3">{children}</CardContent>
    {footer && <CardFooter className="text-sm text-muted-foreground">{footer}</CardFooter>}
  </Card>
);

function SidebarToggle({ isCollapsed, isEnabled }: { isCollapsed: boolean; isEnabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <div className="space-y-1">
        <p className="text-sm font-medium">Sidebar Toggle</p>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          ID: mock.sidebar-toggle
        </p>
        <p className="text-xs text-muted-foreground">
          State: {isCollapsed ? 'Collapsed' : 'Expanded'} • {isEnabled ? 'Enabled' : 'Disabled'}
        </p>
      </div>
      <span className="rounded-full bg-border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
        Static
      </span>
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
      className={`flex items-center justify-between rounded-md border px-3 py-2 ${isSelected ? 'border-primary/60 bg-primary/10' : 'border-border bg-background/40'}`}
    >
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">
          {isSelected ? 'Selected thread' : 'Available thread'}
        </p>
      </div>
      <span className="rounded-full bg-border px-2 py-1 text-xs text-muted-foreground">
        {unreadCount} unread
      </span>
    </div>
  );
}

function ThreadList() {
  const list = uiModels.threadList.defaultState;
  const items = uiModels.threadItems.map((model) => model.defaultState);
  return (
    <Panel
      title="ThreadList"
      subtitle="Sidebar"
      events={uiModels.threadList.events}
      ariaLabel="Thread list"
      mockId="mock.thread-list"
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
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
    </Panel>
  );
}

function ActorPanel() {
  const state = uiModels.actorPanel.defaultState;
  return (
    <Panel
      title="ActorPanel"
      subtitle="Sidebar"
      events={uiModels.actorPanel.events}
      ariaLabel="Actor panel"
      mockId="mock.actor-panel"
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Selected actor: {state.selectedActorId}</span>
        <span>{state.isEditable ? 'Editable' : 'Read only'}</span>
      </div>
      <ul className="space-y-2">
        {state.actors.map((actor) => (
          <li
            key={actor.id}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2"
          >
            <div>
              <p className="font-medium">{actor.name}</p>
              <p className="text-xs text-muted-foreground">Role: {actor.role}</p>
            </div>
            <span className="rounded-full bg-border px-2 py-1 text-xs uppercase text-muted-foreground">
              {actor.id}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function FilePanel() {
  const state = uiModels.filePanel.defaultState;
  return (
    <Panel
      title="FilePanel"
      subtitle="Sidebar"
      events={uiModels.filePanel.events}
      ariaLabel="File panel"
      mockId="mock.file-panel"
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Selected file: {state.selectedFileId}</span>
        <span>{state.isEditable ? 'Editable' : 'Read only'}</span>
      </div>
      <ul className="space-y-2">
        {state.files.map((file) => (
          <li
            key={file.id}
            className="flex items-center justify-between rounded-md border border-border px-3 py-2"
          >
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">Status: {file.status}</p>
            </div>
            <span className="rounded-full bg-border px-2 py-1 text-xs uppercase text-muted-foreground">
              {file.id}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function SettingsPanel() {
  const state = uiModels.settingsPanel.defaultState;
  return (
    <Panel
      title="SettingsPanel"
      subtitle="Sidebar"
      events={uiModels.settingsPanel.events}
      ariaLabel="Settings panel"
      mockId="mock.settings-panel"
    >
      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <dt className="text-muted-foreground">Theme</dt>
          <dd className="font-medium">{state.settings.theme}</dd>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <dt className="text-muted-foreground">Density</dt>
          <dd className="font-medium">{state.settings.density}</dd>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <dt className="text-muted-foreground">Sound</dt>
          <dd className="font-medium">{state.settings.sound ? 'Enabled' : 'Disabled'}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground">
        Dirty keys: {state.dirtyKeys.length ? state.dirtyKeys.join(', ') : 'none'} •{' '}
        {state.isEditable ? 'Editable' : 'Read only'}
      </p>
    </Panel>
  );
}

function SystemStateBar() {
  const state = uiModels.systemStateBar.defaultState;
  return (
    <Panel
      title="SystemStateBar"
      subtitle="Main Pane"
      events={uiModels.systemStateBar.events}
      layout="row"
      ariaLabel="System state bar"
      mockId="mock.system-state-bar"
    >
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge variant="accent" className="uppercase">
          Status: {state.systemStatus}
        </Badge>
        <Badge variant="default" className="text-[11px] normal-case">
          Labels: {state.labels.join(' • ')}
        </Badge>
        <span className="text-xs text-muted-foreground">Last updated: {state.lastUpdatedAt}</span>
      </div>
    </Panel>
  );
}

function ThreadHeader() {
  const header = uiModels.threadHeader.defaultState;
  const title = uiModels.threadTitle.defaultState;
  const actions = uiModels.threadActions.defaultState;
  return (
    <Panel
      title="ThreadHeader"
      subtitle="Main Pane"
      events={[
        ...uiModels.threadHeader.events,
        ...uiModels.threadTitle.events,
        ...uiModels.threadActions.events,
      ]}
      ariaLabel="Thread header"
      mockId="mock.thread-header"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">ThreadTitle</p>
          <p className="text-xl font-semibold">{title.title}</p>
          <p className="text-xs text-muted-foreground">
            Editable: {title.isEditable ? 'yes' : 'no'} • Thread ID: {title.threadId}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions.availableActions.map((action) => (
            <Button
              key={action}
              variant="outline"
              size="sm"
            >
              {action}
            </Button>
          ))}
          <Badge variant="default" className="text-[11px] normal-case">
            Last: {actions.lastInvokedAction}
          </Badge>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          ThreadHeader: {header.title} ({header.threadId})
        </span>
        <span>Status: {header.status}</span>
      </div>
    </Panel>
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
  const roleClass =
    bubble.actorRole === 'assistant'
      ? 'border-primary/60 bg-primary/10'
      : bubble.actorRole === 'system'
        ? 'border-muted bg-muted/40'
        : 'border-border bg-card';
  return (
    <Card className={cn('space-y-2', roleClass)}>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>
          {bubble.actorRole} • {bubble.timestamp}
        </span>
        <Badge variant="outline" className="text-[11px] normal-case">
          {bubble.status}
        </Badge>
        </div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          ID: {bubble.messageId}
        </p>
        <p className="text-sm">{content.content}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Format: {content.format}</span>
          <span>Context menu: {contextMenuLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function MessageTimeline({ className }: { className?: string }) {
  const timeline = uiModels.messageTimeline.defaultState;
  const bubbles = new Map(
    uiModels.messageBubbles.map((model) => [model.defaultState.messageId, model.defaultState]),
  );
  const contents = new Map(
    uiModels.messageContents.map((model) => [model.defaultState.messageId, model.defaultState]),
  );
  const contextMenus = new Map(
    uiModels.messageContextMenus.map((model) => [model.defaultState.messageId, model.defaultState]),
  );

  return (
    <Panel
      title="MessageTimeline"
      subtitle="Main Pane"
      events={uiModels.messageTimeline.events}
      ariaLabel="Message timeline"
      className={className}
      mockId="mock.message-timeline"
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
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
    </Panel>
  );
}

function Composer() {
  const composer = uiModels.messageComposer.defaultState;
  const input = uiModels.composerInput.defaultState;
  const toolbar = uiModels.composerToolbar.defaultState;
  const palette = uiModels.commandPalette.defaultState;

  return (
    <Panel
      title="MessageComposer"
      subtitle="Main Pane"
      events={[
        ...uiModels.messageComposer.events,
        ...uiModels.composerInput.events,
        ...uiModels.composerToolbar.events,
      ]}
      ariaLabel="Message composer"
      mockId="mock.message-composer"
    >
      <div className="rounded-md border border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Draft length: {composer.draftText.length} • Cursor: {input.cursorPosition}
          </span>
          <span>Actors: {composer.selectedActors.join(', ')}</span>
        </div>
        <div className="mt-2 rounded-md border border-dashed border-border bg-card px-3 py-2 text-sm text-muted-foreground">
          ComposerInput: &quot;{input.draftText || 'Empty draft'}&quot; (
          {input.isFocused ? 'Focused' : 'Blurred'})
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {toolbar.availableCommands.map((command) => (
            <Badge
              key={command}
              variant={toolbar.activeCommandId === command ? 'accent' : 'outline'}
            >
              {command}
            </Badge>
          ))}
          <Badge variant="default" className="text-[11px] normal-case">
            Active: {toolbar.activeCommandId}
          </Badge>
        </div>
      </div>
      <div className="rounded-md border border-border bg-muted/30 p-3">
        <p className="text-sm font-semibold">CommandPalette</p>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Open: {palette.isOpen ? 'Yes' : 'No'}</span>
          <span>
            Query: &quot;{palette.query || 'empty'}&quot; • Highlighted:{' '}
            {palette.highlightedIndex + 1}/{palette.results.length}
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {palette.results.map((result) => (
            <Badge
              key={result}
              variant="outline"
            >
              {result}
            </Badge>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Submission: {composer.isSubmitting ? 'Pending' : 'Idle'} • Last event:{' '}
        {composer.lastEventId}
      </p>
    </Panel>
  );
}

function ThreadOverviewDrawer() {
  const drawer = uiModels.threadOverviewDrawer.defaultState;
  return (
    <Panel
      title="ThreadOverviewDrawer"
      subtitle="Main Pane"
      events={uiModels.threadOverviewDrawer.events}
      ariaLabel="Thread overview drawer"
      mockId="mock.thread-overview-drawer"
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Thread: {drawer.threadId}</span>
        <span>Open: {drawer.isOpen ? 'Yes' : 'No'}</span>
      </div>
      <Tabs defaultValue={drawer.activeSectionId} className="w-full">
        <TabsList className="flex flex-wrap">
          {drawer.sections.map((section) => (
            <TabsTrigger key={section} value={section}>
              {section}
            </TabsTrigger>
          ))}
        </TabsList>
        {drawer.sections.map((section) => (
          <TabsContent key={section} value={section} className="text-sm text-muted-foreground">
            {section === drawer.activeSectionId
              ? `Active section: ${section}`
              : `Section: ${section}`}
          </TabsContent>
        ))}
      </Tabs>
    </Panel>
  );
}

function Sidebar() {
  const sidebar = uiModels.sidebar.defaultState;
  const toggle = uiModels.sidebarToggle.defaultState;
  return (
    <aside className="sidebar space-y-4" aria-label="Sidebar">
      <div className="panel rounded-lg border border-border bg-card/80 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Sidebar</p>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          ID: mock.sidebar
        </p>
        <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>Collapsed: {sidebar.isCollapsed ? 'Yes' : 'No'}</span>
          <span>Active panel: {sidebar.activePanel}</span>
        </div>
      </div>
      <Panel
        title="Sidebar Toggle"
        subtitle="Sidebar"
        events={uiModels.sidebarToggle.events}
        mockId="mock.sidebar-toggle-panel"
      >
        <SidebarToggle isCollapsed={toggle.isCollapsed} isEnabled={toggle.isEnabled} />
      </Panel>
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
    <Panel
      title="MessageDetailsPanel"
      subtitle="Additional Panel"
      events={uiModels.messageDetailsPanel.events}
      ariaLabel="Message details panel"
      mockId="mock.message-details-panel"
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Message: {panel.messageId}</span>
        <span>Open: {panel.isOpen ? 'Yes' : 'No'}</span>
      </div>
      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
        <span>Tokens: {panel.details.tokens}</span>
        <span>Latency: {panel.details.latencyMs}ms</span>
      </div>
    </Panel>
  );
}

function SoundNotifier() {
  const notifier = uiModels.soundNotifier.defaultState;
  return (
    <Panel
      title="SoundNotifier"
      subtitle="Additional Panel"
      events={uiModels.soundNotifier.events}
      ariaLabel="Sound notifier"
      mockId="mock.sound-notifier"
    >
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Enabled: {notifier.isEnabled ? 'Yes' : 'No'}</span>
        <span>Volume: {Math.round(notifier.volume * 100)}%</span>
      </div>
      <p className="text-xs text-muted-foreground">Last sound: {notifier.lastSoundId}</p>
    </Panel>
  );
}

function OverlayManager() {
  const overlay = uiModels.overlayManager.defaultState;
  return (
    <Panel
      title="OverlayManager"
      subtitle="Additional Panel"
      events={uiModels.overlayManager.events}
      ariaLabel="Overlay manager"
      mockId="mock.overlay-manager"
    >
      <p className="text-sm text-muted-foreground">
        Active overlays: {overlay.activeOverlays.length || 'None'}
      </p>
      <p className="text-xs text-muted-foreground">
        Z-stack: {overlay.zStack.length ? overlay.zStack.join(', ') : 'Empty'}
      </p>
      <p className="text-xs text-muted-foreground">Last event: {overlay.lastEventId}</p>
    </Panel>
  );
}

function MainPane() {
  return (
    <section className="main-pane flex min-h-[70vh] flex-col gap-4" aria-label="Main pane">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
        ID: mock.main-pane
      </p>
      <SystemStateBar />
      <ThreadHeader />
      <MessageTimeline className="timeline-panel flex-1" />
      {/* Bottom stack keeps composer anchored while reserving space for the drawer. */}
      <div className="main-pane__bottom mt-auto space-y-4">
        <Composer />
        <ThreadOverviewDrawer />
      </div>
    </section>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const shell = uiModels.appShell.defaultState;
  return (
    <section
      className="app-shell rounded-xl border border-border bg-card/90 shadow-lg"
      aria-label="App shell"
      data-mock-id="mock.app-shell"
    >
      <header className="app-shell__header flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">AppShell</p>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            ID: mock.app-shell
          </p>
          <h1 className="text-2xl font-semibold">AI Platform – Mocked Client</h1>
          <p className="text-sm text-muted-foreground">
            Layout: {shell.layoutMode} • Active pane: {shell.activePane} • Last event:{' '}
            {shell.lastEventId}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2 text-[11px] text-muted-foreground">
          {uiModels.appShell.events.map((event) => (
            <span
              key={event}
              className="rounded-full border border-border px-3 py-1 uppercase tracking-wide"
            >
              {event}
            </span>
          ))}
        </div>
      </header>
      <div className="app-shell__body space-y-6 p-6">{children}</div>
    </section>
  );
}

function App() {
  return (
    <main className="app-root min-h-screen bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.15),_transparent_55%),linear-gradient(135deg,_rgba(16,20,43,0.95),_rgba(11,16,33,0.95))] text-foreground">
      <div className="app-container mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10">
        <AppShell>
          <div className="layout-grid grid gap-6 lg:grid-cols-[320px,1fr]">
            <Sidebar />
            <MainPane />
          </div>
          <div className="additional-grid grid gap-4 lg:grid-cols-3" aria-label="Additional panels">
            <MessageDetailsPanel />
            <SoundNotifier />
            <OverlayManager />
          </div>
        </AppShell>
      </div>
    </main>
  );
}

export default App;
