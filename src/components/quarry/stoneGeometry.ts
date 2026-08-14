import type { StoneStage } from '@/lib/quarry';

/**
 * The capstone stone, as pure geometry.
 *
 * WHY THIS FILE EXISTS: the same stone is drawn in five places — the progress
 * emblem (`CapstoneStone`), the reward beat (`CutMark`), the landing hero
 * (`QuarryScene`), the favicon (`app/icon.tsx`) and the social card
 * (`app/opengraph-image.tsx`). Until now each one had its own hand-authored path
 * data, so there were three different stones in the product and any change to one
 * silently desynced the others. The path strings live here once; every surface
 * scales them into its own viewBox.
 *
 * This module is deliberately plain data with no React and no CSS variables, so
 * the two Satori-rendered images (`icon`, `opengraph-image`) can import it too —
 * Satori is not a browser and resolves no custom properties, so those callers
 * supply their own hex fills.
 *
 * Canonical space: a 120×120 viewBox with the stone's hub vertex at (58, 56).
 */

/** Every path here is authored in this box. Scale, don't re-author. */
export const VIEWBOX = 120;

/** The interior vertex every facet fans from. Also the crystal's seat. */
export const HUB = { x: 58, y: 56 } as const;

/**
 * Three silhouettes, not six.
 *
 * The old art gave each stage its own outline, but stages 0–1 and 2–5 differed by
 * about two units per vertex — invisible at the 30px and 44px sizes where most
 * stones actually render. Shape is the one property that survives downscaling, so
 * it is what carries the progression now:
 *
 *   rough → an unworked boulder (12 lumpy vertices)
 *   crown → the top cut clean, the base still rough (the "half done" read)
 *   cut   → the finished gem (7 vertices, all straight)
 *
 * `cut` is byte-for-byte the path already shipped in the favicon and the OG card,
 * so redrawing the stone does not invalidate images that are already in the wild.
 */
export type StoneKind = 'rough' | 'crown' | 'cut';

export const SILHOUETTE: Record<StoneKind, string> = {
  rough:
    'M26 88 L14 62 L22 40 L36 26 L52 20 L68 22 L82 18 L98 38 L102 58 L94 80 L74 96 L48 100 Z',
  crown: 'M18 54 L40 24 L74 18 L100 44 L94 80 L74 96 L48 100 L26 88 Z',
  cut: 'M30 86 L18 54 L40 24 L74 18 L100 44 L96 84 L62 102 Z',
};

export const STAGE_KIND: Record<StoneStage, StoneKind> = {
  0: 'rough',
  1: 'rough',
  2: 'crown',
  3: 'cut',
  4: 'cut',
  5: 'cut',
};

export function kindFor(stage: StoneStage): StoneKind {
  return STAGE_KIND[stage] ?? 'rough';
}

/**
 * A single flat face of the stone.
 *
 * `tone` is a signed lighting value under a light source at the upper left:
 * positive means "add this much of the highlight colour", negative means "add this
 * much of the shadow colour". Faces are *filled*, never merely outlined — a cut
 * stone reads as a cut stone because adjacent faces differ in value, and a filled
 * polygon stays legible at 30px where a 1px facet line renders at a quarter of a
 * device pixel and disappears.
 */
export interface Facet {
  d: string;
  tone: number;
}

const V = {
  bottomLeft: '30 86',
  left: '18 54',
  upperLeft: '40 24',
  top: '74 18',
  upperRight: '100 44',
  right: '96 84',
  bottom: '62 102',
} as const;

const from = (a: string, b: string) => `M${HUB.x} ${HUB.y} L${a} L${b} Z`;

/** The full fan: seven faces around the hub, in clockwise order from the left. */
const CUT_FACETS: Facet[] = [
  { d: from(V.left, V.upperLeft), tone: 0.26 },
  { d: from(V.upperLeft, V.top), tone: 0.38 },
  { d: from(V.top, V.upperRight), tone: 0.14 },
  { d: from(V.upperRight, V.right), tone: -0.34 },
  { d: from(V.right, V.bottom), tone: -0.62 },
  { d: from(V.bottom, V.bottomLeft), tone: -0.48 },
  { d: from(V.bottomLeft, V.left), tone: 0.04 },
];

