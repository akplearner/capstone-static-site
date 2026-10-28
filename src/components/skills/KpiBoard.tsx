'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, CloudOff, RotateCcw, User, Users } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/step/CommandBlock';
import { DUR, EASE, meter } from '@/lib/motion';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import { useCountUp } from '@/lib/useCountUp';
import type { KpiBoard as KpiBoardDto, KpiValue } from '@/lib/kpiBoard';
import type { ScoreValue } from '@/lib/scores';
import type { KpiDef, KpiFamilyDef } from '@/lib/docs/kpis';
import type { WorkRoleDef } from '@/lib/docs/workRoles';
import type { BoardCopy } from '@/lib/docs/skillsCopy';

/**
 * R108 — the KPI tiles (twenty-eight since R132, seven families of four), the
 * six scores by the published method and the timing block. Props only: the page reads the document and
 * hands in the board, the registry rows and the words. On mount a sweep
 * crosses the panel and every figure counts up, both inside the meter budget
 * (`DUR.meter`); the sweep is positional, so `MotionConfig` stills it, and
 * the count-up reads the preference itself. Replay re-mounts the grid.
 * Nothing moves on hover. A tile whose fact was not handed in says so rather
 * than printing zero as if it were measured.
 */
export type Audience = 'student' | 'hiring' | 'agent';

interface KpiBoardProps {
  board: KpiBoardDto;
  defs: KpiDef[];
  families: KpiFamilyDef[];
  workRoles: WorkRoleDef[];
  copy: BoardCopy;
  persistenceLabel: string;
  weeks: { value: number; of: number };
}

const AUDIENCES: Audience[] = ['student', 'hiring', 'agent'];

export function KpiBoard({ board, defs, families, workRoles, copy, persistenceLabel, weeks }: KpiBoardProps) {
  const reduce = useReducedMotionSafe();
  const [audience, setAudience] = useState<Audience>('student');
  const [replay, setReplay] = useState(0);
  const defOf = new Map(defs.map((d) => [d.id, d]));
  const json = JSON.stringify(board, null, 2);

  return (
    <section data-kpi-board role="region" aria-labelledby="kpi-board-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="kpi-board-title" className="text-xl font-semibold tracking-tight text-ink">{copy.familiesHeading}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label={copy.familiesHeading} className="flex rounded-full bg-panel-2 p-0.5">
            {AUDIENCES.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={audience === a}
                data-audience={a}
                onClick={() => setAudience(a)}
                className={`rounded-full px-3 py-1 text-sm font-medium ${audience === a ? 'bg-panel text-ink depth-edge' : 'text-muted hover:text-ink'}`}
              >
                {copy.audience[a]}
              </button>
            ))}
          </div>
          {!reduce && (
            <Button variant="ghost" size="sm" onClick={() => setReplay((n) => n + 1)} className="flex items-center gap-1.5" data-replay>
              <RotateCcw className="h-4 w-4" aria-hidden /> {copy.replay}
            </Button>
          )}
        </div>
      </div>

      {audience === 'hiring' && (
        <p className="text-sm text-body" data-work-roles>
          <span className="font-medium text-ink">{copy.workRole}:</span> {workRoles.map((w) => w.label).join(' · ') || '—'}
          <span className="text-muted"> · {copy.measuredAgainst}: {board.measuredAgainst.label}</span>
        </p>
      )}

      {audience === 'agent' ? (
        <div className="space-y-2" data-kpi-agent>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>{copy.jsonCaption} {copy.schemaNote}</span>
            <CopyButton text={json} label={copy.copyJson} />
          </div>
          <pre data-kpi-json className="max-h-[32rem] overflow-auto rounded-[var(--radius-control)] bg-panel-2 p-3 text-xs text-ink">{json}</pre>
        </div>
      ) : (
        <div key={replay} className="relative space-y-5 overflow-hidden">
          {!reduce && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/3"
              style={{ background: 'linear-gradient(90deg, transparent, var(--color-accent-soft), transparent)' }}
              initial={{ x: '-100%' }}
              animate={{ x: '400%' }}
              transition={{ duration: DUR.meter, ease: EASE.out }}
            />
          )}
          {families.map((f) => (
            <section key={f.id} data-kpi-family={f.id} className="space-y-2">
              <h3 className="text-sm font-semibold text-ink">
                {f.label} <span className="font-normal text-muted">· {f.definition}</span>
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {board.kpis.filter((k) => k.family === f.id).map((k) => (
                  <KpiTile key={k.id} k={k} def={defOf.get(k.id)} copy={copy} audience={audience} persistenceLabel={persistenceLabel} weeks={weeks} replayKey={replay} medianNull={board.timing.medianMinutes === null} />
                ))}
              </ul>
            </section>
          ))}
          <ScoresSection scores={board.scores} defs={defOf} copy={copy} />
          <TimingSection timing={board.timing} copy={copy} />
        </div>
      )}
    </section>
  );
}

