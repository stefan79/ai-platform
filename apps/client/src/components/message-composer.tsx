import { useState } from 'react';
import { useAppSelector, useThreadBus } from '../runtime';
import { cn } from '../lib/utils';

/**
 * Component: MessageComposer
 *
 * Purpose:
 * - Present the message composition surface for user input.
 *
 * Visuals:
 * - Layout: full-width composer with textarea and submit button.
 * - Density: comfortable.
 * - Color/Type: seamless textarea with accent submit button.
 * - States: empty draft, focused/blurred input, submitting/locked state.
 */
export function MessageComposer() {
  const threadId = useAppSelector((state) => state.ui.threadList.selectedThreadId);
  const composerLocked = useAppSelector((state) => state.composerLocked);
  const threadBus = useThreadBus();
  const [draft, setDraft] = useState('');

  const submitMessage = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;

    threadBus.publish({
      kind: 'envelope',
      threadId,
      envelope: {
        type: 'user.message',
        payload: {
          messageId: crypto.randomUUID(),
          threadId,
          timestamp: Date.now(),
          body: trimmed,
        },
      },
    });
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !composerLocked) {
      e.preventDefault();
      submitMessage();
    }
  };

  const placeholder = composerLocked ? 'Waiting for response...' : 'Message Agent Platform...';

  return (
    <div className="message-composer__surface">
      <div className="message-composer__input-shell">
        <textarea
          className="message-composer__input"
          placeholder={placeholder}
          rows={4}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={composerLocked}
          aria-label="Message input"
        />
      </div>
      <div className="message-composer__actions">
        <button
          className={cn(
            'message-composer__submit',
            (composerLocked || !draft.trim()) && 'opacity-50 cursor-not-allowed',
          )}
          type="button"
          onClick={submitMessage}
          disabled={composerLocked || !draft.trim()}
          aria-label="Send message"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
