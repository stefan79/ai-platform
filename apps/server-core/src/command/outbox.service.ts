import { Injectable, Logger } from '@nestjs/common';
import { match } from 'ts-pattern';
import { Effect } from 'effect';
import { DynamoPersistenceService } from '../persistence/dynamo.persistence';
import { EventKafkaProducer } from '../event/event-kafka.producer';
import type { ReductionResult } from '../domain/reducers/reducer-chain.service';
import type { OutboxRecord } from '../domain/outbox';
import { createOutboxRecord } from '../domain/outbox';
import { createDomainChangeEnvelope } from '../domain/domain-change';
import { kafkaConfig } from '../config';
import { DynamoDomainRepository } from '../domain/repository/domain-repository';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    private readonly repository: DynamoDomainRepository,
    private readonly persistence: DynamoPersistenceService,
    private readonly producer: EventKafkaProducer,
  ) {}

  persistAndDispatch(result: ReductionResult) {
    return Effect.tryPromise({
      try: async () => {
        const domainChangeRecords = result.domainEvents.map((event) =>
          createOutboxRecord(
            'kafka.domain-change',
            createDomainChangeEnvelope(event),
          ),
        );
        const outboxRecords = [...result.outboxRecords, ...domainChangeRecords];
        this.logger.log(
          `Persisting ${result.domainEvents.length} domain events, ${result.snapshots.length} snapshots, and ${outboxRecords.length} outbox records`,
        );
        await this.repository.transact(result.domainEvents, result.snapshots, outboxRecords);
        this.logger.log('Persisted domain events, snapshots, and outbox records');
        await this.dispatchEffects(outboxRecords);
      },
      catch: (error) => error as Error,
    });
  }

  private async dispatchEffects(records: OutboxRecord[]) {
    this.logger.log(`Dispatching ${records.length} outbox records`);
    for (const record of records) {
      await match(record)
        .with({ type: 'kafka.echo' }, async (kafkaRecord) => {
          this.logger.log(`Publishing outbox ${kafkaRecord.id} to Kafka`);
          await this.producer.publish(kafkaRecord.payload, kafkaRecord.payload.sessionId);
          this.logger.log(`Published outbox ${kafkaRecord.id} to Kafka`);
          await this.persistence.deleteOutboxRecord(kafkaRecord);
          this.logger.log(`Deleted outbox ${kafkaRecord.id}`);
        })
        .with({ type: 'kafka.domain-change' }, async (domainRecord) => {
          this.logger.log(`Publishing domain change ${domainRecord.id} to Kafka`);
          await this.producer.publishDomainChange(
            domainRecord.payload,
            kafkaConfig.domainChangesTopic,
            domainRecord.payload.aggregateId,
          );
          this.logger.log(`Published domain change ${domainRecord.id}`);
          await this.persistence.deleteOutboxRecord(domainRecord);
          this.logger.log(`Deleted domain change ${domainRecord.id}`);
        })
        .exhaustive();
    }
  }
}
