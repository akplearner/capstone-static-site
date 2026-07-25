import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { SiteNav } from '@/components/SiteNav';
import { MotionProvider } from '@/components/MotionProvider';
import { ToastProvider } from '@/components/ui/Toast';

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

export const metadata: Metadata = {
  title: 'Capstone Lab Platform',
  description: 'Security+ Capstone - Week-by-Week Lab Platform',
};

// Applies the saved theme (or the OS preference) before first paint to avoid a
// flash of the wrong theme. See node_modules/next/dist/docs guide
// "preventing-flash-before-hydration".
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${plexSans.variable} ${plexMono.variable} bg-surface`}>
        <MotionProvider>
          <ToastProvider>
            <SiteNav />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          </ToastProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
