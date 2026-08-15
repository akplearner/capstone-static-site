'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';

/**
 * The pixel miner — a canvas port of the product owner's `minerv3.html` prototype.
 *
 * A chibi miner in a vendor-coloured hard hat works a glowing rock inside a mine:
 * cave walls, timber supports, stalactites that drip, crystal clusters, drifting
 * dust. Three pick-hits crack the rock; it shatters into gems and a new one grows.
 * This replaces the R30 vector mascot as THE character — one little guy across the
 * platform, in the art style the owner actually chose and supplied.
 *
 * Two variants:
 *  - `scene` — the full 256×144 mine, upscaled with `image-rendering: pixelated`
 *    (chunky pixels are the aesthetic). The landing hero.
 *  - `beat`  — just the miner and the rock, cropped to a 122×84 window on a
 *    transparent background, for inline use at toolbar size. Deliberately NOT
 *    pixelated-upscaled: at 30–56px the canvas is *downscaled*, and nearest-
 *    neighbour downscaling turns pixel art to noise — smooth scaling reads as a
 *    tiny sprite instead. The beat's rock also spawns two hits in, so a single
 *    swing shatters it: one tick of a checkbox = one full payoff.
 *
 * Theming: the palette table is keyed by the same seven region keys as the
 * `[data-region]` blocks in globals.css, plus a neutral default in the site teal.
 * `theme="cycle"` advances one vendor per respawned rock, so the hero shows every
 * vendor's colour over time. Colours here are canvas art, never text, so the
 * brighter prototype hues don't touch the AA-checked accent tokens.
 *
 * Motion: everything runs in a rAF loop inside an effect (no SSR surface at all).
 * With `animate` false or reduced motion on (via the hydration-safe hook from
 * R30), the effect composes ONE static frame and never starts the loop.
 */

export type MinerTheme =
  | 'comptia'
  | 'cisco'
  | 'aws'
  | 'microsoft'
  | 'isc2'
  | 'linux'
  | 'engagement'
  | 'default';

interface ThemeDef {
  hat: string;
  hatDk: string;
  hatLt: string;
  glow: string; // "r,g,b"
  gem: string;
  gemLt: string;
}

const THEMES: Record<MinerTheme, ThemeDef> = {
  comptia: { hat: '#d8463e', hatDk: '#9e2f29', hatLt: '#f18b84', glow: '216,70,62', gem: '#ff6b61', gemLt: '#ffd3ce' },
  cisco: { hat: '#1ba0c4', hatDk: '#12708a', hatLt: '#63cde8', glow: '27,160,196', gem: '#3fd0f0', gemLt: '#cef3fb' },
  aws: { hat: '#e8912a', hatDk: '#a5641b', hatLt: '#f8bd72', glow: '232,145,42', gem: '#ffb454', gemLt: '#ffe8c6' },
  microsoft: { hat: '#3f7fd8', hatDk: '#2a579a', hatLt: '#86adee', glow: '63,127,216', gem: '#6ea8ff', gemLt: '#d8e6ff' },
  isc2: { hat: '#7b5bd6', hatDk: '#523a97', hatLt: '#af92f2', glow: '123,91,214', gem: '#a686ff', gemLt: '#e7dcff' },
  linux: { hat: '#2fae5a', hatDk: '#1f7a3f', hatLt: '#6fdb92', glow: '47,174,90', gem: '#57e08a', gemLt: '#cef7db' },
  engagement: { hat: '#b24ad0', hatDk: '#7d3193', hatLt: '#d98ff0', glow: '178,74,208', gem: '#e070ff', gemLt: '#f6d9ff' },
  default: { hat: '#1f8aa8', hatDk: '#145f75', hatLt: '#6cc4dc', glow: '31,138,168', gem: '#35b6d6', gemLt: '#c9eef8' },
};

const CYCLE_ORDER: MinerTheme[] = ['comptia', 'cisco', 'aws', 'microsoft', 'isc2', 'linux', 'engagement'];

/** Neutral (theme-independent) palette, straight from the prototype. */
const N = {
  sk: '#d9dee4', skLt: '#f1f4f7', skDk: '#a9b2bc', skSh: '#8d96a1',
  suit: '#c3cad2', suitDk: '#9aa4ae', suitLt: '#e6eaef',
  strap: '#7e8892', belt: '#6c7681', buckle: '#e0c069',
  boot: '#767f8a', bootDk: '#59616b',
  glove: '#8b949e', gloveDk: '#6e7782',
  eyeW: '#f6fafd', eye: '#161c23', mouth: '#5c6672',
  wood: '#c79b5e', woodDk: '#8f6534', woodLt: '#e3c58f',
  steel: '#c9d4de', steelDk: '#94a1ad', steelLt: '#f0f5f9',
  rock: '#3b4653', rockLt: '#556773', rockTop: '#657f8a', rockDk: '#252f39', rockEdge: '#7099a8',
  cave: '#0f151c', caveMid: '#141c25', caveLt: '#1b242f', caveEdge: '#25313d',
  ground: '#101720', groundEdge: '#212d38', crack: '#0d151c',
  beam: '#4a3a28', beamLt: '#6a5238',
};

