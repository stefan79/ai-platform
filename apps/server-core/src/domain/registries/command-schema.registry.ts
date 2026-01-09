import { z } from 'zod';
import type { CommandKafkaEnvelope } from '@ai-platform/protocol-core';

export type TypedCommandKafkaEnvelope<TPayload> = Omit<CommandKafkaEnvelope, 'payload' | 'type'> & {
  type: string;
  payload: TPayload;
};

export class CommandSchemaRegistry {
  private readonly schemas = new Map<string, z.ZodTypeAny>();

  register<TPayload>(type: string, schema: z.ZodType<TPayload>): void {
    this.schemas.set(type, schema);
  }

  parse<TPayload>(
    envelope: CommandKafkaEnvelope,
    type: string = envelope.type,
  ): TypedCommandKafkaEnvelope<TPayload> {
    if (envelope.type !== type) {
      throw new Error(`Command type mismatch: expected ${type} but got ${envelope.type}`);
    }
    const schema = this.schemas.get(type);
    if (!schema) {
      throw new Error(`No command schema registered for type ${type}`);
    }
    const payload = schema.parse(envelope.payload);
    return { ...envelope, type, payload };
  }
}
