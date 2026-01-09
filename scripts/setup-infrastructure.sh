#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$ROOT_DIR/docker-compose.dev.yml}"
REDPANDA_CONTAINER="${REDPANDA_CONTAINER:-ai-platform-redpanda}"
DYNAMODB_CONTAINER="${DYNAMODB_CONTAINER:-ai-platform-dynamodb}"

KAFKA_BROKERS="${KAFKA_BROKERS:-localhost:9092}"
KAFKA_TOPIC="${KAFKA_TOPIC:-ai-platform-messages}"
KAFKA_COMMANDS_TOPIC="${KAFKA_COMMANDS_TOPIC:-ai-platform-commands}"
KAFKA_OUTBOX_TOPIC="${KAFKA_OUTBOX_TOPIC:-ai-platform-outbox}"
KAFKA_DEAD_LETTER_TOPIC="${KAFKA_DEAD_LETTER_TOPIC:-ai-platform-dead-letter}"
KAFKA_PARTITIONS="${KAFKA_PARTITIONS:-1}"
KAFKA_REPLICATION="${KAFKA_REPLICATION:-1}"

DYNAMODB_ENDPOINT="${DYNAMODB_ENDPOINT:-http://localhost:8000}"
DYNAMODB_REGION="${AWS_REGION:-us-east-1}"
DYNAMODB_DOMAIN_TABLE="${DYNAMODB_DOMAIN_TABLE:-ai-platform-domain-events}"
DYNAMODB_OUTBOX_TABLE="${DYNAMODB_OUTBOX_TABLE:-ai-platform-outbox}"
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-local}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-local}"
AWS_CLI_CONNECT_TIMEOUT="${AWS_CLI_CONNECT_TIMEOUT:-5}"
AWS_CLI_READ_TIMEOUT="${AWS_CLI_READ_TIMEOUT:-10}"

timeout_cmd() {
  if command -v timeout >/dev/null 2>&1; then
    echo "timeout"
    return 0
  fi

  if command -v gtimeout >/dev/null 2>&1; then
    echo "gtimeout"
    return 0
  fi

  echo ""
}

run_with_timeout() {
  local duration="$1"
  shift
  if [[ -n "${TIMEOUT_CMD:-}" ]]; then
    "$TIMEOUT_CMD" "$duration" "$@"
    return $?
  fi

  "$@" &
  local cmd_pid=$!
  (
    sleep "$duration"
    if kill -0 "$cmd_pid" >/dev/null 2>&1; then
      kill -TERM "$cmd_pid" >/dev/null 2>&1 || true
    fi
  ) >/dev/null 2>&1 &
  local watcher_pid=$!

  wait "$cmd_pid"
  local status=$?
  kill "$watcher_pid" >/dev/null 2>&1 || true
  wait "$watcher_pid" >/dev/null 2>&1 || true
  return "$status"
}

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
TIMEOUT_CMD="$(timeout_cmd)"

$COMPOSE -f "$COMPOSE_FILE" up -d redpanda
$COMPOSE -f "$COMPOSE_FILE" up -d dynamodb

for _ in {1..20}; do
  if run_with_timeout 5 docker exec "$REDPANDA_CONTAINER" rpk cluster info --brokers "$KAFKA_BROKERS" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! run_with_timeout 5 docker exec "$REDPANDA_CONTAINER" rpk topic describe "$KAFKA_TOPIC" \
  --brokers "$KAFKA_BROKERS" >/dev/null 2>&1; then
  run_with_timeout 5 docker exec "$REDPANDA_CONTAINER" rpk topic create "$KAFKA_TOPIC" \
    --brokers "$KAFKA_BROKERS" \
    --partitions "$KAFKA_PARTITIONS" \
    --replicas "$KAFKA_REPLICATION"
fi

if ! run_with_timeout 5 docker exec "$REDPANDA_CONTAINER" rpk topic describe "$KAFKA_OUTBOX_TOPIC" \
  --brokers "$KAFKA_BROKERS" >/dev/null 2>&1; then
  run_with_timeout 5 docker exec "$REDPANDA_CONTAINER" rpk topic create "$KAFKA_OUTBOX_TOPIC" \
    --brokers "$KAFKA_BROKERS" \
    --partitions "$KAFKA_PARTITIONS" \
    --replicas "$KAFKA_REPLICATION"
fi

