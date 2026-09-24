'use client';

import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import { useArt, type U } from './defs';
import { Item, type ItemKind } from './inventory';
import { RARITY, type GemCut, type Rarity } from './palette';

/** One SVG with its own gradient set; `children` draws with `u`. */
export function ArtSvg({
  viewBox = '0 0 100 100',
  size,
  width,
  height,
  label,
  className,
  style,
  children,
}: {
  viewBox?: string;
  size?: number;
  width?: number;
  height?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
  children: (u: U) => ReactNode;
}) {
  const { u, defs } = useArt();
  return (
    <svg
      viewBox={viewBox}
      width={width ?? size}
      height={height ?? size}
      className={className}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      overflow="visible"
    >
      {defs}
      {children(u)}
    </svg>
  );
}

/**
 * Depth you can feel: a pointer-driven tilt (±12°) under a perspective, a slow
 * idle float, and a highlight that slides with the tilt. It is the thing that
 * turns a well-shaded drawing into an object. Everything stops under reduced
 * motion — the art underneath already carries its own shading.
 */
export function Item3D({ children, float = true, tilt = true, className = '' }: { children: ReactNode; float?: boolean; tilt?: boolean; className?: string }) {
  const reduce = useReducedMotionSafe();
  const ref = useRef<HTMLSpanElement>(null);
  const [t, setT] = useState({ x: 0, y: 0 });
  const live = tilt && !reduce;
  return (
    <span
      ref={ref}
      className={`qa-3d inline-flex ${float && !reduce ? 'qa-float' : ''} ${className}`}
      onPointerMove={
        live
          ? (e) => {
              const r = ref.current!.getBoundingClientRect();
              setT({ x: ((e.clientX - r.left) / r.width - 0.5) * 2, y: ((e.clientY - r.top) / r.height - 0.5) * 2 });
            }
          : undefined
      }
      onPointerLeave={live ? () => setT({ x: 0, y: 0 }) : undefined}
      style={
        {
          '--rx': `${(-t.y * 12).toFixed(1)}deg`,
          '--ry': `${(t.x * 12).toFixed(1)}deg`,
          '--hx': `${50 + t.x * 30}%`,
          '--hy': `${50 + t.y * 30}%`,
        } as CSSProperties
      }
    >
      <span className="qa-3d-inner inline-flex">{children}</span>
    </span>
  );
}

/** An inventory item at a size, with the detail layers dropped at 32 px and below. */
export function ItemIcon({ kind, size = 48, cut, label, className, float = false }: { kind: ItemKind; size?: number; cut?: GemCut; label?: string; className?: string; float?: boolean }) {
  return (
    <Item3D float={float} tilt={size > 32} className={className}>
      <ArtSvg size={size} label={label}>
        {(u) => <Item u={u} kind={kind} cut={cut} detail={size > 32} />}
      </ArtSvg>
    </Item3D>
  );
}

/**
 * The obtain moment: a rarity-coloured ring, a spray of star sparks and a
 * "+1 RARE" floater. Keyed by `trigger`, so each new value replays it once.
 */
export function ObtainBurst({ trigger, rarity = 0 }: { trigger: number; rarity?: Rarity }) {
  const reduce = useReducedMotionSafe();
  if (!trigger || reduce) return null;
  const n = [6, 8, 10, 14][rarity];
  const color = RARITY[rarity].color;
  return (
    <span key={trigger} aria-hidden className="qa-burst pointer-events-none absolute inset-0" style={{ '--rc': color } as CSSProperties}>
      <span className="qa-burst-ring" />
      {Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const d = 30 + ((i * 37) % 22);
        return <i key={i} style={{ '--dx': `${Math.round(Math.cos(a) * d)}px`, '--dy': `${Math.round(Math.sin(a) * d)}px`, animationDelay: `${(i % 3) * 0.03}s` } as CSSProperties} />;
      })}
      <span className="qa-burst-plus">+1 {RARITY[rarity].name.toUpperCase()}</span>
    </span>
  );
}

/** A rarity frame around anything: the slot glow, Epic's pulse, Legendary's sweep. */
export function RaritySlot({ rarity, children, className = '', title }: { rarity: Rarity; children: ReactNode; className?: string; title?: string }) {
  return (
    <span
      title={title ?? `${RARITY[rarity].name} — ${RARITY[rarity].means}`}
      className={`qa-slot qa-r${rarity} relative inline-flex items-center justify-center ${className}`}
      style={{ '--rc': RARITY[rarity].color } as CSSProperties}
    >
      {children}
    </span>
  );
}
