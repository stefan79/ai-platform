# AGENTS.md — client

## Purpose
Provide the React shell for the chat UI, including layout, static models, and component scaffolding.

## Ownership
- Maintainers: <team>
- Critical paths: AppShell, Sidebar, MainPane, Timeline, Composer

## Constraints
- Runtime: browser
- Frameworks: React, Vite, Tailwind
- Testing: Vitest, Testing Library

## Documentation Request Template
Use this block at the top of a component file to capture UI intent and integration details.

```
/**
 * Component: <Name>
 *
 * Purpose:
 * - <what this component represents and why it exists>
 *
 * Visuals:
 * - Layout: <grid/flex structure, key regions>
 * - Density: <compact/comfortable>
 * - Color/Type: <token usage: e.g., text-muted, bg-surface>
 * - States: <empty, loading, error, active, disabled>
 *
 * Responsive + Scrolling:
 * - Breakpoints: <mobile/tablet/desktop behavior>
 * - Scrolling: <which container scrolls, sticky headers, overflow rules>
 * - Height: <min/max/fit rules>
 *
 * Model Setup:
 * - Inputs: <props and required types>
 * - Defaults: <default state to render>
 * - Derived: <computed values or selectors>
 *
 * Events + Commands:
 * - Events In: <event types this component consumes>
 * - Commands Out: <commands emitted on user actions>
 * - Reducers: <reducers handling events/commands>
 * - Side Effects: <network/outbox/logging, if any>
 *
 * Accessibility:
 * - Keyboard: <focus/shortcuts>
 * - ARIA: <role/labels>
 *
 * Notes:
 * - <pitfalls, TODOs, UI quirks>
 */
```

## Commands
- Dev: `pnpm nx run client:serve --output-style=stream`
- Test: `pnpm nx run client:test --output-style=stream`
- Build: `pnpm nx run client:build --output-style=stream`
