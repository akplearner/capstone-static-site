'use client';

import { Check, ChevronRight, Hammer } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import type { Course } from '@/lib/types';

/**
 * The build map: the topology goal, one milestone per week, kept above the
 * task list so a student always knows what this week's steps add up to.
 *
 * Students said the course was a lot of tasks with no thread. The thread is
 * the thing they are building — a rack, a host, two zones, a published site,
 * a hardened fleet — and the seed already names it per week. This renders
 * that list as a chain of chips (done / this week / ahead) and one sentence:
 * what you are building now and how you will know it is built.
 */
export function BuildMap({
  course,
  weeks,
  current,
  percentOf,
  onPick,
}: {
  course: Course;
  /** The weeks the rail shows; setup weeks are left out. */
  weeks: number[];
  current: number;
  percentOf: (week: number) => number;
  onPick: (week: number) => void;
}) {
  const items = (course.buildMap ?? []).filter((m) => weeks.includes(m.week));
  if (items.length === 0) return null;
  const now = items.find((m) => m.week === current) ?? items[0];
  return (
    <Surface as="section" variant="inset" padding="sm" aria-labelledby="build-map-head" className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted">
        <Hammer className="h-4 w-4 text-accent" aria-hidden />
        <span id="build-map-head">What you are building</span>
      </div>
      <ol className="flex flex-wrap items-center gap-y-1.5">
        {items.map((m, i) => {
          const done = percentOf(m.week) >= 100;
          const isNow = m.week === current;
          return (
            <li key={m.week} className="flex items-center">
              <button
                type="button"
                onClick={() => onPick(m.week)}
                aria-current={isNow ? 'step' : undefined}
                title={`Built when ${m.check}`}
                className={`inline-flex max-w-[16rem] items-center gap-1.5 rounded-full border px-2.5 py-1 text-left text-xs font-medium transition-colors ${
                  done
                    ? 'border-ok-line bg-ok-soft text-ok'
                    : isNow
                      ? 'border-accent bg-accent text-accent-contrast'
                      : 'border-line bg-panel text-muted hover:text-ink'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden /> : <span className="font-mono text-2xs">W{m.week}</span>}
                <span className="truncate">{m.label}</span>
              </button>
              {i < items.length - 1 && <ChevronRight className="mx-0.5 h-3.5 w-3.5 shrink-0 text-muted/60" aria-hidden />}
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-body">
        <span className="font-semibold text-ink">This week:</span> {now.label}.{' '}
        <span className="text-muted">Built when {now.check}.</span>
      </p>
    </Surface>
  );
}
