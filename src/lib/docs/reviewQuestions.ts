/**
 * The peer reviewer's six binary questions (R84, spec §9). Binary on purpose:
 * a reviewer who can answer "mostly" will answer "yes" to work that is not
 * done, and the platform tie-break needs answers it can count. `confirm` is
 * DERIVED — all six yes — so a review can never say "confirmed" while an
 * answer says no; there is one source of truth, not a seventh checkbox.
 */
export const REVIEW_QUESTIONS: { id: string; label: string; hint: string }[] = [
  { id: 'complete', label: 'Complete', hint: 'Every required field and table has a real entry — nothing blank, nothing “TBD”.' },
  { id: 'correct', label: 'Correct', hint: 'Values have the right shape: addresses parse, names follow the convention, dates are dates.' },
  { id: 'consistent', label: 'Consistent', hint: 'Nothing contradicts itself — the same host, address or scope means the same thing everywhere.' },
  { id: 'evidenced', label: 'Evidence-backed', hint: 'Claims point at checks, hashes or recorded output — the frozen checks below agree with what is written.' },
  { id: 'clear', label: 'Clear', hint: 'Someone outside the team could follow it without asking what a row means.' },
  { id: 'standard', label: 'To standard', hint: 'It reads like the course’s format: right sections, right naming, right units.' },
];

/** A review confirms exactly when every question is answered yes. */
export function confirmOf(answers: Record<string, boolean>): boolean {
  return REVIEW_QUESTIONS.every((q) => answers[q.id] === true);
}

/** Answered at all — the submit gate: no question may be left untouched. */
export function allAnswered(answers: Record<string, boolean>): boolean {
  return REVIEW_QUESTIONS.every((q) => typeof answers[q.id] === 'boolean');
}
