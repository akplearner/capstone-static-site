import type { HTMLAttributes, ReactNode } from 'react';

/**
 * The one page header — eyebrow · title · lede · trailing.
 *
 * Every in-course tab used to roll its own: h1 at 4xl on the dashboard, 3xl on
 * the Guide and the Team page, 2xl on Deliverables, and only one of the five had
 * an eyebrow naming the tab. Four tabs that look like four different sites read
 * as four different tools to learn. This is the shape they share.
 *
 * `level` exists for the dashboard, whose h1 is the course title above the
 * sub-nav: a tab header there is a section, not a second page title.
 * Everything else spreads through, so a caller can keep a `data-block` literal
 * on the element (the Deliverables page's shape guard reads it from source).
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
  trailing,
  level = 1,
  className,
  ...rest
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  trailing?: ReactNode;
  level?: 1 | 2;
} & Omit<HTMLAttributes<HTMLElement>, 'title'>) {
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <header
      {...rest}
      className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-2 ${className ?? ''}`}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow && <div className="eyebrow-muted">{eyebrow}</div>}
        <Heading className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</Heading>
        {lede && <p className="max-w-2xl text-sm text-muted">{lede}</p>}
      </div>
      {trailing && <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div>}
    </header>
  );
}
