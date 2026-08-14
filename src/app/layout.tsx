import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { SiteNav } from '@/components/SiteNav';
import { SiteFooter } from '@/components/SiteFooter';
import { MotionProvider } from '@/components/MotionProvider';
import { ToastProvider } from '@/components/ui/Toast';
// Applies the saved theme before first paint. Shared with next.config.ts, which
// whitelists it in the CSP by hash — see src/lib/themeScript.ts.
import { THEME_SCRIPT } from '@/lib/themeScript';

// IBM Plex is the capstone's type system (matches the course overview design):
// Plex Sans for prose/UI, Plex Mono for eyebrows, labels, IPs and terminals.
// Exposed as CSS variables so the Tailwind `@theme` in globals.css can bind
// `--font-sans` / `--font-mono` to them.
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
});

// The public origin. Needed for absolute OG/canonical URLs — without a
// metadataBase Next emits relative image URLs that most social scrapers ignore.
// Set NEXT_PUBLIC_SITE_URL in hosting; localhost is only the dev fallback.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// Root metadata. Pages that are `'use client'` can't export their own, so the
// public routes get server `layout.tsx` wrappers that override the title via the
// template below; everything else inherits this.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Capstone Quarry — prove your security skills by building, not cramming',
    template: '%s · Capstone Quarry',
  },
  description:
    'Hands-on cybersecurity capstones you build in your own home lab. Verify each step against real command output, hash your evidence, and export a portfolio that shows what you actually did.',
  applicationName: 'Capstone Quarry',
  openGraph: {
    type: 'website',
    siteName: 'Capstone Quarry',
    title: 'Capstone Quarry — prove your security skills by building',
    description:
      'Build the lab, verify each step against real output, keep an evidence ledger you can show an employer.',
    url: SITE_URL,
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${plexSans.variable} ${plexMono.variable} bg-surface`}>
        <MotionProvider>
          <ToastProvider>
            <SiteNav />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
            <SiteFooter />
          </ToastProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
