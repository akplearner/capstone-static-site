import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PROCEDURES, WEEKS, procedureById } from './serverProcedures';
import { SERVER_PLUS } from '../data/seed/serverPlus';
import { HOST, OPS, ZONE_BRIDGES, BRIDGES } from '../serverTopology';

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
    expect(refs.length).toBeGreaterThanOrEqual(15);
  });
});

/**
 * Every team gets its OWN server, and the course has to say so everywhere.
 *
 * The Tailscale procedures were written from an instructor SOP that documents a
 * single real machine — local address 10.10.30.15, Tailscale address
 * 100.121.75.81. Pasted in as-is those would have told sixteen teams to
 * administer one host. The addressing rule is `HOST.rule` (10.10.30.T) with
 * Team 1 as the single worked example, and nothing else may appear.
 *
 * CySA+ is deliberately not scanned: its attacker box genuinely lives at
 * 10.10.30.<team> on a different lab, and that is its own course's fact.
 */
const SERVER_PLUS_SOURCES = [
  'src/lib/docs/serverProcedures.ts',
  'src/lib/data/seed/serverPlus.ts',
  'src/lib/docs/serverPlusDeliverables.ts',
  'src/lib/serverTopology.ts',
  'src/components/diagrams/ServerTopologyDiagram.tsx',
];
const readSource = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

/**
 * R71: the guide adds 10,400 explain words to the seed's. The base build is
 * Weeks 1–4, and a student follows it with the guide open beside the step, so
 * each explain is one line and each summary is a paragraph, not a page. The
 * budgets bind only the base build; the advanced weeks are a reference.
 */
describe('the base-build guide stays short enough to follow', () => {
  const prose = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  const base = PROCEDURES.filter((p) => p.week <= 4);

  it('has base-build procedures to measure', () => {
    expect(base.length).toBeGreaterThan(20);
  });

  it('every explain is under 40 words', () => {
    const over = base.flatMap((p) => p.steps.filter((s) => prose(s.explain) >= 40).map((s) => `${p.id}: ${(s.cmd ?? s.gui ?? '').slice(0, 40)} (${prose(s.explain)}w)`));
    expect(over, `cut these: ${over.join(', ')}`).toEqual([]);
  });

  it('every summary is under 60 words', () => {
    const over = base.filter((p) => prose(p.summary) >= 60).map((p) => `${p.id} (${prose(p.summary)}w)`);
    expect(over, `cut these: ${over.join(', ')}`).toEqual([]);
  });
});

describe('the host address is always the team’s own', () => {
  it.each(SERVER_PLUS_SOURCES)('%s writes only the rule or the Team 1 example', (path) => {
    const found = Array.from(readSource(path).matchAll(/10\.10\.30\.(\d+|[A-Za-z])/g)).map((m) => m[0]);
    const allowed = [HOST.rule, HOST.exampleAddress];
    expect(
      Array.from(new Set(found.filter((a) => !allowed.includes(a)))),
      `use ${HOST.rule} (worked example ${HOST.exampleAddress}), never one team's address`
    ).toEqual([]);
  });

  it.each(SERVER_PLUS_SOURCES)('%s carries no address from the source SOP', (path) => {
    // The SOP's own machine. A 100.x address belongs to one tailnet node; the
    // course must always say "whatever `tailscale ip -4` prints on your host".
    expect(readSource(path)).not.toContain('100.121.75.81');
  });
});

/**
 * Week 6's ops network is the one place a team's address is unique — and it is
 * unique by the team number, so a command that names one must carry the rule
 * (`OPS.team.rule`, 10.20.T) for the Lab access panel to fill, never a worked
 * example's octet. The Core's own block (10.20.0.x) is the same for everyone
 * and is allowed as a literal. The README the repository procedure writes is
 * a command too — a student copies it — so it is held to the same rule.
 */
describe('Week 6 names team addresses by the rule, never by example', () => {
  const week6Commands = [
    ...SERVER_PLUS.tasks.filter((t) => t.week === 6).flatMap((t) => t.steps.flatMap((s) => [s.command ?? '', ...(s.commands ?? []).map((c) => c.cmd)])),
    ...PROCEDURES.filter((p) => p.week === 6).flatMap((p) => p.steps.map((s) => s.cmd ?? '')),
  ].filter(Boolean);

  it('has Week 6 commands to check', () => {
    expect(week6Commands.length).toBeGreaterThan(40);
  });

  it('never hard-codes a team octet on the ops network', () => {
    const literal = week6Commands.filter((c) => /\b10\.20\.(?:[1-9]|1[0-6])\.\d+/.test(c));
    expect(literal, `use ${OPS.team.rule}.x so Lab access fills it`).toEqual([]);
  });

  it('uses the ops rule somewhere, so the token is not vacuous', () => {
    expect(week6Commands.some((c) => c.includes(OPS.team.rule))).toBe(true);
  });

  it('badges the instructor build so nobody runs it', () => {
    const day0 = procedureById('core-node-day-zero');
    expect(day0?.optional).toBe(true);
    expect(day0?.optionalLabel).toMatch(/Instructor/);
    // …and the only step that points at it is a read, not a build.
    const readers = SERVER_PLUS.tasks.flatMap((t) => t.steps).filter((s) => s.guideRef?.procedureId === 'core-node-day-zero');
    expect(readers.length).toBe(1);
    expect(readers[0].commands ?? []).toEqual([]);
  });
});

describe('the ops network is a plane, not a zone', () => {
  it('never appears among the segmented zones', () => {
    expect(ZONE_BRIDGES.map((b) => b.id as string)).not.toContain(OPS.bridge);
    expect(BRIDGES.map((b) => b.id as string)).not.toContain(OPS.bridge);
  });

  it('gives the Core a block no team can collide with', () => {
    // Team numbers start at 1; the Core sits in block 0.
    for (const addr of Object.values(OPS.core)) expect(addr.startsWith('10.20.0.')).toBe(true);
    expect(OPS.team.node.startsWith(OPS.team.rule + '.')).toBe(true);
    expect(OPS.team.opsVm.startsWith(OPS.team.rule + '.')).toBe(true);
  });
});
