'use client';

import { useId } from 'react';
import type { Level } from '@/lib/types';

/**
 * Quarry item icons — a curated port of the product owner's `quarryitemsv2.html`
 * prototype into React SVG components.
 *
 * Style contract (the prototype's "clarity pass"): every icon has a dark contour
 * outline so it reads on any background, and a literal, nameable silhouette —
 * a pick, a drill, a shield, a trophy — not an abstract mark.
 *
 * Colour: the neutral rock/metal/wood hexes are theme-independent and stay
 * hardcoded, exactly as the prototype defines them. The accent colours map onto
 * the live token cascade — the prototype's `--acc` → `var(--color-accent)`,
 * `--acc-lt` → `var(--stone-crystal)`, `--acc-dk` → `var(--color-accent-strong)` —
 * so every icon recolours per vendor region / course seam for free.
 *
 * Animations use the `qi-*` keyframes in globals.css; the global
 * prefers-reduced-motion block stills them all.
 *
 * What's ported and where it's used:
 *  - ToolTierIcon  — the 4 mining tools ↔ the 4 cert levels (Explore level bands)
 *  - WeekVerbIcon  — DEPLOY / OPERATE / HARDEN / DELIVER (course week headers)
 *  - SealLedger    — gem sockets in a stone face, filled = cleared graded week
 *                    (dashboard course cards, portfolio rows)
 *  - RelicTrophy   — the trophy gem, for a filed capstone (portfolio)
 */

// Neutral palette, straight from the prototype.
const OUT = '#070b0f';
const RK = { r0: '#1a222b', r1: '#242e39', r2: '#333f4c', r3: '#48586a', r4: '#5f7488', hi: '#b7ccdc' };
const MT = { m0: '#5c6672', m1: '#8a97a3', m2: '#bcc8d2', m3: '#eef3f8' };
const WD = { w0: '#8f6534', w1: '#c79b5e', w2: '#e3c58f' };

// Live-token accent mapping.
const ACC = 'var(--color-accent)';
const ACC_LT = 'var(--stone-crystal, #7aa2c8)';
const ACC_DK = 'var(--color-accent-strong)';

/** Heavy contour — the thing that makes an icon read on any background. */
const O = { stroke: OUT, strokeWidth: 2.5, strokeLinejoin: 'round' as const };
/** Light contour. */
const o = { stroke: OUT, strokeWidth: 1.6, strokeLinejoin: 'round' as const };

function Svg({ size, label, children, className }: { size: number; label: string; children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} role="img" aria-label={label}>
      {children}
    </svg>
  );
}

function TierDots({ n }: { n: number }) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={16 + i * 10} cy={90} r={3.4} fill={i < n ? ACC : RK.r2} {...o} />
      ))}
    </>
  );
}

