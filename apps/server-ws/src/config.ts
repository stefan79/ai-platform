export const kafkaConfig = {
  brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092')
    .split(',')
    .map((broker) => broker.trim())
    .filter((broker) => broker.length > 0),
  clientId: process.env.KAFKA_CLIENT_ID ?? 'ai-platform-server-ws',
  eventsTopic: process.env.KAFKA_EVENTS_TOPIC ?? 'ai-platform-events',
  outboxTopic: process.env.KAFKA_OUTBOX_TOPIC ?? 'ai-platform-outbox',
  groupId: process.env.KAFKA_GROUP_ID ?? 'ai-platform-server-ws',
  outboxGroupId: process.env.KAFKA_OUTBOX_GROUP_ID ?? 'ai-platform-server-ws-outbox',
};
