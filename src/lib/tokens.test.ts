import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { contrastRatio } from './contrast';

/**
 * The palette, checked as arithmetic rather than looked at.
 *
 * R77 raises the saturation of every colour in the app — and saturation is the
 * change that quietly drops a button's label below the readable threshold. The
 * app has 12 theme blocks (a base, a dark twin, seven regions and five course
 * seams, each with its own dark twin), so "does the accent still work" is not one
 * question, it is a few hundred. Nobody checks a few hundred by eye, which is
 * how a course ends up with an unreadable chip that nobody notices for a term.
 *
 * So this walks the real cascade: the base tokens, then the dark overrides, then
 * the region, then the seam — the order a course page actually resolves them in
 * — and asserts the pairs the UI really renders.
 *
 * WHAT IT CANNOT SEE, stated rather than implied:
 *   - tokens whose value is `color-mix(in oklab, …)`. oklab mixing is not sRGB
 *     mixing and approximating it here would assert a number the browser never
 *     computes. Those tokens are skipped by name, and the skip list is asserted
 *     to be small.
 *   - opacity applied in a class (`text-muted/70`), which is a component
 *     decision rather than a token one.
 */

const CSS = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');

/** Every `--token: value;` inside one `selector { … }` block. */
function blockVars(selector: string): Record<string, string> {
  // Escape the selector for use in a regex, then take everything to the first
  // closing brace at the start of a line — every block here is top-level.
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = CSS.match(new RegExp(`^${esc}\\s*\\{([\\s\\S]*?)^\\}`, 'm'));
  if (!m) throw new Error(`no such block in globals.css: ${selector}`);
  const out: Record<string, string> = {};
  for (const line of m[1].matchAll(/(--[a-z0-9-]+):\s*([^;]+);/gi)) {
    out[line[1]] = line[2].trim();
  }
  return out;
}

const BASE = blockVars('@theme');
const DARK = blockVars('.dark');

/** The regions and seams, read from the file so a new one is covered the day it
 *  is added rather than the day somebody remembers this test exists. */
const REGIONS = [...CSS.matchAll(/^\[data-region='([a-z0-9-]+)'\]/gm)].map((m) => m[1]);
const SEAMS = [...CSS.matchAll(/^\[data-seam='([a-z0-9-]+)'\]/gm)].map((m) => m[1]);

/** Which region's rock a seam sits in — a course page sets both, and the seam is
 *  authored after its region, so the seam wins where they overlap. */
const SEAM_REGION: Record<string, string> = {
  'security-plus': 'comptia',
  'cysa-plus': 'comptia',
  'server-plus': 'comptia',
  mssp: 'engagement',
  ccna: 'cisco',
};

type Context = { name: string; vars: Record<string, string> };

function layer(...blocks: Record<string, string>[]): Record<string, string> {
  return Object.assign({}, ...blocks);
}

const CONTEXTS: Context[] = [
  { name: 'light', vars: BASE },
  { name: 'dark', vars: layer(BASE, DARK) },
  ...REGIONS.flatMap((r) => [
    { name: `light/${r}`, vars: layer(BASE, blockVars(`[data-region='${r}']`)) },
    {
      name: `dark/${r}`,
      vars: layer(BASE, DARK, blockVars(`[data-region='${r}']`), blockVars(`.dark [data-region='${r}']`)),
    },
  ]),
  ...SEAMS.flatMap((s) => {
    const r = SEAM_REGION[s];
    return [
      {
        name: `light/${r}/${s}`,
        vars: layer(BASE, blockVars(`[data-region='${r}']`), blockVars(`[data-seam='${s}']`)),
      },
      {
        name: `dark/${r}/${s}`,
        vars: layer(
          BASE,
          DARK,
          blockVars(`[data-region='${r}']`),
          blockVars(`.dark [data-region='${r}']`),
          blockVars(`[data-seam='${s}']`),
          blockVars(`.dark [data-seam='${s}']`)
        ),
      },
    ];
  }),
];

/** A token whose value this test can resolve to a flat hex. */
const isHex = (v: string | undefined): v is string => !!v && /^#[0-9a-fA-F]{3,8}$/.test(v);

/**
 * The pairs the UI actually renders, and the floor each one has to clear.
 *
 * 4.5 is the WCAG AA threshold for body text; 3.0 is the threshold for large
 * text and for the edge of a control. `--color-ink` is held at 7 because it is
 * AAA today and there is no reason for a saturation pass to spend that.
 */
