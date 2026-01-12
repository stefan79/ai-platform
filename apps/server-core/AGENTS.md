# AGENTS.md — server-core

## Purpose

Owns server-side event handling, command routing, and the canonical event schema definitions.

## Ownership

- Maintainers: <team>
- Critical paths: event strategies, schema registration, command reducers

## Constraints

- Runtime: node
- Frameworks: NestJS
- Testing: Jest

## Bootstrap

- Events are validated against registered schemas before strategy handling.

## Patterns

- Conventions:
  - Each strategy file exports `eventDefinitions` with `{ type, schema }`.
  - Schemas are registered in `register()` via `eventDefinitions`.
- Domain events:
  - Domain event schemas are fixed and should be kept explicit in server-core.
  - Domain event outbox effects (domain-change topic) are written in the same DynamoDB transaction.
  - Domain events are intentionally separate from command and external event schemas.
- File layout: `apps/server-core/src/event/strategies/*.strategy.ts`
- Commands:
  - Generate client-safe schemas: `pnpx nx run protocol-generated:generate --output-style=stream`
  - Scaffold strategy: `pnpx nx g event-strategy --name user-message --eventType user.message`
