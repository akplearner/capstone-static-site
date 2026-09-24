import { REST, type MinerPose } from './parts';

/**
 * The prototype's strike, as a pure function of time — so a React component can
 * drive it from one `requestAnimationFrame` and a test can sample it.
 *
 * One strike is 0.70 s: anticipation (0.28 s, the pick winds back, the face
 * narrows) → strike (0.07 s, the pick snaps through, the face strains) →
 * impact hold (0.12 s, squash) → recover (0.23 s). Three strikes cut a stone.
 */
export const STRIKE = 0.7;
const eOut = (t: number) => 1 - Math.pow(1 - t, 3);
const eIn = (t: number) => t * t * t;
const eIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** The miner's pose `t` seconds into one strike; `impact` is true on the hit frame. */
export function strikePose(t: number): { pose: MinerPose; impact: boolean } {
  if (t < 0.28) {
    const e = eOut(t / 0.28);
    return { pose: { ...REST, ang: -15 - 60 * e, sqy: 1 - 0.1 * e, sqx: 1 + 0.08 * e, lean: -4 * e, face: 'focused' }, impact: false };
  }
  if (t < 0.35) {
    const e = eIn((t - 0.28) / 0.07);
    return { pose: { ...REST, ang: -75 + 175 * e, sqy: 0.9 + 0.2 * e, sqx: 1.08 - 0.14 * e, lean: -4 + 10 * e, face: 'strain' }, impact: false };
  }
  if (t < 0.47) {
    const p = (t - 0.35) / 0.12;
    const q = Math.sin(p * Math.PI);
    return { pose: { ...REST, ang: 100 - 12 * p, sqy: 1 - 0.16 * q, sqx: 1 + 0.14 * q, lean: 6, face: 'strain' }, impact: p < 0.2 };
  }
  const p = Math.min(1, (t - 0.47) / 0.23);
  const e = eIO(p);
  const q = Math.sin(p * Math.PI);
  return { pose: { ...REST, ang: 88 - 103 * e, sqy: 1 + 0.06 * q, sqx: 1 - 0.05 * q, lean: 6 * (1 - e), face: p < 0.6 ? 'strain' : 'idle' }, impact: false };
}
