'use client';

import type { U } from './defs';
import { ACC, ACC_DK, ACC_LT, OUT, type GemCut } from './palette';

/**
 * The four characters of the quarry art — Gem, Stone, Miner, Pebble — ported
 * from the product owner's `quarry-mine-progression` prototype.
 *
 * Every part is an SVG `<g>` in its own coordinate box; the caller positions it.
 * Depth is the prototype's five layers (cast shadow → contact shadow → body
 * gradient → bevel → specular) plus, new in R80, an EXTRUDED side face on the
 * stone and the gem: a darker copy of the silhouette pushed down-right under
 * the body, which is what reads as thickness rather than a sticker.
 */

export const star = (x: number, y: number, r: number) =>
  `M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} Z`;

/* ── Gem ────────────────────────────────────────────────────────────────── */

const CUTS: Record<GemCut, { f: string; t: string }> = {
  shield: { f: 'M50 20 L74 30 V52 C74 66 63 76 50 82 C37 76 26 66 26 52 V30 Z', t: 'M50 20 L74 30 L50 40 L26 30 Z' },
  hex: { f: 'M50 18 L76 33 V63 L50 78 L24 63 V33 Z', t: 'M50 18 L76 33 L50 46 L24 33 Z' },
  bar: { f: 'M30 22 H70 V78 H30 Z', t: 'M30 22 H70 L60 34 H40 Z' },
  rack: { f: 'M26 24 H74 V76 H26 Z M32 34 H68 M32 46 H68 M32 58 H68', t: 'M26 24 H74 L64 32 H36 Z' },
  cloud: { f: 'M32 70 a16 16 0 0 1 2 -30 a20 20 0 0 1 36 4 a14 14 0 0 1 -2 26 Z', t: 'M34 40 a20 20 0 0 1 36 4 L50 50 Z' },
  quad: { f: 'M24 24 H76 V76 H24 Z', t: 'M24 24 H76 L50 44 Z' },
  round: { f: 'M50 20 A28 30 0 1 1 49.9 20 Z', t: 'M50 20 A28 30 0 0 1 78 46 L50 50 Z' },
};

/** A cert gem in a 100×100 box. `silhouette` is the empty slot's shape. */
export function Gem({ u, cut, silhouette = false, detail = true }: { u: U; cut: GemCut; silhouette?: boolean; detail?: boolean }) {
  const C = CUTS[cut];
  const body = cut === 'rack' ? 'M26 24 H74 V76 H26 Z' : C.f;
  if (silhouette) return <path d={body} fill="#2a1f17" stroke="#3b2d21" strokeWidth={3} strokeLinejoin="round" />;
  return (
    <g>
      {/* thickness: the same cut, pushed down-right, in the gem's dark */}
      <path d={body} transform="translate(3 4)" style={{ fill: ACC_DK }} stroke={OUT} strokeWidth={3.2} strokeLinejoin="round" />
      <path d={body} fill={u('gem')} stroke={OUT} strokeWidth={3.2} strokeLinejoin="round" />
      {cut === 'rack' && <path d="M32 36 H68 M32 48 H68 M32 60 H68" style={{ stroke: ACC_LT }} strokeWidth={2.4} opacity={0.8} />}
      {detail && <path d={C.t} fill="#fff" opacity={0.38} />}
      {detail && (
        <path d={body} fill="none" style={{ stroke: ACC_LT }} strokeWidth={1.6} opacity={0.75} transform="translate(50 50) scale(.8) translate(-50 -50)" />
      )}
      <ellipse cx={41} cy={34} rx={9} ry={6.5} fill={u('spec')} />
      {detail && <circle cx={62} cy={63} r={2.2} fill="#fff" opacity={0.75} />}
    </g>
  );
}

/* ── Stone ──────────────────────────────────────────────────────────────── */

const BOULDER = 'M-27 0 L-31 -20 L-20 -40 L2 -47 L23 -38 L30 -17 L25 0 Z';
const HALF_L = 'M-27 0 L-31 -20 L-20 -40 L2 -47 L-3 -30 L3 -16 L-2 0 Z';
const HALF_R = 'M-2 0 L3 -16 L-3 -30 L2 -47 L23 -38 L30 -17 L25 0 Z';