/** The four mining tools, one per certification level. */
export function ToolTierIcon({ level, size = 24, className }: { level: Level; size?: number; className?: string }) {
  const tier = { entry: 1, associate: 2, professional: 3, expert: 4 }[level] ?? 1;
  const label = `${level} tier tool`;

  if (level === 'entry') {
    return (
      <Svg size={size} label={label} className={className}>
        <g className="qi-float">
          <rect x={46.5} y={26} width={7} height={52} rx={3} fill={WD.w1} {...O} />
          <rect x={48} y={26} width={2} height={52} fill={WD.w2} />
          <path d="M46 48 h8 M46 52 h8" stroke={WD.w0} strokeWidth={2} />
          <path d="M18 32 Q50 12 82 32 L74 38 Q50 24 26 38 Z" fill={MT.m1} {...O} />
          <path d="M20 31 Q50 14 80 31" stroke={MT.m2} strokeWidth={3} fill="none" />
          <rect x={43} y={20} width={14} height={13} rx={3} fill={MT.m0} {...O} />
        </g>
        <TierDots n={tier} />
      </Svg>
    );
  }
  if (level === 'associate') {
    return (
      <Svg size={size} label={label} className={className}>
        <g className="qi-float">
          <rect x={46.5} y={24} width={7} height={56} rx={3} fill={WD.w1} {...O} />
          <rect x={44} y={40} width={12} height={5} rx={2} fill={MT.m0} {...o} />
          <rect x={44} y={58} width={12} height={5} rx={2} fill={MT.m0} {...o} />
          <path d="M12 28 L46 22 L54 22 L88 28 L78 34 L54 30 L46 30 L22 34 Z" fill={MT.m2} {...O} />
          <path d="M14 28 L86 28" stroke={MT.m3} strokeWidth={2.4} />
          <rect x={42} y={16} width={16} height={16} rx={3} fill={MT.m1} {...O} />
          <circle cx={46} cy={20} r={1.4} fill={MT.m3} />
          <circle cx={54} cy={20} r={1.4} fill={MT.m3} />
        </g>
        <TierDots n={tier} />
      </Svg>
    );
  }
  if (level === 'professional') {
    return (
      <Svg size={size} label={label} className={className}>
        <g className="qi-float">
          <rect x={26} y={36} width={40} height={22} rx={6} fill={MT.m1} {...O} />
          <rect x={26} y={36} width={40} height={7} rx={3.5} fill={MT.m2} />
          <rect x={30} y={58} width={14} height={24} rx={4} fill={MT.m0} {...O} />
          <rect x={46} y={58} width={8} height={8} rx={2} fill={ACC} {...o} />
          <circle cx={34} cy={47} r={4.5} fill={ACC} className="qi-pulse" {...o} />
          <g className="qi-drill">
            <rect x={66} y={42} width={10} height={10} fill={MT.m0} {...o} />
            <rect x={76} y={44.5} width={14} height={5} fill={MT.m2} {...o} />
            <polygon points="90,42 98,47 90,52" fill={MT.m3} {...o} />
            <line x1={78} y1={47} x2={88} y2={47} stroke={MT.m0} strokeWidth={1.6} />
          </g>
          <g fill={ACC_LT}>
            <rect x={93} y={36} width={3} height={3} className="qi-sparkA" />
            <rect x={96} y={52} width={2.5} height={2.5} className="qi-sparkB" />
          </g>
        </g>
        <TierDots n={tier} />
      </Svg>
    );
  }
  return (
    <Svg size={size} label={label} className={className}>
      <g className="qi-float">
        <line x1={50} y1={24} x2={30} y2={72} stroke={MT.m1} strokeWidth={4} />
        <line x1={50} y1={24} x2={70} y2={72} stroke={MT.m1} strokeWidth={4} />
        <line x1={50} y1={24} x2={50} y2={70} stroke={MT.m2} strokeWidth={4} />
        <rect x={38} y={14} width={24} height={16} rx={4} fill={MT.m0} {...O} />
        <rect x={38} y={14} width={24} height={5} rx={2.5} fill={MT.m1} />
        <circle cx={50} cy={22} r={4} fill={ACC} className="qi-pulse" {...o} />
        <rect x={47.5} y={30} width={5} height={40} fill={ACC} opacity={0.8} className="qi-glow" />
        <rect x={46} y={30} width={8} height={40} fill={ACC_LT} opacity={0.25} className="qi-glow" />
        <polygon points="26,86 74,86 66,72 34,72" fill={RK.r1} {...O} />
        <circle cx={50} cy={72} r={6} fill={ACC_LT} className="qi-core" />
        <g fill="#fff">
          <rect x={44} y={64} width={3} height={3} className="qi-sparkA" />
          <rect x={55} y={66} width={2.5} height={2.5} className="qi-sparkC" />
        </g>
      </g>
      <TierDots n={tier} />
    </Svg>
  );
}

export type WeekVerb = 'deploy' | 'operate' | 'harden' | 'deliver';

