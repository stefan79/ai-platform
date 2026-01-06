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

## Test

Run all tests across the workspace:

```sh
pnpx nx run-many -t test --output-style=stream
```

Run tests for the client only:

```sh
pnpx nx run client:test --output-style=stream
```
