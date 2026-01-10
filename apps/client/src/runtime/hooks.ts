import { useContext, useSyncExternalStore } from 'react';
import type { AppState, ConnectionState } from './types';
import type { AppStore } from './store';
import { AppRuntimeContext, AppStoreContext } from './provider';

const useAppStore = (): AppStore => {
  const store = useContext(AppStoreContext);
  if (!store) {
    throw new Error('AppRuntimeProvider is missing');
  }
  return store;
};

export const useAppSelector = <Selected,>(selector: (state: AppState) => Selected): Selected => {
  const store = useAppStore();
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
};

export const useAppShellState = () => useAppSelector((state) => state.ui.appShell);

export const useConnectionState = (): ConnectionState =>
  useAppSelector((state) => state.connection);

export const useSendCommand = () => {
  const runtime = useContext(AppRuntimeContext);
  if (!runtime) {
    throw new Error('AppRuntimeProvider is missing');
  }
  return runtime.sendCommand;
};
