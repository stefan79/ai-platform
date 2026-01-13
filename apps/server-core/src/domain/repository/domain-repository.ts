import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoConfig } from '../../config';
import type { DomainEventEnvelope, DomainAggregateType } from '../events';
import { parseDomainEventEnvelope } from '../events';
import type { OutboxRecord } from '../outbox';
import { outboxRecordSchema } from '../outbox';
import type { ServerSnapshot, UserSnapshot, ThreadSnapshot } from '../snapshots';
import { snapshotSchema } from '../snapshots';

export interface DomainRepository {
  loadServer(serverId: string): Promise<ServerSnapshot | null>;
  loadUser(userId: string): Promise<UserSnapshot | null>;
  loadThread(threadId: string): Promise<ThreadSnapshot | null>;

  listThreads(args: {
    userId: string;
    limit?: number;
    cursor?: string;
    direction?: 'forward' | 'backward';
    sort?: string;
    order?: 'asc' | 'desc';
    filter?: Record<string, string>;
  }): Promise<{ items: ThreadSnapshot[]; cursor?: string }>;

  listThreadMessages(args: {
    userId: string;
    threadId: string;
    limit?: number;
    cursor?: string;
    direction?: 'forward' | 'backward';
    sort?: string;
    order?: 'asc' | 'desc';
    filter?: Record<string, string>;
  }): Promise<{
    items: DomainEventEnvelope<'thread.message-added'>['payload']['message'][];
    cursor?: string;
  }>;

  transact(
    events: DomainEventEnvelope[],
    snapshots: Array<ServerSnapshot | UserSnapshot | ThreadSnapshot>,
    outbox: OutboxRecord[],
  ): Promise<void>;
}

type AggregateKey = {
  aggregateType: DomainAggregateType;
  aggregateId: string;
};

const aggregatePk = ({ aggregateType, aggregateId }: AggregateKey) =>
  `AGG#${aggregateType}#${aggregateId}`;
const eventSk = (occurredAt: number, eventId: string) => `EVENT#${occurredAt}#${eventId}`;
const snapshotSk = (version: number) => `SNAPSHOT#${String(version).padStart(10, '0')}`;

const encodeCursor = (key?: Record<string, unknown>) =>
  key ? Buffer.from(JSON.stringify(key)).toString('base64') : undefined;
