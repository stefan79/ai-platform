import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { kafkaConfig } from './config';
import { KafkaProducerService } from './kafka.producer';
import { KafkaController } from './kafka.controller';
import { CommandProcessorService } from './command-processor.service';
import { ReducerChainService } from './reducers/reducer-chain.service';
import { ServerReducer } from './reducers/server.reducer';
import { UserReducer } from './reducers/user.reducer';
import { ThreadReducer } from './reducers/thread.reducer';
import { DynamoPersistenceService } from './persistence/dynamo.persistence';
import { OutboxService } from './outbox.service';
import { ServerContext } from './server-context';
import { UserMessageStrategy } from './strategies/user-message.strategy';
import { KafkaCommandConsumerService } from './kafka-command-consumer.service';
import { AssistantResponseService } from './assistant-response.service';

@Module({
  imports: [
    CqrsModule,
    ClientsModule.register([
      {
        name: 'KAFKA_CLIENT',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: kafkaConfig.clientId,
            brokers: kafkaConfig.brokers,
          },
          consumer: {
            groupId: kafkaConfig.groupId,
          },
          producer: {
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
  ],
  controllers: [KafkaController],

    providers: [
    ServerContext,
    KafkaProducerService,
    KafkaCommandConsumerService,
    AssistantResponseService,
    CommandProcessorService,
    ReducerChainService,
    ServerReducer,
    UserReducer,
    ThreadReducer,
    DynamoPersistenceService,
    OutboxService,
    UserMessageStrategy,
  ],
})
export class AppModule {}