/**
 * Stage 2 cuts the crown and nothing else, so it reuses the first three faces
 * unchanged — the crown vertices ARE the finished stone's top vertices. That is
 * the point: a student at stage 2 is looking at part of the final stone, not at a
 * different picture that will be thrown away.
 */
const CROWN_FACETS: Facet[] = CUT_FACETS.slice(0, 3);

export function facetsFor(kind: StoneKind): Facet[] {
  if (kind === 'cut') return CUT_FACETS;
  if (kind === 'crown') return CROWN_FACETS;
  return [];
}

/** The fan spokes, drawn as hairlines at large sizes to sharpen the facet edges. */
export const SPOKES: Record<StoneKind, string[]> = {
  rough: [],
  crown: [V.left, V.upperLeft, V.top, V.upperRight].map((p) => `M${HUB.x} ${HUB.y} L${p}`),
  cut: Object.values(V).map((p) => `M${HUB.x} ${HUB.y} L${p}`),
};

/** The lit edges, catching a specular highlight. Same on `crown` and `cut`. */
export const RIM = 'M18 54 L40 24 L74 18 L100 44';

/** Stage 2's girdle: the line the cut stopped at, with rough rock below it. */
export const GIRDLE = 'M18 54 L58 56 L100 44';

/**
 * The unworked half of a stage-2 stone, washed dark.
 *
 * Without it the crown's three lit faces are the only shading on the stone and
 * stage 2 renders *brighter* than the fully-cut stage 3 — the progression reads
 * backwards. Darkening the base also gives the girdle something to separate.
 */
export const CROWN_BASE = 'M18 54 L58 56 L100 44 L94 80 L74 96 L48 100 L26 88 Z';

/**
 * Stage 1 — requirements read and the cut planned, drawn straight onto raw rock.
 *
 * Solid accent guides with cross-ticks, not the old dashed hairlines: `--color-accent`
 * is the one token defined on every surface (the `--stone-*` set is not), and a
 * 3-3 dash pattern at 30px is a smudge.
 */
export const SCRIBE = ['M22 46 L100 40', 'M20 70 L98 64'];
export const SCRIBE_TICKS = ['M40 43 L40 49', 'M60 42 L60 48', 'M80 41 L80 47'];

/** Stage 3 — the mineral core. A polygon, so it holds an edge when scaled down. */
export const CRYSTAL = 'M58 45 L67 51 L67 62 L58 68 L49 62 L49 51 Z';
export const CRYSTAL_FACE = 'M58 45 L67 51 L58 56 Z';

/**
 * Stage 4 — a bezel hugging the girdle, replacing the two bands that used to be
 * drawn in an X *across* the face. Those bands destroyed the facet read the stone
 * had just earned; a setting reads as "protected" without touching the faces.
 */
export const BEZEL = 'M26 90 L13 53 L37 19 L76 13 L105 42 L100 87 L62 107 Z';
export const CLAWS = ['M13 53 L20 54', 'M76 13 L73 20', 'M105 42 L98 44', 'M62 107 L61 100'];

/** Stage 5 — seated and handed over. Sits just below the bezel's low vertex. */
export const PLINTH = { x: 32, y: 109, width: 56, height: 8, rx: 1.5 } as const;

/**
 * The specular sweep: a slanted band that travels across the stone, clipped to the
 * silhouette. Used as the "a cut landed" beat when the stage advances, and as the
 * slow ambient shimmer at large sizes.
 */
export const SWEEP_BAND = 'M0 -12 L28 -12 L-12 132 L-40 132 Z';
export const SWEEP_FROM = -70;
export const SWEEP_TO = 190;

/**
 * Fills for callers that cannot resolve CSS variables (Satori, in `icon.tsx` and
 * `opengraph-image.tsx`). Same construction as the live component: a base rock
 * fill with a per-facet highlight or shadow laid over it.
 */
export const STATIC_PALETTE = {
  rock: '#3f434b',
  rockDark: '#24272c',
  vein: '#d8dce3',
  crystal: '#7fc3ee',
  ground: '#14171c',
} as const;

/** Flatten a facet's signed tone into a solid hex, for the static renderers. */
export function facetHex(tone: number): { fill: string; opacity: number } {
  return tone >= 0
    ? { fill: STATIC_PALETTE.vein, opacity: tone }
    : { fill: STATIC_PALETTE.rockDark, opacity: -tone };
}
