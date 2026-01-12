import { createContextState, readWorkspaceVersion } from '@ai-platform/context-core';
import { buildServer } from './server';
import { createLogger } from './logger';

export async function startServer() {
  const version = readWorkspaceVersion();
  const contextState = createContextState({ version });
  const server = buildServer(contextState);
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  try {
    await server.listen({ port, host });
    return server;
  } catch (error) {
    server.log.error(error);
    throw error;
  }
}

function registerShutdownSignals(server: Awaited<ReturnType<typeof startServer>>) {
  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    server.log.info({ signal }, 'server-rest shutting down...');
    try {
      await server.close();
      server.log.info('server-rest shutdown complete.');
    } catch (error) {
      server.log.error(error, 'server-rest shutdown failed.');
      process.exitCode = 1;
    } finally {
      process.exit();
    }
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

if (require.main === module) {
  startServer()
    .then((server) => {
      registerShutdownSignals(server);
    })
    .catch((error) => {
      const logger = createLogger();
      logger.error(error);
      process.exit(1);
    });
}
