# Main Page (SPA)

## ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────────┐
│ AppShell                                                                 │
│ ┌───────────────┐   ┌──────────────────────────────────────────────────┐ │
│ │ Sidebar       │   │ Main Pane                                        │ │
│ │ ───────────── │   │ ┌──────────────────────────────────────────────┐ │ │
│ │ Toggle        │   │ │ System State Bar                             │ │ │
│ │ Thread List   │   │ ├──────────────────────────────────────────────┤ │ │
│ │ Actor Panel   │   │ │ Thread Header (Title + Actions)              │ │ │
│ │ File Panel    │   │ ├──────────────────────────────────────────────┤ │ │
│ │ Settings      │   │ │ Message Timeline                             │ │ │
│ │               │   │ │  - Message Bubble (role styling)             │ │ │
│ │               │   │ │  - Message Context Menu (placeholder)        │ │ │
│ └───────────────┘   │ ├──────────────────────────────────────────────┤ │ │
│                     │ │ Message Composer (Input + Toolbar)           │ │ │
│                     │ │ Command Palette (collapsed)                  │ │ │
│                     │ └──────────────────────────────────────────────┘ │ │
│                     │ Thread Overview Drawer (closed)                  │ │
│                     └──────────────────────────────────────────────────┘ │
│ Additional Panels: Message Details, Sound Notifier, Overlay Manager      │
└──────────────────────────────────────────────────────────────────────────┘
```

## Purpose

Provide a single-page chat workspace that exposes system status, thread context,
and a readable timeline with a grounded composition area. The layout establishes
clear separation between control panels (left) and conversation flow (right).

## Sections

- **App Shell**: Owns global layout, active panes, and high-level status.
- **Sidebar (Control Panel)**: Threads, actors, files, and settings in a compact
  navigation column.
- **System State Bar**: Always-visible system status and environment labels.
- **Thread Header**: Thread title plus core actions like pin, mute, archive.
- **Message Timeline**: Immutable message events with role-based styling.
- **Message Composer**: Draft input, toolbar actions, and optional command palette.
- **Thread Overview Drawer**: Collapsible overview for thread metadata.
- **Additional Panels**: Message details, sound notifier, and overlay manager.

## Success Criteria

- The main layout renders as a split view with sidebar + main pane.
- All primary panels are visible and aligned to their intended regions.
- The timeline shows at least two messages with role-based styling.
- The composer is anchored to the bottom of the main pane.
- System status is visible at all times.

## Component Mapping (shadcn/ui)

- App shell and panels: `Card`, `CardHeader`, `CardContent`.
- Status chips and events: `Badge`.
- Thread actions: `Button` (outline).
- Thread overview sections: Radix `Tabs`.
