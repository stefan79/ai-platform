# AGENTS.md — AI Platform Monorepo

## Goal
Build a dynamic chat platform with:
- Turn-based WebSocket protocol for conversations.
- REST endpoints for threads, thread items, and uploads.
- A minimal React shell that can load/replace UI components at runtime via SystemJS + import maps.
- A server runtime with pluggable WS handlers and a handler stack (takeover/yield).
- Privileged authoring tools that can generate/validate/build/load plugins.
- Local, Git-managed plugin workspace with hot reload on save.

## Non-goals (initially)
- Multi-tenant SaaS.
- Running arbitrary untrusted plugins without sandboxing.
- Full native import map dynamism (use SystemJS import maps).

## Repo layout (target)
- `apps/server`: Bun/Elysia server, WS + REST, plugin runtime.
- `apps/client`: React shell, SystemJS loader, state + slots.
- `packages/protocol`: shared WS/REST schemas and TS types.
- `packages/ui-core`: reusable UI components and theming.
- `apps/server/plugins-workspace`: git-managed plugin sources.
- `apps/server/plugins-dist`: built plugin artifacts served to clients.

## WebSocket protocol
Envelope:
- `v`: number
- `id`: string
- `ts`: number
- `threadId?`, `turnId?`: string
- `type`: string
- `payload`: unknown (schema-validated)

Core message types (initial):
- Client → Server: `client.hello`, `thread.open`, `turn.submit`, `command.invoke`
- Server → Client: `server.hello`, `thread.snapshot`, `thread.patch`, `turn.start`, `turn.delta`, `turn.end`,
  `ui.state.patch`, `ui.commands.set`, `ui.plugin.install`, `ui.plugin.update`, `ui.plugin.disable`

## Handler runtime
Each WS connection has a handler stack:
- Router dispatches to top-of-stack handler.
- Handlers can `takeover` (push) or `yield` (pop).

Handler interface:
- `id`
- `match(msg)`
- `onEnter(ctx)`
- `onMessage(ctx, msg)`
- `onExit(ctx)`
- `dispose()`

Context provides:
- `send(msg)`
- `resources` (threads/files/uploads)
- `openai` provider
- `tools` (privileged only)
- `pushHandler(id)`, `popHandler()`

## Plugin model
Each plugin folder includes:
- `plugin.json` manifest
- server entry (registers hooks/handlers/tools)
- client entry (registers slot overrides/renderers/commands)

Lifecycle:
- `register()` returns disposer
- disposer must remove registrations/cleanup

## Authoring tools (privileged)
Tools must:
1) write to `plugins-workspace/`
2) validate: `tsc --noEmit`, tests, build server + client
3) enable/reload only on success
4) return structured error payloads on failure

## Build requirements
- Client plugins: `System.register` output served at `/plugins/<id>/<versionHash>/client.system.js`
- Server plugins: ESM for Bun at `/plugins/<id>/<versionHash>/server.mjs`

## Hot reload loop
- Server watches `plugins-workspace/`
- Debounced rebuild (200–500ms)
- On success: reload server plugin, send `ui.plugin.update`
- Clients: dispose, `System.delete`, re-import, re-register

## Acceptance tests (minimum)
1) Create thread, send text, receive streamed assistant output.
2) Server can lock/unlock composer via `ui.state.patch`.
3) Install a plugin that replaces `slot.composer` at runtime.
4) Update plugin code on disk → rebuild → client updates without refresh.
5) Disable plugin → UI returns to defaults cleanly.

## Implementation order
1) Protocol + WS echo handler
2) Thread store + REST
3) Default OpenAI handler + streaming events
4) UI state patching + commands
5) Slot system + renderer registry
6) Plugin manager server + client
7) Authoring tools + build/test pipeline
8) Hardening: auth, rollback, sandboxing

## Repo conventions
- Use Nx commands via `pnpx nx`.
- Use `pnpm`/`pnpx` (no `npm`/`npx`).
- Keep TypeScript as the default language.
- Prefer Nx generators for new apps/libs.
- Add module-specific `AGENTS.md` files under `apps/<name>/` or `packages/<name>/`.

## Module AGENTS.md boilerplate
Add a local `AGENTS.md` to extend/override guidance within a module:

```
# AGENTS.md — <module-name>

## Purpose
<short description>

## Ownership
- Maintainers: <names/team>
- Critical paths: <list>

## Constraints
- Runtime: <bun/node/browser>
- Frameworks: <list>
- Testing: <list>

## Patterns
- Conventions: <list>
- File layout: <list>
- Commands: <pnpx nx ...>
```
