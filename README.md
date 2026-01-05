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

## Test

Run all tests across the workspace:

```sh
pnpx nx run-many -t test --output-style=stream
```

Run tests for the client only:

```sh
pnpx nx run client:test --output-style=stream
```
