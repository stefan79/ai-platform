import { Injectable, Logger } from '@nestjs/common';
import { match } from 'ts-pattern';
import { Effect } from 'effect';
import { DynamoPersistenceService } from './persistence/dynamo.persistence';
import { KafkaProducerService } from './kafka.producer';
import type { ReductionResult } from './reducers/reducer-chain.service';
import type { OutboxRecord } from './domain/outbox';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    private readonly persistence: DynamoPersistenceService,
    private readonly producer: KafkaProducerService,
  ) {}

  persistAndDispatch(result: ReductionResult) {
    return Effect.tryPromise({
      try: async () => {
        this.logger.log(
          `Persisting ${result.domainEvents.length} domain events and ${result.outboxRecords.length} outbox records`,
        );
        await this.persistence.transactDomainAndOutbox(result.domainEvents, result.outboxRecords);
        this.logger.log('Persisted domain events and outbox records');
        await this.dispatchEffects(result.outboxRecords);
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
        .exhaustive();
    }
  }
}
