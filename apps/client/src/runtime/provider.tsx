import type { ReactNode } from 'react';
import { createContext, useEffect, useMemo, useRef } from 'react';
import { createAppStore } from './store';
import type { AppStore } from './store';
import { createAppRuntime } from './runtime';
import type { AppRuntime, AppRuntimeConfig } from './runtime';
import { useUserProfile } from './user-profile';
import { createThreadBus, ThreadBusProvider } from './thread-bus';

export type AppRuntimeProviderProps = {
  children: ReactNode;
  config?: Partial<AppRuntimeConfig>;
};

export type RuntimeControls = {
  sendCommand: AppRuntime['sendCommand'];
};

export const AppStoreContext = createContext<AppStore | null>(null);
export const AppRuntimeContext = createContext<RuntimeControls | null>(null);

export const defaultRuntimeConfig: AppRuntimeConfig = {
  restBaseUrl: import.meta.env.VITE_REST_BASE_URL ?? 'http://localhost:3000',
  snapshotPath: import.meta.env.VITE_SNAPSHOT_PATH ?? '/api/v1/server',
  wsBaseUrl: import.meta.env.VITE_WS_BASE_URL ?? 'http://localhost:3001',
  userId: import.meta.env.VITE_USER_ID ?? 'user-1',
};

export function AppRuntimeProvider({ children, config }: AppRuntimeProviderProps) {
  const storeRef = useRef(createAppStore());
  const runtimeRef = useRef<AppRuntime | null>(null);
  const threadBusRef = useRef(createThreadBus());
  const profile = useUserProfile();

  const resolvedConfig = useMemo(
    () => ({
      restBaseUrl: config?.restBaseUrl ?? defaultRuntimeConfig.restBaseUrl,
      snapshotPath: config?.snapshotPath ?? defaultRuntimeConfig.snapshotPath,
      wsBaseUrl: config?.wsBaseUrl ?? defaultRuntimeConfig.wsBaseUrl,
      userId: profile.userId ?? config?.userId ?? defaultRuntimeConfig.userId,
    }),
    [
      config?.restBaseUrl,
      config?.snapshotPath,
      config?.wsBaseUrl,
      config?.userId,
      profile.userId,
    ],
  );

  useEffect(() => {
    runtimeRef.current?.stop();
    const runtime = createAppRuntime({
      store: storeRef.current,
      config: resolvedConfig,
      threadBus: threadBusRef.current,
    });
    runtimeRef.current = runtime;
    const unsubscribeThreadBus = threadBusRef.current.subscribe((event) => {
      storeRef.current.dispatch({ type: 'thread.event', event });
    });
    void runtime.start();
    return () => {
      runtime.stop();
      runtimeRef.current = null;
      unsubscribeThreadBus();
    };
  }, [
    resolvedConfig.restBaseUrl,
    resolvedConfig.snapshotPath,
    resolvedConfig.wsBaseUrl,
    resolvedConfig.userId,
  ]);

  const runtimeControls = useMemo<RuntimeControls>(
    () => ({
      sendCommand: (type, body) => runtimeRef.current?.sendCommand(type, body) ?? false,
    }),
    [],
  );

  return (
    <AppStoreContext.Provider value={storeRef.current}>
      <ThreadBusProvider value={threadBusRef.current}>
        <AppRuntimeContext.Provider value={runtimeControls}>
          {children}
        </AppRuntimeContext.Provider>
      </ThreadBusProvider>
    </AppStoreContext.Provider>
  );
}
