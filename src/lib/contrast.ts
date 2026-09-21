/**
 * Contrast arithmetic, so "vibrant but still readable" is a number.
 *
 * R77 raises the saturation of every colour token in the app. Saturation and
 * legibility pull against each other — a punchier accent with white label text
 * on it is exactly the change that quietly drops a button below the readable
 * threshold — and the only honest way to make that change is to measure it
 * rather than look at it.
 *
 * This is a real module rather than a test helper because the same maths is
 * worth having at runtime later (an instructor picking a course accent should be
 * told when their colour fails), and because a helper hidden in a test file is a
 * helper nobody finds.
 *
 * The formulas are WCAG 2.1: relative luminance with the 0.03928 linearisation
 * split, and the (L1 + 0.05) / (L2 + 0.05) ratio.
 */

export type Rgb = [number, number, number];

/** `#rgb` or `#rrggbb` (case-insensitive) to 0-255 channels. */
export function parseHex(hex: string): Rgb {
  const h = hex.trim().replace(/^#/, '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`not a hex colour: ${hex}`);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** WCAG 2.1 relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** The WCAG ratio between two hex colours, 1 (identical) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(parseHex(a));
  const lb = relativeLuminance(parseHex(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Blend two hex colours in sRGB, `pct` being how much of `a` to use.
 *
 * An approximation of `color-mix()` and an honest one: the app's mixes are
 * authored `in oklab`, which is perceptually uniform and NOT the same as mixing
 * sRGB channels. Where a token is a mix, the caller either allows slack or skips
 * the pair by name — see `tokens.test.ts`. What this is good for is the case
 * that actually matters here: a translucent rim over a known background.
 */
export function mixSrgb(a: string, b: string, pct: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  const f = Math.max(0, Math.min(1, pct / 100));
  const ch = (x: number, y: number) => Math.round(x * f + y * (1 - f));
  return `#${[ch(ar, br), ch(ag, bg), ch(ab, bb)]
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')}`;
}

/** Rounded for messages: `4.83` reads better than `4.8321…` in a failure. */
export function ratioText(a: string, b: string): string {
  return contrastRatio(a, b).toFixed(2);
}
