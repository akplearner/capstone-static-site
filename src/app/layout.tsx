import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SiteNav } from '@/components/SiteNav';
import { MotionProvider } from '@/components/MotionProvider';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'] });

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
      <body className={`${inter.className} bg-white dark:bg-gray-900`}>
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
