import type { EventKafkaEnvelope } from '@ai-platform/protocol-core';
import type { ServerContext } from '../../domain/server-context';

export interface EventHandler<TEnvelope = EventKafkaEnvelope> {
  register(context: ServerContext): void;
  match(envelope: TEnvelope): boolean;
  handle(envelope: TEnvelope): Promise<void>;
}
