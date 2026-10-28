'use client';

import { useState } from 'react';
import { CheckCircle2, CircleHelp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ValidationActivity } from '@/lib/validation/activities';
import type { Checkpoint } from '@/lib/validation/plan';
import type { ValidationAnswer } from '@/lib/data/types';

/**
 * R140 — "Validate what you built", props only.
 *
 * The cards ask about values the TEAM recorded; none reveals the recorded
 * value. A recall or an applied scenario is a choice or a typed value judged
 * on the spot (a right answer stamps, a wrong one allows a retry); an
 * explanation is saved for the instructor; a consistency task is checked
 * against the record. The container (`ValidationSection`) generates the
 * activities and records the answers; this component only renders.
 */
export interface ValidationPanelProps {
  checkpoints: Checkpoint[];
  reached: Checkpoint[];
  activities: ValidationActivity[];
  answers: ValidationAnswer[];
  currentWeek: number;
  recorded: number;
  onAnswer: (activity: ValidationActivity, given: string) => void;
}

const KIND_LABEL: Record<ValidationActivity['kind'], string> = { recall: 'Recall', apply: 'Apply', explain: 'Explain', consistency: 'Resolve' };

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export function latestAnswers(answers: ValidationAnswer[]): Map<string, { latest: ValidationAnswer; attempts: number }> {
  const out = new Map<string, { latest: ValidationAnswer; attempts: number }>();
  for (const a of [...answers].sort((x, y) => x.at - y.at)) {
    const prev = out.get(a.activityId);
    out.set(a.activityId, { latest: a, attempts: (prev?.attempts ?? 0) + 1 });
  }
  return out;
}

function Card({ activity, state, onAnswer }: { activity: ValidationActivity; state?: { latest: ValidationAnswer; attempts: number }; onAnswer: (given: string) => void }) {
  const [choice, setChoice] = useState('');
  const [text, setText] = useState('');
  const done = state?.latest.correct === true || (activity.kind === 'explain' && !!state);
  const wrong = !!state && state.latest.correct === false;
  return (
    <li data-validation-activity={activity.id} data-kind={activity.kind} data-done={done} className="rounded-md depth-edge bg-panel px-3 py-2">
      <div className="flex items-start gap-2">
        {done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden /> : <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />}
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-semibold uppercase tracking-wide text-muted">{KIND_LABEL[activity.kind]}</p>
          <p className="text-sm text-ink">{activity.prompt}</p>
          {done ? (
            <p className="mt-1 text-xs text-ok" data-stamp>
              {activity.kind === 'explain' ? 'Saved for the instructor to mark.' : activity.kind === 'consistency' ? 'Resolved — the record no longer contradicts.' : `Correct${state && state.attempts > 1 ? ` on attempt ${state.attempts}` : ''}.`}
            </p>
          ) : activity.options ? (
            <form
              className="mt-2 space-y-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (choice) onAnswer(choice);
              }}
            >
              {activity.options.map((o) => (
                <label key={o} className="flex items-center gap-2 text-sm text-body">
                  <input type="radio" name={activity.id} value={o} checked={choice === o} onChange={() => setChoice(o)} />
                  <span className="font-mono">{o}</span>
                </label>
              ))}
              <div className="flex items-center gap-2 pt-1">
                <Button type="submit" size="sm" disabled={!choice}>Check</Button>
                {wrong && <span className="text-xs text-warn" data-retry><RotateCcw className="mr-1 inline h-3 w-3" aria-hidden />Not that one — try again.</span>}
              </div>
            </form>
          ) : activity.kind === 'explain' ? (
            <form
              className="mt-2 space-y-1"
              onSubmit={(e) => {
                e.preventDefault();
                if (words(text) >= (activity.minWords ?? 40)) onAnswer(text);
              }}
            >
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} className="w-full rounded-md border border-line bg-panel-2 px-2 py-1 text-sm text-ink" aria-label={activity.prompt} />
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={words(text) < (activity.minWords ?? 40)}>Save</Button>
                <span className="text-xs text-muted">{words(text)} of {activity.minWords ?? 40} words</span>
              </div>
            </form>
          ) : activity.kind === 'consistency' ? (
            <div className="mt-2 flex items-center gap-2">
              <Button type="button" size="sm" onClick={() => onAnswer('resolved')}>Check the record</Button>
              {wrong && <span className="text-xs text-warn" data-retry>Still there — fix the form first.</span>}
            </div>
          ) : (
            <form
              className="mt-2 flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (text.trim()) onAnswer(text);
              }}
            >
              <input value={text} onChange={(e) => setText(e.target.value)} inputMode="numeric" className="w-28 rounded-md border border-line bg-panel-2 px-2 py-1 font-mono text-sm text-ink" aria-label={activity.prompt} />
              <Button type="submit" size="sm" disabled={!text.trim()}>Check</Button>
              {wrong && <span className="text-xs text-warn" data-retry>Not that — try again.</span>}
            </form>
          )}
        </div>
      </div>
    </li>
  );
}

export function ValidationPanel({ checkpoints, reached, activities, answers, currentWeek, recorded, onAnswer }: ValidationPanelProps) {
  const states = latestAnswers(answers);
  const next = checkpoints.find((c) => c.week > currentWeek);
  const done = activities.filter((a) => states.get(a.id)?.latest.correct === true || (a.kind === 'explain' && states.has(a.id))).length;
  return (
    <section aria-labelledby="validation-head" data-validation-panel className="rounded-lg depth-edge bg-panel-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="validation-head" className="text-sm font-semibold text-ink">Validate what you built</h3>
        {activities.length > 0 && (
          <span className="font-mono text-3xs text-muted" data-validation-progress>{done}/{activities.length}</span>
        )}
      </div>
      <p className="mt-0.5 text-3xs text-muted">
        Questions about the values your team recorded in its forms — asked without the form open, so the answer is what you remember and can apply. A wrong answer allows another try; every answer is kept.
      </p>
      {reached.length === 0 ? (
        <p className="mt-2 text-xs text-body" data-validation-empty>
          {next ? `Opens in week ${next.week}: by then your team will have recorded the values the questions ask about.` : 'This course has no validation checkpoint.'}
        </p>
      ) : activities.length === 0 ? (
        <p className="mt-2 text-xs text-body" data-validation-empty>
          {recorded === 0 ? 'Nothing to ask yet: record your team’s values in the forms first (addresses, prefixes, ports, sizes, decisions).' : 'Nothing to ask yet from what the team has recorded so far.'}
        </p>
      ) : (
        reached.map((cp) => {
          const mine = activities.filter((a) => a.checkpoint === cp.week);
          if (mine.length === 0) return null;
          return (
            <div key={cp.week} className="mt-2" data-validation-checkpoint={cp.week}>
              <p className="text-2xs font-semibold text-muted">Week {cp.week} · {cp.kind === 'recall' ? 'recall and explain' : cp.kind === 'apply' ? 'apply and resolve' : 'extend'}</p>
              <ul className="mt-1 space-y-1.5">
                {mine.map((a) => (
                  <Card key={a.id} activity={a} state={states.get(a.id)} onAnswer={(given) => onAnswer(a, given)} />
                ))}
              </ul>
            </div>
          );
        })
      )}
    </section>
  );
}