/** 0 intact · 1 chipped · 2 cracked (light leaks) · 3 open · 4 spent */
export type StoneState = 0 | 1 | 2 | 3 | 4;

/** A boulder, origin at its base centre, about 62 wide and 50 tall. */
export function Stone({ u, state }: { u: U; state: StoneState }) {
  const shadows = (
    <>
      <ellipse cx={11} cy={1.5} rx={32} ry={5.5} fill="#000" opacity={0.38} filter={u('fb2')} />
      <ellipse cx={0} cy={0} rx={25} ry={3.6} fill="#000" opacity={0.55} filter={u('fb1')} />
    </>
  );
  if (state <= 2) {
    return (
      <g>
        {shadows}
        {/* extruded side face */}
        <path d={BOULDER} transform="translate(4 3)" fill={u('rockside')} stroke={OUT} strokeWidth={2.2} strokeLinejoin="round" />
        <path d={BOULDER} fill={u('rock')} stroke={OUT} strokeWidth={2.2} strokeLinejoin="round" />
        <path d="M-27 0 L-31 -20 L-20 -40 L2 -47 L0 0 Z" fill="#fff" opacity={0.07} />
        <path d="M-29 -21 L-19 -39 L1 -45" stroke="#fff" strokeWidth={1.7} fill="none" opacity={0.38} strokeLinecap="round" />
        <ellipse cx={-12} cy={-31} rx={9} ry={6} fill={u('spec')} opacity={0.7} />
        <g fill="#2f241b" opacity={0.6}>
          <circle cx={10} cy={-26} r={2} />
          <circle cx={16} cy={-12} r={1.6} />
          <circle cx={-16} cy={-12} r={1.4} />
        </g>
        <circle cx={-3} cy={-22} r={2.4} style={{ fill: ACC }} opacity={0.35 + state * 0.25} />
        {state >= 1 && (
          <>
            <path d="M-31 -20 L-21 -18 L-25 -8 L-29 -9 Z" fill="#20160e" />
            <path d="M-21 -18 L-11 -22 L-6 -15" stroke={OUT} strokeWidth={1.6} fill="none" strokeLinecap="round" />
          </>
        )}
        {state >= 2 && (
          <>
            <path
              d="M-11 -22 L-2 -34 L5 -30 M-6 -15 L4 -9 L12 -14 M-2 -34 L2 -45"
              style={{ stroke: ACC_LT }}
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
            />
            <circle className="qa-breathe" cx={-3} cy={-22} r={10} fill={u('glow')} opacity={0.55} />
          </>
        )}
      </g>
    );
  }
  const off = state === 3 ? 7 : 14;
  const rot = state === 3 ? 8 : 16;
  const lip = { style: { stroke: ACC_LT }, strokeWidth: 2, fill: 'none', strokeLinecap: 'round' as const };
  return (
    <g>
      {shadows}
      <g opacity={state === 4 ? 0.72 : 1}>
        <g transform={`translate(${-off} 0) rotate(${-rot} -2 0)`}>
          <path d={HALF_L} transform="translate(3 3)" fill={u('rockside')} stroke={OUT} strokeWidth={2.2} strokeLinejoin="round" />
          <path d={HALF_L} fill={u('rock')} stroke={OUT} strokeWidth={2.2} strokeLinejoin="round" />
          <path d="M2 -47 L-3 -30 L3 -16 L-2 0" {...lip} />
          <path d="M-29 -21 L-19 -39 L1 -45" stroke="#fff" strokeWidth={1.7} fill="none" opacity={0.35} />
        </g>
        <g transform={`translate(${off} 0) rotate(${rot} -2 0)`}>
          <path d={HALF_R} transform="translate(3 3)" fill={u('rockside')} stroke={OUT} strokeWidth={2.2} strokeLinejoin="round" />
          <path d={HALF_R} fill={u('rock')} stroke={OUT} strokeWidth={2.2} strokeLinejoin="round" />
          <path d="M2 -47 L-3 -30 L3 -16 L-2 0" {...lip} />
        </g>
      </g>
      {state === 3 && <circle className="qa-breathe" cx={0} cy={-22} r={18} fill={u('glow')} />}
      {state === 4 && (
        <g fill="#4a3a2c" stroke={OUT} strokeWidth={1.2}>
          <path d="M-6 0 l3 -5 l5 1 l1 4 Z" />
          <path d="M6 0 l2 -4 l4 0 l1 4 Z" />
        </g>
      )}
    </g>
  );
}

