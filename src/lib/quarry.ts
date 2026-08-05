import { Course } from './types';

/**
 * Capstone Quarry — the world model.
 *
 * "Build the environment. Work the process. Prove the skill."
 *
 * Two ideas carry the whole theme, and everything here exists to serve them:
 *
 *  1. **Every vendor is a geographic region with its own mineral.** A course
 *     isn't a colour, it's a place — CompTIA's Foundation Quarry, AWS's Ember
 *     Cloud Range. The mineral drives the palette, so the theme and the identity
 *     are the same decision rather than two that can drift apart.
 *
 *  2. **Every team shapes one evolving Capstone Stone.** Progress is not points;
 *     it's a rock getting cut. The stage is *derived* from work actually
 *     completed, so it can never flatter a student who hasn't done anything.
 *
 * Regions are keyed by vendor rather than by course, because two CompTIA courses
 * belong to the same geography. They're separated by a *seam* — a vein colour
 * within the same rock — so Security+ and CySA+ stay tellable apart without
 * pretending to be different places.
 */

// ── Regions ──────────────────────────────────────────────────────────────────

export interface QuarryRegion {
  /** CSS key; must match a `[data-region=...]` block in globals.css. */
  key: string;
  /** "The Foundation Quarry" — the place students are working in. */
  name: string;
  /** "Iron quartz" — what they're cutting. */
  mineral: string;
  /** One line of place-setting for the course header. Not marketing filler:
   *  it should tell a student what kind of work this region involves. */
  terrain: string;
}

export const REGIONS: Record<string, QuarryRegion> = {
  comptia: {
    key: 'comptia',
    name: 'The Foundation Quarry',
    mineral: 'Iron quartz',
    terrain:
      'Server rooms cut into rock, cabling run through the tunnels, checkpoints on every level. Broad, practical ground — hardware, networks, security and operations.',
  },
  aws: {
    key: 'aws',
    name: 'The Ember Cloud Range',
    mineral: 'Fire opal',
    terrain:
      'Volcanic peaks with platforms floating between them, amber cores burning at the centre of each. Distributed ground: what you build in one zone has to survive losing another.',
  },
  microsoft: {
    key: 'microsoft',
    name: 'The Azure Crystal Basin',
    mineral: 'Azure crystal',
    terrain:
      'Ordered blue formations and enterprise control rooms, with hybrid tunnels linking what is on-premises to what is in the cloud. Identity is the gate to everything.',
  },
  cisco: {
    key: 'cisco',
    name: 'The Copper Network Canyon',
    mineral: 'Copper-cobalt',
    terrain:
      'Deep interconnected canyons with copper pathways cut into the walls. Every route matters, and a wrong turn is visible for miles.',
  },
  isc2: {
    key: 'isc2',
    name: 'The Obsidian Security Vault',
    mineral: 'Obsidian diamond',
    terrain:
      'A black glass fortress of protected chambers, risk archives and controlled gates. Nothing moves here without being recorded.',
  },
  linux: {
    key: 'linux',
    name: 'The Emerald System Caverns',
    mineral: 'Emerald',
    terrain:
      'Underground command centres lit green by terminals, process pipelines running wall to wall, automation machinery that never stops.',
  },
  engagement: {
    key: 'engagement',
    name: 'The Obsidian Audit Vault',
    mineral: 'Obsidian',
    terrain:
      'A client-side vault where the work is evidence: controls proved, risks recorded, and every claim traceable to something you can show an auditor.',
  },
};

/** Fallback for a course we have no region for — neutral stone, never a guess. */
const UNCHARTED: QuarryRegion = {
  key: 'default',
  name: 'Uncharted Ground',
  mineral: 'Raw stone',
  terrain: 'A region that has not been surveyed yet.',
};

/**
 * Which region a course belongs to, and which seam within it.
 *
 * Keyed by course id with a safe default, because instructor-authored courses
 * can override a seed by id and may carry no vendor at all.
 */
const COURSE_REGION: Record<string, { region: string; seam: string }> = {
  'security-plus': { region: 'comptia', seam: 'security-plus' },
  'cysa-plus': { region: 'comptia', seam: 'cysa-plus' },
  mssp: { region: 'engagement', seam: 'mssp' },
};

export function regionFor(course: Course): QuarryRegion {
  const mapped = COURSE_REGION[course.id]?.region;
  if (mapped && REGIONS[mapped]) return REGIONS[mapped];
  // Fall back to the course's own vendor string if it names a known region.
  const byVendor = course.vendor?.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (byVendor && REGIONS[byVendor]) return REGIONS[byVendor];
  return UNCHARTED;
}

/** The CSS seam key — the vein colour inside the region's rock. */
export function seamFor(course: Course): string {
  return COURSE_REGION[course.id]?.seam ?? 'default';
}

// ── The Capstone Stone ───────────────────────────────────────────────────────

export type StoneStage = 0 | 1 | 2 | 3 | 4 | 5;