/** The week's job, as a literal object: rocket, monitor, shield, sealed plinth. */
export function WeekVerbIcon({ verb, size = 22, className }: { verb: WeekVerb; size?: number; className?: string }) {
  if (verb === 'deploy') {
    return (
      <Svg size={size} label="Deploy — it exists and it runs" className={className}>
        <rect x={20} y={58} width={60} height={26} rx={5} fill={RK.r3} {...O} />
        <circle cx={32} cy={71} r={4.5} fill={ACC} className="qi-pulse" {...o} />
        <g stroke={RK.r4} strokeWidth={2.6}>
          <line x1={44} y1={66} x2={70} y2={66} />
          <line x1={44} y1={76} x2={62} y2={76} />
        </g>
        <g className="qi-float">
          <path d="M50 8 L66 36 H34 Z" fill={ACC} {...O} />
          <rect x={44} y={34} width={12} height={18} rx={2} fill={ACC_DK} {...o} />
          <path d="M40 52 l-6 10 M60 52 l6 10" stroke={ACC_LT} strokeWidth={3} strokeLinecap="round" className="qi-glow" />
        </g>
      </Svg>
    );
  }
  if (verb === 'operate') {
    return (
      <Svg size={size} label="Operate — it does real work" className={className}>
        <rect x={12} y={20} width={76} height={56} rx={6} fill={RK.r1} {...O} />
        <rect x={12} y={20} width={76} height={10} rx={5} fill={RK.r3} />
        <circle cx={20} cy={25} r={2} fill={ACC} />
        <circle cx={27} cy={25} r={2} fill={RK.r4} />
        <polyline
          points="20,62 34,62 42,42 52,70 60,50 68,62 82,62"
          fill="none"
          stroke={ACC}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={52} cy={70} r={4.5} fill={ACC_LT} className="qi-pulse" />
        <rect x={38} y={84} width={24} height={5} rx={2.5} fill={RK.r3} />
      </Svg>
    );
  }
  if (verb === 'harden') {
    return (
      <Svg size={size} label="Harden — weaknesses closed" className={className}>
        <path d="M50 8 L84 22 V52 C84 72 69 85 50 92 C31 85 16 72 16 52 V22 Z" fill={RK.r2} {...O} />
        <path d="M50 8 L84 22 V52 C84 72 69 85 50 92 Z" fill={RK.r1} />
        <path d="M36 50 l10 10 l20 -22" stroke={ACC} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M50 12 L80 24 V52 C80 69 67 81 50 87 C33 81 20 69 20 52 V24 Z" fill="none" stroke={ACC_LT} strokeWidth={2} className="qi-glow" />
      </Svg>
    );
  }
  return (
    <Svg size={size} label="Deliver — proven and handed over" className={className}>
      <rect x={18} y={80} width={64} height={8} rx={3} fill={ACC} {...O} />
      <rect x={26} y={73} width={48} height={7} rx={2.5} fill={ACC_DK} {...o} />
      <g className="qi-float">
        <polygon points="50,18 70,30 70,54 50,66 30,54 30,30" fill={RK.r2} {...O} />
        <polygon points="50,18 70,30 50,42" fill={RK.r4} />
        <polygon points="50,34 58,38 58,46 50,50 42,46 42,38" fill={ACC} {...o} className="qi-core" />
        <circle cx={50} cy={42} r={26} fill="none" stroke={ACC_LT} strokeWidth={2} className="qi-ring" />
      </g>
      <g fill="#fff">
        <rect x={26} y={26} width={3} height={3} className="qi-sparkA" />
        <rect x={70} y={58} width={3} height={3} className="qi-sparkB" />
      </g>
    </Svg>
  );
}

/**
 * Gem sockets cut into a stone face — one per graded week, filled once the week
 * is cleared. An empty socket reads as a hole with the week number in it, so
 * "what's left" is as visible as "what's done".
 */
