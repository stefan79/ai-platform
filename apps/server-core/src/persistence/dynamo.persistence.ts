import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DeleteCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { dynamoConfig } from '../config';
import type { OutboxRecord } from '../domain/outbox';

@Injectable()
export class DynamoPersistenceService {
  private readonly logger = new Logger(DynamoPersistenceService.name);
  private readonly client = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: dynamoConfig.region,
      endpoint: dynamoConfig.endpoint,
    }),
  );

  async deleteOutboxRecord(record: OutboxRecord): Promise<void> {
    this.logger.log(`Deleting outbox record ${record.id} from ${dynamoConfig.outboxTable}`);
    await this.client.send(
      new DeleteCommand({
        TableName: dynamoConfig.outboxTable,
        Key: {
          pk: record.pk,
          sk: record.sk,
        },
      }),
    );
    this.logger.log(`Deleted outbox record ${record.id}`);
  }
}
