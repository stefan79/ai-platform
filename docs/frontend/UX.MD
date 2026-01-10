# UX Rules for Client UI

## Purpose

These rules guide UI/UX concepts for the client shell so the interface remains
consistent across mocked and future event-driven iterations.

## Core Principles

- Prioritize clarity over cleverness; the UI communicates system state explicitly.
- Keep the experience deterministic and predictable; avoid hidden state.
- Prefer event-driven models: state changes are expressed as events, not mutations.
- Treat messages as immutable timeline entries; edits are represented as new events.

## Layout Rules

- Preserve the split layout: sidebar (control panel) + main pane (thread view).
- Keep all primary panels visible in the initial render.
- Anchor the composer at the bottom of the main pane.
- Place system state at the top of the main pane so status is always visible.

## Component Hierarchy Alignment

- Follow the mocked hierarchy: AppShell → Sidebar/MainPane → panels.
- Sidebar contains thread list, actor panel, file panel, settings panel.
- Main pane contains system state bar, thread header, timeline, composer, drawers.
- Additional panels include message details, sound notifier, and overlay manager.

## Visual Language

- Use Tailwind tokens for spacing, color, and typography.
- Prefer shadcn/ui and Radix primitives for consistent accessibility and focus states.
- Message styling reflects actor role only (system/user/assistant).

## Token Conventions

- Use shadcn/ui token names in Tailwind (`bg-background`, `text-foreground`, `bg-card`, `border-border`).
- Map design tokens in `libs/design-tokens/src/styles.css` to shadcn variables (background, card, primary, muted).
- Prefer `text-muted-foreground` for secondary labels and metadata.

## Component Mapping

- Use shadcn/ui `Card` for panels (sidebar blocks, system state bar, timeline, composer).
- Use `Badge` for status chips and event tags.
- Use `Button` for thread actions and tool buttons (non-functional placeholders).
- Use Radix `Tabs` for drawer section navigation.

## Interaction Constraints

- Keep UI static; no real data loading or network activity.
- Render from explicit default state values for every component.
- Expose toggles and actions as non-functional placeholders.

## Default Data Expectations

- Thread list includes at least two sample threads.
- Actor list includes system, operator, and assistant roles.
- File list includes synced and draft examples.
- Settings expose theme, density, and sound.
- Thread header reflects an active thread with basic actions (pin, mute, archive).
- Timeline includes at least two messages with role-based styling.

## Documentation Expectations

- Add concise UX annotations in component files to clarify intent and behavior.
- Reference this document when introducing new UI elements or patterns.
