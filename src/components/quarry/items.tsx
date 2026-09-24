'use client';

import type { Level } from '@/lib/types';
import { ArtSvg, Item3D, ItemIcon } from './art/widgets';
import { Item, type ItemKind } from './art/inventory';
import { Miner, REST, type Face } from './art/parts';
import { ACC, ACC_LT, OUT } from './art/palette';

/**
 * Quarry item icons — R80 redraws every one from the product owner's
 * `quarry-items-inventory` prototype (see `./art/`): the same warm outline,
 * the same five depth layers, plus an extruded thickness and a pointer tilt.
 *
 * The exports and their props are unchanged from R29, so Explore, the
 * dashboard, the portfolio and the empty states pick up the new art with no
 * call-site edit:
 *  - ToolTierIcon  — the four picks ↔ the four cert levels
 *  - WeekVerbIcon  — DEPLOY / OPERATE / HARDEN / DELIVER → pick · ore · seal · relic
 *  - SealLedger    — the gold seal ringed with one gem socket per graded week
 *  - RelicTrophy   — the relic, for a filed capstone
 *  - MinerMark     — the miner, with a face for the mood
 *
 * Colour reads `--acc*` with the page's accent tokens as fallback, so every
 * icon takes its course's colour.
 */

const TOOL: Record<Level, ItemKind> = { entry: 'hand', associate: 'steel', professional: 'drill', expert: 'rig' };
const TOOL_NAME: Record<Level, string> = { entry: 'Hand pick', associate: 'Steel pick', professional: 'Powered drill', expert: 'Core rig' };

/** The four mining tools, one per certification level. */
export function ToolTierIcon({ level, size = 24, className }: { level: Level; size?: number; className?: string }) {
  return <ItemIcon kind={TOOL[level]} size={size} className={className} label={`${TOOL_NAME[level]} — ${level} level`} />;
}

export type WeekVerb = 'deploy' | 'operate' | 'harden' | 'deliver';
const VERB: Record<WeekVerb, ItemKind> = { deploy: 'hand', operate: 'ore', harden: 'seal', deliver: 'relic' };

export function WeekVerbIcon({ verb, size = 22, className }: { verb: WeekVerb; size?: number; className?: string }) {
  return <ItemIcon kind={VERB[verb]} size={size} className={className} label={verb} />;
}

/**
 * The seal, ringed with one gem socket per graded week, lit once the week is
 * cleared. An empty socket stays a dark hole, so what is left is as visible as
 * what is done.
 */
export function SealLedger({ sealed, total, size = 48, className }: { sealed: number; total: number; size?: number; className?: string }) {
  const n = Math.max(0, Math.min(sealed, total));
  const detail = size > 32;
  return (
    <Item3D float={false} tilt={detail} className={className}>
      <ArtSvg size={size} viewBox="-8 -8 116 116" label={`${n} of ${total} weeks sealed`}>
        {(u) => (
          <g>
            <g transform="translate(50 50) scale(.78) translate(-50 -50)">
              <Item u={u} kind="seal" detail={detail} />
            </g>
            {Array.from({ length: total }, (_, i) => {
              const a = -Math.PI / 2 + (i / Math.max(1, total)) * Math.PI * 2;
              const x = 50 + Math.cos(a) * 50;
              const y = 50 + Math.sin(a) * 50;
              const on = i < n;
              return (
                <g key={i}>
                  {on && <circle className="qa-breathe" cx={x} cy={y} r={11} fill={u('glow')} />}
                  <path
                    d={`M${x} ${y - 7} L${x + 6} ${y} L${x} ${y + 8} L${x - 6} ${y} Z`}
                    style={{ fill: on ? ACC : '#2a1f17' }}
                    stroke={OUT}
                    strokeWidth={2}
                    strokeLinejoin="round"
                  />
                  {on && <path d={`M${x} ${y - 7} L${x + 6} ${y} L${x} ${y} Z`} style={{ fill: ACC_LT }} opacity={0.8} />}
                </g>
              );
            })}
          </g>
        )}
      </ArtSvg>
    </Item3D>
  );
}

/** The relic, for a filed capstone. */
export function RelicTrophy({ size = 32, className }: { size?: number; className?: string }) {
  return <ItemIcon kind="relic" size={size} className={className} label="Capstone relic" float />;
}

export type MinerMood = 'idle' | 'strain' | 'happy';
const FACE: Record<MinerMood, Face> = { idle: 'idle', strain: 'strain', happy: 'proud' };

/** The miner as a mark — empty states, the pack header. */
export function MinerMark({ size = 96, mood = 'idle', swing = false, className }: { size?: number; mood?: MinerMood; swing?: boolean; className?: string }) {
  const pose = { ...REST, face: FACE[mood], ang: mood === 'happy' ? -50 : mood === 'strain' ? -75 : -15, lean: mood === 'happy' ? 7 : 0 };
  return (
    <Item3D float className={className}>
      <ArtSvg size={size} viewBox="-48 -104 100 112" label={`Miner, ${mood}`}>
        {(u) => (
          <g className={swing ? 'qa-float' : undefined}>
            <Miner u={u} pose={pose} />
          </g>
        )}
      </ArtSvg>
    </Item3D>
  );
}
