import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { ShieldCheck, GraduationCap, PencilRuler } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Capstone Lab Platform',
  description: 'Security+ Capstone - Week-by-Week Lab Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-gray-900`}>
        <nav className="border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                <ShieldCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <span>Capstone Lab</span>
              </Link>
              <div className="flex items-center gap-1 sm:gap-2">
                <Link href="/" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Courses</span>
                </Link>
                <Link href="/instructor" className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                  <PencilRuler className="h-4 w-4" />
                  <span className="hidden sm:inline">Instructor</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
