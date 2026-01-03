import pino from 'pino';

export const resolveLogLevel = (nodeEnv: string | undefined): pino.LevelWithSilent =>
  nodeEnv === 'production' ? 'warn' : 'info';

export const createLogger = () =>
  pino({
    level: resolveLogLevel(process.env.NODE_ENV)
  });
