import { match } from 'ts-pattern';
import type { DomainEventEnvelope } from './events';

export type ServerSnapshot = {
  serverId: string;
  users: string[];
  settings: Record<string, string>;
  updatedAt: number;
  version: number;
};

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

export const applyThreadEvent = (
  snapshot: ThreadSnapshot,
  event: DomainEventEnvelope<'thread.message-added' | 'thread.title-updated' | 'thread.metadata-updated'>,
): ThreadSnapshot =>
  match(event)
    .with({ type: 'thread.message-added' }, (evt) => ({
      ...snapshot,
      lastMessage: evt.payload,
      updatedAt: evt.occurredAt,
      version: snapshot.version + 1,
    }))
    .with({ type: 'thread.title-updated' }, (evt) => ({
      ...snapshot,
      title: evt.payload.title,
      updatedAt: evt.occurredAt,
      version: snapshot.version + 1,
    }))
    .with({ type: 'thread.metadata-updated' }, (evt) => ({
      ...snapshot,
      updatedAt: evt.occurredAt,
      version: snapshot.version + 1,
    }))
    .exhaustive();
