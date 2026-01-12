import { useState } from 'react';
import { uiModels } from './models';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { AppShell } from './components/app-shell';
import { useAppShellState } from './runtime';
import { MessageComposer } from './components/message-composer';
import { MessageTimeline } from './components/message-timeline';
import { logoSvg } from '@ai-platform/design-tokens';
import { cn } from './lib/utils';

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
    <button
      className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
        isSelected
          ? 'bg-primary/15 border border-primary/30'
          : 'hover:bg-muted/50 border border-transparent'
      }`}
    >
      <p className={`font-medium ${isSelected ? 'text-foreground' : 'text-foreground/80'}`}>
        {title}
      </p>
      {unreadCount > 0 && (
        <span className="mt-1 inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
          {unreadCount} new
        </span>
      )}
    </button>
  );
}

function ThreadList() {
  const items = uiModels.threadItems.map((model) => model.defaultState);
  return (
    <div className="space-y-1" aria-label="Thread list">
      {items.map((item) => (
        <ThreadListItem
          key={item.threadId}
          title={item.title}
          unreadCount={item.unreadCount}
          isSelected={item.isSelected}
        />
      ))}
    </div>
  );
}

function ActorList() {
  const state = uiModels.actorPanel.defaultState;
  return (
    <ul className="space-y-1" aria-label="Actor list">
      {state.actors.map((actor) => (
        <li
          key={actor.id}
          className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              actor.role === 'system'
                ? 'bg-yellow-500'
                : actor.role === 'assistant'
                  ? 'bg-green-500'
                  : 'bg-blue-500'
            }`}
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{actor.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{actor.role}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function FileList() {
  const state = uiModels.filePanel.defaultState;
  return (
    <ul className="space-y-1" aria-label="File list">
      {state.files.map((file) => (
        <li
          key={file.id}
          className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
        >
          <p className="font-medium truncate">{file.name}</p>
          <Badge variant={file.status === 'synced' ? 'default' : 'secondary'} className="text-xs">
            {file.status}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

function SettingsList() {
  const state = uiModels.settingsPanel.defaultState;
  return (
    <dl className="space-y-1 text-sm" aria-label="Settings list">
      <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
        <dt className="text-muted-foreground">Theme</dt>
        <dd className="font-medium capitalize">{state.settings.theme}</dd>
      </div>
      <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
        <dt className="text-muted-foreground">Density</dt>
        <dd className="font-medium capitalize">{state.settings.density}</dd>
      </div>
      <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors">
        <dt className="text-muted-foreground">Sound</dt>
        <dd className="font-medium">{state.settings.sound ? 'On' : 'Off'}</dd>
      </div>
    </dl>
  );
}

function SystemStateBar() {
  const state = uiModels.systemStateBar.defaultState;
  return (
    <div className="flex items-center gap-3 px-1">
      <Badge
        variant={state.systemStatus === 'ok' ? 'default' : 'destructive'}
        className="uppercase text-xs"
      >
        {state.systemStatus}
      </Badge>
      <span className="text-xs text-muted-foreground">{state.labels.join(' • ')}</span>
    </div>
  );
}

function ThreadHeader() {
  const title = uiModels.threadTitle.defaultState;
  const actions = uiModels.threadActions.defaultState;
  return (
    <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
      <div>
        <h2 className="text-xl font-semibold">{title.title}</h2>
      </div>
      <div className="flex items-center gap-2">
        {actions.availableActions.map((action) => (
          <Button key={action} variant="ghost" size="sm" className="capitalize">
            {action}
          </Button>
        ))}
      </div>
    </div>
  );
}

function SidebarSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <div className="h-px flex-1 bg-border/50" />
      </div>
      <div className="pl-1">{children}</div>
    </div>
  );
}

const ThreadsIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const ActorsIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const FilesIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    />
  </svg>
);

const SettingsIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

function Sidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const shell = useAppShellState();
  return (
    <aside
      className={cn(
        'sidebar flex flex-col rounded-xl border border-border bg-card/80 shadow-lg overflow-hidden transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-full',
      )}
      aria-label="Sidebar"
    >
      <div className="flex-none flex items-center gap-3 px-3 py-4">
        <button
          onClick={onToggle}
          className="logo inline-flex h-8 w-8 flex-shrink-0 hover:opacity-80 transition-opacity"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          dangerouslySetInnerHTML={{ __html: logoSvg }}
        />
        {!isCollapsed && (
          <h1 className="text-xl font-semibold tracking-tight truncate">{shell.title}</h1>
        )}
      </div>
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-5">
          <SidebarSection title="Threads" icon={<ThreadsIcon />}>
            <ThreadList />
          </SidebarSection>
          <SidebarSection title="Actors" icon={<ActorsIcon />}>
            <ActorList />
          </SidebarSection>
          <SidebarSection title="Files" icon={<FilesIcon />}>
            <FileList />
          </SidebarSection>
          <SidebarSection title="Settings" icon={<SettingsIcon />}>
            <SettingsList />
          </SidebarSection>
        </div>
      )}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center gap-4 py-4">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label="Threads"
            title="Threads"
          >
            <ThreadsIcon />
          </button>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label="Actors"
            title="Actors"
          >
            <ActorsIcon />
          </button>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label="Files"
            title="Files"
          >
            <FilesIcon />
          </button>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
            aria-label="Settings"
            title="Settings"
          >
            <SettingsIcon />
          </button>
        </div>
      )}
    </aside>
  );
}

function MainPane() {
  return (
    <section className="main-pane flex h-full flex-col overflow-hidden" aria-label="Main pane">
      <div className="flex-none space-y-4 pb-4">
        <SystemStateBar />
        <ThreadHeader />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        <MessageTimeline />
      </div>
      <div className="flex-none pt-4">
        <MessageComposer />
      </div>
    </section>
  );
}

function App() {
  const shell = useAppShellState();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <main className="app-root h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.15),_transparent_55%),linear-gradient(135deg,_rgba(16,20,43,0.95),_rgba(11,16,33,0.95))] text-foreground">
      <div className="app-container mx-auto flex h-full max-w-7xl flex-col px-6 py-6">
        <AppShell shell={shell}>
          <div
            className={cn(
              'layout-grid grid h-full gap-6 transition-all duration-300',
              sidebarCollapsed ? 'grid-cols-[64px,1fr]' : 'lg:grid-cols-[280px,1fr]',
            )}
          >
            <Sidebar
              isCollapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <MainPane />
          </div>
        </AppShell>
      </div>
    </main>
  );
}

export default App;
