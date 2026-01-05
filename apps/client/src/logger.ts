import pino from 'pino';

const level = import.meta.env.MODE === 'production' ? 'warn' : 'info';

export const logger = pino({
  browser: {
    asObject: true,
  },
  level,
});
