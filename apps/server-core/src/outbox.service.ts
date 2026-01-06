import { Injectable } from '@nestjs/common';
import { match } from 'ts-pattern';
import { Effect } from 'effect';
import { DynamoPersistenceService } from './persistence/dynamo.persistence';
import { KafkaProducerService } from './kafka.producer';
import type { ReductionResult } from './reducers/reducer-chain.service';
import type { OutboxRecord } from './domain/outbox';

@Injectable()
export class OutboxService {
  constructor(
    private readonly persistence: DynamoPersistenceService,
    private readonly producer: KafkaProducerService,
  ) {}

  persistAndDispatch(result: ReductionResult) {
    return Effect.tryPromise({
      try: async () => {
        await this.persistence.transactDomainAndOutbox(result.domainEvents, result.outboxRecords);
        await this.dispatchEffects(result.outboxRecords);
      },
      catch: (error) => error as Error,
    });
  }

  private async dispatchEffects(records: OutboxRecord[]) {
    for (const record of records) {
      await match(record)
        .with({ type: 'kafka.echo' }, async (kafkaRecord) => {
          await this.producer.publish(kafkaRecord.payload);
          await this.persistence.deleteOutboxRecord(kafkaRecord);
        })
        .exhaustive();
    }
  }
}
