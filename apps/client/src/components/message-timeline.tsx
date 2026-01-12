import { useAppSelector } from '../runtime';
import { cn } from '../lib/utils';

/**
 * Component: MessageTimeline
 *
 * Purpose:
 * - Render assistant message history from the socket.io event stream.
 *
 * Visuals:
 * - Layout: single-column list of message bubbles with newest at the bottom.
 * - Density: comfortable.
 * - Color/Type: role-based bubble styling (user right-aligned, assistant left-aligned).
 * - States: empty timeline message when no assistant output yet.
 */
export function MessageTimeline({ className }: { className?: string }) {
  const messages = useAppSelector((state) => state.messages);

  return (
    <div className={cn('flex-1', className)} aria-label="Message timeline">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted/50 p-4 mb-4">
            <svg
              className="h-8 w-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">No messages yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Start a conversation below</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => {
            const isUser = message.role === 'user';
            const isAssistant = message.role === 'assistant';
            const isPending = message.status === 'pending';

            return (
              <div
                key={message.id}
                className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',
                    isUser
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted/60 text-foreground rounded-bl-md',
                    isPending && 'opacity-70',
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
                  <div
                    className={cn(
                      'mt-2 flex items-center gap-2 text-xs',
                      isUser ? 'text-primary-foreground/70' : 'text-muted-foreground',
                    )}
                  >
                    <span>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isPending && (
                      <span className="flex items-center gap-1">
                        <span className="animate-pulse">•</span>
                        Sending...
                      </span>
                    )}
                    {isAssistant && message.assistantId && (
                      <span className="opacity-70">{message.assistantId}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
