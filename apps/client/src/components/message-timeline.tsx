import { Panel } from './panel';
import { useAppSelector } from '../runtime';

/**
 * Component: MessageTimeline
 *
 * Purpose:
 * - Render assistant message history from the socket.io event stream.
 *
 * Visuals:
 * - Layout: single-column list of message cards with newest at the bottom.
 * - Density: comfortable.
 * - Color/Type: card surface with muted metadata.
 * - States: empty timeline message when no assistant output yet.
 *
 * Responsive + Scrolling:
 * - Breakpoints: list scales to container width.
 * - Scrolling: parent container scrolls; timeline content grows.
 * - Height: fit content.
 *
 * Model Setup:
 * - Inputs: message history from runtime store.
 * - Defaults: empty list.
 * - Derived: render order matches arrival order.
 *
 * Events + Commands:
 * - Events In: `assistant.message` from WS.
 * - Commands Out: none.
 *
 * Accessibility:
 * - Keyboard: none (static).
 * - ARIA: panel uses aria-label via wrapper.
 *
 * Notes:
 * - Messages append to the bottom as new events arrive.
 */
export function MessageTimeline({ className }: { className?: string }) {
  const messages = useAppSelector((state) => state.messages);

  return (
    <Panel
      title="MessageTimeline"
      subtitle="Main Pane"
      ariaLabel="Message timeline"
      className={className}
      mockId="mock.message-timeline"
    >
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">No messages yet.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className="rounded-md border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>
                  {message.role} • {new Date(message.timestamp).toISOString()}
                </span>
                <span>{message.assistantId ?? 'local'}</span>
              </div>
              <p className="mt-2 text-sm text-foreground">{message.body}</p>
              {message.status === 'pending' && (
                <p className="mt-2 text-xs text-muted-foreground">Awaiting response...</p>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
