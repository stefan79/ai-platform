# AI Platform

## Project goals

- Build a dynamic chat platform with turn-based conversations over WebSocket and REST.
- Deliver a minimal React shell that can load runtime UI modules via SystemJS and import maps.
- Provide a pluggable server runtime with authoring tools for plugins.
- Support a local, Git-managed plugin workspace with hot reload.

## Install

```sh
pnpm install
```

## Run

Start the client shell (mocked UI) on `http://localhost:4300`:

```sh
pnpx nx run client:serve --output-style=stream
```

## Authentication (Clerk)

The client and servers use Clerk-issued JWTs as the source of truth. You will need a Clerk
application (dev instance or production) to run the stack end-to-end.

### Client environment variables

Set these in your shell or a `.env` file before running the Vite client:

- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk publishable key.
- `VITE_REST_BASE_URL` — REST base URL (default `http://localhost:3000`).
- `VITE_WS_BASE_URL` — WS base URL (default `http://localhost:3001`).
- `VITE_SNAPSHOT_PATH` — REST snapshot path (default `/api/v1/server`).

### Server environment variables

Set these for both `server-rest` and `server-ws`:

- `CLERK_JWT_ISSUER` — Clerk issuer URL (recommended, e.g. `https://your-app.clerk.accounts.dev`).
- `CLERK_JWKS_URL` — Optional override for the JWKS URL (if not using `CLERK_JWT_ISSUER`).
- `CORS_ORIGINS` — Optional comma-separated list of allowed origins for REST (defaults to
  `http://localhost:4300,https://ai-platform.local`).

When using Clerk in production mode, make sure the publishable key and issuer correspond to the
production instance. For local development, you can use the Clerk dev instance credentials.

## Local HTTPS with Traefik + mkcert

Clerk requires HTTPS for production-mode applications and is recommended for local testing. This
repo includes a Traefik reverse proxy setup for local TLS termination.

### 1) Create locally trusted certificates

Install `mkcert` and trust its local CA:

```sh
mkcert -install
```

Generate a cert/key pair for the local domains:

```sh
mkdir -p certs
mkcert -cert-file certs/ai-platform.local.pem -key-file certs/ai-platform.local-key.pem \
  ai-platform.local '*.ai-platform.local'
```

### 2) Add local hostnames

Add the following entries to `/etc/hosts`:

```
127.0.0.1 ai-platform.local api.ai-platform.local ws.ai-platform.local
```

### 3) Start Traefik

Traefik is wired up in `docker-compose.dev.yml`:

```sh
docker compose -f docker-compose.dev.yml up -d traefik
```

Traefik listens on `http://localhost:8080` and `https://localhost:8443` in dev.

### 4) Update client base URLs

Point the client at the HTTPS endpoints:

```sh
export VITE_REST_BASE_URL=https://api.ai-platform.local:8443
export VITE_WS_BASE_URL=https://ws.ai-platform.local:8443
```

The client will be reachable at `https://ai-platform.local:8443` once it is running.
Remember to add these HTTPS origins to your Clerk instance (allowed origins + redirect URLs).

## Protocol generation

Event payload schemas are registered in server-core strategies and code-generated into a shared,
browser-safe library for the client.

- Source of truth: `apps/server-core/src/event/strategies/*.strategy.ts` exports
  `eventDefinitions` with `{ type, schema }`.
- Generated output: `libs/protocol-generated/src/events.ts`

Regenerate the shared schemas/types:

```sh
pnpx nx run protocol-generated:generate --output-style=stream
```

Create a new event strategy (scaffolded with `eventDefinitions`):

```sh
pnpx nx g event-strategy --name user-message --eventType user.message
```

## Domain events and snapshots (spec)

The v0.2.0 domain events + CQRS snapshot design is captured in:

- `spec/v0.2.0-domain-events-cqrs.md`

Notes:

- Domain event schemas for server/user/thread are fixed in server-core (explicit Zod schemas).
- Outbox effects include a domain-change topic published from the same DynamoDB transaction.

Optional development servers:

```sh
pnpx nx run server-rest:serve --output-style=stream
pnpx nx run server-ws:serve --output-style=stream
```

Start local infrastructure dependencies (Redpanda + DynamoDB Local):

```sh
pnpx nx run infra:up --output-style=stream
```

Set up infrastructure (creates Kafka topics and DynamoDB tables, seeds a thread snapshot):

```sh
bash scripts/setup-infrastructure.sh
```

Optional overrides for infrastructure setup:

- `KAFKA_DOMAIN_CHANGES_TOPIC` (default `ai-platform-domain-changes`)
- `DYNAMODB_SNAPSHOTS_TABLE` (default `ai-platform-snapshots`)
- `THREAD_ID` / `USER_ID` (seeded thread snapshot IDs)

Send a test user message over WebSocket:

```sh
pnpm exec tsx scripts/send-ws-user-message.ts
```

Stop local infrastructure:

```sh
pnpx nx run infra:down --output-style=stream
```

## Shutdown behavior

The REST, WS, and core servers trap `SIGINT`/`SIGTERM` to close HTTP/WS resources and stop
Kafka consumers before disconnecting. This helps ensure offsets are committed and avoids
consumer group rebalances during normal shutdown.

## Kafka static group membership

Set stable `groupInstanceId` values to allow Kafka consumers to resume cleanly across restarts:

- `KAFKA_GROUP_INSTANCE_ID` (server-core event consumer + server-ws client group)
- `KAFKA_COMMANDS_GROUP_INSTANCE_ID` (server-core command consumer)
- `KAFKA_OUTBOX_GROUP_INSTANCE_ID` (server-ws outbox consumer)

## Test

Run all tests across the workspace:

```sh
pnpx nx run-many -t test --output-style=stream
```

Run tests for the client only:

```sh
pnpx nx run client:test --output-style=stream
```
