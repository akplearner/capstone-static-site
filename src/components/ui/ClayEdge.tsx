import { useId } from 'react';

/**
 * The gloss — the part of clay that CSS cannot do honestly.
 *
 * R77's depth is almost entirely tokens: `--clay-1/2/3` carry the rims and the
 * cast, and a box-shadow re-themes for free. What a box-shadow cannot draw is the
 * *sheen* — the soft highlight that runs across the top third of an extruded
 * shape and stops, which is the single cue that reads as "glossy" rather than
 * merely "raised". A linear-gradient background could fake it, but then the
 * shape's fill and its highlight are the same declaration, so a variant cannot
 * change one without re-typing the other.
 *
 * THE INSTRUCTION THIS ANSWERS (both halves of it): no new `.svg` file lands on
 * disk and lucide stays the only icon source, while the gloss itself IS an SVG
 * asset, authored once and reused across every control that has depth.
 *
 * ── Rules these all obey ──
 *   - purely decorative: `aria-hidden`, `focusable="false"`, `pointer-events-none`,
 *     so a screen reader never meets them and a click always lands on the control
 *     underneath rather than on its shine;
 *   - absolutely positioned and sized to the parent, so a consumer adds `relative`
 *     and nothing else — the gloss never changes a layout;
 *   - gradient ids come from `useId()`. Two buttons on one page with the same
 *     hardcoded `id` is the classic inline-SVG bug: the second one's gradient
 *     silently resolves to the first one's, and in a list of twenty they all
 *     inherit whatever rendered first.
 *
 * ── Where NOT to use them ──
 * Never inside a list row or a table row. The gloss is a per-control flourish; a
 * sheen on each of twelve rows is noise, and twelve extra SVG nodes per render is
 * a cost paid for noise. Dense surfaces use `variant="dense"` on `Surface`, which
 * is rims only — see the tier ladder in `Surface.tsx`.
 */

type GlossShape = 'pill' | 'card' | 'disc';

/** Where the sheen stops, per shape. A disc's highlight is tighter than a pill's
 *  because a sphere curves away from the light faster than a cylinder does. */
const SWEEP: Record<GlossShape, { stop: string; rx: number }> = {
  pill: { stop: '58%', rx: 50 },
  card: { stop: '46%', rx: 8 },
  disc: { stop: '52%', rx: 50 },
};

export function ClayGloss({ shape = 'pill', className = '' }: { shape?: GlossShape; className?: string }) {
  const id = useId();
  const grad = `gloss-${id}`;
  const { stop, rx } = SWEEP[shape];
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      // `preserveAspectRatio="none"` so one 100×100 sweep stretches to any control
      // width without the highlight bunching at the ends of a wide button.
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`.trim()}
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          {/* The values are deliberately in the stylesheet, not here: a gloss at a
              fixed white opacity is a light-mode gloss, and on a dark card it is a
              smear. `--gloss-stop-*` have dark twins; this only says WHERE they go. */}
          <stop offset="0%" stopColor="var(--gloss-stop-hi)" />
          <stop offset={stop} stopColor="var(--gloss-stop-mid)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" rx={rx} ry={rx} fill={`url(#${grad})`} />
    </svg>
  );
}

/**
 * The socket — a round well cut INTO a surface, for the spot a ring or an avatar
 * sits in. The inverse of `ClayGloss`: light from below, dark at the top, which is
 * what the eye reads as recessed.
 */
export function ClayWell({ className = '' }: { className?: string }) {
  const id = useId();
  const grad = `well-${id}`;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`.trim()}
    >
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--clay-rim-lo)" />
          <stop offset="45%" stopColor="transparent" />
          <stop offset="100%" stopColor="var(--clay-rim-hi)" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill={`url(#${grad})`} />
    </svg>
  );
}

/**
 * A badge blob with a real cast shadow — the one export here that uses a filter.
 *
 * A box-shadow follows the element's border-box, so on a shape that is not a
 * rectangle (a count bubble overlapping a card corner, a status pip on an avatar)
 * it casts a rectangle's shadow around a circle. `feDropShadow` follows the alpha
 * channel of what was actually drawn, which is the only correct answer for a
 * non-rectangular shape, and the reason this one is worth a filter's cost.
 */
export function ClayBadgeShape({ className = '' }: { className?: string }) {
  const id = useId();
  const filter = `badge-${id}`;
  const grad = `badgefill-${id}`;
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 100 100"
      className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`.trim()}
    >
      <defs>
        <filter id={filter} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="var(--clay-cast-far)" />
        </filter>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gloss-stop-hi)" />
          <stop offset="60%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="var(--clay-tint)" filter={`url(#${filter})`} />
      <circle cx="50" cy="50" r="48" fill={`url(#${grad})`} />
    </svg>
  );
}
