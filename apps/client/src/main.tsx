import React from 'react';
import ReactDOM from 'react-dom/client';
import '@ai-platform/design-tokens/styles.css';
import './index.css';
import App from './App';
import { logger } from './logger';

const rootElement = document.getElementById('root');

if (!rootElement) {
  logger.error('Root element missing');
  throw new Error('Root element missing');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
