import { describe, it, expect } from 'vitest';
import { PROCEDURES, WEEKS, procedureById } from './serverProcedures';
import { SERVER_PLUS } from '../data/seed/serverPlus';

/**
 * Steps say WHAT; the guide says HOW.
 *
 * Weeks 1 and 2 of Server+ used to carry the configuration guide twice: 22
 * near-verbatim click-list items in Week 1, and 49% of Week 2 restated — two
 * steps were 100% copies. A step now names the procedure instead (`guideRef`),
 * and these assertions are what keep the copy from creeping back and the link
 * from rotting.
 */
const steps = SERVER_PLUS.tasks.flatMap((t) => t.steps.map((s) => ({ task: t, step: s })));
const refs = steps.filter(({ step }) => step.guideRef);

describe('Server+ procedures — the guide the steps point at', () => {
  it('procedure ids are unique, and every one sits in a week the guide renders', () => {
    const ids = PROCEDURES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const weeks = new Set(WEEKS.map((w) => w.number));
    expect(PROCEDURES.filter((p) => !weeks.has(p.week)).map((p) => p.id)).toEqual([]);
  });

  it('the guide names the weeks the way the course does', () => {
    for (const w of WEEKS) {
      const seedWeek = SERVER_PLUS.weeks.find((x) => x.number === w.number);
      expect(seedWeek?.title, `guide week ${w.number}`).toBe(w.title);
    }
  });

  it('every guideRef resolves', () => {
    const broken = refs.filter(({ step }) => !procedureById(step.guideRef!.procedureId));
    expect(broken.map(({ step }) => `${step.id} → ${step.guideRef!.procedureId}`)).toEqual([]);
  });

  it('a guideRef lands in the week the step is in', () => {
    // The deep link selects the procedure's week in the guide. A step in Week 1
    // pointing at a Week-2 procedure would open the guide on the wrong week.
    const wrong = refs.filter(({ task, step }) => procedureById(step.guideRef!.procedureId)?.week !== task.week);
    expect(wrong.map(({ task, step }) => `${step.id} (week ${task.week}) → ${step.guideRef!.procedureId}`)).toEqual([]);
  });

  it('a step with a guideRef carries no click-list of its own', () => {
    const doubled = refs.filter(({ step }) => step.instructionList?.length || step.paths?.length);
    expect(doubled.map(({ step }) => step.id)).toEqual([]);
  });

  it('no step still links the guide as a bare file entry', () => {
    // The old shape: a `files[]` row whose source was the guide's section anchor,
    // rendered as four lines ending in a raw URL that always landed on Week 1.
    const stale = steps.filter(({ step }) => step.files?.some((f) => /guide(\/reference)?#config-guide/.test(f.source ?? '')));
    expect(stale.map(({ step }) => step.id)).toEqual([]);
  });

  it('the duplicated Week 1–2 steps are the ones that link', () => {
    expect(refs.length).toBeGreaterThanOrEqual(12);
  });
});
