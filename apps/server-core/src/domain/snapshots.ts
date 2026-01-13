import { z } from 'zod';
import type { DomainEventEnvelope } from './events';

export type ServerSnapshot = {
  serverId: string;
  users: string[];
  settings: Record<string, string>;
  updatedAt: number;
  version: number;
};

export const serverSnapshotSchema = z
  .object({
    serverId: z.string(),
    users: z.array(z.string()),
    settings: z.record(z.string()),
    updatedAt: z.number().int().nonnegative(),
    version: z.number().int().nonnegative(),
  })
  .strip();

export type UserSnapshot = {
  userId: string;
  threads: string[];
  profile: {
    displayName?: string;
    avatarUrl?: string;
  };
  updatedAt: number;
  version: number;
};

export const userSnapshotSchema = z
  .object({
    userId: z.string(),
    threads: z.array(z.string()),
    profile: z
      .object({
        displayName: z.string().optional(),
        avatarUrl: z.string().url().optional(),
      })
      .strict(),
    updatedAt: z.number().int().nonnegative(),
    version: z.number().int().nonnegative(),
  })
  .strip();

export type ThreadSnapshot = {
  threadId: string;
  userId: string;
  title?: string;
  lastMessage?: {
    messageId: string;
    authorId: string;
    timestamp: number;
    body: string;
  };
  updatedAt: number;
  version: number;
};

export const threadSnapshotSchema = z
  .object({
    threadId: z.string(),
    userId: z.string(),
    title: z.string().optional(),
    lastMessage: z
      .object({
        messageId: z.string(),
        authorId: z.string(),
        timestamp: z.number().int().nonnegative(),
        body: z.string(),
      })
      .strict()
      .optional(),
    updatedAt: z.number().int().nonnegative(),
    version: z.number().int().nonnegative(),
  })
  .strip();

export const snapshotSchema = z.union([
  serverSnapshotSchema,
  userSnapshotSchema,
  threadSnapshotSchema,
]);

export const applyThreadEvent = (
  snapshot: ThreadSnapshot,
  event:
    | DomainEventEnvelope<'thread.message-added'>
    | DomainEventEnvelope<'thread.title-updated'>
    | DomainEventEnvelope<'thread.metadata-updated'>,
): ThreadSnapshot => {
  switch (event.type) {
    case 'thread.message-added': {
      const message = event.payload.message.payload as {
        messageId: string;
        timestamp: number;
        body: string;
      };
      return {
        ...snapshot,
        lastMessage: {
          messageId: message.messageId,
          authorId: event.payload.authorId,
          timestamp: message.timestamp,
          body: message.body,
        },
        updatedAt: event.occurredAt,
        version: snapshot.version + 1,
      };
    }
    case 'thread.title-updated':
      return {
        ...snapshot,
        title: event.payload.title,
        updatedAt: event.occurredAt,
        version: snapshot.version + 1,
      };
    case 'thread.metadata-updated':
      return {
        ...snapshot,
        updatedAt: event.occurredAt,
        version: snapshot.version + 1,
      };
  }
};