const PAIRS: { fg: string; bg: string; floor: number; why: string }[] = [
  { fg: '--color-ink', bg: '--color-panel', floor: 7, why: 'body text on a card' },
  { fg: '--color-ink', bg: '--color-surface', floor: 7, why: 'body text on the page' },
  { fg: '--color-ink', bg: '--color-panel-2', floor: 7, why: 'body text on an inset strip' },
  { fg: '--color-body', bg: '--color-panel', floor: 4.5, why: 'form labels and ledes' },
  { fg: '--color-body', bg: '--color-panel-2', floor: 4.5, why: 'labels on an inset strip' },
  { fg: '--color-muted', bg: '--color-panel', floor: 4.5, why: 'table meta and captions' },
  { fg: '--color-muted', bg: '--color-surface', floor: 4.5, why: 'captions on the page' },
  { fg: '--color-muted', bg: '--color-panel-2', floor: 4.5, why: 'captions on a strip' },
  // The one saturation breaks first: every primary button label, in every theme.
  { fg: '--color-accent-contrast', bg: '--color-accent', floor: 4.5, why: 'the label on a primary button' },
  { fg: '--color-accent-ink', bg: '--color-accent-soft', floor: 4.5, why: 'accent text on an accent chip' },
  { fg: '--color-accent', bg: '--color-panel', floor: 4.5, why: 'the eyebrow kicker, 12px semibold' },
  { fg: '--color-ink', bg: '--color-ok-soft', floor: 4.5, why: 'an Alert body on a success fill' },
  { fg: '--color-ink', bg: '--color-warn-soft', floor: 4.5, why: 'an Alert body on a warning fill' },
  { fg: '--color-ink', bg: '--color-danger-soft', floor: 4.5, why: 'an Alert body on an error fill' },
  { fg: '--color-ink', bg: '--color-info-soft', floor: 4.5, why: 'an Alert body on an info fill' },
  { fg: '--color-ok', bg: '--color-panel', floor: 4.5, why: 'text-ok in a table' },
  { fg: '--color-warn', bg: '--color-panel', floor: 4.5, why: 'text-warn in a table' },
  { fg: '--color-danger', bg: '--color-panel', floor: 4.5, why: 'text-danger in a table' },
  { fg: '--color-info', bg: '--color-panel', floor: 4.5, why: 'text-info in a table' },
  { fg: '--color-term-tx', bg: '--color-term-bg', floor: 4.5, why: 'terminal output' },
  { fg: '--color-term-ip', bg: '--color-term-bg', floor: 4.5, why: 'an address in a terminal block' },
  { fg: '--color-term-dim', bg: '--color-term-bg', floor: 3, why: 'a dimmed terminal comment' },
];

describe('the palette is readable in every theme', () => {
  it('resolves a context for every region and seam the stylesheet declares', () => {
    expect(REGIONS.length, 'regions').toBeGreaterThanOrEqual(7);
    expect(SEAMS.length, 'seams').toBeGreaterThanOrEqual(5);
    // Every seam must name the region it sits in, or its context is wrong.
    for (const s of SEAMS) expect(SEAM_REGION[s], `seam '${s}' has no region`).toBeTruthy();
    expect(CONTEXTS.length).toBe(2 + REGIONS.length * 2 + SEAMS.length * 2);
  });

  it.each(CONTEXTS.map((c) => [c.name, c] as const))('%s', (_name, ctx) => {
    const failures: string[] = [];
    for (const { fg, bg, floor, why } of PAIRS) {
      const f = ctx.vars[fg];
      const b = ctx.vars[bg];
      // A token this context resolves to a mix is skipped — see the docblock.
      if (!isHex(f) || !isHex(b)) continue;
      const ratio = contrastRatio(f, b);
      if (ratio < floor) {
        failures.push(`${fg} on ${bg} = ${ratio.toFixed(2)}, needs ${floor} (${why})`);
      }
    }
    expect(failures, `${ctx.name}:\n  ${failures.join('\n  ')}`).toEqual([]);
  });

  it('leaves few pairs unchecked — a skip list that grows is a test going blind', () => {
    let checked = 0;
    let skipped = 0;
    for (const ctx of CONTEXTS) {
      for (const { fg, bg } of PAIRS) {
        if (isHex(ctx.vars[fg]) && isHex(ctx.vars[bg])) checked++;
        else skipped++;
      }
    }
    expect(checked, 'pairs actually measured').toBeGreaterThan(300);
    expect(skipped / (checked + skipped), 'fraction skipped').toBeLessThan(0.15);
  });
});

describe('every theme block is complete', () => {
  /** A seam that redefines the accent must redefine everything that sits on it,
   *  or a course ends up with a new accent and the old contrast colour. */
  const ACCENT_SET = ['--color-accent', '--color-accent-strong', '--color-accent-ink', '--color-accent-soft'];

  it('a block that moves the accent moves the whole accent family', () => {
    const bad: string[] = [];
    for (const sel of [
      ...REGIONS.flatMap((r) => [`[data-region='${r}']`, `.dark [data-region='${r}']`]),
      ...SEAMS.flatMap((s) => [`[data-seam='${s}']`, `.dark [data-seam='${s}']`]),
    ]) {
      const vars = blockVars(sel);
      if (!vars['--color-accent']) continue;
      for (const t of ACCENT_SET) if (!vars[t]) bad.push(`${sel} sets --color-accent but not ${t}`);
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
});
