'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { MineScene } from './MineScene';
import { COURSE_TINT, tintVars } from './palette';

/**
 * The landing hero (R80): the mine, with the five live courses above it.
 * Picking one recolours the miner — his shirt, his eyes — and the gems and
 * crystals of the whole mine to that course, and offers the course itself.
 * One style attribute on the wrapper does it (`tintVars`); the scene keeps
 * playing through the change.
 */
export function HeroMine({ courses, className = '', sceneClassName = '' }: { courses: { id: string; title: string }[]; className?: string; sceneClassName?: string }) {
  const live = courses.filter((c) => COURSE_TINT[c.id]);
  const [pick, setPick] = useState(live[0]?.id ?? 'security-plus');
  const t = COURSE_TINT[pick];
  const course = live.find((c) => c.id === pick);
  return (
    <div className={`space-y-3 ${className}`} style={tintVars(pick)}>
      <div role="radiogroup" aria-label="Pick a cert to see its quarry" className="flex flex-wrap gap-2">
        {live.map((c) => {
          const on = c.id === pick;
          const ct = COURSE_TINT[c.id];
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setPick(c.id)}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                on ? 'depth-lift scale-105 bg-panel text-ink' : 'depth-edge depth-hover bg-panel-2 text-muted'
              }`}
            >
              <span aria-hidden className="h-2.5 w-2.5 rounded-full transition-transform" style={{ background: ct.acc, transform: on ? 'scale(1.3)' : undefined, boxShadow: on ? `0 0 10px ${ct.acc}` : undefined }} />
              {ct.name}
            </button>
          );
        })}
      </div>
      <MineScene mode="demo" weeks={4} cut={t.cut} label={t.name} className={`cursor-pointer ${sceneClassName}`} />
      {course && (
        <Link href={`/courses/${course.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
          Start {course.title} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
