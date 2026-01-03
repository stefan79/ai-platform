# Implementation Roadmap — Dynamic Chat Platform (Node.js + React + SystemJS)

**Goal:** deliver a turn-based WebSocket chat platform with server-controlled UI state, pluggable backend handlers, and runtime-loadable UI microfrontends, plus an “authoring” workflow that generates/validates/builds plugins before activation.

**Release policy:** Semantic Versioning (SemVer)
- **MAJOR**: breaking changes to WS protocol envelope, plugin interfaces, persistent data models, or client slot contracts.
- **MINOR**: new backward-compatible message types, tools, plugin contribution points, UI toggles/widgets.
- **PATCH**: bug fixes, performance improvements, security hardening, developer-experience improvements.

---

## v0.1.0 — Bootstrap: WS echo + minimal React shell

### Scope
- Node.js server starts, serves static assets + index.html.
- WebSocket endpoint `/ws` accepts connections.
- Minimal React chat shell connects, shows connection status.
- Basic turn submission (`turn.submit`) and server echo response.

### Proof of functioning (PoF)
- **PoF-01:** open app → WS connects → UI shows “connected”.
- **PoF-02:** send a message → server responds with `turn.start`, `turn.delta`, `turn.end` (even if echo).
- **PoF-03:** protocol validation: malformed message gets rejected with `error.validation`.

### Artifacts
- `packages/protocol` with Zod schemas for envelope + core message types.
- `apps/server` + `apps/client` scaffold.

---

## v0.2.0 — Thread storage + REST modeled after ChatKit concepts

### Scope
- REST endpoints for:
  - threads CRUD
  - thread items list/append
  - basic upload endpoint (local disk) + asset serving
- Client:
  - thread list view
  - thread history from REST
  - create/open thread
- Server:
  - persist thread items (SQLite for dev)

### PoF
- **PoF-04:** create thread → refresh page → thread still exists.
- **PoF-05:** append items via REST → appears in UI.
- **PoF-06:** upload file → server stores + client can fetch metadata/preview link.

### Versioning notes
- Adds data model + REST (non-breaking to v0.1.0 if new routes only). MINOR bump OK.

---

## v0.3.0 — Handler runtime v1: message-type router + takeover/yield stack

### Scope
- Server handler interface:
  - `match(msg)` + `onMessage(ctx,msg)`
  - lifecycle: `onEnter/onExit` optional
  - disposer: `dispose()`
- Handler stack per WS connection:
  - default router dispatch
  - `pushHandler()` takeover, `popHandler()` yield
- Basic built-in handlers:
  - `core.chat` (echo or deterministic bot)
  - `core.authoring` (stub, no codegen yet)

### PoF
- **PoF-07:** a handler can take over for a multi-step flow (e.g., “confirm?”) and then yield back.
- **PoF-08:** multiple message types routed to distinct handlers.
- **PoF-09:** handler emits UI patch events while active.

### Risk controls
- Hard limit on handler stack depth.
- Timeouts/guards to prevent permanent takeover.

---

## v0.4.0 — UI state control plane + commands

### Scope
- Server→client `ui.state.patch` supports:
  - locks (composer, threads, uploads)
  - visibility (thread list, uploads panel, model picker)
  - toggles (allow upload, model select, custom switches)
- Command system:
  - `ui.commands.set` defines buttons/menus (like ChatGPT “little buttons”)
  - client renders command bar and sends `command.invoke`

### PoF
- **PoF-10:** server locks composer → user cannot type/send.
- **PoF-11:** server hides uploads panel and disables upload toggle.
- **PoF-12:** command button appears → click triggers `command.invoke` → server responds.

---

## v0.5.0 — OpenAI provider integration: streamed assistant output

### Scope
- Server `core.chat` handler calls OpenAI (Responses API or Agents SDK).
- Streaming mapped to WS:
  - `turn.start` → `turn.delta` → `turn.end`
- Thread items persisted (user +assistant messages, tool traces optional).

### PoF
- **PoF-13:** assistant output streams incrementally into UI.
- **PoF-14:** thread history replays correctly after refresh.
- **PoF-15:** graceful handling of rate limit / network errors (turn ends with error widget).

### Versioning notes
- MINOR release if protocol additions are backward compatible.

---

## v0.6.0 — Slot system + renderer registry (data-driven customization)

### Scope
- Client shell defines stable slots:
  - `slot.threadList`, `slot.chatHistory`, `slot.composer`, `slot.rightPanel`, etc.
- Renderer registry:
  - `message.type → React renderer`
  - Default renderers for text, system, tool, widget.
- Server can influence rendering via message metadata (e.g., “expireAt”).

### PoF
- **PoF-16:** message of type `widget.card` renders via registered card renderer.
- **PoF-17:** server sends rule “hide after 30s” → client removes/condenses messages.
- **PoF-18:** server can switch renderer for a type without page reload (config update).

---

## v0.7.0 — Plugin MVP: server plugins + client microfrontends (SystemJS)

