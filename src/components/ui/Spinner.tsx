'use client';

import { Loader2 } from 'lucide-react';

/** Accessible loading spinner. Announces "Loading" to assistive tech. */
export function Spinner({
  size = 20,
  label = 'Loading',
  className = '',
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <span role="status" className={`inline-flex items-center gap-2 text-muted ${className}`}>
      <Loader2 className="animate-spin motion-reduce:animate-none" style={{ width: size, height: size }} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Centered full-section loading state, used by route loading.tsx and in-page waits. */
export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-muted">
      <Spinner label={label} />
      <span>{label}</span>
    </div>
  );
}

/** Grey placeholder block for skeleton screens. */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-panel-2 motion-reduce:animate-none ${className}`}
      aria-hidden
    />
  );
}
