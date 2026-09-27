import { describe, it, expect } from 'vitest';
import { validateDeliverableDef, validateDeliverableList } from './validateDeliverable';
import { seedDeliverablesForCourse } from './definitions';

const COURSE_IDS = ['security-plus', 'cysa-plus', 'server-plus', 'ccna', 'mssp'];

describe('R85 — the admin editor refuses what would break a student’s screen', () => {
  it('every shipped definition passes its own gate', () => {
    for (const id of COURSE_IDS) {
      const defs = seedDeliverablesForCourse(id);
      const v = validateDeliverableList(defs);
      expect(v.ok, id + (v.ok ? '' : `: ${(v as { error: string }).error}`)).toBe(true);
    }
  });

  it('rejects the malformed: not an object, missing keys, bad weeks', () => {
    expect(validateDeliverableDef('nope').ok).toBe(false);
    expect(validateDeliverableDef({ id: 'x' }).ok).toBe(false);
    const base = seedDeliverablesForCourse('server-plus')[0];
    expect(validateDeliverableDef({ ...base, weeks: [] }).ok).toBe(false);
    expect(validateDeliverableDef({ ...base, weeks: ['two'] }).ok).toBe(false);
  });

  it('rejects a malformed sections blob with a message that names the spot', () => {
    const base = seedDeliverablesForCourse('server-plus')[0];
    const bad = validateDeliverableDef({ ...base, sections: [{ kind: 'fields', fields: [{ label: 'No field key' }] }] });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toContain('sections[0]');
    const badKind = validateDeliverableDef({ ...base, sections: [{ kind: 'table' }] });
    expect(badKind.ok).toBe(false);
    const badGroup = validateDeliverableDef({ ...base, sections: [{ kind: 'group', group: { columns: [] } }] });
    expect(badGroup.ok).toBe(false);
  });

  it('rejects dod checks without a predicate, and duplicate ids in a list', () => {
    const base = seedDeliverablesForCourse('server-plus')[0];
    expect(validateDeliverableDef({ ...base, dod: [{ label: 'no when' }] }).ok).toBe(false);
    const dup = validateDeliverableList([base, base]);
    expect(dup.ok).toBe(false);
    if (!dup.ok) expect(dup.error).toContain('duplicate id');
  });
});
