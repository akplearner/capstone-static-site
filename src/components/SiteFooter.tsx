import Link from 'next/link';

/**
 * Global footer. Its real job is to put the legal links within one click of every
 * page — a requirement once signups are open to the public, not decoration.
 *
 * A server component: it holds no state and no interactivity, so there's no
 * reason to ship it to the browser.
 */
export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-panel/60 print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
        <p>
          <span className="font-semibold text-ink">Capstone Quarry</span> — build it, prove it, keep it.
        </p>
        <nav className="flex flex-wrap items-center gap-4">
          <Link href="/explore" className="hover:text-ink hover:underline">Explore certs</Link>
          <Link href="/legal/privacy" className="hover:text-ink hover:underline">Privacy</Link>
          <Link href="/legal/terms" className="hover:text-ink hover:underline">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
