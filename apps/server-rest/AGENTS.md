# AGENTS.md — server-rest

## Purpose

Provide the REST API for the platform, including bootstrap snapshots and health endpoints.

## Ownership

- Maintainers: <team>
- Critical paths: bootstrap endpoints, health checks, REST schema contracts

## Constraints

- Runtime: node
- Frameworks: NestJS, Fastify
- Testing: Jest

## Patterns

- Conventions: REST endpoints should return deterministic snapshots for client bootstrap.
- Naming: Prefer hierarchical, resource-oriented URLs with user scoping.
- Query: Use consistent paging/filter/sort parameters across resources.
- File layout: `apps/server-rest/src`
- Commands: `pnpm nx run server-rest:serve --output-style=stream`

## REST URL Naming Pattern

### Scope and Resources

- Base: `/api/v1`
- Server-wide properties (dictionary):
  - `GET /api/v1/server/details`
- User-scoped properties (dictionary):
  - `GET /api/v1/users/{userId}/details`
- Threads (user-scoped, list + detail):
  - `GET /api/v1/users/{userId}/threads`
  - `GET /api/v1/users/{userId}/threads/{threadId}/details`
- Thread messages (paged, user-scoped, thread-scoped):
  - `GET /api/v1/users/{userId}/threads/{threadId}/messages`

### Paging, Sorting, Filtering (reusable)

- Paging:
  - `limit` (default 50, max 200)
  - `cursor` (opaque, for pagination)
  - `direction` (`forward` | `backward`, default `forward`)
- Sorting:
  - `sort` (field name, e.g. `createdAt`)
  - `order` (`asc` | `desc`)
- Filtering:
  - `filter[field]=value` (simple equality)
  - `filter[field][op]=value` (advanced ops: `eq`, `ne`, `lt`, `lte`, `gt`, `gte`, `contains`)

### Examples

- Threads, newest first:
  - `/api/v1/users/{userId}/threads?sort=updatedAt&order=desc&limit=50`
- Messages, paginate backward from cursor:
  - `/api/v1/users/{userId}/threads/{threadId}/messages?direction=backward&cursor=...&limit=50`
- Threads filtered by status:
  - `/api/v1/users/{userId}/threads?filter[status]=open`
