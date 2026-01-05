# AGENTS.md — AI Platform Monorepo

## Goal

Build a dynamic chat platform with:

- Turn-based conversations over WebSocket and REST.
- A minimal React shell with runtime‑loaded UI components via SystemJS + import maps.
- A server runtime that supports pluggable handlers and plugins.
- Privileged authoring tools for generating, validating, building, and loading plugins.
- A local, Git‑managed plugin workspace with hot reload.

## Non-goals (initially)

- Multi-tenant SaaS.
- Running arbitrary untrusted plugins without sandboxing.
- Full native import map dynamism (use SystemJS import maps).

## Repo layout (target)

- `apps/server-ws`: WS server + plugin runtime.
- `apps/server-rest`: REST server.
- `apps/client`: React shell, SystemJS loader, state + slots.
- `packages/protocol`: shared WS/REST schemas and TS types.
- `packages/ui-core`: reusable UI components and theming.
- `apps/server-ws/plugins-workspace`: git-managed plugin sources.
- `apps/server-ws/plugins-dist`: built plugin artifacts served to clients.

## Repo conventions

- Use Nx commands via `pnpx nx`.
- When running Nx commands, add `--output-style=stream` so logs are visible.
- Use `pnpm`/`pnpx` (no `npm`/`npx`).
- Keep TypeScript as the default language.
- Prefer Nx generators for new apps/libs.
- Add module-specific `AGENTS.md` files under `apps/<name>/` or `packages/<name>/`.
- Use Context7 for templates and documentation lookups.
- Use the GitHub MCP server for repo management tasks.
- Use the NX MCP server as listed below for development tasks.
- Ensure code compiles, tests pass, and `README.md` is current before marking tasks complete.

## Detailed specs

- See `subagents.md` for detailed protocol/runtime/plugin/test requirements and implementation notes.

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

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
