import type { ServerContext } from '../../domain/server-context';

export interface CommandHandler {
  register(context: ServerContext): void;
}
