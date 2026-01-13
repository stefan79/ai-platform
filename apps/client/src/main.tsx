import React from 'react';
import ReactDOM from 'react-dom/client';
import '@ai-platform/design-tokens/styles.css';
import './index.css';
import App from './App';
import { logger } from './logger';
import { AppRuntimeProvider, UserProfileProvider, defaultRuntimeConfig } from './runtime';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-react';
import { LoggedOutPage } from './components/logged-out-page';

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const rootElement = document.getElementById('root');

if (!rootElement) {
  logger.error('Root element missing');
  throw new Error('Root element missing');
}

if (!clerkPublishableKey) {
  logger.error('Missing VITE_CLERK_PUBLISHABLE_KEY');
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <SignedOut>
        <LoggedOutPage />
      </SignedOut>
      <SignedIn>
        <UserProfileProvider>
          <AppRuntimeProvider config={defaultRuntimeConfig}>
            <App />
          </AppRuntimeProvider>
        </UserProfileProvider>
      </SignedIn>
    </ClerkProvider>
  </React.StrictMode>,
);
