'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function CourseError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Something went wrong</h1>
      <p className="text-gray-600 dark:text-gray-400">
        This course page hit an unexpected error. This can happen with malformed course data.
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
