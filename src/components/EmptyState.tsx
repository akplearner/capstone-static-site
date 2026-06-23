'use client';

import Link from 'next/link';
import { Button } from './ui/Button';

export function EmptyState({
  title,
  message,
  href,
  cta,
}: {
  title: string;
  message: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
      {href && cta && (
        <Link href={href}>
          <Button>{cta}</Button>
        </Link>
      )}
    </div>
  );
}
