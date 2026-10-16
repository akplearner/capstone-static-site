// readingBudget.ts — the words a student meets, counted the way the seeds are held to (R121).
//
// `content-integrity.test.ts` holds every seed to these budgets, so a step reads in a half-width
// column and the detail waits behind a press. A content fix (`contentFix.ts`) is held to the same
// numbers when it is saved: a fix that passes here cannot fail the suite on the day it is folded
// into the code. One module, two readers; raise a budget here and both follow.

/** Whitespace-separated tokens. */
export const words = (s: string): number => s.split(/\s+/).filter(Boolean).length;

/** Tokens that hold a letter or a digit, so a dash is not a word. */
export const prose = (s: string): number => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;

export const READING_BUDGET = {
  /** An instruction without a list, a troubleshooting paragraph, a "what it means": fewer words than this. */
  longWords: 40,
  /** A command's explanation in a graded week: fewer prose words than this. */
  explainProse: 36,
  /** At most this many prose words. */
  weekObjectiveProse: 20,
  taskObjectiveProse: 25,
  instructionProse: 30,
  /** Each action of an instruction list, at most. */
  actionProse: 20,
  /** A step's description in a graded week: fewer prose words than this. */
  descriptionProse: 30,
} as const;
