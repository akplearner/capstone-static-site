import { describe, it, expect } from 'vitest';
import { CATEGORY_DEFS, CHANGE_GROUPS, FORM_CATEGORY, PROFESSIONAL_THRESHOLD, RECORD_CATEGORIES, TROUBLE_GROUPS, formBase, formCategories, isRationaleKey, taskCategories } from './recordCategories';
import { SKILL_DOMAINS, SKILL_DOMAIN_IDS } from './skillDomains';
import { SCORES } from './scoring';
import { KPIS, kpiOf } from './kpis';
import { AREA_LABEL } from './skills';
import { decisionBlocksOf, decisionKey } from './types';
import { SEED_COURSES } from '../content/dto';
import { seedDeliverablesForCourse } from './definitions';
import { getTasksByRole, isGradedWeek } from '../course-helpers';
import { evaluate } from './predicate';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const register = (text: string, at: string) => {
  expect(text, `${at}: second person`).not.toMatch(/\b(you|your|yours|we|our)\b/i);
  expect(text, `${at}: em dash or emoji`).not.toMatch(/—|\p{Extended_Pictographic}/u);
  expect(text, `${at}: contraction`).not.toMatch(/\b\w+n[’']t\b|\b\w+[’'](re|ll|ve|m)\b|\b(it|that|what|there|here)[’']s\b/i);
};

/**
 * R132 — the record categories, the skill domains, the scores and the decision
 * blocks are data with a contract: every form and every graded task of every
 * course lands in at least one category; every category, domain and score
 * resolves what it names; every decision block offers three or more options
 * and its Definition-of-Done check holds only once a choice is made and the
 * required questions are answered; the tier threshold is ten.
 */
describe('R132 — the fourteen record categories', () => {
  it('are fourteen, in order, each naming real dimensions and competency areas, in the register', () => {
    expect(CATEGORY_DEFS.map((c) => c.id)).toEqual(RECORD_CATEGORIES);
    expect(RECORD_CATEGORIES.length).toBe(14);
    expect(PROFESSIONAL_THRESHOLD).toBe(10);
    for (const c of CATEGORY_DEFS) {
      expect(words(c.label), `${c.id} label ≤ 3 words`).toBeLessThanOrEqual(3);
      expect(words(c.unit), `${c.id} unit ≤ 25 words`).toBeLessThanOrEqual(25);
      expect(words(c.success), `${c.id} success ≤ 25 words`).toBeLessThanOrEqual(25);
      expect(c.areas.length, `${c.id} serves some competency area`).toBeGreaterThan(0);
      for (const a of c.areas) expect(AREA_LABEL, `${c.id} area ${a}`).toHaveProperty(a);
      register(`${c.unit} ${c.success}`, c.id);
    }
  });

  it('every form of every course lands in a category beyond documentation, and every fault or change table named exists with its columns', () => {
    const forms = SEED_COURSES.flatMap((c) => seedDeliverablesForCourse(c.id));
    expect(forms.length).toBeGreaterThan(100);
    for (const d of forms) {
      const cats = formCategories(d);
      expect(cats, `${d.id} is documentation`).toContain('documentation');
      expect(cats.length, `${d.id} lands somewhere beyond documentation`).toBeGreaterThan(1);
      if (d.capstone) expect(cats).toContain('projects');
    }
    const byId = new Map(forms.map((d) => [d.id, d]));
    const resolve = (form: string) => byId.get(form) ?? forms.find((d) => formBase(d.id) === form);
    for (const g of [...TROUBLE_GROUPS, ...CHANGE_GROUPS]) {
      const def = resolve(g.form);
      expect(def, `${g.form} exists`).toBeDefined();
      const section = def!.sections.find((s) => s.kind === 'group' && s.group.group === g.group);
      expect(section, `${g.form}.${g.group} is a table`).toBeDefined();
      const cols = section!.kind === 'group' ? section!.group.columns.map((c) => c.field) : [];
      expect(cols, `${g.form}.${g.group} has its outcome column`).toContain('outcome' in g ? g.outcome : g.rollback);
      if ('resolved' in g) expect(() => new RegExp(g.resolved, 'i')).not.toThrow();
    }
    for (const id of Object.keys(FORM_CATEGORY)) expect(resolve(id), `${id} in FORM_CATEGORY is a form`).toBeDefined();
    // Every course has a fault or incident table the Problem Solving domain can read.
    for (const c of SEED_COURSES) {
      const ids = seedDeliverablesForCourse(c.id).map((d) => d.id);
      expect(TROUBLE_GROUPS.some((g) => ids.includes(g.form) || ids.some((id) => formBase(id) === g.form)), `${c.id} has a fault, incident or triage table`).toBe(true);
    }
  });

  it('every graded task of every course lands in a category, and every course practises troubleshooting, configurations and architectures', () => {
    for (const c of SEED_COURSES) {
      const forms = seedDeliverablesForCourse(c.id);
      const byFile = new Map(forms.map((d) => [d.file, d]));
      const seen = new Set<string>();
      for (const role of c.roles) for (const t of getTasksByRole(c, role.id).filter((x) => isGradedWeek(c, x.week))) {
        const cats = taskCategories(c, t, byFile);
        expect(cats.length, `${c.id} ${t.id} lands somewhere`).toBeGreaterThan(0);
        cats.forEach((x) => seen.add(x));
      }
      for (const cat of ['troubleshooting', 'configurations', 'architectures', 'documentation']) expect(seen.has(cat as never), `${c.id} practises ${cat}`).toBe(true);
    }
    expect(isRationaleKey('raid_why')).toBe(true);
    expect(isRationaleKey('because')).toBe(true);
    expect(isRationaleKey('hostname')).toBe(false);
  });
});

describe('R132 — the eight skill domains and the scores (seven since R140)', () => {
  it('the domains are eight, in order, naming real dimensions, categories, KPIs and scores, in the register', () => {
    expect(SKILL_DOMAINS.map((d) => d.id)).toEqual(SKILL_DOMAIN_IDS);
    expect(SKILL_DOMAINS.length).toBe(8);
    for (const d of SKILL_DOMAINS) {
      expect(words(d.label), `${d.id} label ≤ 3 words`).toBeLessThanOrEqual(3);
      for (const [name, text] of [['definition', d.definition], ['asks', d.asks], ['evidence', d.evidence]] as const) {
        expect(words(text), `${d.id} ${name} ≤ 25 words`).toBeLessThanOrEqual(25);
        register(text, `${d.id} ${name}`);
      }
      expect(d.dimensions.length, `${d.id} reads a dimension`).toBeGreaterThan(0);
      for (const c of d.categories) expect(RECORD_CATEGORIES, `${d.id} category ${c}`).toContain(c);
      for (const k of d.kpis) expect(kpiOf(k), `${d.id} kpi ${k}`).toBeDefined();
      if (d.score) expect(SCORES.map((s) => s.id), `${d.id} score ${d.score}`).toContain(d.score);
    }
    expect(SKILL_DOMAINS.find((d) => d.id === 'professional-readiness')!.asks).toContain('professional level');
  });

  it('every score is a weighted mean whose weights sum to one over KPIs with a denominator, in the register', () => {
    expect(SCORES.length).toBe(7);
    for (const s of SCORES) {
      expect(words(s.label), `${s.id} label ≤ 4 words`).toBeLessThanOrEqual(4);
      expect(words(s.definition), `${s.id} definition ≤ 25 words`).toBeLessThanOrEqual(25);
      expect(words(s.caveat), `${s.id} caveat ≤ 25 words`).toBeLessThanOrEqual(25);
      register(`${s.definition} ${s.caveat}`, s.id);
      expect(Math.round(s.components.reduce((n, c) => n + c.weight, 0) * 1000)).toBe(1000);
      for (const c of s.components) {
        const k = kpiOf(c.kpi);
        expect(k, `${s.id} reads ${c.kpi}`).toBeDefined();
        expect(k!.scored, `${c.kpi} is marked scored`).toBe(true);
        expect(k!.unit, `${c.kpi} has a denominator or is minutes`).not.toBe('count');
      }
    }
    // Every scored KPI is read by exactly one score.
    const reads = SCORES.flatMap((s) => s.components.map((c) => c.kpi));
    expect(new Set(reads).size).toBe(reads.length);
    expect(KPIS.filter((k) => k.scored).map((k) => k.id).sort()).toEqual([...reads].sort());
  });
});

describe('R132 — the decision blocks', () => {
  const forms = SEED_COURSES.flatMap((c) => seedDeliverablesForCourse(c.id).map((d) => ({ course: c.id, def: d })));

  it('every course has at least one, every block offers three or more options with unique ids, and the words keep the budgets', () => {
    const courses = new Set<string>();
    for (const { course, def } of forms) {
      for (const b of decisionBlocksOf(def)) {
        courses.add(course);
        expect(b.options.length, `${def.id}.${b.id} offers three options`).toBeGreaterThanOrEqual(3);
        expect(new Set(b.options.map((o) => o.id)).size).toBe(b.options.length);
        expect(words(b.prompt), `${def.id}.${b.id} prompt ≤ 25 words`).toBeLessThanOrEqual(25);
        expect(b.questions.filter((q) => q.required).length, `${def.id}.${b.id} asks for a reason`).toBeGreaterThanOrEqual(2);
        for (const o of b.options) {
          expect(words(o.label), `${def.id}.${b.id}.${o.id} label ≤ 8 words`).toBeLessThanOrEqual(8);
          if (o.help) expect(words(o.help), `${def.id}.${b.id}.${o.id} help ≤ 25 words`).toBeLessThanOrEqual(25);
        }
        // The questions' keys collide with no other field of the form.
        const others = def.sections.flatMap((s) => (s.kind === 'fields' ? s.fields.map((f) => f.field) : []));
        for (const q of b.questions) expect(others, `${def.id}.${b.id}.${q.field} is its own field`).not.toContain(q.field);
      }
    }
    for (const c of SEED_COURSES) expect(courses.has(c.id), `${c.id} has a decision block`).toBe(true);
  });

  it('the Definition-of-Done check holds only with a choice and every required answer', () => {
    const { def } = forms.find((f) => decisionBlocksOf(f.def).length > 0)!;
    const b = decisionBlocksOf(def)[0];
    const check = def.dod!.find((c) => c.label.startsWith(b.title))!;
    expect(check, `${def.id} carries the decision check`).toBeDefined();
    const required = b.questions.filter((q) => q.required).map((q) => q.field);
    const answers = Object.fromEntries(required.map((f) => [f, 'A real answer, forty characters long at least.']));
    expect(evaluate(check.when, { fields: {}, groups: {} })).toBe(false);
    expect(evaluate(check.when, { fields: { ...answers }, groups: {} }), 'answers without a choice').toBe(false);
    expect(evaluate(check.when, { fields: { [decisionKey(b.id)]: b.options[0].id }, groups: {} }), 'a choice without answers').toBe(required.length === 0);
    expect(evaluate(check.when, { fields: { [decisionKey(b.id)]: b.options[0].id, ...answers }, groups: {} })).toBe(true);
  });
});