/* ── Miner ──────────────────────────────────────────────────────────────── */

export type Face = 'idle' | 'focused' | 'strain' | 'proud';
export interface MinerPose {
  /** Pick angle in degrees: -15 rest, -75 wind-up, 100 strike, -50 inspect. */
  ang: number;
  sqx: number;
  sqy: number;
  /** Head lean in degrees. */
  lean: number;
  /** Hat bob offset. */
  hat: number;
  face: Face;
  /** Walk frame, or null standing. */
  walk: 0 | 1 | null;
}
export const REST: MinerPose = { ang: -15, sqx: 1, sqy: 1, lean: 0, hat: 0, face: 'idle', walk: null };

function Eye({ u, cx, tilt, lid }: { u: U; cx: number; tilt: number; lid: number }) {
  const rx = 10.6;
  const ry = 11.6;
  const y = -44;
  return (
    <g transform={`rotate(${tilt} ${cx} ${y})`}>
      <ellipse cx={cx} cy={y} rx={rx} ry={ry} fill="#fff" stroke={OUT} strokeWidth={2.6} />
      <ellipse cx={cx} cy={y - 0.8} rx={rx * 0.8} ry={ry * 0.8} fill={u('iris')} />
      <ellipse cx={cx} cy={y + 0.6} rx={rx * 0.4} ry={ry * 0.42} fill="#1a110a" />
      <ellipse cx={cx - rx * 0.36} cy={y - ry * 0.48} rx={3.5} ry={3} fill="#fff" />
      <circle cx={cx + rx * 0.4} cy={y + ry * 0.38} r={1.6} fill="#fff" opacity={0.9} />
      {lid > 0 && (
        <>
          <rect x={cx - rx - 2} y={y - ry - 3} width={rx * 2 + 4} height={ry * lid * 2 + 3} fill="#f4c69c" />
          <path d={`M${cx - rx} ${y - ry + ry * lid * 2} h${rx * 2}`} stroke={OUT} strokeWidth={2.6} strokeLinecap="round" />
        </>
      )}
    </g>
  );
}

