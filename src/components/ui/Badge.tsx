import React from 'react';

/**
 * The one chip. Four tones cover what used to be four ad-hoc colour systems in
 * the task view (violet optional pills, sky file chips, amber deliverable chips,
 * plus assorted hand-rolled spans):
 *
 *   default   — accent identity chip (IP pills, week tags)
 *   secondary — quiet metadata
 *   outline   — quiet metadata on a busy background
 *   note      — "worth noticing" (optional steps, extras)
 *   warn      — "produces evidence / needs action" strips
 *
 * Framework chips keep their own per-framework colour map (getFrameworkColor) —
 * there the colour IS data; everywhere else it routes through these tones.
 */
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'note' | 'warn';
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  const variantClasses = {
    default: 'bg-accent-soft text-accent-ink',
    secondary: 'bg-panel-2 text-muted',
    outline: 'border border-line text-muted',
    note: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    warn: 'border border-warn-line bg-warn-soft text-ink',
  };

  return (
    <span className={`inline-block rounded-full px-3 py-1 font-mono text-sm font-medium ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
