'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Course, WeekDef } from '@/lib/types';
import { TextField, TextArea, NumberField } from './fields';

export function WeeksEditor({ course, onChange }: { course: Course; onChange: (c: Course) => void }) {
  const setWeeks = (weeks: WeekDef[]) => onChange({ ...course, weeks });

  const update = (i: number, patch: Partial<WeekDef>) =>
    setWeeks(course.weeks.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));

  const add = () => {
    const nextNum = course.weeks.reduce((m, w) => Math.max(m, w.number), 0) + 1;
    setWeeks([...course.weeks, { number: nextNum, title: `Week ${nextNum}`, theme: '', objective: '' }]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Define the weeks/phases of the course.</p>
        <Button size="sm" onClick={add} className="flex items-center gap-1"><Plus className="h-4 w-4" /> Add week</Button>
      </div>
      {[...course.weeks]
        .map((w, i) => ({ w, i }))
        .sort((a, b) => a.w.number - b.w.number)
        .map(({ w, i }) => (
          <div key={i} className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink">Week {w.number}: {w.title}</span>
              <button type="button" aria-label={`Remove week ${w.number}`} onClick={() => setWeeks(course.weeks.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-600">
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <NumberField label="Number" value={w.number} onChange={(v) => update(i, { number: v })} />
              <div className="sm:col-span-2">
                <TextField label="Title" value={w.title} onChange={(v) => update(i, { title: v })} />
              </div>
            </div>
            <TextField label="Theme" value={w.theme} onChange={(v) => update(i, { theme: v })} />
            <TextArea label="Objective" value={w.objective} onChange={(v) => update(i, { objective: v })} />
          </div>
        ))}
    </div>
  );
}
