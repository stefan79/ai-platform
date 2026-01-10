import type { ReactNode } from 'react';
import type { AppShellState } from '../models';
import { logoSvg } from '@ai-platform/design-tokens';

/**
 * Component: AppShell
 *
 * Purpose:
 * - Provide the primary chrome for the client layout and server identity.
 *
 * Visuals:
 * - Layout: header + content stack within a bordered shell container.
 * - Layout Header: left-aligned logo mark and server name.
 * - Layout Body: content area with padding.
 * - Density: comfortable.
 * - Color/Type: uses card surface and accent-colored logo with a headline title.
 * - States: REST-provided server name; children render below.
 *
 * Responsive + Scrolling:
 * - Breakpoints: header stays on one line; add wrapping if needed later.
 * - Scrolling: content scrolls within the page; shell itself does not scroll.
 * - Height: fit content.
 *
 * Model Setup:
 * - Inputs: AppShellState from the runtime store.
 * - Defaults: driven by caller or REST bootstrap.
 * - Derived: none.
 *
 * Events + Commands:
 * - Events In: REST bootstrap data for server name.
 * - Commands Out: none.
 * - Reducers: none.
 * - Side Effects: none.
 *
 * Accessibility:
 * - Keyboard: none.
 * - ARIA: labeled section via aria-label.
 *
 * Notes:
 * - Uses REST bootstrap data; no WS wiring yet.
 *
 * TODO:
 * - Add a fallback title when REST fails.
 * - Swap logo if design tokens change.
 */
export type AppShellProps = {
  children: ReactNode;
  shell: AppShellState;
};

export function AppShell({ children, shell }: AppShellProps) {
  return (
    <section
      className="app-shell rounded-xl border border-border bg-card/90 shadow-lg"
      aria-label="App shell"
      data-mock-id="mock.app-shell"
    >
      <header className="app-shell__header flex items-center justify-start gap-4 border-b border-border px-8 py-5">
        <span
          className="logo inline-flex h-10 w-10"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: logoSvg }}
        />
        <h1 className="text-3xl font-semibold tracking-tight">{shell.title}</h1>
      </header>
      <div className="app-shell__body space-y-6 p-6">{children}</div>
    </section>
  );
}
