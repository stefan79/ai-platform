import { useState } from 'react';
import { uiModels } from '../models';
import { Panel } from './panel';
import { useAppSelector } from '../runtime';
import { useThreadBus } from '../runtime';

/**
 * Component: MessageComposer
 *
 * Purpose:
 * - Present the message composition surface, draft metadata, and command affordances.
 *
 * Visuals:
 * - Layout: full-width composer surface with a footer action row.
 * - Density: comfortable.
 * - Color/Type: seamless text area on the same surface with an accent submit button.
 * - States: empty draft, focused/blurred input, submitting flag.
 *
 * Responsive + Scrolling:
 * - Breakpoints: layout remains single column; actions stay right-aligned.
 * - Scrolling: none; content grows vertically.
 * - Height: fit content.
 *
 * Model Setup:
 * - Inputs: message composer + input state.
 * - Defaults: uses mocked UI model defaults for now.
 * - Derived: draft length from state.
 *
 * Events + Commands:
 * - Events In: ComposerDraftChanged, ComposerSubmitted, ComposerCleared,
 *   ComposerInputChanged, ComposerInputFocused, ComposerInputBlurred.
 * - Commands Out: thread bus `user.message` payloads.
 * - Reducers: none.
 * - Side Effects: none.
 *
 * Accessibility:
 * - Keyboard: none (static).
 * - ARIA: panel uses aria-label via wrapper.
 *
 * Notes:
 * - Mock-only; wire to runtime state and commands later.
 *
 * TODO:
 * - Swap mocked state for runtime selectors.
 * - Add keyboard submit + focus handling.
 */
export function MessageComposer() {
  const input = uiModels.composerInput.defaultState;
  const threadId = useAppSelector((state) => state.ui.threadList.selectedThreadId);
  const composerLocked = useAppSelector((state) => state.composerLocked);
  const threadBus = useThreadBus();
  const [draft, setDraft] = useState(input.draftText);

  const submitMessage = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }
    threadBus.publish({
      threadId,
      payloadType: 'user.message',
      payload: {
        messageId: crypto.randomUUID(),
        threadId,
        timestamp: Date.now(),
        body: trimmed,
      },
    });
    setDraft('');
  };

  const placeholder = composerLocked
    ? 'Waiting for assistant response...'
    : 'Message Agent Platform...';

  const onSubmit = () => {
    if (composerLocked) {
      return;
    }
    submitMessage();
  };

  return (
    <Panel
      title="MessageComposer"
      subtitle="Main Pane"
      events={[
        ...uiModels.messageComposer.events,
        ...uiModels.composerInput.events,
      ]}
      ariaLabel="Message composer"
      mockId="mock.message-composer"
    >
      <div className="message-composer__surface">
        <div className="message-composer__input-shell">
          <textarea
            className="message-composer__input"
            placeholder={placeholder}
            rows={4}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label="Message input"
            readOnly={composerLocked}
          />
        </div>
        <div className="message-composer__actions">
          <button
            className="message-composer__submit"
            type="button"
            aria-label="Submit message"
            onClick={onSubmit}
            disabled={composerLocked}
          >
            ↑
          </button>
        </div>
      </div>
    </Panel>
  );
}
