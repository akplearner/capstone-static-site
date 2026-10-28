import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { formOfKey, skillValidationOf } from './skillValidation';
import { validate, type JsonSchema } from './schema/validate';
import { fullMemberInput } from './kpiBoard.allCourses.fixture';
import { skillProfile } from './skillProfile';
import type { ValidationAnswer } from './data/types';

const schema = JSON.parse(readFileSync(resolve(process.cwd(), 'content', 'schemas', 'skill-validation.schema.json'), 'utf8')) as JsonSchema;

/** R141 — per skill: demonstrated, validated, confidence, retained; from the profile and the answers. */
describe('R141 — skill validation', () => {
  it('reads the form behind an answer from its key', () => {
    expect(formOfKey('srv_ip_plan.addresses[0].address')).toBe('srv_ip_plan');
    expect(formOfKey('srv_bringup.decision:raid')).toBe('srv_bringup');
    expect(formOfKey('plain')).toBe('plain');
  });

  it('builds a document that validates, with the dates, counts and confidence per skill', () => {
    const input = fullMemberInput('server-plus', 'net');
    const profile = skillProfile(input);
    const skill = profile.rows.skills.find((r) => r.deliverables.length > 0)!;
    const form = skill.deliverables[0];
    const a = (over: Partial<ValidationAnswer>): ValidationAnswer => ({ courseId: 'server-plus', memberId: 'me', teamId: 't', activityId: 'val:3:recall:x', checkpoint: 3, kind: 'recall', recordKey: `${form}.g[0].c`, answerSha256: 'a'.repeat(64), correct: true, explanation: '', at: 10, ...over });
    const dto = skillValidationOf(profile, [a({}), a({ correct: false, at: 20 }), a({ kind: 'explain', correct: null, at: 30 }), a({ courseId: 'other', at: 40 })]);
    expect(validate(dto, schema)).toEqual([]);
    expect(dto.skills).toHaveLength(profile.rows.skills.length);
    const row = dto.skills.find((s) => s.skillId === skill.id)!;
    expect(row).toMatchObject({ validationCount: 3, correctCount: 1, confidence: 0.5, lastValidatedAt: 10 });
    expect(row.firstDemonstratedAt).toBe(skill.firstVerifiedAt ?? skill.lastVerifiedAt ?? null);
    const untouched = dto.skills.find((s) => !profile.rows.skills.find((r) => r.id === s.skillId)!.deliverables.includes(form))!;
    expect(untouched).toMatchObject({ validationCount: 0, correctCount: 0, confidence: 0, lastValidatedAt: null });
  });
});
