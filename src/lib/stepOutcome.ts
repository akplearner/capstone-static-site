import type { Step } from './types';

// Pure logic behind "what you should see" (rendered by components/StepOutcome.tsx).
// Kept in a .ts module so it is unit-testable — vitest only collects src/**/*.test.ts.

/** A thing to point at inside a step's expected output, and why it matters. */
export interface OutputTarget {
  text: string;
  label: string;
}

/** Where a target was found, once numbered for display. */
export interface OutputHit extends OutputTarget {
  n: number;
  start: number;
  end: number;
}

export const GENERIC_VERIFY_LABEL =
  'this must appear in your real output for the step to have worked';

/**
 * Decide whether `expectedOutput` is text the student captured off a console, or
 * a sentence the author wrote describing the result.
 *
 * Multi-line content is something that was captured. A single line is almost
 * always a summary ("Both agents show Active with a recent check-in") — and
 * wrapping that in green monospace with a copy button was the original problem.
 * `Step.outputKind` overrides this when the guess is wrong.
 */
export function looksLikeConsoleOutput(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  if (t.includes('\n')) return true;
  if (/^[$#>]\s/.test(t)) return true; // an explicit prompt
  if (/^\S+@\S+[:#$]/.test(t)) return true; // user@host:~$ …
  return false;
}

/**
 * Locate each target in the output: first occurrence only, case-insensitive, and
 * never overlapping an earlier hit — so two targets sharing a substring can't
 * produce tangled markup. Targets that don't appear come back in `missing`,
 * because the sample output is illustrative and the student's real output isn't.
 */
export function locateTargets(
  output: string,
  targets: OutputTarget[]
): { hits: OutputHit[]; missing: OutputTarget[] } {
  const haystack = output.toLowerCase();
  const taken: [number, number][] = [];
  const hits: OutputHit[] = [];
  const missing: OutputTarget[] = [];

  targets.forEach((t) => {
    const needle = t.text.toLowerCase();
    if (!needle) return;
    let from = 0;
    let placed = false;
    while (from <= haystack.length - needle.length) {
      const at = haystack.indexOf(needle, from);
      if (at === -1) break;
      const end = at + needle.length;
      if (!taken.some(([s, e]) => at < e && end > s)) {
        taken.push([at, end]);
        hits.push({ ...t, n: 0, start: at, end });
        placed = true;
        break;
      }
      from = at + 1;
    }
    if (!placed) missing.push(t);
  });

  hits.sort((a, b) => a.start - b.start);
  hits.forEach((h, i) => {
    h.n = i + 1;
  });
  return { hits, missing };
}

/**
 * Build the list of things to point at. `verify` tokens come first because they
 * are, by definition, the substrings that must appear for the step to have
 * worked — they *are* the component being targeted. `outputHighlights` supplies
 * the authored explanation for a token, and any extra tokens worth naming.
 */
export function buildTargets(
  verify?: string[],
  outputHighlights?: Step['outputHighlights']
): OutputTarget[] {
  const byText = new Map<string, OutputTarget>();
  (verify ?? []).forEach((text) => {
    if (text.trim()) {
      byText.set(text.toLowerCase(), { text, label: GENERIC_VERIFY_LABEL });
    }
  });
  // An authored label wins over the generic one above.
  (outputHighlights ?? []).forEach((h) => {
    if (h.text.trim()) byText.set(h.text.toLowerCase(), { text: h.text, label: h.label });
  });
  return [...byText.values()];
}
