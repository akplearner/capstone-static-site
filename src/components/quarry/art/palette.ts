import type { CSSProperties } from 'react';

/**
 * The quarry art's colours, per course (R80).
 *
 * Every piece of the art — the miner's shirt and eyes, the cert gem, the
 * crystals, the light leaking from a cracked stone — reads three CSS custom
 * properties: `--acc`, `--acc-lt`, `--acc-dk`. Setting them on any ancestor
 * recolours everything under it, which is how picking a cert on the landing
 * page recolours the character: one style attribute, not a re-render of art.
 *
 * Unset, they fall back to the page's own accent tokens, so art dropped into a
 * course page takes that course's seam colour for free.
 */
export type GemCut = 'shield' | 'hex' | 'bar' | 'rack' | 'round' | 'quad' | 'cloud';

export interface CourseTint {
  name: string;
  acc: string;
  lt: string;
  dk: string;
  cut: GemCut;
}

export const COURSE_TINT: Record<string, CourseTint> = {
  'security-plus': { name: 'Security+', acc: '#e0524a', lt: '#ffb0aa', dk: '#8f2620', cut: 'shield' },
  'cysa-plus': { name: 'CySA+', acc: '#f0703c', lt: '#ffc2a3', dk: '#8f3a14', cut: 'hex' },
  'server-plus': { name: 'Server+', acc: '#4c8ee6', lt: '#a9c8f7', dk: '#1f4a86', cut: 'rack' },
  ccna: { name: 'CCNA', acc: '#22a6cc', lt: '#9ee6f7', dk: '#0b5a70', cut: 'bar' },
  mssp: { name: 'MSSP', acc: '#b24ad0', lt: '#e6a8f5', dk: '#68267f', cut: 'round' },
};

export const NEUTRAL_TINT: CourseTint = { name: 'Quarry', acc: '#c9a064', lt: '#f3dcb0', dk: '#7a5a2c', cut: 'quad' };

export function tintFor(courseId?: string | null): CourseTint {
  return (courseId && COURSE_TINT[courseId]) || NEUTRAL_TINT;
}

/** The three custom properties that recolour every piece of art beneath them. */
export function tintVars(courseId?: string | null): CSSProperties {
  const t = tintFor(courseId);
  return { '--acc': t.acc, '--acc-lt': t.lt, '--acc-dk': t.dk } as CSSProperties;
}

/** Rarity is earned, never random — see `src/lib/rarity.ts`. */
export type Rarity = 0 | 1 | 2 | 3;
export const RARITY: { name: string; color: string; means: string }[] = [
  { name: 'Common', color: '#9aa3ab', means: 'task done' },
  { name: 'Rare', color: '#4a9be8', means: 'done before the due date' },
  { name: 'Epic', color: '#a86ae0', means: 'every check matched real output' },
  { name: 'Legendary', color: '#f5b52e', means: 'verified, on time, nothing self-attested' },
];

/** Accent colours as the art reads them — with the page's tokens as fallback. */
export const ACC = 'var(--acc, var(--color-accent))';
export const ACC_LT = 'var(--acc-lt, var(--stone-crystal, #9ec3e6))';
export const ACC_DK = 'var(--acc-dk, var(--color-accent-strong))';
/** The warm dark outline every piece shares. */
export const OUT = '#1d130c';
