import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { kafkaConfig } from './config';
import { KafkaProducerService } from './kafka.producer';
import { KafkaController } from './kafka.controller';
import { MessageProcessorService } from './message-processor.service';
import { ReducerChainService } from './reducers/reducer-chain.service';
import { ServerReducer } from './reducers/server.reducer';
import { UserReducer } from './reducers/user.reducer';
import { ThreadReducer } from './reducers/thread.reducer';
import { DynamoPersistenceService } from './persistence/dynamo.persistence';
import { OutboxService } from './outbox.service';
import { ServerContext } from './server-context';

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

  //TODO: The three reducers (server, user, thread) should each have their own list of reducers to allow for better separation of concerns
  //TODO: The reducers should get their handlers from the server context

  providers: [
    ServerContext,
    KafkaProducerService,
    MessageProcessorService,
    ReducerChainService,
    ServerReducer,
    UserReducer,
    ThreadReducer,
    DynamoPersistenceService,
    OutboxService,
  ],
})
export class AppModule {}