/** The beat crop: the world rectangle that contains the miner and the rock.
 *  Top is 42, not 49: the chibi head is taller and the raised pick tip reaches
 *  y≈49, so the tighter crop clipped the pickaxe head at the top of the swing. */
const BEAT = { x: 95, y: 42, w: 122, h: 92 };
export const BEAT_ASPECT = BEAT.w / BEAT.h;

export function PixelMiner({
  theme = 'default',
  variant = 'scene',
  interactive = false,
  animate = true,
  className,
  /** Displayed CSS height in px for `beat`; `scene` fills its parent. */
  size = 40,
}: {
  theme?: MinerTheme | 'cycle';
  variant?: 'scene' | 'beat';
  interactive?: boolean;
  animate?: boolean;
  className?: string;
  size?: number;
}) {
  const reduce = useReducedMotionSafe();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // The rAF loop reads the theme through a ref so a theme change doesn't restart
  // the whole scene. Written in an effect, not during render (react-hooks/refs).
  const themeRef = useRef(theme);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
  const live = animate && !reduce;

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const beat = variant === 'beat';
    const W = (cv.width = beat ? BEAT.w : 256);
    const H = (cv.height = beat ? BEAT.h : 144);

    let cycleIdx = 0;
    const pickTheme = (): ThemeDef => {
      const t = themeRef.current;
      if (t === 'cycle') return THEMES[CYCLE_ORDER[cycleIdx % CYCLE_ORDER.length]];
      return THEMES[t] ?? THEMES.default;
    };
    let T = pickTheme();

    // ── helpers ─────────────────────────────────────────────────────────────
    const R = (x: number, y: number, w: number, h: number, c: string) => {
      ctx.fillStyle = c;
      ctx.fillRect(x | 0, y | 0, Math.max(1, w | 0), Math.max(1, h | 0));
    };
    function disc(cx: number, cy: number, r: number, c: string, x0?: number, x1?: number, y0?: number, y1?: number) {
      ctx!.fillStyle = c;
      const r2 = r * r;
      for (let y = -r; y <= r; y++) {
        if (y0 != null && (cy + y < y0 || cy + y > y1!)) continue;
        const yy = y * y;
        for (let x = -r; x <= r; x++) {
          if (x0 != null && (cx + x < x0 || cx + x > x1!)) continue;
          if (x * x + yy <= r2) ctx!.fillRect((cx + x) | 0, (cy + y) | 0, 1, 1);
        }
      }
    }
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
    const eOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const eIn = (t: number) => t * t * t;
    const eIO = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    // ── pickaxe sprite ──────────────────────────────────────────────────────
    const PIV = { x: 20, y: 54 }, TIP = { x: 16, y: -43 };
    const pick = document.createElement('canvas');
    pick.width = 40; pick.height = 60;
    {
      const g = pick.getContext('2d')!;
      const P = (x: number, y: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
      P(18, 16, 4, 38, N.wood); P(18, 16, 1, 38, N.woodDk); P(21, 16, 1, 38, N.woodLt);
      P(18, 30, 4, 2, N.woodDk); P(18, 44, 4, 2, N.woodDk);
      P(4, 10, 32, 4, N.steel); P(2, 11, 4, 2, N.steelDk); P(34, 11, 4, 2, N.steelDk);
      P(8, 9, 24, 1, N.steelLt); P(6, 13, 28, 1, N.steelDk);
      P(16, 8, 8, 9, N.steel); P(17, 8, 6, 1, N.steelLt); P(16, 15, 8, 2, N.steelDk);
      P(13, 40, 7, 7, N.glove); P(20, 40, 7, 7, N.glove);
      P(13, 40, 7, 1, '#a3acb6'); P(20, 40, 7, 1, '#a3acb6');
      P(13, 46, 7, 1, N.gloveDk); P(20, 46, 7, 1, N.gloveDk);
    }

    // ── state ───────────────────────────────────────────────────────────────
    const CY = 1.5;
    let cycle = 0, prev = 0;
    let shake = 0, sx = 0, sy2 = 0, lamp = 0, flash = 0, happy = 0, blink = 0, blinkT = rnd(1.5, 3.5);
    type Dust = { x: number; y: number; vx: number; vy: number; life: number; max: number; s: number };
    type Gem = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; r: number; life: number; max: number; b: number };
    type Shard = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; a: number; b: number; cc: number; d: number; life: number };
    const dust: Dust[] = [], gems: Gem[] = [], shards: Shard[] = [];
    const motes = Array.from({ length: 16 }, () => ({ x: rnd(20, 240), y: rnd(20, 120), v: rnd(3, 8), ph: rnd(0, 6.3), a: rnd(0.05, 0.16) }));
    const drips = [36, 88, 212].map((x) => ({ x, y: rnd(20, 60), t: rnd(0, 3) }));

    // static cave decor
    const stalac = Array.from({ length: 9 }, () => ({ x: rnd(8, 248), w: rnd(4, 10), h: rnd(8, 26) }));
    const crystSpots: [number, number][] = [[26, 96], [54, 110], [236, 100], [214, 112], [74, 44], [196, 42], [12, 64], [244, 66], [100, 118], [152, 118]];
    const cryst = crystSpots.map(([x, y]) => ({
      x, y,
      c: Array.from({ length: 2 + ((Math.random() * 3) | 0) }, () => ({
        dx: rnd(-6, 6), dy: rnd(-3, 2), h: rnd(5, 13), w: rnd(2, 4), lean: rnd(-0.35, 0.35), p: rnd(0, 6.3),
      })),
    }));
    const rubble = Array.from({ length: 22 }, () => ({ x: rnd(4, 252), y: rnd(120, 138), r: rnd(1, 3.5), d: Math.random() < 0.5 }));
    const vein = Array.from({ length: 3 }, () => {
      const pts: [number, number][] = [];
      let x = rnd(0, 60), y = rnd(30, 80);
      for (let k = 0; k < 7; k++) { pts.push([x, y]); x += rnd(14, 30); y += rnd(-10, 10); }
      return pts;
    });

    // rock
    const RX = 182, RY = 100, RR = 26;
    const rock = { hits: 0, state: 'idle' as 'idle' | 'grow' | 'shatter', squash: 0, grow: 1, resp: 0, branches: [] as [number, number][][] };
    function octP(cx: number, cy: number, r: number, rot: number): [number, number][] {
      const p: [number, number][] = [];
      for (let i = 0; i < 8; i++) { const a = rot + (i * Math.PI) / 4; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
      return p;
    }
    function newRock() {
      rock.hits = beat ? 2 : 0; // the beat pays off in a single swing
      rock.state = 'grow'; rock.grow = 0; rock.squash = 0; rock.branches = [];
      for (let b = 0; b < 4; b++) {
        const dir = rnd(0, 6.3); const pts: [number, number][] = [[0, 0]];
        let x = 0, y = 0; const s = 3 + ((Math.random() * 2) | 0);
        for (let k = 0; k < s; k++) {
          x += Math.cos(dir) * (RR / s) * rnd(0.7, 1.1) + rnd(-2, 2);
          y += Math.sin(dir) * (RR / s) * rnd(0.7, 1.1) + rnd(-2, 2);
          pts.push([x, y]);
        }
        rock.branches.push(pts);
      }
      if (themeRef.current === 'cycle') { cycleIdx++; T = pickTheme(); }
    }
    newRock(); rock.state = 'idle'; rock.grow = 1;

    let ang = 0, sqY = 1, sqX = 1, hop = 0, lean = 0;
    const shoulder = { x: 0, y: 0 };
    const phase = () => (cycle % CY) / CY;
    function updateMotion(p: number) {
      if (p < 0.3) ang = -45 * eOut(p / 0.3);
      else if (p < 0.48) ang = -45 + -7 * ((p - 0.3) / 0.18);
      else if (p < 0.56) ang = -52 + 152 * eIn((p - 0.48) / 0.08);
      else if (p < 0.64) ang = 100 - 22 * eOut((p - 0.56) / 0.08);
      else ang = 78 - 78 * eIO((p - 0.64) / 0.36);
      sqY = 1; sqX = 1; hop = 0;
      if (p < 0.3) { const t = eOut(p / 0.3); sqY = 1 + 0.06 * t; sqX = 1 - 0.04 * t; }
      else if (p >= 0.56 && p < 0.72) {
        const t = (p - 0.56) / 0.16, s = Math.sin(t * Math.PI);
        sqY = 1 - 0.16 * s; sqX = 1 + 0.14 * s; hop = t < 0.25 ? 8 * (t / 0.25) : 6 * s;
      }
      lean = p >= 0.44 && p < 0.6 ? eIn((p - 0.44) / 0.16) * 3 : p >= 0.6 && p < 0.82 ? 3 * (1 - eOut((p - 0.6) / 0.22)) : 0;
    }
    function impact() {
      const a = (ang * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
      const cx = shoulder.x + (TIP.x * c - TIP.y * s), cy = shoulder.y + (TIP.x * s + TIP.y * c);
      lamp = 1; flash = 1;
      if (rock.state !== 'idle') return;
      rock.hits++; rock.squash = 1;
      if (rock.hits >= 3) {
        shake = 3.4; rock.state = 'shatter'; rock.resp = 0; happy = 0.6;
        spawnGems(15, RX, RY - 4, true);
        const pts = octP(RX, RY, RR, 0.1);
        for (let i = 0; i < 8; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % 8];
          const mx = (ax + bx + RX) / 3, my = (ay + by + RY) / 3;
          shards.push({ x: mx, y: my, vx: (mx - RX) * rnd(0.1, 0.16), vy: (my - RY) * rnd(0.1, 0.16) - rnd(1, 2.4), rot: rnd(0, 6.3), vr: rnd(-6, 6), a: ax - RX, b: ay - RY, cc: bx - RX, d: by - RY, life: 1 });
        }
        for (let i = 0; i < 22; i++) dust.push({ x: RX + rnd(-8, 8), y: RY + rnd(-6, 8), vx: rnd(-30, 30), vy: rnd(-34, -4), life: 1, max: rnd(0.5, 1), s: rnd(1, 2) });
      } else {
        shake = 1.9; spawnGems(4, cx, cy - 2, false);
        for (let i = 0; i < 12; i++) dust.push({ x: cx + rnd(-3, 3), y: cy + rnd(-3, 3), vx: rnd(-30, 20), vy: rnd(-30, -2), life: 1, max: rnd(0.4, 0.9), s: rnd(1, 2) });
      }
    }
    function spawnGems(n: number, x: number, y: number, big: boolean) {
      for (let i = 0; i < n; i++) {
        const dir = rnd(-2.5, -0.6), spd = big ? rnd(28, 70) : rnd(24, 52);
        gems.push({ x, y, vx: Math.cos(dir) * spd * rnd(0.6, 1), vy: Math.sin(dir) * spd, rot: rnd(0, 6.3), vr: rnd(-5, 5), r: big ? rnd(3, 4.5) : rnd(2.5, 3.5), life: 1, max: rnd(0.9, 1.5), b: 0 });
      }
    }
    function updateFX(dt: number) {
      if (shake > 0) { shake = Math.max(0, shake - dt * 14); sx = (Math.random() * 2 - 1) * shake; sy2 = (Math.random() * 2 - 1) * shake * 0.6; }
      else { sx = 0; sy2 = 0; }
      lamp = Math.max(0, lamp - dt * 3.5); flash = Math.max(0, flash - dt * 6); happy = Math.max(0, happy - dt);
      rock.squash = Math.max(0, rock.squash - dt * 3.5);
      blinkT -= dt;
      if (blink > 0) blink -= dt;
      else if (blinkT <= 0) { blink = 0.12; blinkT = rnd(2, 4.5); }
      if (rock.state === 'grow') { rock.grow = Math.min(1, rock.grow + dt * 4); if (rock.grow >= 1) rock.state = 'idle'; }
      if (rock.state === 'shatter') { rock.resp += dt; if (rock.resp > 0.5) newRock(); }
      for (let i = dust.length - 1; i >= 0; i--) { const d = dust[i]; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 26 * dt; d.vx *= 0.96; d.life -= dt / d.max; if (d.life <= 0) dust.splice(i, 1); }
      for (let i = gems.length - 1; i >= 0; i--) {
        const g = gems[i]; g.x += g.vx * dt; g.y += g.vy * dt; g.vy += 90 * dt; g.rot += g.vr * dt;
        if (g.y > 121 && !g.b) { g.y = 121; g.vy *= -0.45; g.vx *= 0.7; g.b++; }
        g.life -= dt / g.max; if (g.life <= 0) gems.splice(i, 1);
      }
      for (let i = shards.length - 1; i >= 0; i--) { const s = shards[i]; s.x += s.vx; s.y += s.vy; s.vy += 0.5; s.rot += s.vr * dt; s.life -= dt * 1.6; if (s.life <= 0) shards.splice(i, 1); }
      for (const m of motes) { m.y -= m.v * dt; m.ph += dt; if (m.y < 14) { m.y = 126; m.x = rnd(20, 240); } }
      for (const d of drips) { d.t += dt; if (d.t > 3.2) d.t = 0; }
    }

    // ── background (scene only) ─────────────────────────────────────────────
    function bg() {
      const g = ctx!.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0a0f14'); g.addColorStop(0.6, '#0d141b'); g.addColorStop(1, '#070a0d');
      ctx!.fillStyle = g; ctx!.fillRect(-4, -4, W + 8, H + 8);
      ctx!.fillStyle = '#060a0e'; ctx!.beginPath(); ctx!.ellipse(128, 74, 74, 52, 0, 0, 6.3); ctx!.fill();
      ctx!.fillStyle = '#0a1016'; ctx!.beginPath(); ctx!.ellipse(128, 74, 60, 42, 0, 0, 6.3); ctx!.fill();
      caveWall();
      ctx!.lineWidth = 1;
      vein.forEach((pts) => {
        ctx!.strokeStyle = 'rgba(' + T.glow + ',0.16)'; ctx!.beginPath(); ctx!.moveTo(pts[0][0], pts[0][1]);
        for (let k = 1; k < pts.length; k++) ctx!.lineTo(pts[k][0], pts[k][1]);
        ctx!.stroke();
      });
      stalactites(); timbers();
      const gg = ctx!.createRadialGradient(RX, RY, 4, RX, RY, 90);
      gg.addColorStop(0, 'rgba(' + T.glow + ',0.18)'); gg.addColorStop(1, 'rgba(' + T.glow + ',0)');
      ctx!.fillStyle = gg; ctx!.fillRect(-4, -4, W + 8, H + 8);
    }
    function caveWall() {
      const ledges = [[-4, 14, 70, 10], [52, 26, 64, 8], [-4, 40, 44, 10], [186, 20, 74, 10], [206, 34, 54, 8], [224, 50, 36, 10],
        [-4, 58, 34, 12], [228, 66, 32, 12], [-4, 80, 44, 14], [218, 84, 42, 14], [-4, 100, 58, 20], [204, 102, 60, 20]];
      ledges.forEach((l, i) => { R(l[0], l[1], l[2], l[3], i % 2 ? N.caveMid : N.cave); R(l[0], l[1], l[2], 1, N.caveEdge); R(l[0] + 2, l[1] + l[3] - 1, l[2] - 4, 1, '#080d12'); });
      for (let i = 0; i < 26; i++) { const x = (i * 37) % 256, y = 16 + ((i * 53) % 104); if (x > 70 && x < 190 && y > 30 && y < 110) continue; R(x, y, 2, 1, N.caveLt); }
    }
    function stalactites() {
      stalac.forEach((s) => {
        ctx!.fillStyle = N.caveMid; ctx!.beginPath(); ctx!.moveTo(s.x - s.w / 2, 0); ctx!.lineTo(s.x + s.w / 2, 0); ctx!.lineTo(s.x, s.h); ctx!.closePath(); ctx!.fill();
        ctx!.fillStyle = N.caveLt; ctx!.beginPath(); ctx!.moveTo(s.x - s.w / 2, 0); ctx!.lineTo(s.x - s.w / 2 + 2, 0); ctx!.lineTo(s.x - 1, s.h - 3); ctx!.closePath(); ctx!.fill();
      });
      drips.forEach((d) => {
        const t = d.t % 3.2;
        if (t < 1.6) { const y = d.y + t * 46; if (y < 120) R(d.x, y, 1, 2, 'rgba(160,200,220,.5)'); }
        else R(d.x - 2, 119, 5, 1, 'rgba(120,170,200,.18)');
      });
    }
    function timbers() {
      R(6, 26, 6, 96, N.beam); R(6, 26, 2, 96, N.beamLt);
      R(244, 26, 6, 96, N.beam); R(244, 26, 2, 96, N.beamLt);
      R(6, 20, 244, 7, N.beam); R(6, 20, 244, 2, N.beamLt);
      R(14, 27, 4, 4, '#3a2d1e'); R(238, 27, 4, 4, '#3a2d1e');
      for (let x = 22; x < 240; x += 28) R(x, 22, 2, 2, '#6d5638');
    }
    function crystals() {
      cryst.forEach((cl) => {
        cl.c.forEach((k) => {
          const px = cl.x + k.dx, py = cl.y + k.dy;
          const tipx = px + k.lean * k.h, tipy = py - k.h;
          ctx!.globalAlpha = 0.25 + 0.15 * Math.sin(cycle * 2 + k.p);
          const g = ctx!.createRadialGradient(px, py - k.h / 2, 0, px, py - k.h / 2, k.h);
          g.addColorStop(0, 'rgba(' + T.glow + ',0.55)'); g.addColorStop(1, 'rgba(' + T.glow + ',0)');
          ctx!.fillStyle = g; ctx!.beginPath(); ctx!.arc(px, py - k.h / 2, k.h, 0, 6.3); ctx!.fill();
          ctx!.globalAlpha = 1;
          ctx!.fillStyle = T.gem; ctx!.beginPath();
          ctx!.moveTo(tipx, tipy); ctx!.lineTo(px + k.w / 2, py - k.h * 0.25); ctx!.lineTo(px + k.w / 2, py); ctx!.lineTo(px - k.w / 2, py); ctx!.lineTo(px - k.w / 2, py - k.h * 0.25); ctx!.closePath(); ctx!.fill();
          ctx!.fillStyle = T.gemLt; ctx!.beginPath(); ctx!.moveTo(tipx, tipy); ctx!.lineTo(px + k.w / 2, py - k.h * 0.25); ctx!.lineTo(px, py - k.h * 0.2); ctx!.closePath(); ctx!.fill();
          R(px - 1, tipy + 2, 1, 2, '#ffffff');
        });
      });
    }
    function ground() {
      R(-4, 120, W + 8, H - 116, N.ground); R(-4, 120, W + 8, 1, N.groundEdge);
      R(-4, 124, W + 8, 1, '#0a0e13');
      rubble.forEach((r) => { disc(r.x, r.y, r.r, r.d ? '#1b242e' : '#232e3a'); R(r.x - 1, r.y - r.r, 1, 1, '#2e3b48'); });
      ctx!.fillStyle = 'rgba(3,6,9,0.55)';
      ctx!.beginPath(); ctx!.ellipse(120, 122, 20, 4, 0, 0, 6.3); ctx!.fill();
      ctx!.beginPath(); ctx!.ellipse(RX, 124, 25, 5, 0, 0, 6.3); ctx!.fill();
    }
    function motesDraw() {
      for (const m of motes) { ctx!.globalAlpha = m.a * (0.6 + 0.4 * Math.sin(m.ph)); R(m.x, m.y, 1, 1, '#cfe6f2'); }
      ctx!.globalAlpha = 1;
    }
    function vignette() {
      const g = ctx!.createRadialGradient(W / 2, H / 2, 54, W / 2, H / 2, 168);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
      ctx!.fillStyle = g; ctx!.fillRect(-4, -4, W + 8, H + 8);
    }

    // ── rock ────────────────────────────────────────────────────────────────
    function poly(pts: [number, number][], c: string) {
      ctx!.fillStyle = c; ctx!.beginPath(); ctx!.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx!.lineTo(pts[i][0], pts[i][1]);
      ctx!.closePath(); ctx!.fill();
    }
    function edge(a: [number, number], b: [number, number], c: string, w: number) {
      ctx!.strokeStyle = c; ctx!.lineWidth = w; ctx!.beginPath(); ctx!.moveTo(a[0], a[1]); ctx!.lineTo(b[0], b[1]); ctx!.stroke();
    }
    function gemShape(x: number, y: number, r: number, rot: number, col: string, lt: string) {
      ctx!.save(); ctx!.translate(x, y); ctx!.rotate(rot);
      ctx!.fillStyle = col; ctx!.beginPath(); ctx!.moveTo(0, -r); ctx!.lineTo(r * 0.8, -r * 0.2); ctx!.lineTo(r * 0.6, r); ctx!.lineTo(-r * 0.6, r); ctx!.lineTo(-r * 0.8, -r * 0.2); ctx!.closePath(); ctx!.fill();
      ctx!.fillStyle = lt; ctx!.beginPath(); ctx!.moveTo(0, -r); ctx!.lineTo(r * 0.8, -r * 0.2); ctx!.lineTo(0, 0); ctx!.closePath(); ctx!.fill();
      ctx!.fillStyle = '#fff'; ctx!.fillRect(-1, -r + 1, 1, 1); ctx!.restore();
    }
    function rockDraw() {
      if (rock.state === 'shatter' && rock.resp > 0.02) { shardsDraw(); return; }
      ctx!.save(); ctx!.translate(RX, RY);
      ctx!.scale((1 + 0.1 * rock.squash) * rock.grow, (1 - 0.12 * rock.squash) * rock.grow);
      ctx!.translate(-RX, -RY);
      const p = octP(RX, RY, RR, 0.1);
      poly(p, N.rock);
      poly([p[6], p[7], p[0], p[1], [RX, RY]], N.rockTop);
      poly([p[7], p[0], [RX, RY]], N.rockLt);
      poly([p[2], p[3], p[4], [RX, RY]], N.rockDk);
      edge(p[5], p[6], N.rockEdge, 2); edge(p[6], p[7], N.rockEdge, 2); edge(p[7], p[0], N.rockEdge, 1);
      const cg = ctx!.createRadialGradient(RX, RY, 1, RX, RY, 13);
      cg.addColorStop(0, 'rgba(' + T.glow + ',0.75)'); cg.addColorStop(1, 'rgba(' + T.glow + ',0)');
      ctx!.fillStyle = cg; ctx!.beginPath(); ctx!.arc(RX, RY, 13, 0, 6.3); ctx!.fill();
      gemShape(RX, RY, 5, 0.2, T.gem, T.gemLt);
      R(RX - 9, RY - 11, 2, 2, '#cdeef6'); R(RX - 7, RY - 12, 1, 1, '#fff');
      for (let i = 0; i < Math.min(rock.hits * 2, 8); i++) {
        const br = rock.branches[i % rock.branches.length];
        ctx!.strokeStyle = i >= rock.branches.length ? T.gemLt : N.crack;
        ctx!.lineWidth = 1;
        ctx!.beginPath(); ctx!.moveTo(RX + br[0][0], RY + br[0][1]);
        for (let k = 1; k < br.length; k++) ctx!.lineTo(RX + br[k][0], RY + br[k][1]);
        ctx!.stroke();
      }
      ctx!.restore();
      if (flash > 0) { ctx!.globalAlpha = flash * 0.8; disc(RX - RR + 3, RY, 3, '#eaffff'); ctx!.globalAlpha = 1; }
    }
    function shardsDraw() {
      for (const s of shards) {
        ctx!.save(); ctx!.translate(s.x, s.y); ctx!.rotate(s.rot); ctx!.globalAlpha = Math.max(0, s.life);
        ctx!.fillStyle = N.rock; ctx!.beginPath(); ctx!.moveTo(0, 0); ctx!.lineTo(s.a * 0.5, s.b * 0.5); ctx!.lineTo(s.cc * 0.5, s.d * 0.5); ctx!.closePath(); ctx!.fill();
        ctx!.fillStyle = N.rockLt; ctx!.fillRect(-1, -1, 2, 2); ctx!.restore();
      }
      ctx!.globalAlpha = 1;
    }
    function gemsDraw() {
      for (const g of gems) {
        ctx!.globalAlpha = clamp(g.life * 1.4, 0, 1);
        const gg = ctx!.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r * 2.5);
        gg.addColorStop(0, 'rgba(' + T.glow + ',0.5)'); gg.addColorStop(1, 'rgba(' + T.glow + ',0)');
        ctx!.fillStyle = gg; ctx!.beginPath(); ctx!.arc(g.x, g.y, g.r * 2.5, 0, 6.3); ctx!.fill();
        gemShape(g.x, g.y, g.r, g.rot, T.gem, T.gemLt);
      }
      ctx!.globalAlpha = 1;
    }

    // ── the miner ───────────────────────────────────────────────────────────
    /**
     * The miner, in chibi proportions: head r17 over a body r8, so the head
     * dominates — that ratio is what reads as "cute" rather than "small adult".
     * Big glossy eyes with two catchlights each, blush, softened brows, and
     * little arms with mitts. The hat and headlamp are rescaled to the larger
     * head. Everything outside this function (cave, rock, particles) is the
     * original scene.
     */
    function miner() {
      const bx = 116 + lean, gY = 120;
      shoulder.x = bx + 8; shoulder.y = 88;
      ctx!.save(); ctx!.translate(bx, gY); ctx!.scale(sqX, sqY); ctx!.translate(-bx, -gY); ctx!.translate(0, hop);

      // Legs — short and stubby, then chunky boots with a sole.
      R(bx - 6, gY - 12, 4, 9, N.suitDk); R(bx + 2, gY - 12, 4, 9, N.suit);
      R(bx - 6, gY - 12, 4, 1, N.suitLt); R(bx + 2, gY - 12, 4, 1, N.suitLt);
      R(bx - 8, gY - 4, 7, 4, N.boot); R(bx + 1, gY - 4, 8, 4, N.boot);
      R(bx - 8, gY - 1, 7, 2, N.bootDk); R(bx + 1, gY - 1, 8, 2, N.bootDk);
      R(bx - 8, gY - 4, 7, 1, '#8b939d'); R(bx + 1, gY - 4, 8, 1, '#8b939d');

      // Body — a small round bump under the big head.
      disc(bx + 1, gY - 22, 8, N.sk);
      disc(bx + 1, gY - 24, 8, N.skLt, bx - 8, bx + 2, gY - 32, gY - 22);
      R(bx + 6, gY - 26, 2, 9, N.skDk);
      R(bx - 4, gY - 24, 10, 10, N.suit); R(bx - 4, gY - 24, 10, 1, N.suitLt);
      R(bx - 3, gY - 29, 2, 6, N.strap); R(bx + 2, gY - 29, 2, 6, N.strap);
      R(bx - 3, gY - 24, 2, 1, N.buckle); R(bx + 2, gY - 24, 2, 1, N.buckle);
      R(bx - 7, gY - 16, 15, 3, N.belt); R(bx - 1, gY - 16, 4, 3, N.buckle);
      R(bx + 6, gY - 16, 3, 4, N.belt);

      // Little arms + mitts — the far arm, and the one gripping the pick.
      R(bx - 9, gY - 24, 3, 8, N.suitDk);
      R(bx - 9, gY - 17, 3, 3, N.glove);
      R(shoulder.x - 3, shoulder.y - 2, 5, 5, N.glove);
      R(shoulder.x - 3, shoulder.y - 2, 5, 1, N.gloveDk);

      // Head — big and round, with a soft dome shine.
      const hx = bx + 2, hy = gY - 44, HR = 17;
      disc(hx, hy, HR, N.sk);
      disc(hx, hy, HR, N.skLt, hx + 1, hx + HR, hy - HR, hy + 4);
      disc(hx, hy, HR, N.skDk, hx - HR, hx - 8, hy - 4, hy + HR);
      disc(hx - 5, hy - 8, 5, N.skLt);
      disc(hx - 16, hy + 3, 3, N.skDk);

      // Eyes — big, glossy, low-set, two catchlights each.
      const ey = hy + 4;
      if (blink > 0) { R(hx - 11, ey, 9, 1, N.eye); R(hx + 3, ey, 9, 1, N.eye); }
      else if (happy > 0) {
        R(hx - 10, ey - 1, 3, 1, N.eye); R(hx - 7, ey - 2, 3, 1, N.eye); R(hx - 4, ey - 1, 2, 1, N.eye);
        R(hx + 3, ey - 1, 2, 1, N.eye); R(hx + 5, ey - 2, 3, 1, N.eye); R(hx + 8, ey - 1, 3, 1, N.eye);
      } else {
        disc(hx - 6, ey, 5, N.eyeW); disc(hx + 7, ey, 5, N.eyeW);
        disc(hx - 6, ey, 3.6, N.eye); disc(hx + 7, ey, 3.6, N.eye);
        R(hx - 5, ey - 3, 2, 2, '#fff'); R(hx + 8, ey - 3, 2, 2, '#fff');
        R(hx - 8, ey + 1, 1, 1, '#fff'); R(hx + 5, ey + 1, 1, 1, '#fff');
      }
      // Brows softened so he reads friendly rather than stern.
      R(hx - 9, ey - 7, 4, 1, N.skSh); R(hx + 6, ey - 7, 4, 1, N.skSh);
      R(hx - 1, hy + 11, 3, 1, N.mouth); R(hx - 2, hy + 10, 1, 1, N.mouth); R(hx + 2, hy + 10, 1, 1, N.mouth);
      ctx!.globalAlpha = 0.5;
      R(hx - 13, ey + 4, 4, 2, '#e79a9a'); R(hx + 9, ey + 4, 4, 2, '#e79a9a');
      ctx!.globalAlpha = 1;

      // Hard hat, scaled to the bigger head (radius 17 → 289 = 17²).
      const top = hy - HR;
      for (let y = 0; y < 15; y++) {
        const w = Math.round(Math.sqrt(Math.max(0, 289 - (y - 1) * (y - 1))) * 1.13);
        R(hx - w / 2, top + y, w, 1, y < 4 ? T.hatLt : T.hat);
      }
      R(hx - 16, hy - 8, 32, 2, T.hatDk);
      R(hx - 18, hy - 5, 36, 3, T.hatDk);
      R(hx + 14, hy - 6, 8, 3, T.hatDk);
      R(hx - 18, hy - 5, 36, 1, T.hatLt);
      R(hx - 10, top + 2, 8, 2, T.hatLt);
      R(hx - 1, top - 2, 3, 6, T.hatDk);
      R(hx - 1, top - 2, 1, 6, T.hatLt);

      const lf = 1 + lamp * 1.2;
      R(hx + 13, hy - 5, 6, 5, '#7c858f'); R(hx + 13, hy - 5, 6, 1, '#98a1ab');
      ctx!.save();
      const lg = ctx!.createRadialGradient(hx + 18, hy - 3, 0, hx + 18, hy - 3, 17 * lf);
      lg.addColorStop(0, 'rgba(240,250,255,' + 0.62 * lf + ')'); lg.addColorStop(1, 'rgba(240,250,255,0)');
      ctx!.fillStyle = lg; ctx!.beginPath(); ctx!.arc(hx + 18, hy - 3, 17 * lf, 0, 6.3); ctx!.fill();
      ctx!.globalAlpha = 0.12 * lf; ctx!.fillStyle = 'rgba(235,248,255,1)';
      ctx!.beginPath(); ctx!.moveTo(hx + 18, hy - 6); ctx!.lineTo(RX + 4, RY - 14); ctx!.lineTo(RX + 4, RY + 10); ctx!.lineTo(hx + 18, hy + 1); ctx!.closePath(); ctx!.fill();
      ctx!.restore();
      disc(hx + 18, hy - 3, 2, '#f2fbff'); R(hx + 18, hy - 4, 1, 1, '#fff');

      ctx!.globalAlpha = 0.5;
      disc(hx - 1, hy, HR, T.hatLt, hx - HR, hx - 13, hy - 9, hy + 9);
      R(bx - 8, gY - 27, 1, 9, T.hatLt);
      ctx!.globalAlpha = 1;
      ctx!.restore();
    }
    function arm() {
      ctx!.save(); ctx!.translate(shoulder.x, shoulder.y); ctx!.rotate((ang * Math.PI) / 180); ctx!.drawImage(pick, -PIV.x, -PIV.y); ctx!.restore();
      const p = phase();
      if (p > 0.5 && p < 0.57) {
        ctx!.globalAlpha = 0.3; ctx!.strokeStyle = '#e6f2fa'; ctx!.lineWidth = 1;
        ctx!.beginPath(); ctx!.arc(shoulder.x, shoulder.y, 44, -1.9, 0.4); ctx!.stroke(); ctx!.globalAlpha = 1;
      }
    }
    function particles() {
      for (const d of dust) { ctx!.globalAlpha = clamp(d.life, 0, 1) * 0.55; R(d.x, d.y, d.s, d.s, '#7c8894'); }
      ctx!.globalAlpha = 1;
    }

    // ── compose one frame ───────────────────────────────────────────────────
    function draw() {
      ctx!.setTransform(1, 0, 0, 1, 0, 0);
      ctx!.clearRect(0, 0, W, H);
      ctx!.save();
      if (beat) ctx!.translate(Math.round(sx) - BEAT.x, Math.round(sy2) - BEAT.y);
      else ctx!.translate(Math.round(sx), Math.round(sy2));
      if (!beat) { bg(); crystals(); motesDraw(); ground(); }
      rockDraw(); miner(); arm(); gemsDraw(); particles();
      ctx!.restore();
      if (!beat) vignette();
    }

    if (!live) {
      // One still: the miner mid-raise beside an intact, glowing rock.
      updateMotion(0.2);
      draw();
      return;
    }

    let raf = 0;
    let last = performance.now();
    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now; cycle += dt;
      const p = phase();
      updateMotion(p); updateFX(dt);
      if (prev < 0.56 && p >= 0.56) impact();
      prev = p;
      draw();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    const snap = () => { cycle = Math.floor(cycle / CY) * CY; };
    if (interactive) cv.addEventListener('click', snap);

    return () => {
      cancelAnimationFrame(raf);
      if (interactive) cv.removeEventListener('click', snap);
    };
  }, [variant, interactive, live]);

  if (variant === 'beat') {
    return (
      <canvas
        ref={canvasRef}
        className={className}
        style={{ height: size, width: size * BEAT_ASPECT, display: 'block' }}
        role="img"
        aria-label="A pixel miner striking a stone"
      />
    );
  }
  return (
    <canvas
      ref={canvasRef}
      className={`block h-full w-full ${className ?? ''}`}
      style={{ imageRendering: 'pixelated', cursor: interactive ? 'pointer' : undefined }}
      role="img"
      aria-label="A pixel miner working a glowing rock inside a mine"
    />
  );
}
