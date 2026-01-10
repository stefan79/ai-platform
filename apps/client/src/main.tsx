import React from 'react';
import ReactDOM from 'react-dom/client';
import '@ai-platform/design-tokens/styles.css';
import './index.css';
import App from './App';
import { logger } from './logger';
import { AppRuntimeProvider, UserProfileProvider, defaultRuntimeConfig } from './runtime';

const rootElement = document.getElementById('root');

if (!rootElement) {
  logger.error('Root element missing');
  throw new Error('Root element missing');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <UserProfileProvider>
      <AppRuntimeProvider config={defaultRuntimeConfig}>
        <App />
      </AppRuntimeProvider>
    </UserProfileProvider>
  </React.StrictMode>,
);
