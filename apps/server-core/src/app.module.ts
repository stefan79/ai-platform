import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { kafkaConfig } from './config';
import { EventKafkaConsumer } from './event/event-kafka-consumer.controller';
import { EventKafkaProducer } from './event/event-kafka.producer';
import { CommandProcessorService } from './command/command-processor.service';
import { ReducerChainService } from './domain/reducers/reducer-chain.service';
import { ServerReducer } from './domain/reducers/server.reducer';
import { UserReducer } from './domain/reducers/user.reducer';
import { ThreadReducer } from './domain/reducers/thread.reducer';
import { DynamoPersistenceService } from './persistence/dynamo.persistence';
import { OutboxService } from './command/outbox.service';
import { ServerContextRepository } from './domain/server-context.repository';
import { UserMessageStrategy } from './event/strategies/user-message.strategy';
import { CommandKafkaConsumer } from './command/command-kafka-consumer.service';
import { AssistantResponseService } from './command/assistant-response.service';
import { CommandKafkaProducer } from './command/command-kafka.producer';
import { SaveUserMessageCommandHandler } from './command/handlers/save-user-message.command';
import { ReplyWithAssistantMessageCommandHandler } from './command/handlers/reply-with-assistant-message.command';

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
  controllers: [EventKafkaConsumer],
  providers: [
    ServerContextRepository,
    EventKafkaProducer,
    CommandKafkaProducer,
    CommandKafkaConsumer,
    AssistantResponseService,
    CommandProcessorService,
    SaveUserMessageCommandHandler,
    ReplyWithAssistantMessageCommandHandler,
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
