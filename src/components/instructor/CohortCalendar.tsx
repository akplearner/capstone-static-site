'use client';

import { useState } from 'react';
import { CalendarDays, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cohortRepo } from '@/lib/data';
import { useClientStore } from '@/lib/useClientStore';
import type { Course } from '@/lib/types';
import { buildIcs, shortDate, weekDueDates } from '@/lib/calendar';
import { downloadText } from '@/lib/download';
import { getMonthlyCohorts } from '@/lib/utils';

/**
 * The cohort calendar controls: pick a cohort, set the day it starts, and
 * every week's due date follows. Lives in the studio's Details tab and on the
 * cohort dashboard. Seeds carry no dates — the cohort does.
 */
export function CohortCalendar({ course }: { course: Course }) {
  const cohorts = getMonthlyCohorts(12);
  const [cohort, setCohort] = useState(cohorts[0] ?? '');
  const saved = useClientStore(() => (cohort ? cohortRepo.get(course.id, cohort) : null), null);
  const [startsOn, setStartsOn] = useState<string | null>(null);
  const value = startsOn ?? saved?.startsOn ?? '';
  const dirty = value !== (saved?.startsOn ?? '');

  const save = () => {
    if (!value) return;
    cohortRepo.save({ courseId: course.id, cohort, startsOn: value });
    setStartsOn(null);
  };

  return (
    <div className="space-y-3 rounded-lg depth-edge p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <CalendarDays className="h-4 w-4 text-accent" aria-hidden /> Cohort calendar
      </h3>
      <p className="text-sm text-muted">
        Week N is due seven days after week N−1; preparation is due on the start date. Students see “due Fri 20 Sep · in 3 days” on
        their week, and can add the whole run to their calendar.
      </p>
      <div className="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <label className="block text-sm">
          <span className="block font-medium text-body">Cohort</span>
          <select value={cohort} onChange={(e) => { setCohort(e.target.value); setStartsOn(null); }} className="mt-1 w-full text-sm">
            {cohorts.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="block font-medium text-body">Starts on</span>
          <input type="date" value={value} onChange={(e) => setStartsOn(e.target.value)} className="mt-1 w-full text-sm" />
        </label>
        <Button size="sm" onClick={save} disabled={!dirty || !value}>
          {saved ? 'Update' : 'Set start date'}
        </Button>
      </div>
      {saved && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          {weekDueDates(course, saved.startsOn).map((w) => (
            <span key={w.week}>
              W{w.week} · {shortDate(w.due)}
            </span>
          ))}
          <button
            type="button"
            onClick={() => downloadText(`${course.id}_${cohort}.ics`, buildIcs({ course, cohort, startsOn: saved.startsOn }), 'text/calendar;charset=utf-8')}
            className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
          >
            <Download className="h-3.5 w-3.5" /> .ics
          </button>
        </div>
      )}
    </div>
  );
}
