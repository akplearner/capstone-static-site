'use client';

import type { CSSProperties } from 'react';
import { ArtSvg, Item3D } from './widgets';
import { Item, type ItemKind } from './inventory';
import { Miner, PEBBLE_NAMES, Pebble, REST, type PebbleStage } from './parts';
import { RARITY, type GemCut } from './palette';

export interface PackSlot {
  kind: ItemKind;
  name: string;
  /** What earns it, in the student's words. */
  earn: string;
  earned: boolean;
}

/**
 * The pack (R80, from the inventory prototype's header): the miner, Pebble at
 * its evolution stage, the gems counted by rarity, and the five slots of the
 * course — pick, ore, facet, seal, relic — each lit the moment it is earned.
 * An unearned slot is a dark silhouette with how to earn it underneath, so
 * the next thing to do is always in view.
 */
export function PackStrip({
  slots,
  gems,
  pebble,
  cut,
  className = '',
  style,
}: {
  slots: PackSlot[];
  /** Gems earned, counted by rarity index. */
  gems: [number, number, number, number];
  pebble: PebbleStage;
  cut: GemCut;
  className?: string;
  style?: CSSProperties;
}) {
  const total = gems.reduce((a, b) => a + b, 0);
  return (
    <div className={`space-y-4 ${className}`} style={style}>
      <div className="flex flex-wrap items-end gap-4">
        <Item3D>
          <ArtSvg viewBox="-48 -104 100 112" width={64} height={72} label="Your miner">
            {(u) => <Miner u={u} pose={{ ...REST, face: total > 0 ? 'proud' : 'idle', ang: total > 0 ? -50 : -15, lean: total > 0 ? 7 : 0 }} />}
          </ArtSvg>
        </Item3D>
        <Item3D>
          <ArtSvg viewBox="-20 -36 40 40" size={36} label={`Pebble is a ${PEBBLE_NAMES[pebble]}`}>
            {(u) => <Pebble u={u} stage={pebble} />}
          </ArtSvg>
        </Item3D>
        <div className="min-w-0">
          <div className="eyebrow">Your pack</div>
          <div className="text-sm text-muted">
            Pebble is a <span className="font-semibold text-ink">{PEBBLE_NAMES[pebble]}</span>
          </div>
        </div>
        {/* 2×2 on phones — as a single ml-auto row the four tiles wrapped
            into a ragged 3+1 under 375px (R82). */}
        <dl className="grid w-full grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto sm:flex-wrap">
          {RARITY.map((r, i) => (
            <div key={r.name} className="min-w-16 rounded-[var(--radius-control)] depth-edge bg-panel-2 px-2.5 py-1.5 text-center" title={r.means}>
              <dd className="text-lg font-bold tabular-nums leading-none" style={{ color: r.color }}>
                {gems[i]}
              </dd>
              <dt className="mt-1 font-mono text-3xs uppercase tracking-wider text-muted">{r.name}</dt>
            </div>
          ))}
        </dl>
      </div>
      <ol className="grid grid-cols-5 gap-1.5 sm:gap-2" aria-label="The five slots of this course">
        {slots.map((s) => (
          <li
            key={s.kind}
            className={`relative flex min-w-0 flex-col items-center rounded-[var(--radius-control)] px-0.5 pb-2 pt-1 text-center sm:px-1 ${
              s.earned ? 'depth-edge bg-panel-2' : 'border border-dashed border-line'
            }`}
            title={s.earned ? `${s.name} — earned` : `${s.name} — ${s.earn}`}
          >
            <Item3D float={s.earned}>
              {/* CSS width beats the attribute: 40px on phones, 52 from sm. */}
              <ArtSvg size={52} className="h-auto w-10 sm:w-[52px]" label={s.name} style={s.earned ? undefined : { filter: 'grayscale(1) brightness(.45)', opacity: 0.7 }}>
                {(u) => <Item u={u} kind={s.kind} cut={cut} />}
              </ArtSvg>
            </Item3D>
            <span className={`text-xs font-semibold ${s.earned ? 'text-ink' : 'text-muted'}`}>{s.name}</span>
            <span className="break-words text-3xs leading-tight text-muted">{s.earned ? 'earned' : s.earn}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
