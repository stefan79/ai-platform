import { createContext, useContext } from 'react';
import type { ThreadEvent } from './types';

export type ThreadBus = {
  publish: (event: ThreadEvent) => void;
  subscribe: (listener: (event: ThreadEvent) => void) => () => void;
};

export const createThreadBus = (): ThreadBus => {
  const listeners = new Set<(event: ThreadEvent) => void>();

  return {
    publish: (event) => {
      listeners.forEach((listener) => listener(event));
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

const ThreadBusContext = createContext<ThreadBus | null>(null);

export const ThreadBusProvider = ThreadBusContext.Provider;

export const useThreadBus = (): ThreadBus => {
  const bus = useContext(ThreadBusContext);
  if (!bus) {
    throw new Error('ThreadBusProvider is missing');
  }
  return bus;
};
