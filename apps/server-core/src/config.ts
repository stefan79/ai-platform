export const kafkaConfig = {
  brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092')
    .split(',')
    .map((broker) => broker.trim())
    .filter((broker) => broker.length > 0),
  clientId: process.env.KAFKA_CLIENT_ID ?? 'ai-platform-server-core',
  topic: process.env.KAFKA_TOPIC ?? 'ai-platform-messages',
  groupId: process.env.KAFKA_GROUP_ID ?? 'ai-platform-server-core',
};

export const dynamoConfig = {
  region: process.env.AWS_REGION ?? 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT,
  domainTable: process.env.DYNAMODB_DOMAIN_TABLE ?? 'ai-platform-domain-events',
  outboxTable: process.env.DYNAMODB_OUTBOX_TABLE ?? 'ai-platform-outbox',
};
