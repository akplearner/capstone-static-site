import { Course } from './types';

/**
 * Per-course colour identity, keyed by vendor + certification.
 *
 * The app has one global accent (the SOC teal). With three courses running side
 * by side that means every course looks identical, and a student can't tell from
 * a screenshot which product they're in.
 *
 * Rather than thread colours through components — which Tailwind can't do with
 * dynamic class names anyway — each course sets a `data-course` attribute on its
 * layout wrapper, and `globals.css` re-declares the accent tokens under that
 * selector. Every existing `bg-accent`, `.eyebrow`, `.ip`, progress bar and
 * diagram then follows the course automatically, with no component edits.
 *
 * The value here is the CSS selector key, not the colour: the colours live in
 * globals.css so light and dark variants sit next to each other.
 */

export interface CourseTheme {
  /** Value for the `data-course` attribute; must match a block in globals.css. */
  key: string;
  /** Who awards the credential, shown as the left half of the identity chip. */
  vendor?: string;
  /** The credential itself, shown as the right half. */
  certification?: string;
}

/**
 * Fallback identities for the built-in seeds. A course may also carry `vendor`
 * and `certification` on itself; those win. Instructor-authored courses can
 * override a seed by id, so we resolve by id here and degrade to the neutral
 * default theme rather than assuming the fields exist.
 */
const SEED_THEMES: Record<string, CourseTheme> = {
  'security-plus': {
    key: 'security-plus',
    vendor: 'CompTIA',
    certification: 'Security+',
  },
  'cysa-plus': {
    key: 'cysa-plus',
    vendor: 'CompTIA',
    certification: 'CySA+ (CS0-003)',
  },
  mssp: {
    key: 'mssp',
    // Not a certification — a client engagement against SOC 2 + ISO 27001.
    vendor: 'Engagement',
    certification: 'SOC 2 + ISO 27001',
  },
};

/** Neutral identity for a course we have no styling for — keeps the default
 *  SOC-teal accents instead of guessing a colour. */
const DEFAULT_THEME: CourseTheme = { key: 'default' };

export function courseTheme(course: Course): CourseTheme {
  const seed = SEED_THEMES[course.id];
  const vendor = course.vendor ?? seed?.vendor;
  const certification = course.certification ?? seed?.certification;
  return {
    key: seed?.key ?? DEFAULT_THEME.key,
    vendor,
    certification,
  };
}

/** "CompTIA · CySA+ (CS0-003)", or just one side, or null if neither is known. */
export function courseIdentityLabel(course: Course): string | null {
  const { vendor, certification } = courseTheme(course);
  if (vendor && certification) return `${vendor} · ${certification}`;
  return vendor ?? certification ?? null;
}
