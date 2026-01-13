import { SignIn } from '@clerk/clerk-react';
import { logoSvg } from '@ai-platform/design-tokens';

export function LoggedOutPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.15),_transparent_55%),linear-gradient(135deg,_rgba(16,20,43,0.95),_rgba(11,16,33,0.95))] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-8 px-6 py-12">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: logoSvg }}
          />
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">AI Platform</p>
            <h1 className="text-3xl font-semibold text-foreground">Welcome back</h1>
          </div>
        </div>
        <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/80 p-6 shadow-xl">
          <SignIn />
        </div>
      </div>
    </main>
  );
}
