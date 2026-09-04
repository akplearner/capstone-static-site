'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Compass, Lock } from 'lucide-react';
import { CapstoneStone } from '@/components/quarry/CapstoneStone';
import { Button } from '@/components/ui/Button';
import { PATHS, resolvePath, type CareerPath } from '@/lib/catalog/paths';
import { vendorById } from '@/lib/catalog';
import { DUR, EASE } from '@/lib/motion';

/**
 * The career track, drawn as a run of stones.
 *
 * Answers "what am I building toward", which a per-course progress bar can't:
 * done rungs are cut stones, the current one is being worked, and rungs with no
 * capstone yet are honest rough rock rather than being hidden — the roadmap
 * ahead is part of the picture.
 */
export function PathRail({
  path,
  completedCourseIds,
  onChange,
}: {
  path: CareerPath;
  completedCourseIds: Set<string>;
  onChange: () => void;
}) {
  const rungs = resolvePath(path, completedCourseIds);
  const done = rungs.filter((r) => r.complete).length;

  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-panel p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Your path</p>
          <h2 className="mt-0.5 text-lg font-bold text-ink">{path.name}</h2>
          <p className="text-sm text-muted">{path.role}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted">
            {done} of {rungs.length} cut
          </span>
          <Button variant="secondary" size="sm" onClick={onChange}>
            Change
          </Button>
        </div>
      </div>

      <ol className="mt-4 flex flex-wrap items-stretch gap-2">
        {rungs.map((r, i) => {
          const vendor = vendorById(r.entry.vendorId);
          const available = r.entry.status === 'available';
          const inner = (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: DUR.reveal, ease: EASE.out }}
              data-region={vendor?.region}
              className={`flex h-full min-w-[9.5rem] flex-1 flex-col gap-1 rounded-lg border p-3 ${
                r.current
                  ? 'border-accent bg-accent-soft/40'
                  : r.complete
                    ? 'border-line bg-panel-2'
                    : 'border-dashed border-line bg-panel-2/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <CapstoneStone
                  stage={r.complete ? 5 : r.current ? 3 : 0}
                  size={30}
                  className={available ? '' : 'opacity-50'}
                />
                <span className="font-mono text-3xs uppercase tracking-wider text-muted">
                  {r.complete ? 'Delivered' : r.current ? 'In progress' : available ? 'Ready' : 'Soon'}
                </span>
              </div>
              <div className={`text-sm font-semibold ${available ? 'text-ink' : 'text-muted'}`}>
                {r.entry.certName}
              </div>
              {r.complete && (
                <span className="inline-flex items-center gap-1 text-xs text-accent">
                  <Check className="h-3 w-3" /> Capstone filed
                </span>
              )}
              {!available && (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <Lock className="h-3 w-3" /> Not built yet
                </span>
              )}
            </motion.div>
          );
          return (
            <li key={r.entry.id} className="flex min-w-[9.5rem] flex-1">
              {available && r.entry.courseId ? (
                <Link href={`/courses/${r.entry.courseId}`} className="flex w-full">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Shown when no path is chosen yet — picking one is optional, never forced. */
export function PathPicker({ onPick }: { onPick: (pathId: string) => void }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-panel p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <Compass className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-bold text-ink">Choose a path</h2>
      </div>
      <p className="mt-1 text-sm text-muted">
        Optional — it just orders the certs into a route and shows you what’s next. You can change
        or drop it at any time.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PATHS.map((p) => (
          <button
            key={p.id}
            onClick={() => onPick(p.id)}
            className="rounded-lg border border-line bg-panel-2 p-3 text-left hover:border-accent"
          >
            <div className="font-semibold text-ink">{p.name}</div>
            <div className="eyebrow mt-0.5">{p.role}</div>
            <p className="mt-1 text-sm text-muted">{p.blurb}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
