'use client';

import { useId, useRef, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CloudOff } from 'lucide-react';
import { meter } from '@/lib/motion';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import { useCountUp } from '@/lib/useCountUp';
import { ACC } from '@/components/quarry/art/palette';
import type { KpiBoard, KpiValue } from '@/lib/kpiBoard';
import type { KpiDef, KpiFamilyDef } from '@/lib/docs/kpis';
import type { BoardCopy } from '@/lib/docs/skillsCopy';

/**
 * R109 — the KPI pack: the sixteen KPIs of one board as sockets, four groups
 * of four, compact enough for a dashboard card and the Home role surface.
 * Props only: the page hands in the board, the registry rows and the words.
 *
 * A socket is a ring whose arc sweeps to the ratio in the course tint (the
 * `ProgressRing` arc, inside the meter budget); the disc lights and a halo
 * breathes when the ratio is complete; a socket whose fact was not handed in
 * is dashed and dim and says so. Hover, focus or a tap prints the socket in
 * the read-out line; the hero figure counts up on mount. One tab stop per
 * pack: the arrow keys move between sockets. Nothing is scored or ranked.
 *
 * The arc is a stroke, which `MotionConfig` does not still, so the pack reads
 * the motion preference itself and renders the final state under reduce.
 */
interface KpiPackProps {
  board: KpiBoard;
  defs: KpiDef[];
  families: KpiFamilyDef[];
  copy: BoardCopy;
  /** The Skill board; the header's link. */
  href: string;
  /** `COPY.abilityLabels.persistence`: first-try is never shown alone. */
  persistenceLabel: string;
}

const R = 9;
const C = 2 * Math.PI * R;
const HERO = 'kpi.ability.skills-verified';

const isLit = (k: KpiValue) => k.loaded && k.of > 0 && k.pct === 100;

