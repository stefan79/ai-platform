import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoConfig } from '../config';
import type { OutboxRecord } from '../domain/outbox';
import type { DomainEventRecord } from '../domain/events';

@Injectable()
export class DynamoPersistenceService {
  private readonly logger = new Logger(DynamoPersistenceService.name);
  private readonly client = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: dynamoConfig.region,
      endpoint: dynamoConfig.endpoint,
    }),
  );

  async transactDomainAndOutbox(
    domainEvents: DomainEventRecord[],
    outboxRecords: OutboxRecord[],
  ): Promise<void> {
    if (domainEvents.length === 0 && outboxRecords.length === 0) {
      return;
    }

    this.logger.log(
      `Transacting ${domainEvents.length} domain events into ${dynamoConfig.domainTable} and ${outboxRecords.length} outbox records into ${dynamoConfig.outboxTable}`,
    );
    const TransactItems = [
      ...domainEvents.map((event) => ({
        Put: {
          TableName: dynamoConfig.domainTable,
          Item: event,
        },
      })),
      ...outboxRecords.map((record) => ({
        Put: {
          TableName: dynamoConfig.outboxTable,
          Item: record,
        },
      })),
    ];

    await this.client.send(
      new TransactWriteCommand({
        TransactItems,
      }),
    );
    this.logger.log('DynamoDB transaction complete');
  }

  async deleteOutboxRecord(record: OutboxRecord): Promise<void> {
    this.logger.log(`Deleting outbox record ${record.id} from ${dynamoConfig.outboxTable}`);
    await this.client.send(
      new DeleteCommand({
        TableName: dynamoConfig.outboxTable,
        Key: {
          id: record.id,
        },
      }),
    );
    this.logger.log(`Deleted outbox record ${record.id}`);
  }
}
