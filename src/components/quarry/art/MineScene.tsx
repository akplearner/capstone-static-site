'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import { useArt } from './defs';
import { GY, buildWorld, sscale, sx } from './mineWorld';
import { Gem, Miner, Pebble, REST, Stone, pebbleStage, star, type MinerPose, type PebbleStage, type StoneState } from './parts';
import { OUT, RARITY, type GemCut, type Rarity } from './palette';
import { STRIKE, strikePose } from './strike';

/**
 * The mine (R80) — the product owner's `quarry-mine-progression` prototype as
 * a React component, and the hero of both homes.
 *
 * One stone per week stands on the rail. The miner walks to the next one,
 * lands three strikes (anticipation → strike → recover, 0.7 s each) that chip
 * it intact → chipped → cracked → open, the course gem pops out, spins, and
 * drops into that week's slot in the tray below; the week's lanterns, crystals
 * and wall gems light up, his headlamp's circle of light widens, and past half
 * way a daylight shaft opens from the ceiling. Pebble follows, hopping, and
 * evolves with the weeks.
 *
 *  - `mode="demo"` (the landing page) plays the whole loop on repeat; a click
 *    plays the next week at once.
 *  - `mode="progress"` (a course's Home) shows the student's real weeks:
 *    finished ones open and lit with their gems in the tray at the rarity they
 *    earned, the miner at the stone they are on, working it now and then. A
 *    week finished since the last visit is played for them once.
 *
 * Colour comes from `--acc*` on any ancestor (`tintVars`), so the caller
 * recolours the miner, the gems and the crystals with one style attribute.
 * Motion: nothing runs off screen or in a hidden tab; under reduced motion the
 * scene is a single still frame.
 */

interface Particle {
  k: 'spark' | 'chip' | 'star' | 'ring';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  m: number;
  r: number;
  vr: number;
}
interface Frame {
  mx: number;
  my: number;
  pose: MinerPose;
  px: number;
  py: number;
  peb: PebbleStage;
  stones: StoneState[];
  done: number;
  particles: Particle[];
  fly: { x: number; y: number; sc: number; rot: number } | null;
  light: number;
  shx: number;
  shy: number;
  busy: boolean;
}

