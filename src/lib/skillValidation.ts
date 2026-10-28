import type { ProfileRow, SkillProfile } from './skillProfile';
import type { ValidationAnswer } from './data/types';

/**
 * R141 — `capstone-skill-validation/1`: per skill, when it was first
 * demonstrated (the first verification stamp), when it was last validated (a
 * correct answer to a validation activity on a form the skill maps to), how
 * often, with what confidence, and whether it was retained (verified again
 * seven or more days after the first). Pure: the profile and the answers in,
 * the document out. The form behind an answer is read from its record key
 * (`<form>.<rest>`), the same key the activity was generated from.
 */
export const SKILL_VALIDATION_SCHEMA = 'capstone-skill-validation/1';

export interface SkillValidationRow {
  skillId: string;
  label: string;
  firstDemonstratedAt: number | null;
  lastValidatedAt: number | null;
  /** Answers on the skill's forms, every attempt. */
  validationCount: number;
  correctCount: number;
  /** Correct answers over answers judged, 0 to 1; 0 with none. */
  confidence: number;
  retained: boolean;
}

export interface SkillValidationDto {
  schema: typeof SKILL_VALIDATION_SCHEMA;
  courseId: string;
  role: string;
  skills: SkillValidationRow[];
}

/** The form a record key names: `srv_ip_plan.addresses[0].address` → `srv_ip_plan`; `f.decision:x` → `f`. */
export function formOfKey(recordKey: string): string {
  return recordKey.split('.')[0] ?? recordKey;
}

export function skillValidationOf(profile: Pick<SkillProfile, 'courseId' | 'role' | 'rows'>, answers: ValidationAnswer[]): SkillValidationDto {
  const mine = answers.filter((a) => a.courseId === profile.courseId);
  const byForm = new Map<string, ValidationAnswer[]>();
  for (const a of mine) {
    const f = formOfKey(a.recordKey);
    byForm.set(f, [...(byForm.get(f) ?? []), a]);
  }
  const row = (r: ProfileRow): SkillValidationRow => {
    const on = r.deliverables.flatMap((id) => byForm.get(id) ?? []);
    const judged = on.filter((a) => a.correct !== null);
    const correct = judged.filter((a) => a.correct === true);
    return {
      skillId: r.id,
      label: r.label,
      firstDemonstratedAt: r.firstVerifiedAt ?? r.lastVerifiedAt ?? null,
      lastValidatedAt: correct.length ? Math.max(...correct.map((a) => a.at)) : null,
      validationCount: on.length,
      correctCount: correct.length,
      confidence: judged.length ? Math.round((1000 * correct.length) / judged.length) / 1000 : 0,
      retained: r.retained === true,
    };
  };
  return { schema: SKILL_VALIDATION_SCHEMA, courseId: profile.courseId, role: profile.role, skills: profile.rows.skills.map(row) };
}
