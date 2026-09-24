'use client';

import type { U } from './defs';
import { ACC, ACC_DK, OUT, type GemCut } from './palette';
import { Gem, star } from './parts';

/**
 * The item set, ported from the product owner's `quarry-items-inventory`
 * prototype: tools (one per cert level), the five week slots (pick → ore →
 * facet → seal → relic), materials and gear. Every item draws in a 100×100 box
 * with the same five depth layers as the mine, from one light at the upper left.
 *
 * `detail={false}` drops the fine layers (bevels, speculars, sparkles) for
 * sizes of 32 px and below, where they would render as noise.
 */
export type ItemKind =
  | 'hand'
  | 'steel'
  | 'drill'
  | 'rig'
  | 'ore'
  | 'facet'
  | 'seal'
  | 'relic'
  | 'gold'
  | 'copper'
  | 'iron'
  | 'shard'
  | 'geode'
  | 'helmet'
  | 'lantern'
  | 'cart'
  | 'map'
  | 'ledger';

const O3 = { stroke: OUT, strokeWidth: 3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const O2 = { ...O3, strokeWidth: 2.2 };
const O1 = { ...O3, strokeWidth: 1.4 };

export function Item({ u, kind, cut = 'shield', detail = true }: { u: U; kind: ItemKind; cut?: GemCut; detail?: boolean }) {
  const shadow = (cx: number, cy: number, rx: number) => (
    <>
      <ellipse cx={cx + rx * 0.32} cy={cy + 1.5} rx={rx * 1.12} ry={rx * 0.2} fill="#000" opacity={0.45} filter={u('fb2')} />
      <ellipse cx={cx} cy={cy} rx={rx * 0.78} ry={Math.max(2, rx * 0.13)} fill="#000" opacity={0.6} filter={u('fb1')} />
    </>
  );
  const spec = (cx: number, cy: number, rx: number, ry?: number) =>
    detail ? <ellipse cx={cx} cy={cy} rx={rx} ry={ry ?? rx * 0.72} fill={u('spec')} /> : null;
  const bev = (d: string) =>
    detail ? <path d={d} stroke="#fff" strokeWidth={1.8} fill="none" opacity={0.48} strokeLinecap="round" strokeLinejoin="round" /> : null;
  const tw = (x: number, y: number, r: number) => (detail ? <path className="qa-twinkle" d={star(x, y, r)} fill="#fff" /> : null);
  const prism = (x: number, y: number, h: number, w: number, a: number) => (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      <polygon points={`${-w},0 ${-w},${-h * 0.72} 0,${-h} ${w},${-h * 0.72} ${w},0`} fill={u('gem')} {...O1} />
      {detail && <polygon points={`${-w},0 ${-w},${-h * 0.72} 0,${-h} 0,0`} fill="#fff" opacity={0.45} />}
    </g>
  );
  const gemAt = (x: number, y: number, k: number) => (
    <g transform={`translate(${x} ${y}) scale(${k}) translate(-50 -50)`}>
      <Gem u={u} cut={cut} detail={detail} />
    </g>
  );
  /** Thickness for flat items: the body silhouette, offset and darkened. */
  const slab = (d: string, fill = '#2a1d13') => <path d={d} transform="translate(3 3.5)" fill={fill} {...O3} />;

  switch (kind) {
    case 'hand':
      return (
        <g>
          {shadow(50, 86, 24)}
          <g transform="rotate(35 50 55)">
            <rect x={47} y={30} width={6} height={56} rx={3} fill={u('wood')} {...O2} />
            {detail && <rect x={48.2} y={33} width={1.6} height={50} rx={0.8} fill="#fff" opacity={0.35} />}
            {slab('M22 31 Q50 12 78 31 L73 38 Q50 23 27 38 Z', '#4d565d')}
            <path d="M22 31 Q50 12 78 31 L73 38 Q50 23 27 38 Z" fill={u('metal')} {...O3} />
            {bev('M26 30 Q50 16 74 30')}
            <rect x={43} y={22} width={14} height={13} rx={3.5} fill="#6f7880" {...O2} />
            {spec(34, 26, 7)}
          </g>
        </g>
      );
    case 'steel':
      return (
        <g>
          {shadow(52, 86, 26)}
          <g transform="rotate(35 50 55)">
            <rect x={46.5} y={26} width={7} height={60} rx={3.5} fill={u('wood')} {...O2} />
            {detail && (
              <g style={{ fill: ACC }}>
                <rect x={46} y={64} width={8} height={4} rx={1.5} />
                <rect x={46} y={71} width={8} height={4} rx={1.5} />
                <rect x={46} y={78} width={8} height={4} rx={1.5} />
              </g>
            )}
            {slab('M14 28 Q50 4 86 28 L80 37 Q50 17 20 37 Z', '#4d565d')}
            <path d="M14 28 Q50 4 86 28 L80 37 Q50 17 20 37 Z" fill={u('metal')} {...O3} />
            {bev('M19 27 Q50 9 81 27')}
            <rect x={41} y={17} width={18} height={16} rx={4} fill="#5d666e" {...O2} />
            <circle cx={50} cy={25} r={3.6} style={{ fill: ACC }} {...O1} />
            {spec(32, 23, 7)}
          </g>
        </g>
      );
    case 'drill':
      return (
        <g>
          {shadow(50, 86, 24)}
          <g transform="rotate(-24 50 56)">
            <rect x={43} y={49} width={20} height={36} rx={6} style={{ fill: ACC_DK }} {...O3} />
            <rect x={40} y={46} width={20} height={36} rx={6} fill={u('acc')} {...O3} />
            {detail && <rect x={43} y={60} width={14} height={16} rx={3} fill="#000" opacity={0.22} />}
            <rect x={35} y={30} width={30} height={19} rx={6} fill={u('metal')} {...O3} />
            {detail && (
              <g stroke="#5d666e" strokeWidth={1.6} strokeLinecap="round">
                <path d="M42 35 v9 M47 35 v9 M52 35 v9 M57 35 v9" />
              </g>
            )}
            <rect x={44} y={18} width={12} height={14} rx={3} fill="#5d666e" {...O2} />
            <g className="qa-drill">
              <path d="M46 18 L50 3 L54 18 Z" fill={u('metal')} {...O2} />
            </g>
            <circle cx={50} cy={53} r={3.2} fill="#ffe08a" {...O1} />
            {bev('M38 33 Q50 29 62 33')}
            {spec(43, 37, 6)}
          </g>
        </g>
      );
    case 'rig':
      return (
        <g>
          {shadow(50, 88, 30)}
          <path d="M50 60 L26 88 M50 60 L74 88 M50 60 L50 88" stroke={OUT} strokeWidth={7} strokeLinecap="round" />
          <path d="M50 60 L26 88 M50 60 L74 88 M50 60 L50 88" stroke="#9aa4ad" strokeWidth={3.6} strokeLinecap="round" />
          <path d="M46 62 L50 82 L54 62 Z" fill={u('metal')} {...O2} />
          <rect x={44} y={18} width={12} height={46} rx={3} fill={u('metal')} {...O2} />
          <rect x={35} y={33} width={36} height={22} rx={6} style={{ fill: ACC_DK }} {...O3} />
          <rect x={32} y={30} width={36} height={22} rx={6} fill={u('acc')} {...O3} />
          <rect className="qa-flicker" x={37} y={38} width={26} height={4.4} rx={2.2} fill="#ffe08a" {...O1} />
          <rect x={39} y={11} width={22} height={9} rx={3} fill="#5d666e" {...O2} />
          {bev('M35 33 h30')}
          {spec(40, 35, 6)}
        </g>
      );
    case 'ore':
      return (
        <g>
          {shadow(50, 84, 30)}
          {slab('M20 80 L12 56 L24 34 L50 24 L74 32 L86 56 L78 80 Z')}
          <path d="M20 80 L12 56 L24 34 L50 24 L74 32 L86 56 L78 80 Z" fill={u('rock')} {...O3} />
          {detail && <path d="M20 80 L12 56 L24 34 L50 24 L48 80 Z" fill="#fff" opacity={0.07} />}
          {bev('M14 55 L25 35 L49 26')}
          {prism(60, 48, 26, 5.4, 14)}
          {prism(68, 56, 18, 4.6, 34)}
          {prism(50, 54, 16, 4.2, -10)}
          {detail && (
            <g>
              <circle cx={30} cy={66} r={3.4} fill={u('gold')} {...O1} />
              <circle cx={40} cy={72} r={2.4} fill={u('gold')} {...O1} />
            </g>
          )}
          {spec(30, 42, 9)}
          {tw(70, 26, 3.6)}
        </g>
      );
    case 'facet':
      return (
        <g>
          {shadow(50, 88, 28)}
          {slab('M24 16 H76 V86 H24 Z')}
          <rect x={24} y={16} width={52} height={70} rx={6} fill={u('wood')} {...O3} />
          <rect x={29} y={23} width={42} height={58} rx={3} fill={u('parch')} {...O2} />
          <rect x={40} y={10} width={20} height={11} rx={3} fill={u('metal')} {...O2} />
          {detail && (
            <g stroke="#b39a6c" strokeWidth={2.4} strokeLinecap="round">
              <path d="M35 34 h26" />
              <path d="M35 42 h30" />
              <path d="M35 50 h20" />
            </g>
          )}
          <path d="M56 70 l-4 18 l5 -4 l5 4 Z" style={{ fill: ACC }} {...O1} />
          <path d="M66 70 l-2 18 l5 -4 l4 4 Z" style={{ fill: ACC_DK }} {...O1} />
          <circle cx={61} cy={64} r={12.5} fill="#3fae6a" {...O2} />
          {detail && <circle cx={61} cy={64} r={9} fill="none" stroke="#a7ebc0" strokeWidth={1.2} />}
          <path d="M55.5 64 l4 4 l7 -8" stroke="#fff" strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          {bev('M27 20 h46')}
          {spec(36, 28, 7)}
        </g>
      );
    case 'seal':
      return (
        <g>
          {shadow(50, 86, 26)}
          <path d="M40 66 L34 92 L41 87 L46 93 L50 68 Z" style={{ fill: ACC }} {...O2} />
          <path d="M60 66 L66 92 L59 87 L54 93 L50 68 Z" style={{ fill: ACC_DK }} {...O2} />
          <circle cx={53} cy={49.5} r={30} fill="#7a560a" {...O3} />
          <circle cx={50} cy={46} r={30} fill={u('gold')} {...O3} />
          {detail && (
            <g>
              {Array.from({ length: 20 }, (_, k) => {
                const a = (k * 18 * Math.PI) / 180;
                return <circle key={k} cx={50 + Math.cos(a) * 26.5} cy={46 + Math.sin(a) * 26.5} r={1.4} fill="#a0700e" />;
              })}
            </g>
          )}
          <circle cx={50} cy={46} r={21.5} fill="#2a1d13" {...O2} />
          {gemAt(50, 46, 0.5)}
          {detail && <path d="M26 34 A26 26 0 0 1 44 21" stroke="#fff8d0" strokeWidth={2.4} fill="none" strokeLinecap="round" opacity={0.8} />}
          {spec(36, 28, 8)}
          {tw(80, 20, 3.6)}
        </g>
      );
    case 'relic':
      return (
        <g>
          {shadow(50, 88, 28)}
          <path d="M31 28 h-8 a10 10 0 0 0 11 17" stroke={OUT} strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d="M31 28 h-8 a10 10 0 0 0 11 17" stroke="#d9a52a" strokeWidth={3.8} fill="none" strokeLinecap="round" />
          <path d="M69 28 h8 a10 10 0 0 1 -11 17" stroke={OUT} strokeWidth={7} fill="none" strokeLinecap="round" />
          <path d="M69 28 h8 a10 10 0 0 1 -11 17" stroke="#d9a52a" strokeWidth={3.8} fill="none" strokeLinecap="round" />
          {slab('M30 22 h40 v14 c0 16 -9 24 -20 24 c-11 0 -20 -8 -20 -24 Z', '#7a560a')}
          <path d="M30 22 h40 v14 c0 16 -9 24 -20 24 c-11 0 -20 -8 -20 -24 Z" fill={u('gold')} {...O3} />
          <ellipse cx={50} cy={22} rx={20} ry={4} fill="#fff3b8" {...O2} />
          <rect x={45} y={58} width={10} height={12} fill={u('gold')} {...O2} />
          {slab('M32 69 H68 V82 H32 Z')}
          <rect x={32} y={69} width={36} height={13} rx={3} fill={u('wood')} {...O3} />
          {detail && <rect x={42} y={73} width={16} height={4.4} rx={1.5} fill={u('gold')} {...O1} />}
          {gemAt(50, 40, 0.3)}
          {bev('M33 27 v9 c0 9 5 16 12 19')}
          {spec(39, 32, 7)}
          {tw(22, 18, 4.2)}
          {tw(82, 30, 3)}
        </g>
      );
    case 'gold':
      return (
        <g>
          {shadow(50, 78, 24)}
          {slab('M26 70 L22 52 L36 36 L58 32 L76 44 L78 64 L62 76 L40 78 Z', '#7a560a')}
          <path d="M26 70 L22 52 L36 36 L58 32 L76 44 L78 64 L62 76 L40 78 Z" fill={u('gold')} {...O3} />
          {detail && (
            <g fill="#b98915" opacity={0.55}>
              <circle cx={58} cy={58} r={4} />
              <circle cx={44} cy={64} r={2.6} />
              <circle cx={66} cy={48} r={2} />
            </g>
          )}
          {bev('M24 51 L37 37 L57 33')}
          {spec(38, 44, 9)}
          {tw(68, 36, 3.8)}
        </g>
      );
    case 'copper':
      return (
        <g>
          {shadow(50, 80, 26)}
          {slab('M22 72 L18 50 L34 32 L60 30 L80 46 L78 70 L58 80 L36 80 Z', '#5a2a0e')}
          <path d="M22 72 L18 50 L34 32 L60 30 L80 46 L78 70 L58 80 L36 80 Z" fill={u('copper')} {...O3} />
          {detail && (
            <g fill="#3fa98a" opacity={0.7}>
              <circle cx={62} cy={62} r={4.4} />
              <circle cx={70} cy={54} r={2.4} />
              <circle cx={46} cy={70} r={2.8} />
            </g>
          )}
          {bev('M20 49 L35 33 L59 31')}
          {spec(36, 44, 9)}
        </g>
      );
    case 'iron':
      return (
        <g>
          {shadow(50, 80, 26)}
          {slab('M20 74 L24 44 L44 30 L70 34 L82 56 L72 78 L42 82 Z', '#3d454b')}
          <path d="M20 74 L24 44 L44 30 L70 34 L82 56 L72 78 L42 82 Z" fill={u('iron')} {...O3} />
          {detail && <path d="M44 30 L50 56 L20 74 M50 56 L72 78 M50 56 L82 56" stroke="#6b757c" strokeWidth={1.4} fill="none" />}
          {bev('M25 44 L44 31 L69 35')}
          {spec(38, 44, 9)}
        </g>
      );
    case 'shard':
      return (
        <g>
          {detail && <circle className="qa-breathe" cx={50} cy={52} r={34} fill={u('glow')} opacity={0.7} filter={u('fbG')} />}
          {shadow(50, 82, 26)}
          <ellipse cx={50} cy={80} rx={22} ry={6} fill={u('rock')} {...O2} />
          {prism(36, 78, 30, 6, -24)}
          {prism(64, 78, 32, 6.4, 22)}
          {prism(50, 80, 46, 8, 0)}
          {spec(44, 40, 5)}
          {tw(70, 28, 3.6)}
        </g>
      );
    case 'geode':
      return (
        <g>
          {shadow(50, 84, 30)}
          <ellipse cx={53} cy={57} rx={34} ry={28} fill="#1c140e" {...O3} />
          <ellipse cx={50} cy={54} rx={34} ry={28} fill={u('rock')} {...O3} />
          <ellipse cx={50} cy={55} rx={26} ry={20} fill="#efe6d8" {...O1} />
          <ellipse cx={50} cy={56} rx={22} ry={16} style={{ fill: ACC_DK }} />
          {Array.from({ length: 18 }, (_, k) => {
            const a = (k * 20 * Math.PI) / 180;
            const bx = 50 + Math.cos(a) * 21;
            const by = 56 + Math.sin(a) * 15;
            const tx = 50 + Math.cos(a) * 13;
            const ty = 56 + Math.sin(a) * 9;
            const px = -Math.sin(a) * 3.2;
            const py = Math.cos(a) * 3.2;
            return (
              <polygon
                key={k}
                points={`${bx + px},${by + py} ${tx},${ty} ${bx - px},${by - py}`}
                style={{ fill: k % 2 ? ACC : 'var(--acc-lt, var(--stone-crystal, #9ec3e6))' }}
              />
            );
          })}
          <ellipse className="qa-breathe" cx={50} cy={56} rx={11} ry={8} fill={u('glow')} />
          {bev('M20 44 A32 26 0 0 1 44 27')}
          {spec(32, 38, 8)}
          {tw(52, 54, 3.4)}
        </g>
      );
    case 'helmet':
      return (
        <g>
          {detail && <circle className="qa-flicker" cx={50} cy={52} r={22} fill={u('warm')} opacity={0.7} />}
          {shadow(50, 80, 32)}
          <path d="M21 73 A32 32 0 0 1 85 73 Z" fill="#8a5e10" {...O3} />
          <path d="M18 70 A32 32 0 0 1 82 70 Z" fill={u('hat')} {...O3} />
          {detail && <path d="M26 56 A26 26 0 0 1 42 40" stroke="#fff6d8" strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.7} />}
          <rect x={46} y={36} width={8} height={30} rx={4} fill="#c28d1f" {...O2} />
          <rect x={11} y={66} width={78} height={11} rx={5.5} fill="#c28d1f" {...O3} />
          <circle cx={30} cy={71.5} r={3.2} style={{ fill: ACC }} {...O1} />
          <circle cx={50} cy={52} r={10.5} fill="#fff4c2" {...O3} />
          <circle cx={46.8} cy={48.8} r={3.4} fill="#fff" />
          {spec(32, 52, 7)}
        </g>
      );
    case 'lantern':
      return (
        <g>
          <circle className="qa-flicker" cx={50} cy={52} r={32} fill={u('warm')} opacity={0.75} />
          {shadow(50, 86, 20)}
          <path d="M38 24 a12 12 0 0 1 24 0" stroke={OUT} strokeWidth={6} fill="none" strokeLinecap="round" />
          <path d="M38 24 a12 12 0 0 1 24 0" stroke="#9aa4ad" strokeWidth={3} fill="none" strokeLinecap="round" />
          <path d="M33 26 h34 l-4 9 h-26 Z" fill={u('metal')} {...O2} />
          <rect x={36} y={34} width={28} height={37} rx={4} fill="#ffe4a0" opacity={0.5} {...O2} />
          <path className="qa-flicker" d="M50 40 C43 50 57 55 50 66 C62 58 62 47 50 40 Z" fill="#ffd35a" />
          <path className="qa-flicker" d="M50 49 C47 54 53 56 50 62 C56 58 56 53 50 49 Z" fill="#fff6d0" />
          {detail && (
            <g stroke="#5d666e" strokeWidth={2}>
              <path d="M43 34 v37 M57 34 v37" />
            </g>
          )}
          <rect x={31} y={70} width={38} height={11} rx={3.5} fill={u('metal')} {...O3} />
          {bev('M35 28 h30')}
          {spec(40, 40, 5)}
        </g>
      );
    case 'cart':
      return (
        <g>
          {shadow(50, 90, 34)}
          <rect x={4} y={87} width={92} height={3.2} rx={1.2} fill="#a4abb2" {...O1} />
          <path d="M22 40 L30 28 L40 34 L50 24 L60 32 L70 26 L78 40 Z" fill={u('rock')} {...O2} />
          {prism(44, 38, 16, 4.6, -8)}
          {prism(62, 38, 14, 4, 12)}
          {slab('M16 42 h68 l-8 34 h-52 Z', '#4d565d')}
          <path d="M16 42 h68 l-8 34 h-52 Z" fill={u('metal')} {...O3} />
          <rect x={14} y={39} width={72} height={8} rx={3} fill="#5d666e" {...O2} />
          <circle cx={32} cy={80} r={9} fill="#3e3228" {...O3} />
          <circle cx={32} cy={80} r={3.4} fill={u('metal')} />
          <circle cx={68} cy={80} r={9} fill="#3e3228" {...O3} />
          <circle cx={68} cy={80} r={3.4} fill={u('metal')} />
          {bev('M19 49 h62')}
          {spec(30, 58, 8)}
        </g>
      );
    case 'map':
      return (
        <g>
          {shadow(50, 86, 30)}
          {slab('M14 26 L38 20 L62 28 L86 22 L86 76 L62 82 L38 74 L14 80 Z', '#8a6f47')}
          <path d="M14 26 L38 20 L62 28 L86 22 L86 76 L62 82 L38 74 L14 80 Z" fill={u('parch')} {...O3} />
          <path d="M38 20 L62 28 L62 82 L38 74 Z" fill="#000" opacity={0.07} />
          <path
            className="qa-dash"
            d="M22 66 C34 46 46 64 56 50 S70 40 72 36"
            style={{ stroke: ACC }}
            strokeWidth={2.6}
            fill="none"
            strokeDasharray="4 3.4"
            strokeLinecap="round"
          />
          <circle cx={22} cy={66} r={3.4} fill="#5d4a36" {...O1} />
          <path d="M67 31 l10 10 M77 31 l-10 10" stroke={OUT} strokeWidth={5.6} strokeLinecap="round" />
          <path d="M67 31 l10 10 M77 31 l-10 10" style={{ stroke: ACC_DK }} strokeWidth={3} strokeLinecap="round" />
          {spec(26, 32, 7)}
        </g>
      );
    case 'ledger':
      return (
        <g>
          {shadow(50, 86, 28)}
          <rect x={29} y={22} width={48} height={60} rx={3} fill="#f4ead3" {...O2} />
          <rect x={22} y={18} width={48} height={62} rx={4} fill={u('acc')} {...O3} />
          <rect x={22} y={18} width={9} height={62} rx={3} style={{ fill: ACC_DK }} {...O2} />
          <path d="M70 18 v8 l-8 -8 Z M70 80 v-8 l-8 8 Z" fill={u('gold')} {...O1} />
          <rect x={37} y={31} width={26} height={16} rx={2.4} fill={u('gold')} {...O2} />
          {detail && (
            <g stroke="#7a560a" strokeWidth={1.4} strokeLinecap="round">
              <path d="M41 36 h18 M41 40 h14 M41 44 h16" />
            </g>
          )}
          <path d="M58 78 v13 l3.4 -3.4 l3.4 3.4 v-13 Z" fill={u('gold')} {...O1} />
          {bev('M33 21 h35')}
          {spec(40, 26, 7)}
        </g>
      );
  }
}
