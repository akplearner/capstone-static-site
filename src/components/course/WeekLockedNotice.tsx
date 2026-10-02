'use client';

import { ArrowRight, Lock } from 'lucide-react';
import type { Course } from '@/lib/types';
import { phaseTag } from '@/lib/course-helpers';

/** A week behind a gate the team has not passed: what unlocks it, and the way there. */
export function WeekLockedNotice({ course, unit, week, gate, onGo }: { course: Course; unit: string; week: number; gate: Course['gates'][number] | undefined; onGo: (week: number) => void }) {
  return (
    <div className="flex items-start gap-3 rounded-lg depth-edge bg-panel-2 p-4">
      <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
      <div>
        <p className="text-sm font-medium text-ink">Locked until your team clears Gate {gate?.id}.</p>
        <p className="mt-1 text-sm text-muted">
          Finish {phaseTag(course, gate?.week ?? week - 1)} required tasks — whoever on the team does them — to pass Gate {gate?.id} and unlock this {unit}.
        </p>
        {gate && (
          <button type="button" onClick={() => onGo(gate.week)} className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            Go to {phaseTag(course, gate.week)} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
