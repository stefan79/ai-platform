import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { kafkaConfig } from './config';
import { KafkaProducerService } from './kafka.service';
import { createEnvelopePartitioner } from './partitioner';
import { WsGateway } from './ws.gateway';
import { KafkaConsumerService } from './kafka-consumer.service';

@Module({
  imports: [
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
            createPartitioner: createEnvelopePartitioner,
          },
          producerOnlyMode: true,
        },
      },
    ]),
  ],
  providers: [KafkaProducerService, KafkaConsumerService, WsGateway],
})
export class AppModule {}