const decodeCursor = (cursor?: string) =>
  cursor
    ? (JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')) as Record<string, unknown>)
    : undefined;

//TODO: Why is the snapshot type inference needed here? Can this be simplified?
const inferAggregate = (snapshot: ServerSnapshot | UserSnapshot | ThreadSnapshot): AggregateKey => {
  if ('serverId' in snapshot) {
    return { aggregateType: 'server', aggregateId: snapshot.serverId };
  }
  if ('userId' in snapshot && 'threads' in snapshot) {
    return { aggregateType: 'user', aggregateId: snapshot.userId };
  }
  return { aggregateType: 'thread', aggregateId: snapshot.threadId };
};

@Injectable()
export class DynamoDomainRepository implements DomainRepository {
  private readonly client = DynamoDBDocumentClient.from(
    new DynamoDBClient({
      region: dynamoConfig.region,
      endpoint: dynamoConfig.endpoint,
    }),
    {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    },
  );

  async loadServer(serverId: string): Promise<ServerSnapshot | null> {
    return this.loadSnapshot<ServerSnapshot>({ aggregateType: 'server', aggregateId: serverId });
  }

  async loadUser(userId: string): Promise<UserSnapshot | null> {
    return this.loadSnapshot<UserSnapshot>({ aggregateType: 'user', aggregateId: userId });
  }

  async loadThread(threadId: string): Promise<ThreadSnapshot | null> {
    return this.loadSnapshot<ThreadSnapshot>({ aggregateType: 'thread', aggregateId: threadId });
  }

  async listThreads(args: {
    userId: string;
    limit?: number;
    cursor?: string;
    direction?: 'forward' | 'backward';
    sort?: string;
    order?: 'asc' | 'desc';
    filter?: Record<string, string>;
  }): Promise<{ items: ThreadSnapshot[]; cursor?: string }> {
    const limit = args.limit ?? 50;
    const result = await this.client.send(
      new ScanCommand({
        TableName: dynamoConfig.snapshotTable,
        Limit: limit,
        ExclusiveStartKey: decodeCursor(args.cursor),
        FilterExpression: '#type = :threadType AND #userId = :userId',
        ExpressionAttributeNames: {
          '#type': 'aggregateType',
          '#userId': 'userId',
        },
        ExpressionAttributeValues: {
          ':threadType': 'thread',
          ':userId': args.userId,
        },
      }),
    );

    const items = (result.Items ?? []) as ThreadSnapshot[];
    const sortField = args.sort ?? 'updatedAt';
    const order = args.order ?? 'desc';
    const sorted = [...items].sort((left, right) => {
      const leftValue = (left as Record<string, unknown>)[sortField];
      const rightValue = (right as Record<string, unknown>)[sortField];
      const leftNumber = typeof leftValue === 'number' ? leftValue : 0;
      const rightNumber = typeof rightValue === 'number' ? rightValue : 0;
      return order === 'asc' ? leftNumber - rightNumber : rightNumber - leftNumber;
    });

    return {
      items: sorted,
      cursor: encodeCursor(result.LastEvaluatedKey as Record<string, unknown> | undefined),
    };
  }

  async listThreadMessages(args: {
    userId: string;
    threadId: string;
    limit?: number;
    cursor?: string;
    direction?: 'forward' | 'backward';
    sort?: string;
    order?: 'asc' | 'desc';
    filter?: Record<string, string>;
  }): Promise<{
    items: DomainEventEnvelope<'thread.message-added'>['payload']['message'][];
    cursor?: string;
  }> {
    const limit = args.limit ?? 50;
    const scanForward = args.direction ? args.direction === 'forward' : args.order !== 'desc';
    const result = await this.client.send(
      new QueryCommand({
        TableName: dynamoConfig.domainTable,
        KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :skPrefix)',
        ExpressionAttributeNames: {
          '#pk': 'pk',
          '#sk': 'sk',
          '#type': 'type',
        },
        ExpressionAttributeValues: {
          ':pk': aggregatePk({ aggregateType: 'thread', aggregateId: args.threadId }),
          ':skPrefix': 'EVENT#',
          ':messageType': 'thread.message-added',
        },
        FilterExpression: '#type = :messageType',
        Limit: limit,
        ScanIndexForward: scanForward,
        ExclusiveStartKey: decodeCursor(args.cursor),
      }),
    );

    const items = (result.Items ?? []) as DomainEventEnvelope<'thread.message-added'>[];
    return {
      items: items.map((item) => item.payload.message),
      cursor: encodeCursor(result.LastEvaluatedKey as Record<string, unknown> | undefined),
    };
  }

  async transact(
    events: DomainEventEnvelope[],
    snapshots: Array<ServerSnapshot | UserSnapshot | ThreadSnapshot>,
    outbox: OutboxRecord[],
  ): Promise<void> {
    if (events.length === 0 && snapshots.length === 0 && outbox.length === 0) {
      return;
    }

    const validatedEvents = events.map((event) => parseDomainEventEnvelope(event));
    const validatedSnapshots = snapshots.map((snapshot) => snapshotSchema.parse(snapshot));
    const validatedOutbox = outbox.map((record) => outboxRecordSchema.parse(record));

    const TransactItems = [
      ...validatedEvents.map((event) => ({
        Put: {
          TableName: dynamoConfig.domainTable,
          Item: {
            pk: aggregatePk({ aggregateType: event.aggregateType, aggregateId: event.aggregateId }),
            sk: eventSk(event.occurredAt, event.eventId),
            aggregateType: event.aggregateType,
            aggregateId: event.aggregateId,
            type: event.type,
            payload: event.payload,
            occurredAt: event.occurredAt,
            version: event.version,
            eventId: event.eventId,
          },
          ConditionExpression: 'attribute_not_exists(pk)',
        },
      })),
      ...validatedSnapshots.map((snapshot) => {
        const aggregate = inferAggregate(snapshot);
        return {
          Put: {
            TableName: dynamoConfig.snapshotTable,
            Item: {
              pk: aggregatePk(aggregate),
              sk: snapshotSk(snapshot.version),
              aggregateType: aggregate.aggregateType,
              aggregateId: aggregate.aggregateId,
              ...snapshot,
            },
          },
        };
      }),
      ...validatedOutbox.map((record) => ({
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

  private async loadSnapshot<T>(aggregate: AggregateKey): Promise<T | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: dynamoConfig.snapshotTable,
        KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :skPrefix)',
        ExpressionAttributeNames: {
          '#pk': 'pk',
          '#sk': 'sk',
        },
        ExpressionAttributeValues: {
          ':pk': aggregatePk(aggregate),
          ':skPrefix': 'SNAPSHOT#',
        },
        ScanIndexForward: false,
        Limit: 1,
      }),
    );

    const item = result.Items?.[0] as Record<string, unknown> | undefined;
    if (!item) {
      return null;
    }
    const snapshot = { ...item };
    delete snapshot.pk;
    delete snapshot.sk;
    delete snapshot.aggregateType;
    delete snapshot.aggregateId;
    return snapshot as T;
  }
}