if ! run_with_timeout 5 docker exec "$REDPANDA_CONTAINER" rpk topic describe "$KAFKA_COMMANDS_TOPIC" \
  --brokers "$KAFKA_BROKERS" >/dev/null 2>&1; then
  run_with_timeout 5 docker exec "$REDPANDA_CONTAINER" rpk topic create "$KAFKA_COMMANDS_TOPIC" \
    --brokers "$KAFKA_BROKERS" \
    --partitions "$KAFKA_PARTITIONS" \
    --replicas "$KAFKA_REPLICATION"
fi

if ! run_with_timeout 5 docker exec "$REDPANDA_CONTAINER" rpk topic describe "$KAFKA_DEAD_LETTER_TOPIC" \
  --brokers "$KAFKA_BROKERS" >/dev/null 2>&1; then
  run_with_timeout 5 docker exec "$REDPANDA_CONTAINER" rpk topic create "$KAFKA_DEAD_LETTER_TOPIC" \
    --brokers "$KAFKA_BROKERS" \
    --partitions "$KAFKA_PARTITIONS" \
    --replicas "$KAFKA_REPLICATION"
fi

if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI not found. Install awscli to create DynamoDB tables automatically." >&2
  exit 1
fi

export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY

for _ in {1..30}; do
  if aws dynamodb list-tables \
    --endpoint-url "$DYNAMODB_ENDPOINT" \
    --region "$DYNAMODB_REGION" \
    --cli-connect-timeout "$AWS_CLI_CONNECT_TIMEOUT" \
    --cli-read-timeout "$AWS_CLI_READ_TIMEOUT" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! aws dynamodb list-tables \
  --endpoint-url "$DYNAMODB_ENDPOINT" \
  --region "$DYNAMODB_REGION" \
  --cli-connect-timeout "$AWS_CLI_CONNECT_TIMEOUT" \
  --cli-read-timeout "$AWS_CLI_READ_TIMEOUT" >/dev/null 2>&1; then
  echo "DynamoDB is not reachable at $DYNAMODB_ENDPOINT." >&2
  exit 1
fi

if ! aws dynamodb describe-table \
  --endpoint-url "$DYNAMODB_ENDPOINT" \
  --region "$DYNAMODB_REGION" \
  --cli-connect-timeout "$AWS_CLI_CONNECT_TIMEOUT" \
  --cli-read-timeout "$AWS_CLI_READ_TIMEOUT" \
  --table-name "$DYNAMODB_DOMAIN_TABLE" >/dev/null 2>&1; then
  aws dynamodb create-table \
    --endpoint-url "$DYNAMODB_ENDPOINT" \
    --region "$DYNAMODB_REGION" \
    --cli-connect-timeout "$AWS_CLI_CONNECT_TIMEOUT" \
    --cli-read-timeout "$AWS_CLI_READ_TIMEOUT" \
    --table-name "$DYNAMODB_DOMAIN_TABLE" \
    --attribute-definitions AttributeName=eventId,AttributeType=S \
    --key-schema AttributeName=eventId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST >/dev/null
fi

if ! aws dynamodb describe-table \
  --endpoint-url "$DYNAMODB_ENDPOINT" \
  --region "$DYNAMODB_REGION" \
  --cli-connect-timeout "$AWS_CLI_CONNECT_TIMEOUT" \
  --cli-read-timeout "$AWS_CLI_READ_TIMEOUT" \
  --table-name "$DYNAMODB_OUTBOX_TABLE" >/dev/null 2>&1; then
  aws dynamodb create-table \
    --endpoint-url "$DYNAMODB_ENDPOINT" \
    --region "$DYNAMODB_REGION" \
    --cli-connect-timeout "$AWS_CLI_CONNECT_TIMEOUT" \
    --cli-read-timeout "$AWS_CLI_READ_TIMEOUT" \
    --table-name "$DYNAMODB_OUTBOX_TABLE" \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST >/dev/null
fi

echo "Redpanda ready. Topics '$KAFKA_TOPIC', '$KAFKA_COMMANDS_TOPIC', '$KAFKA_OUTBOX_TOPIC', '$KAFKA_DEAD_LETTER_TOPIC' are available on $KAFKA_BROKERS."
echo "DynamoDB ready. Tables '$DYNAMODB_DOMAIN_TABLE' and '$DYNAMODB_OUTBOX_TABLE' are available at $DYNAMODB_ENDPOINT."