export function KpiPack({ board, defs, families, copy, href, persistenceLabel }: KpiPackProps) {
  const reduce = useReducedMotionSafe();
  const raw = useId();
  const glowId = `kp${raw.replace(/[^a-zA-Z0-9]/g, '')}-glow`;
  const [focusAt, setFocusAt] = useState(0);
  const [hover, setHover] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const defOf = new Map(defs.map((d) => [d.id, d]));
  const ordered = families.flatMap((f) => board.kpis.filter((k) => k.family === f.id));
  const indexOf = new Map(ordered.map((k, i) => [k.id, i]));
  const hero = board.kpis.find((k) => k.id === HERO) ?? board.kpis[0];
  const heroValue = hero?.loaded ? hero.value : 0;
  const n = useCountUp(heroValue);
  const dim = board.kpis.filter((k) => !k.loaded).length;
  const shown = ordered.find((k) => k.id === (hover ?? pinned));

  const nameOf = (k: KpiValue) => defOf.get(k.id)?.label ?? k.id;
  const factWord = (k: KpiValue) => (k.fact === 'own' ? copy.factOwn : k.fact === 'team' ? copy.factTeam : copy.factContent).split(':')[0];
  const besideOf = (k: KpiValue) => (k.beside ? ` · ${persistenceLabel} ${k.beside.value} of ${k.beside.of}` : '');
  // R111: the role's own share, printed only where it differs from the team count.
  const ownOf = (k: KpiValue) => (k.contribution && (k.contribution.value !== k.value || k.contribution.of !== k.of) ? ` · ${copy.contribution} ${k.contribution.value} of ${k.contribution.of}` : '');
  const labelOf = (k: KpiValue) => (k.loaded ? `${nameOf(k)}: ${k.value} of ${k.of}${k.beside ? `; ${persistenceLabel} ${k.beside.value} of ${k.beside.of}` : ''}${ownOf(k).replace(' · ', '; ')}` : `${nameOf(k)}: ${copy.notLoaded}`);

  const move = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowDown' ? 4 : e.key === 'ArrowUp' ? -4 : e.key === 'Home' ? -i : e.key === 'End' ? ordered.length - 1 - i : 0;
    if (!delta) return;
    e.preventDefault();
    const next = Math.min(ordered.length - 1, Math.max(0, i + delta));
    setFocusAt(next);
    refs.current[next]?.focus();
  };

  return (
    <section data-kpi-pack data-motion={reduce ? 'off' : 'on'} aria-label={copy.packTitle} className="@container relative space-y-2">
      <svg aria-hidden className="absolute h-0 w-0">
        <defs>
          <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <stop offset={0} style={{ stopColor: ACC, stopOpacity: 0.85 }} />
            <stop offset={1} style={{ stopColor: ACC, stopOpacity: 0 }} />
          </radialGradient>
        </defs>
      </svg>

      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-xs font-semibold text-ink">{copy.packTitle}</span>
        {hero && (
          <span data-kpi-hero className="text-sm font-semibold tabular-nums text-ink">
            <span aria-hidden>{n}</span>
            <span className="sr-only">{heroValue}</span> of {hero.of} <span className="font-normal text-muted">{copy.heroUnit}</span>
          </span>
        )}
        <Link href={href} data-skill-board-link className="text-xs font-medium text-accent hover:underline">
          {copy.title} →
        </Link>
      </div>

      <span className="sr-only">{copy.packKeys}</span>
      <ol className="grid grid-cols-2 gap-x-4 gap-y-3 @3xl:grid-cols-4">
        {families.map((f) => (
          <li key={f.id} data-kpi-family={f.id}>
            <span className="block font-mono text-3xs uppercase tracking-wider text-muted">{copy.familyShort[f.id]}</span>
            <ul className="mt-1 flex gap-1">
              {board.kpis.filter((k) => k.family === f.id).map((k) => {
                const i = indexOf.get(k.id) ?? 0;
                const lit = isLit(k);
                const state = lit ? 'depth-edge bg-panel-2' : k.loaded ? 'bg-panel-2' : 'border border-dashed border-line';
                return (
                  <li key={k.id}>
                    <button
                      type="button"
                      ref={(el) => {
                        refs.current[i] = el;
                      }}
                      data-kpi={k.id}
                      data-fact={k.fact}
                      data-loaded={k.loaded}
                      data-pct={k.loaded ? k.pct : 0}
                      data-lit={lit}
                      aria-label={labelOf(k)}
                      aria-pressed={pinned === k.id}
                      tabIndex={i === focusAt ? 0 : -1}
                      onKeyDown={(e) => move(e, i)}
                      onMouseEnter={() => setHover(k.id)}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => {
                        setFocusAt(i);
                        setHover(k.id);
                      }}
                      onBlur={() => setHover(null)}
                      onClick={() => setPinned((p) => (p === k.id ? null : k.id))}
                      className={`grid h-8 w-8 place-items-center rounded-[var(--radius-control)] hover:bg-panel-2 ${state}`}
                    >
                      <svg viewBox="0 0 24 24" className="h-6 w-6 -rotate-90" aria-hidden>
                        {lit && <circle cx={12} cy={12} r={11.5} fill={`url(#${glowId})`} className={reduce ? undefined : 'qa-breathe'} />}
                        <circle cx={12} cy={12} r={R} fill="none" strokeWidth={2.5} className="stroke-line" strokeDasharray={k.loaded ? undefined : '2 2'} />
                        {k.loaded && (
                          <motion.circle
                            cx={12}
                            cy={12}
                            r={R}
                            fill="none"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            style={{ stroke: ACC }}
                            strokeDasharray={C}
                            initial={reduce ? false : { strokeDashoffset: C }}
                            animate={{ strokeDashoffset: C * (1 - k.pct / 100) }}
                            transition={meter}
                          />
                        )}
                        {lit ? <circle cx={12} cy={12} r={4} style={{ fill: ACC }} /> : k.loaded ? <circle cx={12} cy={12} r={4} className="fill-line" /> : null}
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>

      <p data-kpi-readout className="min-h-5 text-2xs text-muted">
        {shown ? (
          shown.loaded ? (
            <>
              <span className="font-semibold text-ink">{nameOf(shown)}</span> · {shown.value} of {shown.of} · {shown.pct}% · {factWord(shown)}{besideOf(shown)}{ownOf(shown)}
            </>
          ) : (
            <>
              <span className="font-semibold text-ink">{nameOf(shown)}</span> · {copy.notLoaded}
            </>
          )
        ) : (
          copy.packIdle
        )}
      </p>
      {dim > 0 && (
        <p data-kpi-dim className="flex items-center gap-1 text-2xs text-muted">
          <CloudOff className="h-3 w-3 shrink-0" aria-hidden /> {copy.notLoaded}
        </p>
      )}
    </section>
  );
}
