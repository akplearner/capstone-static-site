'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCourseDocument } from '@/lib/useCourse';
import { weekAdds } from '@/lib/weekAdds';
import { weekVisualsOf } from '@/lib/content/read';

/**
 * R103: the weekly breakdown under the picture — each part that arrives this
 * week, what it is for, and the form that records it. Read from the course
 * document, so it is the picture's own catalogue in words. A long week shows
 * its first rows and a "show all" button; no disclosure widget, so the
 * week's one collapsible stays the week's.
 */
export function WeekAddsList({ courseId, week, limit }: { courseId: string; week: number; /** Rows shown before "show all"; omit for every row. */ limit?: number }) {
  const doc = useCourseDocument();
  const visuals = weekVisualsOf(useCourseDocument());
  const [all, setAll] = useState(false);
  const adds = weekAdds(doc, week);
  if (!visuals.length) return null;
  if (adds.rows.length === 0) {
    // Honest about an empty week: the process is drawn, nothing new is built.
    return (
      <p className="text-2xs text-muted" data-week-adds={week}>
        {adds.starting ? 'Nothing built yet' : 'Nothing new this week; the process is drawn'}
      </p>
    );
  }
  const rows = limit && !all ? adds.rows.slice(0, limit) : adds.rows;
  const hidden = adds.rows.length - rows.length;
  return (
    <div className="text-sm" data-week-adds={week}>
      <ul aria-label={adds.starting ? 'You start with' : 'This week adds'} className="space-y-1">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-baseline gap-x-2 leading-snug" data-adds-part={r.id}>
            <span className="font-semibold text-ink">{r.label}</span>
            <span className="text-body">{r.purpose}</span>
            {r.records && (
              <Link href={`/courses/${courseId}/docs?week=${r.records.week}&form=${r.records.id}`} className="text-2xs text-accent-ink underline-offset-2 hover:underline">
                Recorded in: {r.records.title}
              </Link>
            )}
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button type="button" onClick={() => setAll(true)} className="focusable mt-1 text-2xs font-medium text-accent-ink hover:underline">
          Show all {adds.rows.length}
        </button>
      )}
    </div>
  );
}
