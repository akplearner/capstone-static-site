'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

/**
 * App-level error boundary. Catches unhandled render errors in any route that
 * doesn't have its own error.tsx (instructor, docs, team, home), so a thrown
 * error shows a recovery UI instead of a white screen.
 */
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Something went wrong</h1>
      <p className="text-gray-600 dark:text-gray-400">
        This page hit an unexpected error. You can try again, or head back to the courses list.
      </p>
      <div className="flex justify-center gap-3">
        <Button onClick={() => reset()}>Try again</Button>
        <Link href="/">
          <Button variant="secondary">Browse courses</Button>
        </Link>
      </div>
    </div>
  );
}