### Scope
- Plugin manifest + registry
- Server plugin loader:
  - versioned import (hash-based)
  - register/unregister handlers + tools
- Client plugin loader:
  - `ui.plugin.install/update/disable`
  - SystemJS + import-map updates
  - plugin `register()` returns disposer
- One sample plugin:
  - replaces composer with a micro-app editor OR adds a custom message renderer

### PoF
- **PoF-19:** install plugin at runtime → UI changes immediately (slot override).
- **PoF-20:** update plugin version → client reloads module and behavior changes.
- **PoF-21:** disable plugin → UI returns to defaults without refresh.

### Guardrails
- Only load plugins from server-approved manifest.
- CSP + integrity (optional in dev; required later).

---

## v0.8.0 — Authoring tools v1: generate config/specs, not code

### Scope
- “Tools” usable by authoring handler:
  - create command definitions (schema + UI)
  - create widget specs (JSON schema / Zod)
  - create message type specs and map to existing render primitives
- Approval gate:
  - authoring handler proposes change → requires explicit admin confirmation (for now)
- Audit log of registry changes

### PoF
- **PoF-22:** chat request → new command appears without redeploy (config-driven).
- **PoF-23:** new widget spec renders using existing generic renderer.
- **PoF-24:** registry updates are versioned and reversible.

---

## v0.9.0 — Authoring tools v2: generate code + validate/build/test + hot reload

### Scope
- Plugin workspace on server FS (git-managed):
  - `plugins-workspace/<pluginId>/...`
- Tool pipeline:
  1) generate/modify code
  2) validate (lint/typecheck)
  3) test (unit/integration)
  4) build (server ESM + client System.register bundle)
  5) publish artifact to `plugins-dist/<pluginId>/<hash>/...`
  6) load server plugin + notify clients
- File watcher:
  - on save → rebuild plugin → broadcast `ui.plugin.update`

### PoF
- **PoF-25:** tool generates plugin skeleton → build passes → plugin loads.
- **PoF-26:** developer edits plugin code → save triggers rebuild → client updates live.
- **PoF-27:** failing tests prevent plugin activation; error shown in chat with logs.

### Safety
- Disable arbitrary `eval`.
- Allowlist dependencies for plugins.
- Build in separate process (dev). Plan for container isolation (v1.0+).

---

## v1.0.0 — Production readiness baseline

### Scope
- AuthN/AuthZ:
  - admin-only authoring tools
  - per-thread access control
- Plugin governance:
  - signed manifests (at minimum: allowlist + hash pinning)
  - rollback to previous plugin versions
- Observability:
  - structured logs + correlation ids (threadId/turnId)
  - metrics for latency, errors, plugin load times
- Stability guarantees:
  - protocol versioning strategy (v field) with backward compatibility rules

### PoF
- **PoF-28:** role-based access prevents non-admin plugin installs.
- **PoF-29:** rollback plugin version restores previous UI/behavior within one turn.
- **PoF-30:** load test: N concurrent WS connections stable for X minutes (define target).

### Breaking changes
- Allowed. This is the first stable contract. Any incompatible changes after this require v2.0.0.

---

## v1.1.0 — Optional: isolation boundary for server plugins (recommended)

### Scope
- Run server plugins in:
  - worker threads OR
  - separate Bun process (recommended)
- RPC bridge to main server:
  - handler calls + tool calls
  - deterministic shutdown for “true unload”

### PoF
- **PoF-31:** crash a plugin process → main server remains healthy and recovers.
- **PoF-32:** unload plugin terminates its process → memory/resources reclaimed.

---

## v1.2.0 — Multi-client threads + collaboration

### Scope
- Multiple clients can open same thread and receive updates.
- Thread-level broadcast API in server runtime.
- Presence events (optional).

### PoF
- **PoF-33:** two browsers open same thread → both see streamed assistant output and UI patches.

---

## v1.3.0 — Security hardening for generated code

### Scope
- Containerized build sandbox (Docker/Firecracker depending on environment).
- Dependency allowlist enforcement.
- Static analysis (optional) + SAST on plugin workspace.
- Signed artifact enforcement.

### PoF
- **PoF-34:** plugin with forbidden dependency is rejected.
- **PoF-35:** tampered artifact fails signature/ hash check and won’t load.

---

## Definition of Done (for each release)
- All PoF checks pass.
- Changelog written.
- Protocol/schema changes documented.
- Upgrade notes included (if relevant).
- At least one automated test per new capability (server+client where applicable).

---

## Suggested versioning for protocol & plugins
- WS protocol: `v` in envelope starts at **1**; breaking changes bump protocol v + major server version.
- Plugins:
  - plugin manifest has its own SemVer `version`
  - server stores `versionHash` for deployed artifacts
  - allow side-by-side versions for rollback

---

## Appendix: Minimal CI gates (recommended even in dev)
- `bun install` / `pnpm install`
- `bun test`
- `tsc --noEmit`
- build client (Vite) to System.register bundle
- build server plugins to ESM
- run a smoke test:
  - start server
  - connect WS
  - send `turn.submit`
  - assert streamed response events