function factLine(k: KpiValue, copy: BoardCopy): { Icon: typeof User; text: string } {
  if (!k.loaded) return { Icon: CloudOff, text: copy.notLoaded };
  if (k.fact === 'own') return { Icon: User, text: copy.factOwn };
  if (k.fact === 'team') return { Icon: Users, text: copy.factTeam };
  return { Icon: BookOpen, text: copy.factContent };
}

function KpiTile({ k, def, copy, audience, persistenceLabel, weeks, replayKey, medianNull }: { k: KpiValue; def?: KpiDef; copy: BoardCopy; audience: Audience; persistenceLabel: string; weeks: { value: number; of: number }; replayKey: number; medianNull: boolean }) {
  const n = useCountUp(k.loaded ? k.value : 0, replayKey);
  const { Icon, text } = factLine(k, copy);
  const why = audience === 'hiring' ? def?.whyCompany : def?.whyMember;
  // R132: a count has no denominator; a minutes row prints the median over the steps timed, the percentage being the share within the hour.
  const minutes = k.unit === 'minutes';
  const count = k.unit === 'count';
  // R137: loaded with nothing to measure is a state of its own, never "0 of 0"; a null median (every timed step left over a day) prints a dash too.
  const off = k.loaded && !k.applies;
  const noMedian = minutes && k.loaded && k.of > 0 && medianNull;
  const after = !k.loaded || off ? '' : minutes ? (k.of > 0 ? ` min · ${k.of} ${copy.timedSteps}` : ` · ${copy.noTiming}`) : count ? '' : ` of ${k.of}`;
  const state = !k.loaded ? (k.fact === 'team' ? copy.notLoaded : copy.notLoadedOwn) : off ? (k.notMeasured === 'role' ? copy.notMeasuredRole : copy.notMeasuredYet) : '';
  return (
    <li data-kpi={k.id} data-fact={k.fact} data-loaded={k.loaded} data-applies={k.applies} data-not-measured={k.notMeasured} data-unit={k.unit} data-scored={k.scored || undefined} className="min-w-0">
      <Surface variant="dense" padding="sm" className="flex h-full flex-col gap-2">
        <h4 className="text-sm font-semibold text-ink">{def?.label ?? k.id}</h4>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-semibold tabular-nums text-ink" aria-hidden>{k.loaded && !off && !noMedian ? n : '—'}</span>
          {after && <span className="text-sm text-muted" aria-hidden>{noMedian ? after.replace(/^ min/, '') : after}</span>}
          {!state && <span className="sr-only">{noMedian ? `${copy.notMeasuredShort}${after}` : `${k.value}${after}`}</span>}
          {k.loaded && !off && k.of > 0 && !count && <span className="ml-auto text-sm tabular-nums text-muted" title={minutes ? copy.withinHour : undefined}>{k.pct}%</span>}
        </div>
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={k.loaded ? k.pct : 0} aria-label={def?.label ?? k.id} className="relative h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
          <motion.div className="absolute inset-0 origin-left rounded-full bg-accent" initial={{ scaleX: 0 }} animate={{ scaleX: k.loaded && !off ? k.pct / 100 : 0 }} transition={meter} />
        </div>
        {state && <p className="text-2xs text-muted" data-state>{state}</p>}
        {k.beside && k.loaded && !off && (
          <p className="text-2xs text-muted" data-beside>{persistenceLabel}: {k.beside.value} of {k.beside.of}</p>
        )}
        {k.id === 'kpi.execution.dod-met' && k.loaded && (
          <p className="text-2xs text-muted" data-weeks>{copy.weeksLabel}: {weeks.value} of {weeks.of}</p>
        )}
        {k.loaded && !off && k.contribution && (k.contribution.value !== k.value || k.contribution.of !== k.of) && (
          <p className="text-2xs text-muted" data-contribution>{copy.contributionColumn}: {k.contribution.value} of {k.contribution.of}</p>
        )}
        <p className="flex items-center gap-1 text-2xs text-muted">
          <Icon className="h-3 w-3 shrink-0" aria-hidden /> {text}
        </p>
        {why && <p className="text-xs text-body">{why}</p>}
      </Surface>
    </li>
  );
}