export function SealLedger({ sealed, total, size = 48, className }: { sealed: number; total: number; size?: number; className?: string }) {
  const uid = useId();
  const glowId = `qi-seal-${uid}`;
  const n = Math.max(0, Math.min(sealed, total));
  // Socket layout: 2 columns up to 4 sockets, 3 columns up to 6.
  const cols = total <= 4 ? 2 : 3;
  const rows = Math.max(1, Math.ceil(total / cols));
  const pos: [number, number][] = Array.from({ length: total }, (_, i) => {
    const c = i % cols, r = Math.floor(i / cols);
    return [50 + (c - (cols - 1) / 2) * 26, 52 + (r - (rows - 1) / 2) * 22];
  });

  return (
    <Svg size={size} label={`${n} of ${total} weeks sealed`} className={className}>
      <defs>
        <radialGradient id={glowId} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={ACC_LT} />
          <stop offset="1" stopColor={ACC} stopOpacity="0" />
        </radialGradient>
      </defs>
      <polygon points="50,18 73,27 82,50 73,73 50,82 27,73 18,50 27,27" fill={RK.r1} {...O} />
      <polygon points="50,18 73,27 50,50" fill={RK.r2} />
      <polygon points="27,27 50,18 50,50" fill={RK.r2} opacity={0.7} />
      {pos.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={9.5} fill={RK.r0} {...o} />
          {i < n ? (
            <>
              <circle cx={x} cy={y} r={12} fill={`url(#${glowId})`} className="qi-core" style={{ animationDelay: `${i * 0.3}s` }} />
              <polygon
                points={`${x},${y - 7} ${x + 6.4},${y - 3} ${x + 6.4},${y + 3} ${x},${y + 7} ${x - 6.4},${y + 3} ${x - 6.4},${y - 3}`}
                fill={ACC}
                {...o}
              />
              <polygon points={`${x},${y - 7} ${x + 6.4},${y - 3} ${x},${y}`} fill={ACC_LT} />
              <rect x={x - 2} y={y - 4} width={2.4} height={2.4} fill="#fff" className="qi-pulse" />
            </>
          ) : (
            <text x={x} y={y + 3.5} textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize={10} fill={RK.r3}>
              {i + 1}
            </text>
          )}
        </g>
      ))}
    </Svg>
  );
}

/** The trophy gem — a capstone delivered and kept. */
export function RelicTrophy({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Svg size={size} label="Capstone delivered" className={className}>
      <g className="qi-float">
        <path d="M32 26 h36 v10 c0 12 -8 19 -18 19 c-10 0 -18 -7 -18 -19 Z" fill={MT.m2} {...O} />
        <path d="M32 26 h36 v5 h-36 Z" fill={MT.m3} />
        <path d="M32 30 h-8 c0 10 4 15 10 16 M68 30 h8 c0 10 -4 15 -10 16" stroke={MT.m1} strokeWidth={3.5} fill="none" />
        <rect x={45} y={55} width={10} height={9} fill={MT.m1} {...o} />
        <rect x={36} y={64} width={28} height={7} rx={2} fill={MT.m0} {...O} />
        <polygon points="50,14 58,19 58,27 50,32 42,27 42,19" fill={ACC} {...o} className="qi-core" />
        <polygon points="50,14 58,19 50,23" fill={ACC_LT} />
      </g>
      <rect x={30} y={80} width={40} height={8} rx={2} fill={RK.r2} {...O} />
      <rect x={34} y={74} width={32} height={6} rx={2} fill={RK.r3} {...o} />
      <g fill="#fff">
        <rect x={28} y={20} width={3.5} height={3.5} className="qi-sparkA" />
        <rect x={70} y={30} width={3} height={3} className="qi-sparkB" />
        <rect x={62} y={10} width={2.5} height={2.5} className="qi-sparkC" />
      </g>
    </Svg>
  );
}

/** Map a week's stone stage to its verb icon; planning weeks get none. */
export function verbForStage(stage: number | undefined): WeekVerb | null {
  if (stage === 2) return 'deploy';
  if (stage === 3) return 'operate';
  if (stage === 4) return 'harden';
  if (stage === 5) return 'deliver';
  return null;
}
