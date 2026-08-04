import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import localFont from 'next/font/local';
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
// The arcade face for the game layer — week/difficulty badges, XP, headings.
// Vendored (see fonts/README.md) rather than fetched from Google so the build
// is deterministic and works offline. Restricted to short strings by the
// `.pixel` class; body copy and commands stay IBM Plex, because an 8x8 bitmap
// face at paragraph length is materially harder to read and these students are
// following technical instructions.
const pixel = localFont({
  src: './fonts/PressStart2P-latin.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  // Named *-face because `--font-pixel` is the Tailwind theme entry that wraps
  // this with its fallback chain (see @theme inline in globals.css).
  variable: '--font-pixel-face',
  // Fall back to the UI sans rather than a serif if the file ever fails.
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
  adjustFontFallback: false,
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
      <body className={`${plexSans.variable} ${plexMono.variable} ${pixel.variable} bg-surface`}>
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
