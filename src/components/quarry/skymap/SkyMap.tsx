'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useArt } from '@/components/quarry/art/defs';
import { ACC, ACC_LT } from '@/components/quarry/art/palette';
import { LevelPill } from '@/components/skills/LevelPill';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import type { SkyMapLayout, SkyStar } from '@/lib/skymap';
import type { SkillLevel } from '@/lib/docs/skillsCopy';

/**
 * The competency map (R108) — a night sky of the competencies a role
 * practises, one constellation per area, drawn from `skymapLayout()`.
 *
 * A star is lit by its level: a dim point until practised, the course tint
 * once practised, a halo once verified from pasted output, a ring once the
 * team's document on it was approved. Edges join competencies the same task
 * practises; they draw in, then the stars light in course order, the way the
 * mine plays a week once. Hover or focus a star and the read-out under the
 * sky names it, its level, its area and the next task that moves it; Enter
 * opens that task. Under reduced motion the sky is a single still frame and
 * nothing breathes.
 *
 * Colour comes from `--acc*` on an ancestor (`tintVars`) and the page's
 * tokens; the sky itself is the terminal background token, so the map reads
 * the same in both themes.
 */
interface SkyMapProps {
  layout: SkyMapLayout;
  levelLabel: Record<SkillLevel, string>;
  copy: { mapTitle: string; mapHowToRead: string; mapIdle: string; nextTask: string; heroUnit: string };
  hero: { value: number; of: number };
  href: (next: NonNullable<SkyStar['next']>) => string;
}

const RADIUS: Record<SkillLevel, number> = { 'not-started': 2.2, practised: 3, verified: 3.6, reviewed: 3.6 };
const OPACITY: Record<SkillLevel, number> = { 'not-started': 0.45, practised: 0.9, verified: 1, reviewed: 1 };
const lit = (level: SkillLevel) => level === 'verified' || level === 'reviewed';
const fillOf = (level: SkillLevel) => (level === 'not-started' ? 'var(--color-muted)' : level === 'practised' ? ACC_LT : ACC);

export function SkyMap({ layout, levelLabel, copy, hero, href }: SkyMapProps) {
  const { u, defs } = useArt();
  const glowId = `${useId().replace(/[^a-zA-Z0-9]/g, '')}-glow`;
  const reduce = useReducedMotionSafe();
  const router = useRouter();
  const [focus, setFocus] = useState<string | null>(null);
  const stars = layout.constellations.flatMap((c) => c.stars);
  const byId = new Map(stars.map((s) => [s.id, s]));
  const picked = focus ? byId.get(focus) : undefined;
  const delay = (order: number) => (reduce ? 0 : Math.min(order * 0.04, 1.2));
  const open = (s: SkyStar) => {
    if (s.next) router.push(href(s.next));
  };

  return (
    <section data-skymap className="space-y-3" aria-labelledby="skymap-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="skymap-title" className="text-xl font-semibold tracking-tight text-ink">{copy.mapTitle}</h2>
        <p className="text-sm text-body" data-skymap-hero>
          <span className="text-2xl font-semibold tabular-nums text-ink">{hero.value}</span>
          <span className="text-muted"> of {hero.of} {copy.heroUnit}</span>
        </p>
      </div>
      <p className="text-xs text-muted">{copy.mapHowToRead}</p>
      <div className="overflow-hidden rounded-[var(--radius-card)]" style={{ background: 'var(--color-term-bg)' }}>
        <svg viewBox={`0 0 ${layout.view.w} ${layout.view.h}`} role="img" aria-label={copy.mapTitle} className="block h-auto w-full">
          {defs}
          <defs>
            <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
              <stop offset={0} style={{ stopColor: ACC_LT, stopOpacity: 0.55 }} />
              <stop offset={0.6} style={{ stopColor: ACC, stopOpacity: 0.18 }} />
              <stop offset={1} style={{ stopColor: ACC, stopOpacity: 0 }} />
            </radialGradient>
          </defs>
          {layout.edges.map((e) => {
            const a = byId.get(e.a);
            const b = byId.get(e.b);
            if (!a || !b) return null;
            const dim = !lit(a.level) && !lit(b.level);
            return (
              <motion.line
                key={`${e.a}|${e.b}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={ACC}
                strokeWidth={1}
                strokeOpacity={dim ? 0.22 : 0.45}
                strokeDasharray={dim ? '3 4' : undefined}
                initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: delay(Math.min(a.order, b.order)), ease: 'easeOut' }}
              />
            );
          })}
          {layout.constellations.map((c) => (
            <text key={c.area} x={c.cx} y={c.cy - 4} textAnchor="middle" fontSize={11} fontFamily="var(--font-mono, monospace)" fill="var(--color-term-dim)" opacity={0.9} aria-hidden>
              {c.label}
            </text>
          ))}
          {stars.map((s) => {
            const active = focus === s.id;
            return (
              <g
                key={s.id}
                role="button"
                tabIndex={0}
                data-star={s.id}
                data-level={s.level}
                aria-label={`${s.label}: ${levelLabel[s.level]}`}
                style={{ cursor: 'pointer', outline: 'none' }}
                onMouseEnter={() => setFocus(s.id)}
                onFocus={() => setFocus(s.id)}
                onClick={() => setFocus(s.id)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    setFocus(s.id);
                    open(s);
                  }
                }}
              >
                <title>{`${s.label} · ${levelLabel[s.level]}`}</title>
                {lit(s.level) && (
                  <motion.circle
                    cx={s.x}
                    cy={s.y}
                    fill={`url(#${glowId})`}
                    className={reduce ? undefined : 'skymap-halo'}
                    initial={reduce ? false : { r: 0 }}
                    animate={{ r: 11 }}
                    transition={{ duration: 0.45, delay: delay(s.order), ease: 'easeOut' }}
                  />
                )}
                <motion.circle
                  cx={s.x}
                  cy={s.y}
                  fill={fillOf(s.level)}
                  initial={reduce ? false : { r: 0, opacity: 0 }}
                  animate={{ r: active ? RADIUS[s.level] + 1.4 : RADIUS[s.level], opacity: OPACITY[s.level] }}
                  transition={{ duration: 0.45, delay: delay(s.order), ease: 'easeOut' }}
                />
                {s.level === 'reviewed' && <circle cx={s.x} cy={s.y} r={7.5} fill="none" stroke={ACC_LT} strokeWidth={1.2} opacity={0.9} />}
                {active && <circle cx={s.x} cy={s.y} r={13} fill="none" stroke={u('acc')} strokeWidth={1} opacity={0.8} />}
              </g>
            );
          })}
        </svg>
      </div>
      <div data-skymap-detail className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {picked ? (
          <>
            <span className="font-medium text-ink">{picked.label}</span>
            <LevelPill level={picked.level} label={levelLabel[picked.level]} />
            <span className="text-muted">{layout.constellations.find((c) => c.area === picked.area)?.label}</span>
            {picked.next && (
              <Link href={href(picked.next)} className="font-medium text-accent hover:underline">
                {copy.nextTask}: {picked.next.title} →
              </Link>
            )}
          </>
        ) : (
          <span className="text-muted">{stars.length > 0 ? copy.mapIdle : '—'}</span>
        )}
      </div>
      <ul className="sr-only">
        {stars.map((s) => (
          <li key={s.id}>
            {s.label}, {levelLabel[s.level]}
          </li>
        ))}
      </ul>
    </section>
  );
}
