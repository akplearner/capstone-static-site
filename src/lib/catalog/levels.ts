import type { Level } from '../types';

/**
 * The credential ladder, surface → deep.
 *
 * The catalog is a quarry: an entry cert is a seam near the surface, an expert
 * cert is cut from the deepest rock. `depth` (1–4) drives that visual ordering —
 * deeper level, deeper seam — and `order` is the canonical sort so every list of
 * levels reads foundation-first. The wording is capstone/portfolio framed: these
 * describe the *work* at each tier, never an exam.
 */
export interface LevelDef {
  id: Level;
  /** Short label for chips and column headers. */
  name: string;
  /** One line on the kind of work this tier proves. */
  blurb: string;
  /** Canonical order, 1 = most foundational. */
  order: number;
  /** How deep the seam sits, 1 (surface) – 4 (deepest). Mirrors `order` today but
   *  kept separate so the visual metaphor and the sort can diverge later. */
  depth: 1 | 2 | 3 | 4;
}

export const LEVELS: LevelDef[] = [
  {
    id: 'entry',
    name: 'Entry',
    blurb: 'First cuts — stand up the basics and prove you can run the tools.',
    order: 1,
    depth: 1,
  },
  {
    id: 'associate',
    name: 'Associate',
    blurb: 'Working depth — build and operate a real environment end to end.',
    order: 2,
    depth: 2,
  },
  {
    id: 'professional',
    name: 'Professional',
    blurb: 'Deep seam — investigate, harden, and defend under pressure.',
    order: 3,
    depth: 3,
  },
  {
    id: 'expert',
    name: 'Expert',
    blurb: 'Bedrock — design, lead, and answer for the whole programme.',
    order: 4,
    depth: 4,
  },
];

const BY_ID: Record<Level, LevelDef> = Object.fromEntries(
  LEVELS.map((l) => [l.id, l])
) as Record<Level, LevelDef>;

/** The ordered list of level ids, foundation-first. */
export const LEVEL_ORDER: Level[] = [...LEVELS]
  .sort((a, b) => a.order - b.order)
  .map((l) => l.id);

/** Metadata for a level id (never throws — unknown ids fall back to Entry). */
export function levelDef(id: Level): LevelDef {
  return BY_ID[id] ?? LEVELS[0];
}
