export const kafkaConfig = {
  brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092')
    .split(',')
    .map((broker) => broker.trim())
    .filter((broker) => broker.length > 0),
  clientId: process.env.KAFKA_CLIENT_ID ?? 'ai-platform-server-core',
  eventsTopic: process.env.KAFKA_EVENTS_TOPIC ?? 'ai-platform-events',
  commandsTopic: process.env.KAFKA_COMMANDS_TOPIC ?? 'ai-platform-commands',
  outboxTopic: process.env.KAFKA_OUTBOX_TOPIC ?? 'ai-platform-outbox',
  domainChangesTopic:
    process.env.KAFKA_DOMAIN_CHANGES_TOPIC ?? 'ai-platform-domain-changes',
  deadLetterTopic: process.env.KAFKA_DEAD_LETTER_TOPIC ?? 'ai-platform-dead-letter',
  groupId: process.env.KAFKA_GROUP_ID ?? 'ai-platform-server-core',
  commandsGroupId: process.env.KAFKA_COMMANDS_GROUP_ID ?? 'ai-platform-server-core-commands',
};

export const dynamoConfig = {
  region: process.env.AWS_REGION ?? 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT,
  domainTable: process.env.DYNAMODB_DOMAIN_TABLE ?? 'ai-platform-domain-events',
  snapshotTable: process.env.DYNAMODB_SNAPSHOT_TABLE ?? 'ai-platform-snapshots',
  outboxTable: process.env.DYNAMODB_OUTBOX_TABLE ?? 'ai-platform-outbox',
};