/** R132 — the six scores: a weighted mean of the KPIs named, with every component and whether it counted; a score that stands on nothing prints a dash. */
function ScoresSection({ scores, defs, copy }: { scores: ScoreValue[]; defs: Map<string, KpiDef>; copy: BoardCopy }) {
  return (
    <section data-kpi-scores className="space-y-2">
      <h3 className="text-sm font-semibold text-ink">
        {copy.scoresHeading} <span className="font-normal text-muted">· {copy.scoreNote}</span>
      </h3>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {scores.map((s) => (
          <li key={s.id} data-score={s.id} data-loaded={s.loaded}>
            <Surface variant="dense" padding="sm" className="flex h-full flex-col gap-2">
              <h4 className="text-sm font-semibold text-ink">{s.id.replace('score.', '').replace(/-/g, ' ')}</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold tabular-nums text-ink">{s.loaded ? s.value : '—'}</span>
                {s.loaded && <span className="text-sm text-muted">/ 100</span>}
                <span className="ml-auto text-2xs text-muted">{copy.scoreStandsOn} {s.counted} / {s.of} {copy.scoreComponents}</span>
              </div>
              <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.loaded ? s.value : 0} aria-label={s.id} className="relative h-1.5 w-full overflow-hidden rounded-full bg-panel-2">
                <motion.div className="absolute inset-0 origin-left rounded-full bg-accent" initial={{ scaleX: 0 }} animate={{ scaleX: s.loaded ? s.value / 100 : 0 }} transition={meter} />
              </div>
              <details className="text-2xs text-muted">
                <summary className="cursor-pointer">{copy.scoreComponents}</summary>
                <ul className="mt-1 space-y-0.5" data-score-components>
                  {s.components.map((c) => (
                    <li key={c.kpi} data-counted={c.counted} className="flex justify-between gap-2">
                      <span>{defs.get(c.kpi)?.label ?? c.kpi} <span className="tabular-nums">×{c.weight}</span></span>
                      <span className="tabular-nums">{c.counted ? `${c.pct}%` : '—'}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </Surface>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** R132 — the minutes between the first paste and the verification, as the board carries them. */
function TimingSection({ timing, copy }: { timing: KpiBoardDto['timing']; copy: BoardCopy }) {
  return (
    <section data-kpi-timing className="space-y-1">
      <h3 className="text-sm font-semibold text-ink">
        {copy.timingHeading} <span className="font-normal text-muted">· {copy.timingNote}</span>
      </h3>
      {timing.timedSteps === 0 ? (
        <p className="text-sm text-muted">{copy.noTiming}</p>
      ) : (
        <p className="text-sm text-body">
          <span className="font-semibold tabular-nums text-ink" data-median-minutes>{timing.medianMinutes ?? '—'}</span> min · {timing.timedSteps} {copy.timedSteps} · {timing.withinHour} {copy.withinHour} · {timing.over24h} {copy.over24h}
        </p>
      )}
    </section>
  );
}
