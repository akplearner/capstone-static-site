'use client';

import { useState } from 'react';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import { ArtSvg, Item3D, ObtainBurst, RaritySlot } from './widgets';
import { Gem, Stone, type StoneState } from './parts';
import { RARITY, type GemCut, type Rarity } from './palette';

/** A task's progress, as the stone it is cutting: 0% intact · started chipped · half cracked · done open. */
export function stoneStateFor(percent: number): StoneState {
  if (percent >= 100) return 3;
  if (percent >= 50) return 2;
  if (percent > 0) return 1;
  return 0;
}

/**
 * The stone in front of every task (R80).
 *
 * It is the task's progress bar, drawn as the thing being cut: intact before a
 * step is done, chipped once one is, cracked with light leaking at half way,
 * and split open with the course's gem floating in it when the task is done —
 * framed in the rarity the student earned (see `src/lib/rarity.ts`).
 *
 * Crossing a threshold plays once: the stone jolts; opening pops the gem out
 * with a burst and "+1 RARE". The first render never plays — a page load is
 * not an achievement.
 */
export function TaskStone({ percent, rarity, cut, size = 52 }: { percent: number; rarity: Rarity | null; cut: GemCut; size?: number }) {
  const reduce = useReducedMotionSafe();
  const state = stoneStateFor(percent);
  // Adjusted during render — React's pattern for state derived from a prop
  // change — so a threshold crossing plays exactly once.
  const [seen, setSeen] = useState(state);
  const [jolt, setJolt] = useState(0);
  const [burst, setBurst] = useState(0);
  if (seen !== state) {
    setSeen(state);
    if (state > seen && !reduce) {
      setJolt((j) => j + 1);
      if (state === 3) setBurst((b) => b + 1);
    }
  }

  const done = state === 3 && rarity !== null;
  const label = done ? `Task done — ${RARITY[rarity].name} gem` : `${percent}% of this task done`;
  const art = (
    <ArtSvg viewBox="-40 -80 80 86" width={size} height={size * (86 / 80)} overflow="visible" className="h-auto w-10 sm:w-[52px]" label={label}>
      {(u) => (
        <g key={jolt} className={jolt ? 'qa-pop' : undefined} style={{ transformBox: 'fill-box', transformOrigin: 'center bottom' }}>
          <Stone u={u} state={state} />
          {state === 3 && (
            <g className={burst ? 'qa-drop' : 'qa-float'}>
              <g transform="translate(0 -44) scale(.5) translate(-50 -50)">
                <Gem u={u} cut={cut} />
              </g>
            </g>
          )}
        </g>
      )}
    </ArtSvg>
  );
  return (
    <span className="relative inline-flex shrink-0">
      <Item3D float={false}>{done ? <RaritySlot rarity={rarity} className="p-0.5">{art}</RaritySlot> : art}</Item3D>
      <ObtainBurst trigger={burst} rarity={rarity ?? 0} />
    </span>
  );
}

/**
 * The week's gems: one slot per graded week, a silhouette until the week is
 * done, then its gem in the rarity of its weakest task — dropped in with a
 * spin the moment it is earned.
 */
export function WeekGemTray({
  weeks,
  cut,
  selected,
  onSelect,
}: {
  weeks: { week: number; label: string; rarity: Rarity | null }[];
  cut: GemCut;
  selected: number;
  onSelect: (week: number) => void;
}) {
  return (
    <ol aria-label="Gems earned by week" className="flex flex-wrap items-center gap-2">
      {weeks.map((w) => (
        <li key={w.week}>
          <button
            type="button"
            onClick={() => onSelect(w.week)}
            aria-current={w.week === selected ? 'true' : undefined}
            title={w.rarity === null ? `${w.label} — not yet cut` : `${w.label} — ${RARITY[w.rarity].name} gem`}
            className={`flex flex-col items-center gap-0.5 rounded-[var(--radius-control)] px-1.5 py-1 transition-colors hover:bg-panel-2 ${
              w.week === selected ? 'bg-panel-2' : ''
            }`}
          >
            <span
              className="grid h-9 w-9 place-items-center rounded-full"
              style={{
                border: `2px solid ${w.rarity === null ? 'var(--color-line)' : RARITY[w.rarity].color}`,
                boxShadow: w.rarity === null ? undefined : `0 0 12px -4px ${RARITY[w.rarity].color}`,
              }}
            >
              <ArtSvg size={26}>
                {(u) => (
                  <g className={w.rarity === null ? undefined : 'qa-drop'}>
                    <Gem u={u} cut={cut} silhouette={w.rarity === null} detail={false} />
                  </g>
                )}
              </ArtSvg>
            </span>
            <span className="font-mono text-3xs text-muted">{w.label}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}
