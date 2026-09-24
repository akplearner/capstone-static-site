'use client';

import { useId } from 'react';
import { ACC, ACC_DK, ACC_LT } from './palette';

/**
 * The shared gradients and filters of the quarry art, one set per SVG.
 *
 * The prototypes declared them once per page with fixed ids. A React page mounts
 * many SVGs — a stone on every task row — and fixed ids would collide, so every
 * SVG gets its own prefix from `useId` and passes `u` (id → `url(#…)`) down to
 * the parts. Accent stops read the `--acc*` custom properties, so the art
 * recolours with the course it sits in.
 */
export type U = (name: string) => string;

export function useArt(): { u: U; defs: React.ReactNode } {
  const raw = useId();
  const p = `qa${raw.replace(/[^a-zA-Z0-9]/g, '')}`;
  const id = (n: string) => `${p}-${n}`;
  const u: U = (n) => `url(#${id(n)})`;
  const lin = (n: string, stops: [number, string, number?][], x2 = '.7', y2 = '1', x1 = '.15', y1 = '0') => (
    <linearGradient id={id(n)} x1={x1} y1={y1} x2={x2} y2={y2}>
      {stops.map(([o, c, op]) => (
        <stop key={o} offset={o} style={{ stopColor: c, stopOpacity: op ?? 1 }} />
      ))}
    </linearGradient>
  );
  const rad = (n: string, stops: [number, string, number][]) => (
    <radialGradient id={id(n)} cx="50%" cy="50%" r="50%">
      {stops.map(([o, c, op]) => (
        <stop key={o} offset={o} style={{ stopColor: c, stopOpacity: op }} />
      ))}
    </radialGradient>
  );
  const defs = (
    <defs>
      {lin('wood', [[0, '#e6c38c'], [0.5, '#c79b5e'], [1, '#8f6534']], '1', '0', '0')}
      {lin('metal', [[0, '#f5f9fc'], [0.5, '#b9c3cc'], [1, '#6b747c']], '.45', '1', '0')}
      {lin('acc', [[0, ACC_LT], [0.5, ACC], [1, ACC_DK]])}
      {lin('skin', [[0, '#ffe3c4'], [0.55, '#f4c69c'], [1, '#d99d70']])}
      {lin('hat', [[0, '#ffe685'], [0.5, '#f1bb34'], [1, '#b37d14']], '.6')}
      {lin('iris', [[0, ACC_DK], [0.55, ACC], [1, ACC_LT]], '0', '1', '0')}
      {lin('gem', [[0, ACC_LT], [0.5, ACC], [1, ACC_DK]], '.75')}
      {lin('rock', [[0, '#8f7a63'], [0.5, '#5f4e3e'], [1, '#30261d']], '.8', '1', '.1')}
      {lin('rockside', [[0, '#3a2d22'], [1, '#1c140e']], '1', '1', '0')}
      {lin('gold', [[0, '#fff2ad'], [0.45, '#f2c33c'], [1, '#a0700e']])}
      {lin('copper', [[0, '#ffc9a4'], [0.5, '#d9793a'], [1, '#7a3a14']])}
      {lin('iron', [[0, '#eef2f5'], [0.5, '#a9b3bb'], [1, '#4d565d']])}
      {lin('parch', [[0, '#fff7e0'], [0.6, '#f0dfb4'], [1, '#cdb483']], '.5', '1', '0')}
      {rad('spec', [[0, '#fff', 0.9], [1, '#fff', 0]])}
      {rad('glow', [[0, ACC, 0.85], [1, ACC, 0]])}
      {rad('warm', [[0, '#ffd98a', 0.9], [1, '#ffb24a', 0]])}
      {lin('shaft', [[0, '#fff6d8', 0.75], [1, '#fff0c0', 0]], '0', '1', '0')}
      {lin('beam', [[0, '#fff2c4', 0.55], [1, '#fff2c4', 0]], '1', '0', '0')}
      <filter id={id('fb1')} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.3" />
      </filter>
      <filter id={id('fb2')} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.6" />
      </filter>
      <filter id={id('fbG')} x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="4.5" />
      </filter>
    </defs>
  );
  return { u, defs };
}
