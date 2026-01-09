import { Inject, Injectable } from '@nestjs/common';
import type { EventKafkaEnvelope } from '@ai-platform/protocol-core';
import { ServerContext } from './server-context';
import { UserMessageStrategy } from '../event/strategies/user-message.strategy';
import type { EventHandler } from '../event/strategies/event-handler';
import { CommandKafkaProducer } from '../command/command-kafka.producer';
import { EventKafkaProducer } from '../event/event-kafka.producer';
import { SaveUserMessageCommandHandler } from '../command/handlers/save-user-message.command';
import { ReplyWithAssistantMessageCommandHandler } from '../command/handlers/reply-with-assistant-message.command';
import { AssistantResponseService } from '../command/assistant-response.service';
import { CommandSchemaRegistry } from './registries/command-schema.registry';
import { EventSchemaRegistry } from './registries/event-schema.registry';

@Injectable()
export class ServerContextRepository {
  @Inject(UserMessageStrategy)
  private readonly userMessageStrategy!: UserMessageStrategy;
  @Inject(CommandKafkaProducer)
  private readonly commandProducer!: CommandKafkaProducer;
  @Inject(AssistantResponseService)
  private readonly assistantResponse!: AssistantResponseService;
  @Inject(EventKafkaProducer)
  private readonly eventProducer!: EventKafkaProducer;
  @Inject(SaveUserMessageCommandHandler)
  private readonly saveUserMessageCommand!: SaveUserMessageCommandHandler;
  @Inject(ReplyWithAssistantMessageCommandHandler)
  private readonly replyWithAssistantMessageCommand!: ReplyWithAssistantMessageCommandHandler;

  load(): ServerContext {
    const eventHandlers: EventHandler<EventKafkaEnvelope>[] = [];
    const commandSchemaRegistry = new CommandSchemaRegistry();
    const eventSchemaRegistry = new EventSchemaRegistry();
    const context = new ServerContext(
      eventHandlers,
      this.commandProducer,
      this.assistantResponse,
      this.eventProducer,
      commandSchemaRegistry,
      eventSchemaRegistry,
      [],
      [],
      [],
    );

    const handlers: EventHandler<EventKafkaEnvelope>[] = [this.userMessageStrategy];
    for (const handler of handlers) {
      handler.register(context);
    }

    const commandHandlers = [
      this.saveUserMessageCommand,
      this.replyWithAssistantMessageCommand,
    ];
    for (const handler of commandHandlers) {
      handler.register(context);
    }

    return context;
  }
}
