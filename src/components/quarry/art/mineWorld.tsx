import type { ReactNode } from 'react';
import type { U } from './defs';
import { ACC, ACC_LT, OUT } from './palette';
import { star } from './parts';

/**
 * The mine's backdrop, from the prototype's `buildWorld`: rock wall with
 * strata, ore veins with gold/copper/iron nuggets, a ragged ceiling with
 * stalactites and drips, gems embedded in the wall, support timbers with
 * lanterns, crystal clusters in the course's colour, the floor and the rails.
 *
 * Split in two, as the prototype does: `world` is drawn under the darkness,
 * `glow` above it — the lit copies of the gems, lanterns and crystals that
 * fade in, week by week, as the student finishes weeks (`lit`).
 */
export const W = 480;
export const GY = 202;
export const sx = (i: number, n: number) => (n === 1 ? 240 : 72 + i * (336 / (n - 1)));
export const sscale = (n: number) => (n <= 4 ? 1 : n <= 6 ? 0.8 : 0.64);

export function rngF(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NUG = { gold: ['#f6c945', '#fff0a6', '#a07914'], copper: ['#d9793a', '#ffc19a', '#7a3a14'], iron: ['#9aa5ad', '#e4ebf0', '#4d565d'] } as const;
const GEMCOL = [
  ['#ff5d73', '#ffc4cd'],
  ['#43e0a0', '#c4f7e2'],
  ['#5aa9ff', '#cfe3ff'],
  ['#b98cff', '#e6d8ff'],
  ['#ffd35a', '#fff0bf'],
];

function nugget(k: string, x: number, y: number, t: keyof typeof NUG, r: number) {
  const C = NUG[t];
  return (
    <g key={k}>
      <polygon points={`${x - r},${y} ${x - r * 0.4},${y - r} ${x + r * 0.8},${y - r * 0.6} ${x + r},${y + r * 0.3} ${x},${y + r}`} fill={C[0]} stroke={C[2]} strokeWidth={0.9} />
      <circle cx={x - r * 0.3} cy={y - r * 0.35} r={r * 0.32} fill={C[1]} />
    </g>
  );
}
function smallGem(k: string, x: number, y: number, c: string, lt: string, r: number) {
  return (
    <g key={k}>
      <path d={`M${x} ${y - r} L${x + r * 0.8} ${y} L${x} ${y + r * 1.1} L${x - r * 0.8} ${y} Z`} fill={c} stroke={OUT} strokeWidth={1} />
      <path d={`M${x} ${y - r} L${x + r * 0.8} ${y} L${x} ${y} Z`} fill={lt} opacity={0.8} />
    </g>
  );
}
function cluster(k: string, x: number, y: number, s: number, color: string, lt: string, dir: 1 | -1) {
  const P: [number, number, number][] = [
    [-8, 0.75, -18],
    [0, 1, -4],
    [8, 0.8, 14],
    [-3, 0.55, -34],
    [5, 0.5, 30],
  ];
  return (
    <g key={k}>
      <ellipse cx={x} cy={y} rx={12 * s} ry={3.6 * s} fill="#231810" />
      {P.map(([dx, h, a], i) => {
        const H = 26 * h * s;
        const Wd = 4.8 * s;
        return (
          <g key={i} transform={`translate(${x + dx * s} ${y}) rotate(${a * dir}) scale(1 ${dir})`}>
            <polygon points={`${-Wd},0 ${-Wd},${-H * 0.72} 0,${-H} ${Wd},${-H * 0.72} ${Wd},0`} style={{ fill: color }} stroke={OUT} strokeWidth={1.2} strokeLinejoin="round" />
            <polygon points={`${-Wd},0 ${-Wd},${-H * 0.72} 0,${-H} 0,0`} style={{ fill: lt }} opacity={0.55} />
            <line x1={0} y1={-1} x2={0} y2={-H + 1} stroke="#fff" strokeWidth={0.8} opacity={0.4} />
          </g>
        );
      })}
    </g>
  );
}

export function buildWorld(u: U, n: number): { world: ReactNode; glow: (lit: number) => ReactNode } {
  const rng = rngF(11 + n * 7);
  const W1: ReactNode[] = [];
  const G: { w: number; soft?: boolean; node: ReactNode }[] = [];
  const tw = (k: string, x: number, y: number, r: number, c = '#fff') => <path key={k} className="qa-twinkle" d={star(x, y, r)} fill={c} style={{ animationDelay: `${(x % 7) * 0.3}s` }} />;

  W1.push(<rect key="wall" width={W} height={232} fill="#1e160f" />);
  W1.push(<rect key="wall2" width={W} height={120} fill="#2b2017" opacity={0.6} />);
  for (let i = 0; i < 80; i++) {
    const x = rng() * W;
    const y = 30 + rng() * 170;
    W1.push(<ellipse key={`b${i}`} cx={x} cy={y} rx={4 + rng() * 13} ry={3 + rng() * 7} fill={rng() < 0.5 ? '#3a2c20' : '#120c08'} opacity={0.55} />);
  }
  [72, 118, 164].forEach((y, i) =>
    W1.push(<path key={`s${i}`} d={`M0 ${y} Q120 ${y - 10} 240 ${y + 4} T480 ${y - 6}`} stroke="#4a3828" strokeWidth={2} fill="none" opacity={0.45} />),
  );
  /* veins with nuggets */
  [
    [128, 0.9],
    [158, 1.1],
    [182, 0.8],
  ].forEach(([y0, amp], v) => {
    let d = `M-10 ${y0}`;
    const pts: [number, number][] = [];
    for (let x = 0; x <= 490; x += 35) {
      const y = y0 + Math.sin(x / 60 + v) * 8 * amp;
      d += ` L${x} ${y}`;
      pts.push([x, y]);
    }
    W1.push(<path key={`v${v}`} d={d} stroke="#5c3f24" strokeWidth={4} fill="none" opacity={0.75} strokeLinejoin="round" />);
    W1.push(<path key={`v2${v}`} d={d} stroke="#7a5530" strokeWidth={1.4} fill="none" opacity={0.6} />);
    pts.forEach(([x, y], k) => {
      if (rng() < 0.75) {
        const t = rng() < 0.3 ? 'gold' : rng() < 0.6 ? 'copper' : 'iron';
        W1.push(nugget(`n${v}-${k}`, x + rng() * 14 - 7, y + rng() * 6 - 3, t, 2.6 + rng() * 1.8));
        if (t === 'gold') G.push({ w: -1, soft: true, node: tw(`gt${v}-${k}`, x, y - 3, 3.2, '#fff2b0') });
      }
    });
  });
  /* ceiling + stalactites */
  let c = 'M0 0 L0 28';
  for (let x = 0; x <= W; x += 24) c += ` L${x} ${22 + rng() * 18}`;
  W1.push(<path key="ceil" d={`${c} L480 0 Z`} fill="#0f0a07" stroke="#3a2b1f" strokeWidth={1.5} />);
  for (let i = 0; i < 16; i++) {
    const x = rng() * W;
    const w = 4 + rng() * 6;
    const h = 8 + rng() * 20;
    W1.push(<path key={`st${i}`} d={`M${x - w} 30 L${x + w} 30 L${x} ${30 + h} Z`} fill="#1d150e" stroke="#3a2b1f" strokeWidth={1} />);
    if (rng() < 0.35) W1.push(<circle key={`dr${i}`} className="qa-drip" style={{ animationDelay: `${(rng() * 4).toFixed(2)}s` }} cx={x} cy={31 + h} r={1.2} fill="#9cc7e0" />);
  }
  /* embedded gems */
  for (let k = 0; k < n * 2 + 2; k++) {
    const x = 24 + rng() * 432;
    const y = 54 + rng() * 84;
    const col = GEMCOL[k % GEMCOL.length];
    const r = 3.6 + rng() * 2;
    W1.push(smallGem(`eg${k}`, x, y, col[0], col[1], r));
    G.push({
      w: k % n,
      node: (
        <g key={`egl${k}`}>
          <circle cx={x} cy={y} r={r * 3.4} fill={col[0]} opacity={0.55} filter={u('fbG')} />
          {smallGem(`egg${k}`, x, y, col[0], col[1], r)}
          {tw(`egt${k}`, x + r * 1.4, y - r * 1.4, 2.6)}
        </g>
      ),
    });
  }
  /* timbers + lanterns */
  const posts: { x: number; w: number }[] = [];
  for (let i = 0; i < n - 1; i++) posts.push({ x: (sx(i, n) + sx(i + 1, n)) / 2, w: i });
  const kept = n > 6 ? posts.filter((_, i) => i % 2 === 0) : posts;
  kept.push({ x: 10, w: -1 }, { x: 470, w: -1 });
  kept.forEach((p, i) => {
    W1.push(
      <g key={`t${i}`}>
        <rect x={p.x - 4} y={34} width={8} height={GY - 34} fill="#5a4129" stroke="#231810" strokeWidth={1.4} />
        <rect x={p.x - 2.6} y={34} width={2.2} height={GY - 34} fill="#7a5a38" />
        <rect x={p.x - 16} y={32} width={32} height={7} rx={1.5} fill="#5a4129" stroke="#231810" strokeWidth={1.4} />
        <path d={`M${p.x - 14} 39 L${p.x - 4} 52 M${p.x + 14} 39 L${p.x + 4} 52`} stroke="#4a3522" strokeWidth={3} />
        <line x1={p.x + 11} y1={39} x2={p.x + 11} y2={46} stroke="#2a1f16" strokeWidth={1} />
        <rect x={p.x + 7} y={46} width={8} height={10} rx={2} fill="#241a12" stroke="#6b5238" strokeWidth={1.2} />
      </g>,
    );
    const lx = p.x + 11;
    const ly = 52;
    G.push({
      w: p.w,
      soft: p.w < 0,
      node: (
        <g key={`lg${i}`}>
          <circle cx={lx} cy={ly - 1} r={20} fill={u('warm')} />
          <rect x={lx - 4} y={ly - 6} width={8} height={10} rx={2} fill="#ffdc8a" opacity={0.35} stroke="#b8894c" strokeWidth={1.2} />
          <path
            className="qa-flicker"
            d={`M${lx} ${ly - 4} C${lx - 2.4} ${ly} ${lx + 2.4} ${ly + 1} ${lx} ${ly + 3} C${lx + 3.2} ${ly + 1} ${lx + 2.6} ${ly - 2} ${lx} ${ly - 4} Z`}
            fill="#fff0b8"
          />
        </g>
      ),
    });
  });
  /* crystal clusters: two per week in the course colour, three decorative */
  for (let i = 0; i < n; i++) {
    const a: [number, number] = [sx(i, n) + rng() * 40 - 20, 112 + rng() * 14 - 7];
    const b: [number, number] = [sx(i, n) + (i % 2 ? 22 : -22) + rng() * 16 - 8, 38];
    W1.push(cluster(`ca${i}`, a[0], a[1], 0.72, ACC, ACC_LT, 1), cluster(`cb${i}`, b[0], b[1], 0.62, ACC, ACC_LT, -1));
    G.push({
      w: i,
      node: (
        <g key={`cg${i}`}>
          <circle cx={a[0]} cy={a[1] - 10} r={26} fill={u('glow')} filter={u('fbG')} />
          <circle cx={b[0]} cy={b[1] + 10} r={22} fill={u('glow')} filter={u('fbG')} />
          {cluster(`cag${i}`, a[0], a[1], 0.72, ACC, ACC_LT, 1)}
          {cluster(`cbg${i}`, b[0], b[1], 0.62, ACC, ACC_LT, -1)}
          {tw(`ct${i}`, a[0] + 6, a[1] - 20, 3)}
        </g>
      ),
    });
  }
  (
    [
      [18, 150, '#5fd6f0', '#d4f6fd', 1],
      [462, 142, '#b98cff', '#ecdfff', 1],
      [240, 36, '#5fd6f0', '#d4f6fd', -1],
    ] as [number, number, string, string, 1 | -1][]
  ).forEach(([x, y, c1, c2, d], i) => {
    W1.push(cluster(`dc${i}`, x, y, 0.55, c1, c2, d));
    G.push({
      w: -1,
      soft: true,
      node: (
        <g key={`dcg${i}`}>
          <circle cx={x} cy={y - 8 * d} r={18} fill={c1} opacity={0.5} filter={u('fbG')} />
          {cluster(`dcgg${i}`, x, y, 0.55, c1, c2, d)}
        </g>
      ),
    });
  });
  /* motes */
  for (let i = 0; i < 14; i++)
    G.push({
      w: -2,
      node: <circle key={`m${i}`} className="qa-mote" style={{ animationDelay: `${(rng() * 7).toFixed(2)}s` }} cx={rng() * W} cy={80 + rng() * 110} r={0.6 + rng() * 0.8} fill="#ffe9c0" opacity={0.5} />,
    });
  /* floor + rails */
  W1.push(<rect key="floor" x={0} y={GY - 2} width={W} height={232 - GY + 2} fill="#2a1d13" />);
  W1.push(<rect key="floor2" x={0} y={GY - 2} width={W} height={1.6} fill="#5c4530" />);
  for (let i = 0; i < 40; i++) {
    const x = rng() * W;
    const y = GY + 6 + rng() * 22;
    W1.push(<ellipse key={`f${i}`} cx={x} cy={y} rx={1.5 + rng() * 3} ry={1 + rng() * 2} fill={rng() < 0.5 ? '#3d2c1e' : '#1a120c'} />);
  }
  for (let x = 4; x < W; x += 14) W1.push(<rect key={`tie${x}`} x={x} y={GY - 4} width={8} height={10} rx={1} fill="#4a3322" stroke="#231810" strokeWidth={0.8} />);
  W1.push(
    <g key="rails">
      <rect x={0} y={GY - 4} width={W} height={1.6} fill="#8a9097" />
      <rect x={0} y={GY + 3} width={W} height={2.2} fill="#a4abb2" />
      <rect x={0} y={GY + 3} width={W} height={0.8} fill="#e3e8ec" />
    </g>,
  );
  W1.push(nugget('p1', 14, GY - 4, 'copper', 3.4), nugget('p2', 22, GY - 6, 'gold', 3.8), nugget('p3', 30, GY - 3, 'iron', 3.2));

  return {
    world: <g>{W1}</g>,
    glow: (lit: number) => (
      <g>
        {G.map((g, i) => (
          <g key={i} className={`qa-gw ${g.w === -2 ? 'lit' : g.soft ? 'soft' : g.w >= 0 && g.w < lit ? 'lit' : ''}`}>
            {g.node}
          </g>
        ))}
      </g>
    ),
  };
}
