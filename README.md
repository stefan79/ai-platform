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

Optional development servers:

```sh
pnpx nx run server-rest:serve --output-style=stream
pnpx nx run server-ws:serve --output-style=stream
```

Start local infrastructure dependencies (Redpanda + DynamoDB Local):

```sh
pnpx nx run infra:up --output-style=stream
```

Set up infrastructure (creates Kafka topics for the WS server):

```sh
bash scripts/setup-infrastructure.sh
```

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