const MS = 0.52;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const eOut = (t: number) => 1 - Math.pow(1 - t, 3);
const eIn = (t: number) => t * t * t;
const eIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eBack = (t: number) => {
  const c = 1.7;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

function initial(n: number, done: number, current: StoneState): Frame {
  const k = sscale(n);
  const at = Math.min(done, n - 1);
  const mx = done >= n ? sx(n - 1, n) + 40 : sx(at, n) - (30 + 12 * k);
  return {
    mx,
    my: GY,
    pose: REST,
    px: mx - 24,
    py: GY,
    peb: pebbleStage(done, n),
    stones: Array.from({ length: n }, (_, i) => (i < done ? 4 : i === done ? current : 0)) as StoneState[],
    done,
    particles: [],
    fly: null,
    light: done / n,
    shx: 0,
    shy: 0,
    busy: false,
  };
}

export function MineScene({
  mode,
  weeks = 4,
  done = 0,
  currentPercent = 0,
  rarities = [],
  cut,
  label,
  playFrom,
  onWeekPlayed,
  className = '',
}: {
  mode: 'demo' | 'progress';
  /** Stones on the rail — graded weeks. */
  weeks?: number;
  /** Progress mode: weeks finished. */
  done?: number;
  /** Progress mode: how far into the current week, 0-100 — chips its stone. */
  currentPercent?: number;
  /** Progress mode: each finished week's gem rarity, for the tray. */
  rarities?: (Rarity | null)[];
  cut: GemCut;
  /** The HUD's right-hand label — the course name. */
  label: string;
  /** Progress mode: replay the weeks from this index up to `done` (finished since the last visit). */
  playFrom?: number;
  onWeekPlayed?: (week: number) => void;
  className?: string;
}) {
  const n = Math.max(1, weeks);
  const reduce = useReducedMotionSafe();
  const { u, defs } = useArt();
  const torchId = `qa-torch-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const cur: StoneState = currentPercent >= 50 ? 2 : currentPercent > 0 ? 1 : 0;
  const startDone = mode === 'demo' ? 0 : Math.max(0, Math.min(done, playFrom ?? done));
  const [f, setF] = useState<Frame>(() => initial(n, mode === 'demo' ? 2 : done, cur));
  const hostRef = useRef<HTMLDivElement>(null);
  const kick = useRef<() => void>(() => {});
  const world = useMemo(() => buildWorld(u, n), [u, n]);

  useEffect(() => {
    if (reduce) return;
    let alive = true;
    let visible = true;
    const s = initial(n, startDone, mode === 'demo' ? 0 : startDone === done ? cur : 0);
    const M = { x: s.mx, hop: 0, hatV: 0, hat: 0, walking: false, wf: 0 as 0 | 1, wt: 0, pose: REST };
    const P = { x: s.px, hop: 0, v: 0 };
    let stones = s.stones.slice();
    let d = s.done;
    let peb = s.peb;
    let lightL = s.light;
    let lightT = s.light;
    let particles: Particle[] = [];
    let shake = 0;
    let fly: Frame['fly'] = null;
    let busy = false;
    const tweens: { t: number; d: number; fn: (p: number) => void; res: () => void }[] = [];
    const tween = (dur: number, fn: (p: number) => void) => new Promise<void>((res) => tweens.push({ t: 0, d: dur, fn, res }));
    const wait = (dur: number) => tween(dur, () => {});
    const k = sscale(n);
    const burst = (x: number, y: number, big: boolean) => {
      const P0 = { vx: 0, vy: 0, r: 0, vr: 0 };
      for (let i = 0; i < (big ? 14 : 7); i++) particles.push({ ...P0, k: 'spark', x, y, vx: (Math.random() * -1.3 - 0.2) * 90, vy: -(Math.random() * 110 + 30), life: 1, m: 0.4 + Math.random() * 0.3 });
      for (let i = 0; i < (big ? 9 : 5); i++)
        particles.push({ k: 'chip', x, y, vx: (Math.random() - 0.6) * 80, vy: -(Math.random() * 90 + 40), life: 1, m: 0.7 + Math.random() * 0.4, r: Math.random() * 6.3, vr: (Math.random() - 0.5) * 12 });
      for (let i = 0; i < (big ? 5 : 3); i++) particles.push({ ...P0, k: 'star', x: x + (Math.random() - 0.5) * 26, y: y + (Math.random() - 0.5) * 20, vy: -12, life: 1, m: 0.45 + Math.random() * 0.2 });
    };
    const walkTo = async (tx: number) => {
      const x0 = M.x;
      const dist = Math.abs(tx - x0);
      if (dist < 1) return;
      M.walking = true;
      await tween(Math.max(0.35, dist / 70), (p) => {
        M.x = lerp(x0, tx, eIO(p));
      });
      M.walking = false;
    };
    const strike = async (i: number, target: StoneState | null) => {
      await tween(STRIKE, (p) => {
        const { pose, impact } = strikePose(p * STRIKE);
        M.pose = pose;
        if (impact && target !== null && stones[i] !== target) {
          stones[i] = target;
          shake = target === 3 ? 3.4 : 2;
          M.hatV -= 70;
          burst(sx(i, n) - 14 * k, GY - 18 * k, target === 3);
        } else if (impact && target === null && shake === 0) {
          shake = 1.2;
          M.hatV -= 40;
          burst(sx(i, n) - 14 * k, GY - 18 * k, false);
        }
      });
      M.pose = REST;
    };
    const playWeek = async () => {
      if (busy || d >= n) return;
      busy = true;
      const i = d;
      await walkTo(sx(i, n) - (30 + 12 * k));
      for (let st = 1; st <= 3; st++) await strike(i, Math.max(stones[i], st) as StoneState);
      const gx = sx(i, n);
      const gy0 = GY - 24 * k;
      const gy1 = GY - 78 * k;
      M.pose = { ...REST, face: 'proud' };
      burst(gx, gy1 + 10, true);
      await tween(0.5, (p) => {
        const e = eBack(p);
        fly = { x: gx, y: lerp(gy0, gy1, eOut(p)), sc: 0.6 * clamp(e, 0, 1.3), rot: Math.sin(p * 9) * 8 };
        M.pose = { ...REST, face: 'proud', ang: lerp(-15, -50, eOut(p)), lean: lerp(0, 7, eOut(p)) };
        if (p < 0.2) P.v = -60;
      });
      await wait(0.35);
      await tween(0.65, (p) => {
        const e = eIn(p);
        fly = { x: gx + 10 * Math.sin(p * Math.PI), y: lerp(gy1, 248, e) - 26 * Math.sin(p * Math.PI), sc: lerp(0.6, 0.34, e), rot: 360 * e };
      });
      fly = null;
      stones[i] = 4;
      d += 1;
      lightT = d / n;
      const ns = pebbleStage(d, n);
      if (ns !== peb) {
        peb = ns;
        P.v = -90;
        burst(P.x, GY - 12, false);
      }
      particles.push({ k: 'ring', x: gx, y: 248, vx: 0, vy: 0, life: 1, m: 0.6, r: 0, vr: 0 });
      onWeekPlayed?.(i);
      await tween(0.3, (p) => {
        M.pose = { ...REST, face: 'idle', ang: lerp(-50, -15, eIO(p)), lean: lerp(7, 0, eIO(p)) };
      });
      busy = false;
    };
    const reset = () => {
      stones = Array(n).fill(0);
      d = 0;
      peb = 0;
      lightT = 0;
      M.x = sx(0, n) - (30 + 12 * k) - 40;
    };
    /* the director */
    const run = async () => {
      if (mode === 'demo') {
        for (;;) {
          if (!alive) return;
          await wait(0.6);
          if (d >= n) {
            await wait(2.4);
            if (!alive) return;
            reset();
            continue;
          }
          await playWeek();
          await wait(0.9);
        }
      } else {
        while (alive && d < done) {
          await wait(0.5);
          await playWeek();
        }
        if (d < n && alive) {
          await walkTo(sx(d, n) - (30 + 12 * k));
          stones[d] = cur;
        }
        for (;;) {
          await wait(5 + Math.random() * 3);
          if (!alive) return;
          if (d < n && !busy) {
            busy = true;
            await strike(d, null);
            busy = false;
          }
        }
      }
    };
    kick.current = () => {
      if (mode === 'demo') void playWeek();
      else if (d < n && !busy) {
        busy = true;
        void strike(d, null).then(() => (busy = false));
      }
    };
    void run();

    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible) return;
      for (let i = tweens.length - 1; i >= 0; i--) {
        const t = tweens[i];
        t.t += dt;
        const p = Math.min(1, t.t / t.d);
        t.fn(p);
        if (p >= 1) {
          tweens.splice(i, 1);
          t.res();
        }
      }
      if (M.walking) {
        M.wt += dt;
        if (M.wt > 0.16) {
          M.wt = 0;
          M.wf = M.wf ? 0 : 1;
        }
        M.hop = M.wf ? 1.8 : 0;
      } else M.hop *= 0.8;
      M.hatV += (-M.hat * 220 - M.hatV * 12) * dt;
      M.hat += M.hatV * dt;
      const br = busy ? 0 : Math.sin((now / 1000) * 2.4) * 0.018;
      const tx = M.x - 24;
      P.x += (tx - P.x) * Math.min(1, dt * 4);
      if (M.walking && P.hop <= 0 && Math.abs(tx - P.x) > 2) P.v = -55;
      P.v += 260 * dt;
      P.hop -= P.v * dt;
      if (P.hop < 0) {
        P.hop = 0;
        P.v = 0;
      }
      lightL += (lightT - lightL) * Math.min(1, dt * 1.4);
      let shx = 0;
      let shy = 0;
      if (shake > 0) {
        shake = Math.max(0, shake - dt * 14);
        shx = (Math.random() * 2 - 1) * shake;
        shy = (Math.random() * 2 - 1) * shake * 0.6;
      }
      particles = particles.filter((q) => {
        q.life -= dt / q.m;
        if (q.life <= 0) return false;
        if (q.k === 'spark') {
          q.vy += 260 * dt;
          q.x += q.vx * dt;
          q.y += q.vy * dt;
        } else if (q.k === 'chip') {
          q.vy += 380 * dt;
          q.x += q.vx * dt;
          q.y += q.vy * dt;
          q.r += q.vr * dt;
          if (q.y > GY) {
            q.y = GY;
            q.vy *= -0.35;
            q.vx *= 0.6;
          }
        } else if (q.k === 'star') q.y += q.vy * dt;
        return true;
      });
      const pose: MinerPose = {
        ...M.pose,
        hat: M.hat,
        walk: M.walking ? M.wf : null,
        face: M.walking ? 'idle' : M.pose.face,
        sqy: M.pose.sqy + br,
        sqx: M.pose.sqx - br * 0.8,
      };
      setF({
        mx: M.x,
        my: GY - M.hop,
        pose,
        px: P.x,
        py: GY - P.hop,
        peb,
        stones: stones.slice(),
        done: d,
        particles: particles.map((q) => ({ ...q })),
        fly,
        light: lightL,
        shx,
        shy,
        busy,
      });
    };
    raf = requestAnimationFrame(loop);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting && !document.hidden));
    if (hostRef.current) io.observe(hostRef.current);
    const onVis = () => (visible = !document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
    // The scene restarts when the course's shape or the student's progress changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, mode, n, done, cur, startDone]);

  const k = sscale(n);
  const L2 = clamp((f.light - 0.45) * 1.9, 0, 1);
  const lx = f.mx + 22 * MS;
  const ly = f.my + (-73 + f.pose.hat) * MS;
  const torchR = 78 + 120 * f.light;
  const tray = (i: number): Rarity | null => (mode === 'demo' ? (i < f.done ? ((i === n - 1 ? 3 : Math.min(2, Math.floor((i / Math.max(1, n - 1)) * 3))) as Rarity) : null) : i < f.done ? (rarities[i] ?? 0) : null);
  const hudLabel = f.done >= n ? `DELIVERED · ${n}/${n}` : `WEEK ${f.done + 1} OF ${n}`;

  return (
    <div
      ref={hostRef}
      className={`relative overflow-hidden rounded-[var(--radius-card)] bg-[#0a0705] ${className}`}
      onClick={() => kick.current()}
      role="img"
      aria-label={`The mine: ${f.done} of ${n} weeks cut${mode === 'progress' ? '' : ' — click to strike'}`}
    >
      <svg viewBox="0 0 480 270" className="block h-auto w-full" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        {defs}
        <defs>
          <radialGradient id={torchId} gradientUnits="userSpaceOnUse" cx={f.mx + 14} cy={f.my - 32} r={torchR}>
            <stop offset="0" stopColor="#040302" stopOpacity={0} />
            <stop offset=".42" stopColor="#040302" stopOpacity={0} />
            <stop offset="1" stopColor="#040302" stopOpacity={1} />
          </radialGradient>
        </defs>
        <g transform={`translate(${f.shx.toFixed(2)} ${f.shy.toFixed(2)})`}>
          {world.world}
          {f.stones.map((st, i) => (
            <g key={i} transform={`translate(${sx(i, n)} ${GY}) scale(${k})`}>
              <Stone u={u} state={st} />
            </g>
          ))}
          <g transform={`translate(${f.px.toFixed(2)} ${f.py.toFixed(2)})`}>
            <Pebble u={u} stage={f.peb} />
          </g>
          <g transform={`translate(${f.mx.toFixed(2)} ${f.my.toFixed(2)}) scale(${MS})`}>
            <Miner u={u} pose={f.pose} />
          </g>
          {f.particles
            .filter((q) => q.k === 'chip')
            .map((q, i) => (
              <path
                key={i}
                transform={`translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(${(q.r * 57).toFixed(0)})`}
                d="M-2.4 1.6 L0 -2.6 L2.6 .6 Z"
                fill="#6b5641"
                stroke={OUT}
                strokeWidth={0.6}
                opacity={clamp(q.life * 1.5, 0, 1)}
              />
            ))}
        </g>
        <rect x={0} y={0} width={480} height={232} fill={`url(#${torchId})`} opacity={0.92 - 0.8 * f.light} />
        <g transform={`translate(${f.shx.toFixed(2)} ${f.shy.toFixed(2)})`}>
          {L2 > 0 && (
            <g>
              <ellipse cx={330} cy={26} rx={14 + 14 * L2} ry={4 + 4 * L2} fill="#fff6d6" opacity={L2} />
              <polygon points={`${316 - 10 * L2},26 ${344 + 10 * L2},26 ${378 + 14 * L2},${GY} ${270 - 14 * L2},${GY}`} fill={u('shaft')} opacity={0.85 * L2} />
              <ellipse cx={324} cy={GY + 1} rx={40 + 30 * L2} ry={5} fill="#fff1c8" opacity={0.35 * L2} />
            </g>
          )}
          {world.glow(f.done)}
          <polygon points={`${lx},${ly} ${lx + 100},${ly - 22} ${lx + 100},${ly + 34}`} fill={u('beam')} opacity={0.5 * (1 - f.light * 0.7)} />
          {f.particles.map((q, i) =>
            q.k === 'spark' ? (
              <circle key={i} cx={q.x} cy={q.y} r={1.4 * q.life + 0.4} fill="#fff1b0" opacity={q.life} />
            ) : q.k === 'star' ? (
              <path key={i} d={star(q.x, q.y, 4.4 * (1 - Math.abs(q.life - 0.5) * 2) + 1)} fill="#fffbe6" opacity={clamp(q.life * 1.6, 0, 1)} />
            ) : q.k === 'ring' ? (
              <circle key={i} cx={q.x} cy={q.y} r={13 + (1 - q.life) * 16} fill="none" stroke="#fff4cf" strokeWidth={2} opacity={q.life} />
            ) : null,
          )}
          {f.fly && (
            <g>
              <circle cx={f.fly.x} cy={f.fly.y} r={(26 * f.fly.sc) / 0.6} fill={u('glow')} filter={u('fbG')} />
              <g transform={`translate(${f.fly.x} ${f.fly.y}) rotate(${f.fly.rot}) scale(${f.fly.sc}) translate(-50 -50)`}>
                <Gem u={u} cut={cut} />
              </g>
            </g>
          )}
          {!f.busy && f.done < n && (
            <path className="qa-float" d={`M${sx(f.done, n) - 5} ${GY - 58 * k} h10 l-5 7 Z`} style={{ fill: 'var(--acc-lt, var(--stone-crystal, #9ec3e6))' }} stroke={OUT} strokeWidth={1.2} />
          )}
        </g>
        {/* HUD: the week tray and the labels */}
        <rect x={0} y={232} width={480} height={38} fill="#0c0806" />
        <rect x={0} y={232} width={480} height={1.4} fill="#3a2b1f" />
        <line x1={sx(0, n)} y1={248} x2={sx(n - 1, n)} y2={248} stroke="#2c2118" strokeWidth={3} strokeLinecap="round" />
        {f.done > 0 && <line x1={sx(0, n)} y1={248} x2={sx(Math.min(f.done, n) - 1, n)} y2={248} style={{ stroke: 'var(--acc, var(--color-accent))' }} strokeWidth={3} strokeLinecap="round" />}
        {Array.from({ length: n }, (_, i) => {
          const r = tray(i);
          const c = r === null ? '#6d5b48' : RARITY[r].color;
          return (
            <g key={i}>
              <circle cx={sx(i, n)} cy={248} r={13} fill="#1a120c" stroke={c} strokeWidth={2} opacity={r === null ? 0.5 : 1} />
              {r !== null && <circle cx={sx(i, n)} cy={248} r={15} fill="none" stroke={c} strokeWidth={1} opacity={0.5} />}
              <g transform={`translate(${sx(i, n)} 248) scale(.34) translate(-50 -50)`}>
                <Gem u={u} cut={cut} silhouette={r === null} detail={false} />
              </g>
              <text x={sx(i, n) + 17} y={252} fontFamily="ui-monospace,monospace" fontSize={7} fill={r === null ? '#6d5b48' : c}>
                W{i + 1}
              </text>
            </g>
          );
        })}
        <rect x={8} y={8} width={hudLabel.length * 6.1 + 18} height={18} rx={9} fill="rgba(10,7,5,.78)" stroke="#3a2b1f" />
        <text x={17} y={21} fontFamily="ui-monospace,monospace" fontSize={9.5} fontWeight={700} fill="#f3e2c3">
          {hudLabel}
        </text>
        <rect x={472 - label.length * 5.6 - 16} y={8} width={label.length * 5.6 + 16} height={18} rx={9} fill="rgba(10,7,5,.78)" stroke="#3a2b1f" />
        <text x={464} y={21} textAnchor="end" fontFamily="ui-monospace,monospace" fontSize={9} fill="#c9b596">
          {label}
        </text>
      </svg>
    </div>
  );
}
