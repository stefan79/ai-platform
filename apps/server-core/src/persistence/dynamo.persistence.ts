import { Injectable } from '@nestjs/common';
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
  }

  async deleteOutboxRecord(record: OutboxRecord): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: dynamoConfig.outboxTable,
        Key: {
          id: record.id,
        },
      }),
    );
  }
}