function FaceArt({ u, face }: { u: U; face: Face }) {
  const blush = (o: number) => (
    <>
      <ellipse cx={-21} cy={-33} rx={4.6} ry={3} fill="#f59aa6" opacity={o} />
      <ellipse cx={21} cy={-33} rx={4.6} ry={3} fill="#f59aa6" opacity={o} />
    </>
  );
  if (face === 'strain')
    return (
      <>
        <path d="M-20 -49 L-8 -44 L-20 -39" stroke={OUT} strokeWidth={3.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 -49 L8 -44 L20 -39" stroke={OUT} strokeWidth={3.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x={-6.5} y={-31} width={13} height={5.4} rx={2.7} fill={OUT} />
        <path d="M-2 -31 v5.4 M2 -31 v5.4" stroke="#fff" strokeWidth={1.1} />
        {blush(0.5)}
      </>
    );
  if (face === 'proud')
    return (
      <>
        <path d="M-19.5 -42 q8 -11 16 0" stroke={OUT} strokeWidth={3.8} fill="none" strokeLinecap="round" />
        <path d="M3.5 -42 q8 -11 16 0" stroke={OUT} strokeWidth={3.8} fill="none" strokeLinecap="round" />
        <path d="M-6.5 -31 q6.5 9 13 0 Z" fill={OUT} />
        <path d="M-3.6 -27.4 q3.6 3 7.2 0 Z" fill="#e8798a" />
        {blush(0.8)}
      </>
    );
  const lid = face === 'focused' ? 0.36 : 0;
  return (
    <>
      <Eye u={u} cx={-11.5} tilt={8} lid={lid} />
      <Eye u={u} cx={11.5} tilt={-8} lid={lid} />
      {blush(face === 'focused' ? 0.35 : 0.6)}
      {face === 'focused' ? (
        <path d="M-4 -27 h8" stroke={OUT} strokeWidth={2.6} strokeLinecap="round" />
      ) : (
        <path d="M-4 -28 q4 4.5 8 0" stroke={OUT} strokeWidth={2.6} fill="none" strokeLinecap="round" />
      )}
    </>
  );
}

/** The miner, origin at his feet, facing right, about 70 wide × 100 tall. */
export function Miner({ u, pose }: { u: U; pose: MinerPose }) {
  const o = { stroke: OUT, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const om = { ...o, strokeWidth: 2.2 };
  let fl: [number, number] = [-7, 0];
  let fr: [number, number] = [7, 0];
  if (pose.walk === 0) {
    fl = [-10, -5];
    fr = [6, 0];
  } else if (pose.walk === 1) {
    fl = [-6, 0];
    fr = [10, -5];
  }
  return (
    <g>
      <ellipse cx={4} cy={1} rx={26} ry={4} fill="#000" opacity={0.42} filter={u('fb2')} />
      <g transform={`rotate(${pose.ang.toFixed(2)} 15 -20)`}>
        <rect x={12.5} y={-66} width={5} height={48} rx={2.5} fill={u('wood')} {...om} />
        <path d="M-5 -66 Q15 -82 35 -66 L31 -60 Q15 -72 -1 -60 Z" fill={u('metal')} {...o} />
        <path d="M-2 -65 Q15 -78 32 -65" stroke="#fff" strokeWidth={1.4} fill="none" opacity={0.6} />
        <rect x={9} y={-71} width={12} height={10} rx={3} fill="#6f7880" {...om} />
      </g>
      <g transform={`scale(${pose.sqx.toFixed(3)} ${pose.sqy.toFixed(3)})`}>
        <ellipse cx={fl[0]} cy={fl[1] - 3} rx={7.4} ry={5.2} fill="#553a26" {...o} />
        <ellipse cx={fr[0]} cy={fr[1] - 3} rx={7.4} ry={5.2} fill="#553a26" {...o} />
        <circle cx={-14} cy={-20} r={5.2} style={{ fill: ACC_DK }} {...o} />
        <circle cx={0} cy={-17} r={13} fill={u('acc')} {...o} />
        <path d="M-11.6 -12 a13 13 0 0 0 23.2 0 a12 6 0 0 1 -23.2 0 Z" style={{ fill: ACC_DK }} opacity={0.42} />
        <ellipse cx={-5} cy={-23} rx={4.2} ry={3} fill="#fff" opacity={0.38} />
        <circle cx={0} cy={-14.5} r={4.2} fill="#f4e8d4" {...om} />
        <circle cx={15} cy={-20} r={5.6} fill="#dcb68c" {...o} />
        <g transform={`rotate(${pose.lean.toFixed(2)} 0 -26)`}>
          <circle cx={0} cy={-52} r={30} fill={u('skin')} {...o} />
          <path d="M-27 -43 a30 30 0 0 0 54 0 a28 13 0 0 1 -54 0 Z" fill="#c98e62" opacity={0.32} />
          <ellipse cx={-12} cy={-60} rx={7} ry={5} fill={u('spec')} opacity={0.7} />
          <FaceArt u={u} face={pose.face} />
          <g transform={`translate(0 ${pose.hat.toFixed(2)})`}>
            <path d="M-33 -63 A33 33 0 0 1 33 -63 Z" fill={u('hat')} {...o} />
            <path d="M-20 -80 a21 17 0 0 1 22 -10" stroke="#fff6d8" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />
            <rect x={-36} y={-66} width={72} height={8.4} rx={4.2} fill="#c28d1f" {...o} />
            <rect x={-3} y={-97} width={6} height={18} rx={3} fill="#c28d1f" {...om} />
            <circle cx={22} cy={-73} r={6.6} fill="#fff4c2" {...o} />
            <circle cx={20} cy={-75} r={2.3} fill="#fff" />
          </g>
        </g>
      </g>
    </g>
  );
}

/* ── Pebble ─────────────────────────────────────────────────────────────── */

export const PEBBLE_NAMES = ['Pebble', 'Geode', 'Crystal', 'Lumen'] as const;
export type PebbleStage = 0 | 1 | 2 | 3;

/** Weeks done → evolution stage: start · early · three-quarters · all. */
export function pebbleStage(done: number, total: number): PebbleStage {
  if (done <= 0 || total <= 0) return 0;
  if (done >= total) return 3;
  return done / total >= 0.75 ? 2 : 1;
}

/** The companion, origin at its base centre, about 24 wide. */
export function Pebble({ u, stage }: { u: U; stage: PebbleStage }) {
  const r = [8, 9, 10, 10.5][stage];
  const cy = -r;
  const spikes = [0, 0, 3, 5][stage];
  return (
    <g>
      <ellipse cx={0} cy={0} rx={r * 1.1} ry={2.4} fill="#000" opacity={0.45} filter={u('fb1')} />
      {Array.from({ length: spikes }, (_, k) => {
        const a = ((-150 + k * (120 / Math.max(1, spikes - 1))) * Math.PI) / 180;
        const bx = Math.cos(a) * r * 0.9;
        const by = cy + Math.sin(a) * r * 0.9;
        return (
          <path
            key={k}
            d={`M${bx - 2.6} ${by} L${bx + Math.cos(a) * 8} ${by + Math.sin(a) * 8} L${bx + 2.6} ${by} Z`}
            style={{ fill: ACC }}
            stroke={OUT}
            strokeWidth={1.3}
            strokeLinejoin="round"
          />
        );
      })}
      <circle cx={1.6} cy={cy + 1.6} r={r} fill={u('rockside')} stroke={OUT} strokeWidth={2} />
      <circle cx={0} cy={cy} r={r} fill={u('rock')} stroke={OUT} strokeWidth={2} />
      <ellipse cx={-r * 0.35} cy={cy - r * 0.4} rx={r * 0.38} ry={r * 0.28} fill={u('spec')} opacity={0.75} />
      {stage >= 1 && (
        <path d={`M${-r * 0.6} ${cy + 1} l${r * 0.5} ${r * 0.3} l${-r * 0.2} ${r * 0.4}`} style={{ stroke: ACC_LT }} strokeWidth={1.5} fill="none" />
      )}
      {stage >= 2 && <circle className="qa-breathe" cx={0} cy={cy + 2} r={r * 0.5} fill={u('glow')} />}
      <circle cx={-3.4} cy={cy - 1} r={2.7} fill="#fff" stroke={OUT} strokeWidth={1.1} />
      <circle cx={3.4} cy={cy - 1} r={2.7} fill="#fff" stroke={OUT} strokeWidth={1.1} />
      <circle cx={-3.2} cy={cy - 0.5} r={1.6} fill={OUT} />
      <circle cx={3.6} cy={cy - 0.5} r={1.6} fill={OUT} />
      <circle cx={-2.7} cy={cy - 1.6} r={0.7} fill="#fff" />
      <circle cx={4.1} cy={cy - 1.6} r={0.7} fill="#fff" />
      <path d={`M-1.6 ${cy + 3} q1.6 1.6 3.2 0`} stroke={OUT} strokeWidth={1.1} fill="none" strokeLinecap="round" />
      {stage === 3 && (
        <path
          d={`M-6 ${cy - r - 1} l2.4 -5 l2.2 3 l1.4 -5 l1.4 5 l2.2 -3 l2.4 5 Z`}
          fill="#ffe08a"
          stroke={OUT}
          strokeWidth={1.1}
          strokeLinejoin="round"
        />
      )}
    </g>
  );
}
