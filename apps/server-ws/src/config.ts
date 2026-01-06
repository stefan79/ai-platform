export const kafkaConfig = {
  brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092')
    .split(',')
    .map((broker) => broker.trim())
    .filter((broker) => broker.length > 0),
  clientId: process.env.KAFKA_CLIENT_ID ?? 'ai-platform-server-ws',
  topic: process.env.KAFKA_TOPIC ?? 'ai-platform-messages',
  groupId: process.env.KAFKA_GROUP_ID ?? 'ai-platform-server-ws',
};
