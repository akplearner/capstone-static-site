'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import { ArtSvg } from './widgets';
import { Miner, REST, Stone, star, type MinerPose, type StoneState } from './parts';
import { STRIKE, strikePose } from './strike';

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  chip: boolean;
}

/**
 * The miner working a stone, small: the step-tick beat and the "task
 * complete" mark. `strikes` swings that many times, chipping the stone one
 * state per swing, with sparks and chips flying on each impact; `loop` keeps
 * going. Under reduced motion it draws one still frame.
 */
export function MinerStrike({
  size = 36,
  strikes = 1,
  loop = false,
  startState = 0,
  className,
}: {
  size?: number;
  strikes?: number;
  loop?: boolean;
  startState?: StoneState;
  className?: string;
}) {
  const reduce = useReducedMotionSafe();
  const [pose, setPose] = useState<MinerPose>(REST);
  const [stone, setStone] = useState<StoneState>(startState);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const raf = useRef(0);

  useEffect(() => {
    if (reduce) return;
    let start = performance.now();
    let last = start;
    let hits = 0;
    let st = startState;
    let live: Spark[] = [];
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      const i = Math.floor(t / STRIKE);
      if (i >= strikes) {
        if (!loop) {
          setPose(REST);
          setSparks([]);
          return;
        }
        start = now;
        hits = 0;
        st = startState;
        setStone(st);
      } else {
        const { pose: p, impact } = strikePose(t - i * STRIKE);
        setPose(p);
        if (impact && hits <= i) {
          hits = i + 1;
          st = Math.min(3, st + 1) as StoneState;
          setStone(st);
          for (let k = 0; k < 7; k++)
            live.push({ x: 42, y: -18, vx: -(Math.random() * 60 + 10), vy: -(Math.random() * 80 + 30), life: 1, chip: k % 2 === 0 });
        }
      }
      live = live
        .map((s) => ({ ...s, vy: s.vy + 260 * dt, x: s.x + s.vx * dt, y: s.y + s.vy * dt, life: s.life - dt / 0.5 }))
        .filter((s) => s.life > 0);
      setSparks(live);
      raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf.current);
  }, [reduce, strikes, loop, startState]);

  return (
    <ArtSvg viewBox="-40 -80 130 90" width={size * (130 / 90)} height={size} className={className}>
      {(u) => (
        <g>
          <g transform="translate(60 0) scale(.85)">
            <Stone u={u} state={stone} />
          </g>
          <g transform="translate(0 0) scale(.7)">
            <Miner u={u} pose={pose} />
          </g>
          {sparks.map((s, k) =>
            s.chip ? (
              <path key={k} transform={`translate(${s.x} ${s.y})`} d="M-2.4 1.6 L0 -2.6 L2.6 .6 Z" fill="#6b5641" opacity={s.life} />
            ) : (
              <path key={k} d={star(s.x, s.y, 2.6 * s.life + 0.6)} fill="#fff1b0" opacity={s.life} />
            ),
          )}
        </g>
      )}
    </ArtSvg>
  );
}
