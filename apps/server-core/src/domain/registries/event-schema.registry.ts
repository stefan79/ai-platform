import { z } from 'zod';
import type { EventKafkaEnvelope } from '@ai-platform/protocol-core';

export type TypedEventKafkaEnvelope<TBody> = Omit<EventKafkaEnvelope, 'body' | 'type'> & {
  type: string;
  body: TBody;
};

export class EventSchemaRegistry {
  private readonly schemas = new Map<string, z.ZodTypeAny>();

  register<TBody>(type: string, schema: z.ZodType<TBody>): void {
    this.schemas.set(type, schema);
  }

  parse<TBody>(
    envelope: EventKafkaEnvelope,
    type: string = envelope.type,
  ): TypedEventKafkaEnvelope<TBody> {
    if (envelope.type !== type) {
      throw new Error(`Event type mismatch: expected ${type} but got ${envelope.type}`);
    }
    const schema = this.schemas.get(type);
    if (!schema) {
      throw new Error(`No event schema registered for type ${type}`);
    }
    const body = schema.parse(envelope.body);
    return { ...envelope, type, body };
  }

  parsePayload<TBody>(type: string, payload: unknown): TBody {
    const schema = this.schemas.get(type);
    if (!schema) {
      throw new Error(`No event schema registered for type ${type}`);
    }
    return schema.parse(payload) as TBody;
  }
}