export interface StoneStageDef {
  stage: StoneStage;
  /** "Surveyed Capstone" */
  name: string;
  /** What the team has actually done to reach this. */
  means: string;
  /** The expedition verb for the week that produces it. */
  phase: string;
}

/**
 * Six stages, cut in order. The names are the artefact, not a score — a student
 * reading "Structured Capstone" should be able to say what they built to get it.
 *
 * The `phase` verbs are the *default* expedition arc, shaped for a course that
 * builds an environment. A week may override it (`WeekDef.phase`) when its
 * domain runs a different arc.
 */
export const STONE_STAGES: StoneStageDef[] = [
  {
    stage: 0,
    name: 'Uncut Capstone',
    means: 'Project assigned and crew formed. Nothing surveyed, nothing built.',
    phase: 'Arrive',
  },
  {
    stage: 1,
    name: 'Surveyed Capstone',
    means: 'Requirements read, domains mapped, roles assigned, design agreed.',
    phase: 'Survey & Design',
  },
  {
    stage: 2,
    name: 'Structured Capstone',
    means: 'Environment stood up and core services configured.',
    phase: 'Build & Establish',
  },
  {
    stage: 3,
    name: 'Operational Capstone',
    means: 'Systems integrated, workflows running end to end, monitoring live.',
    phase: 'Integrate & Connect',
  },
  {
    stage: 4,
    name: 'Secured Capstone',
    means: 'Controls in place, testing done, failures found and repaired, evidence collected.',
    phase: 'Secure & Validate',
  },
  {
    stage: 5,
    name: 'Master Capstone',
    means: 'Validated, documented, handed off and defended.',
    // Stage 5 is the only one a week cannot grant on its own — it is the act of
    // handing the work over, so its verb is the handover.
    phase: 'Transfer & Defend',
  },
];

export function stoneStage(stage: StoneStage): StoneStageDef {
  return STONE_STAGES[stage] ?? STONE_STAGES[0];
}

/** The cut a given week produces, if the course authored one. */
export function stageForWeek(course: Course, weekNumber: number): StoneStage | undefined {
  return course.weeks.find((w) => w.number === weekNumber)?.stage;
}

/**
 * The expedition verb for a week: the course's own wording if it authored one,
 * otherwise the default verb of the stage that week cuts. Returns null for a
 * week with neither, so callers render nothing rather than a placeholder.
 */
export function phaseForWeek(course: Course, weekNumber: number): string | null {
  const w = course.weeks.find((x) => x.number === weekNumber);
  if (!w) return null;
  if (w.phase) return w.phase;
  return w.stage != null ? stoneStage(w.stage).phase : null;
}

export interface StageInput {
  /** Week numbers the student has finished, in any order. */
  clearedWeeks: number[];
  /** Graded weeks that have work for this student. */
  totalWeeks: number;
  /** The course's capstone deliverable has been filled in. */
  capstoneFiled: boolean;
  /** Authored week→stage map, when the course has one. */
  stageOf?: (weekNumber: number) => StoneStage | undefined;
}

/**
 * Derive the stone's stage from work actually completed.
 *
 * A week only counts once it is *finished*, so the stone never advances on good
 * intentions. Setup weeks are excluded by the caller — they're opt-in and
 * shouldn't cut the stone.
 *
 * The stage is the **highest cut among the weeks cleared**, read from the
 * course's authored arc. That matters: the previous version derived the stage
 * from the *count* of cleared weeks and jumped straight to 5 the moment the
 * last one landed, so a four-week course produced stages 0,1,2,3,5 and "Secured
 * Capstone" could never be cut at all. Authoring the arc means the ladder has
 * as many rungs as the course has weeks, by construction.
 *
 * Master (5) is deliberately not something a week can grant. It requires every
 * graded week cleared *and* the capstone deliverable filed — the work has to be
 * handed over, not merely finished.
 */
export function deriveStoneStage({
  clearedWeeks,
  totalWeeks,
  capstoneFiled,
  stageOf,
}: StageInput): StoneStage {
  const allCleared = totalWeeks > 0 && clearedWeeks.length >= totalWeeks;
  if (allCleared && capstoneFiled) return 5;

  let highest = 0;
  for (const week of clearedWeeks) {
    // Fall back to positional order for a course with no authored arc (an
    // instructor-built one), so it still advances rather than sitting at Uncut.
    const authored = stageOf?.(week);
    const cut = authored ?? Math.min(4, week);
    if (cut > highest) highest = cut;
  }
  // A week must never award Master; that is the capstone's to give.
  return Math.min(4, highest) as StoneStage;
}

// ── Milestones ───────────────────────────────────────────────────────────────

/**
 * Professional progress markers, replacing XP and generic badges.
 *
 * Every one of these names something a technical crew would actually report at
 * a standup. "Level 3" tells a student nothing; "First operational service"
 * tells them exactly what they proved.
 */
export interface Milestone {
  id: string;
  label: string;
  /** What earns it — shown on hover, so the list doubles as a checklist. */
  hint: string;
  earned: boolean;
}
