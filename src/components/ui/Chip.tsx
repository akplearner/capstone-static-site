'use client';

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

/**
 * R100 — the one chip.
 *
 * A role on a task row, a status ("Next", "Done by Ada"), a documentation
 * link, a meta fact (time, free tier) and the stamp were five hand-rolled
 * pills with five slightly different paddings. This is the one shape they all
 * take: pill radius, `text-2xs`, one tone per meaning, tokens only. It can be
 * a span, a link or a button, so a chip that does something looks exactly
 * like a chip that does not.
 */
export type ChipTone = 'neutral' | 'muted' | 'accent' | 'ok' | 'warn' | 'info' | 'link';

const TONE: Record<ChipTone, string> = {
  neutral: 'bg-panel-2 text-body',
  muted: 'bg-panel-2 text-muted',
  accent: 'bg-accent-soft text-accent-ink',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  info: 'bg-info-soft text-info',
  link: 'depth-edge bg-panel-2 text-accent-ink hover:bg-accent-soft',
};

type ChipProps<T extends ElementType> = {
  as?: T;
  tone?: ChipTone;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function Chip<T extends ElementType = 'span'>({ as, tone = 'neutral', icon, className = '', children, ...rest }: ChipProps<T>) {
  const Tag = (as ?? 'span') as ElementType;
  const interactive = Tag === 'button' || Tag === 'a';
  return (
    <Tag
      className={`inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-[var(--radius-pill)] px-2 py-0.5 text-2xs font-semibold leading-tight ${TONE[tone]} ${
        interactive ? 'focusable cursor-pointer' : ''
      } ${className}`}
      {...rest}
    >
      {icon && <span className="shrink-0 [&>svg]:h-3 [&>svg]:w-3" aria-hidden>{icon}</span>}
      <span className="min-w-0 truncate">{children}</span>
    </Tag>
  );
}
