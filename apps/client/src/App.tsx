import { useEffect, useState } from 'react';
import type { HealthResponse } from '@ai-platform/protocol-rest';
import { fetchHealth } from './api/health';
import { logger } from './logger';

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-none last:pb-0">
      <dt className="text-sm uppercase tracking-wide text-muted">{label}</dt>
      <dd className="font-semibold text-accent">{value}</dd>
    </div>
  );
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then((result) => setHealth(result))
      .catch((err) => {
        logger.error({ err }, 'Unable to load health');
        setError('Could not reach the API');
      });
  }, []);

  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted">AI Platform</p>
            <h1 className="text-2xl font-semibold">System Health</h1>
          </div>
          <span className="inline-flex h-3 w-3 rounded-full bg-accent shadow-[0_0_0_6px_rgba(124,58,237,0.15)]" />
        </header>

        <section className="rounded-lg border border-border bg-surface p-6 shadow-lg">
          {!health && !error && (
            <p className="text-muted" role="status">
              Loading status...
            </p>
          )}

          {error && (
            <p className="text-red-400" role="alert">
              {error}
            </p>
          )}

          {health && (
            <dl className="space-y-3">
              <StatusLine label="Status" value={health.status} />
              <StatusLine label="Version" value={health.version} />
            </dl>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
