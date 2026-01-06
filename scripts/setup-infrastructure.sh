#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.dev.yml}"
REDPANDA_CONTAINER="${REDPANDA_CONTAINER:-ai-platform-redpanda}"

KAFKA_BROKERS="${KAFKA_BROKERS:-localhost:9092}"
KAFKA_TOPIC="${KAFKA_TOPIC:-ai-platform-messages}"
KAFKA_PARTITIONS="${KAFKA_PARTITIONS:-1}"
KAFKA_REPLICATION="${KAFKA_REPLICATION:-1}"

compose_cmd() {
  if command -v docker-compose >/dev/null 2>&1; then
    echo "docker-compose"
    return 0
  fi

  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
    return 0
  fi

  echo "Docker Compose not found." >&2
  exit 1
}

COMPOSE="$(compose_cmd)"

$COMPOSE -f "$COMPOSE_FILE" up -d redpanda

for _ in {1..20}; do
  if docker exec "$REDPANDA_CONTAINER" rpk cluster info --brokers "$KAFKA_BROKERS" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! docker exec "$REDPANDA_CONTAINER" rpk topic describe "$KAFKA_TOPIC" \
  --brokers "$KAFKA_BROKERS" >/dev/null 2>&1; then
  docker exec "$REDPANDA_CONTAINER" rpk topic create "$KAFKA_TOPIC" \
    --brokers "$KAFKA_BROKERS" \
    --partitions "$KAFKA_PARTITIONS" \
    --replicas "$KAFKA_REPLICATION"
fi

echo "Redpanda ready. Topic '$KAFKA_TOPIC' is available on $KAFKA_BROKERS."
