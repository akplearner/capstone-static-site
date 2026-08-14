import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

/**
 * Shared shell for the legal pages, so privacy and terms read as one document
 * set rather than two differently-formatted essays.
 *
 * Server components — static prose, no interactivity, no client bundle. The
 * `prose-ish` styling is done with explicit classes rather than a typography
 * plugin the project doesn't have.
 */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <article className="mx-auto max-w-3xl py-6">
      <header className="border-b border-line pb-5">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 font-mono text-xs text-muted">Last updated {updated}</p>
        <p className="mt-4 text-muted">{intro}</p>
      </header>

      <div className="space-y-8 py-8">{children}</div>

      <footer className="border-t border-line pt-5 text-sm text-muted">
        <p>
          See also{' '}
          <Link href="/legal/terms" className="text-accent hover:underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/legal/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
        </p>
      </footer>
    </article>
  );
}

export function LegalSection({
  title,
  tone,
  children,
}: {
  title: string;
  /** `warn` renders the section as a callout — used where the consequence is real. */
  tone?: 'warn';
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        tone === 'warn'
          ? 'rounded-[var(--radius-card)] border p-5'
          : ''
      }
      style={tone === 'warn' ? { borderColor: 'var(--color-danger)' } : undefined}
    >
      <h2
        className="flex items-center gap-2 text-lg font-bold"
        style={tone === 'warn' ? { color: 'var(--color-danger)' } : { color: 'var(--color-ink)' }}
      >
        {tone === 'warn' && <AlertTriangle className="h-5 w-5 shrink-0" />}
        {title}
      </h2>
      <div className="legal-body mt-2 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
    </section>
  );
}
