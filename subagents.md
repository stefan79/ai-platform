# subagents.md — Detailed Specs (AI Platform)

This file holds the implementation-level guidance that was moved out of the top-level `AGENTS.md`.
Groupings below map to suggested subdirectories where these specs may live long-term.

## docs/protocol
### WebSocket protocol
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

## apps/server/runtime
### Handler runtime
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

## docs/plugins
### Plugin model
Each plugin folder includes:
- `plugin.json` manifest
- server entry (registers hooks/handlers/tools)
- client entry (registers slot overrides/renderers/commands)

Lifecycle:
- `register()` returns disposer
- disposer must remove registrations/cleanup

### Build requirements
- Client plugins: `System.register` output served at `/plugins/<id>/<versionHash>/client.system.js`
- Server plugins: ESM for Bun at `/plugins/<id>/<versionHash>/server.mjs`

### Hot reload loop
- Server watches `plugins-workspace/`
- Debounced rebuild (200–500ms)
- On success: reload server plugin, send `ui.plugin.update`
- Clients: dispose, `System.delete`, re-import, re-register

## apps/server/tools
### Authoring tools (privileged)
Tools must:
1) write to `plugins-workspace/`
2) validate: `tsc --noEmit`, tests, build server + client
3) enable/reload only on success
4) return structured error payloads on failure

## docs/testing
### Acceptance tests (minimum)
1) Create thread, send text, receive streamed assistant output.
2) Server can lock/unlock composer via `ui.state.patch`.
3) Install a plugin that replaces `slot.composer` at runtime.
4) Update plugin code on disk → rebuild → client updates without refresh.
5) Disable plugin → UI returns to defaults cleanly.

## docs/roadmap
### Implementation order
1) Protocol + WS echo handler
2) Thread store + REST
3) Default OpenAI handler + streaming events
4) UI state patching + commands
5) Slot system + renderer registry
6) Plugin manager server + client
7) Authoring tools + build/test pipeline
8) Hardening: auth, rollback, sandboxing
