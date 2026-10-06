/**
 * R99 — "What you build this week", as one contract for every course.
 *
 * Every course draws its own picture (a rack, two campus sites, a SOC, an
 * attack lab, an MSSP engagement, a cloud architecture), and until R99 only
 * the cloud picture changed with the week. The instructor's rule: every week
 * of every course shows the build AS IT STANDS at the end of that week, with
 * this week's additions glowing — and on a week where nothing new is built,
 * the week's PROCESS is drawn over the same picture, so there is always
 * something new to look at.
 *
 * The data here is plain so it ships in the course document
 * (`content.weekVisuals`); the pictures read it through `weekVisualsOf`.
 */

/** One arrow of a process, between two parts of the course's picture. */
export interface WeekProcessStep {
  from: string;
  to: string;
  label: string;
}

/** The week's process, drawn over the picture: a title and a few arrows. */
export interface WeekProcess {
  title: string;
  steps: WeekProcessStep[];
}

export interface WeekVisual {
  /** The course's own week number (`WeekDef.number`; a cloud course counts 0–4). */
  week: number;
  /** What the picture draws as built. The cloud pictures count global weeks 1–12. */
  builtThrough: number;
  /** The parts that arrive THIS week — they glow. Derived from the build model, never authored twice. */
  highlight: string[];
  process?: WeekProcess;
  /** One sentence under the picture: what is new, or what the process shows. */
  caption: string;
}

/** A course's build, as data: when each drawable part arrives, and the authored overlays. */
export interface BuildModel {
  /** Every drawable part's id → the course-local week it arrives in (0 = there from the start). */
  arrives: Record<string, number>;
  /** By course-local week. */
  processes: Record<number, WeekProcess>;
  captions: Record<number, string>;
}

/** The ids that arrive in exactly this week. */
export function arrivingIn(model: BuildModel, week: number): string[] {
  return Object.keys(model.arrives).filter((id) => model.arrives[id] === week);
}

/** The ids built by the end of this week. */
export function partsBuiltThrough(model: BuildModel, week: number): string[] {
  return Object.keys(model.arrives).filter((id) => model.arrives[id] <= week);
}

/**
 * The course's week visuals from its build model, one per week number.
 * `toBuilt` maps a course-local week to what the picture calls built
 * (identity for most courses; the cloud slices add their offset).
 */
export function weekVisualsFrom(model: BuildModel, weeks: number[], toBuilt: (w: number) => number = (w) => w): WeekVisual[] {
  return weeks.map((week) => ({
    week,
    builtThrough: toBuilt(week),
    // R103: week 0 is the starting point — nothing "arrives", so nothing glows.
    highlight: week === 0 ? [] : arrivingIn(model, week),
    process: model.processes[week],
    caption: model.captions[week] ?? '',
  }));
}

/** Every id a process names — for the guard that each one is in the picture. */
export function processIds(p: WeekProcess | undefined): string[] {
  return p ? [...new Set(p.steps.flatMap((s) => [s.from, s.to]))] : [];
}
