'use client';

/**
 * Skeleton — the one loading primitive left.
 *
 * `Spinner` and `LoadingBlock` lived here and both had zero call sites after
 * R64-F replaced the last five whole-page spinners with content-shaped
 * skeletons. They are deleted rather than kept "in case": an unused primitive
 * is the dead chrome R63 spent a commit removing, and `git` remembers them if
 * an inline pending state ever needs one. The filename is left alone so the six
 * `from '@/components/ui/Spinner'` imports do not churn for a rename.
 */

/** Grey placeholder block for skeleton screens. */
export function Skeleton({
  className = '',
  style,
}: {
  className?: string;
  /** For a width the Tailwind scale doesn't have — the content-shaped
   *  skeletons in `Skeletons.tsx` trace real element widths, which are
   *  whatever they are, not multiples of 4px. */
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-md bg-panel-2 motion-reduce:animate-none ${className}`}
      style={style}
      aria-hidden
    />
  );
}
