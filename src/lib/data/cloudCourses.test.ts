import { describe, it, expect } from 'vitest';
import type { Course, Task } from '../types';
import { AZURE_BLOCKS, AZURE_COURSES } from './seed/azureCloud';
import { AWS_BLOCKS, AWS_COURSES } from './seed/awsCloud';
import { seedDeliverablesForCourse } from '../docs/definitions';
import type { DeliverableDef } from '../docs/types';
import { isGradedWeek, weekTasksOrdered } from '../course-helpers';
import { AZURE_IAC } from '../cloud/azureIac';
import { AWS_IAC } from '../cloud/awsIac';

/**
 * R87/R90 — the cloud capstones' own contract, on top of the platform-wide
 * content guards. The instructor's rules were: three or four tasks a week,
 * under an hour each, one independent task per role, short on the surface,
 * industry documents, and the two platforms the same shape. R90 cut each
 * platform into three four-week courses, one per cert level, so the rules
 * now also say: the three quarters cover the plan exactly, and a course after
 * the first opens with a Week 0 that deploys what the previous one built.
 */

const words = (s: string) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
const minutes = (t: Task) => Number(/^(\d+) min$/.exec(t.estimatedTime ?? '')?.[1] ?? NaN);
const startsMachine = (t: Task) =>
  t.steps.some((s) => (s.commands ?? []).some((c) => /az vm (start|create)|start-instances|run-instances|az deployment group create|cloudformation deploy/.test(c.cmd)));
const stopsMachine = (t: Task) =>
  t.steps.some((s) => (s.commands ?? []).some((c) => /az vm deallocate|stop-instances|az group delete|cloudformation delete-stack/.test(c.cmd)));

// R92 — the instructor's three rules: free tier as far as the exam allows,
// the portal first with the shell as the option on every step, and the
// official documentation on every task with what to look for in it.
const DOC_HOSTS = ['learn.microsoft.com', 'docs.aws.amazon.com', 'aws.amazon.com', 'azure.microsoft.com', 'docs.github.com'];
/** The steps the portal genuinely cannot do, with the reason. Anything else with commands needs clicks too. */
const SHELL_ONLY: Record<string, string> = {
  'az-w6-dev-s2': 'a forged Origin header: only curl can send one',
  'aws-w6-dev-s2': 'a forged Origin header: only curl can send one',
  'az-w5-dev-s2': 'Cosmos DB data-plane roles are assigned by CLI only; the portal has no page for them',
};

// R93 — the entry courses (global Weeks 1–4) are read by students who have
// never seen a cloud console: every step carries a real reason, every
// non-obvious flag is explained, cross-role timing is stated, and the counter
// item is called the same thing everywhere.
const ENTRY_WEEKS = 4;
/** Commands whose flags need no breakdown: the reader already knows them or there are none. */
const PLAIN = /^(curl|echo|ls|cat|MYIP=|RG=|FN=|SITE=|API=|VOL=|SUB=|SG=|VPC=|IID=|PID=|URI=|KV=|WEB=|COSMOS=|BUCKET=|TAGS=|ACCT=|\{|<|const |import )/;
/** Task id → the role whose work it needs first (a substring of `prerequisites`). */
const NEEDS: Record<string, string> = {
  'az-w1-secops': 'Infrastructure',
  'az-w2-secops': 'Infrastructure', 'aws-w2-secops': 'Infrastructure',
  'az-w3-dev': 'Infrastructure', 'aws-w3-dev': 'Infrastructure',
  'az-w3-secops': 'App & DevOps', 'aws-w3-secops': 'App & DevOps',
  'az-w4-infra': 'App & DevOps', 'aws-w4-infra': 'App & DevOps',
};

function r93Problems(t: Task, authoredWeek: number): string[] {
  const out: string[] = [];
  if (authoredWeek < 1 || authoredWeek > ENTRY_WEEKS) return out;
  for (const s of t.steps) {
    if (s.usesForm) continue;
    if (words(s.whatItMeans ?? '') < 12) out.push(`${s.id}: the reason is ${words(s.whatItMeans ?? '')} words — a label, not an explanation`);
    if (authoredWeek <= 2) {
      for (const c of s.commands ?? []) {
        if (/\s--?[a-z]/.test(c.cmd) && !PLAIN.test(c.cmd) && !c.flags?.length) out.push(`${s.id}: "${c.cmd.slice(0, 40)}" has flags but no breakdown`);
      }
    }
  }
  const need = NEEDS[t.id];
  if (need && !t.prerequisites?.some((p) => p.includes(need))) out.push(`${t.id}: needs ${need}'s work first but does not say so`);
  return out;
}

// R95 — the two entry courses teach the exam and nothing past it. Every task
// names its exam domain first under "What you'll learn"; the topics that
// belong to the associate exams live in the next course; and the identity,
// MFA, lock and audit work the exams do test is present.
const DOMAINS: Record<string, string[]> = {
  'azure-fundamentals': ['AZ-900 · Cloud concepts', 'AZ-900 · Azure architecture and services', 'AZ-900 · Azure management and governance'],
  'aws-cloud-practitioner': ['CLF-C02 · Cloud Concepts', 'CLF-C02 · Security and Compliance', 'CLF-C02 · Cloud Technology and Services', 'CLF-C02 · Billing, Pricing and Support'],
};
/** Topics that belong to AZ-104 / SAA-C03 and later — none may appear in an entry-course step. */
const BEYOND_EXAM = /Key Vault reference|@Microsoft\.KeyVault|managed identity|foreign origin|Origin:|IMDSv2|HttpTokens=required|ADR-0|layer by layer|Parameter Store/i;
/** What the entry Security tasks must cover, week by week. */
const MUST_COVER: Record<string, RegExp> = {
  'az-w1-secops': /Contributor[\s\S]*MFA/, 'aws-w1-secops': /AdministratorAccess[\s\S]*MFA/,
  'az-w3-secops': /group[\s\S]*Reader/, 'aws-w3-secops': /group[\s\S]*ReadOnlyAccess/,
  'az-w4-secops': /lock/i, 'aws-w4-secops': /CloudTrail/,
};
const stepText = (t: Task) => t.steps.map((s) => JSON.stringify(s)).join('\n');

function r95Problems(course: Course, t: Task): string[] {
  const out: string[] = [];
  const domains = DOMAINS[course.id];
  if (!domains || t.week === 0) return out;
  if (!domains.includes(t.learn?.[0] ?? '')) out.push(`${t.id}: "What you'll learn" does not open with an exam domain (got "${t.learn?.[0]}")`);
  const hit = BEYOND_EXAM.exec(stepText(t));
  if (hit) out.push(`${t.id}: teaches "${hit[0]}", which belongs to the next course`);
  const must = MUST_COVER[t.id];
  if (must && !must.test(JSON.stringify(t))) out.push(`${t.id}: does not cover ${must}`);
  return out;
}

// R97 — the instructor's fourth round on the entry courses: easier, shorter,
// clicks only in the open (the shell is an optional drawer), and the
// documentation on every step, not just the task, so students learn to read it.
const ENTRY = new Set(['azure-fundamentals', 'aws-cloud-practitioner']);
const CLICKS = { perStep: 3, words: 16 };
function r97Problems(course: Course, t: Task): string[] {
  const out: string[] = [];
  if (!ENTRY.has(course.id) || t.week === 0) return out;
  if (words(t.freeTier ?? '') > 25) out.push(`${t.id}: free-tier line is ${words(t.freeTier ?? '')} words`);
  for (const d of t.docs ?? []) if (words(d.lookFor) > 18) out.push(`${t.id}: "${d.title}" look-for is ${words(d.lookFor)} words`);
  for (const s of t.steps) {
    if (s.usesForm) continue; // the record step is the form itself
    const clicks = s.instructionList ?? [];
    if (clicks.length > CLICKS.perStep) out.push(`${s.id}: ${clicks.length} clicks — more than ${CLICKS.perStep}`);
    for (const c of clicks) if (words(c) > CLICKS.words) out.push(`${s.id}: a click is ${words(c)} words`);
    if (words(s.whatItMeans ?? '') > 30) out.push(`${s.id}: the reason is ${words(s.whatItMeans ?? '')} words`);
    if (words(s.expectedOutput ?? '') < 5) out.push(`${s.id}: does not say what the screen shows`);
    if (!s.docs?.length) out.push(`${s.id}: no documentation on the step`);
    for (const d of s.docs ?? []) {
      if (!DOC_HOSTS.some((h) => new URL(d.url).hostname === h)) out.push(`${s.id}: ${d.url} is not official documentation`);
      if (words(d.lookFor) < 5 || words(d.lookFor) > 18) out.push(`${s.id}: "${d.title}" look-for is ${words(d.lookFor)} words`);
    }
    // Code the clicks paste (a function body, a policy) is not a shell alternative, and is marked so.
    const code = (s.commands ?? []).some((c) => /^(const |import |\{|<)/.test(c.cmd));
    if (code && !s.codeToPaste) out.push(`${s.id}: pastes code but is not marked codeToPaste`);
  }
  return out;
}

function r92Problems(t: Task): string[] {
  const out: string[] = [];
  if (t.week > 0) {
    if (!t.docs?.length) out.push(`${t.id}: no documentation`);
    for (const d of t.docs ?? []) {
      if (!DOC_HOSTS.some((h) => new URL(d.url).hostname === h)) out.push(`${t.id}: ${d.url} is not official documentation`);
      if (words(d.lookFor) < 5) out.push(`${t.id}: "${d.title}" does not say what to look for`);
    }
    if (!t.freeTier) out.push(`${t.id}: no free-tier line`);
    else if (words(t.freeTier) > 45) out.push(`${t.id}: free-tier line is ${words(t.freeTier)} words`);
    if (startsMachine(t) && !/stop|deallocate|delete/i.test(t.freeTier ?? '')) out.push(`${t.id}: starts the VM but the free-tier line never says to stop it`);
  }
  for (const s of t.steps) {
    const shell = (s.commands?.length ?? 0) > 0;
    const clicks = (s.instructionList?.length ?? 0) > 0;
    if (shell && !clicks && !SHELL_ONLY[s.id]) out.push(`${s.id}: shell only, with no portal path`);
    if (shell && clicks && !(s.verify?.length)) out.push(`${s.id}: both paths but nothing to verify`);
  }
  return out;
}

/** Every rule, as one function, so it can be proved against a broken task. */
function taskProblems(t: Task): string[] {
  const out: string[] = [];
  if (!(minutes(t) <= 60)) out.push(`${t.id}: ${t.estimatedTime} is over an hour`);
  if (t.steps.length > 5) out.push(`${t.id}: ${t.steps.length} steps`);
  for (const s of t.steps) {
    if (words(s.instruction ?? '') > 12) out.push(`${s.id}: visible line is ${words(s.instruction ?? '')} words`);
  }
  // Week 0 stands the environment up; it records nothing, on purpose.
  if (t.week > 0 && !t.steps.some((s) => s.producesDeliverable)) out.push(`${t.id}: records nothing`);
  if (startsMachine(t) && !stopsMachine(t)) out.push(`${t.id}: starts the VM and never stops it`);
  return out;
}

function documentProblems(d: DeliverableDef): string[] {
  const out: string[] = [];
  const titles = d.sections.map((s) => (s.kind === 'fields' ? s.title : s.group.label) ?? '');
  if (!titles[0]?.startsWith('Document control')) out.push(`${d.id}: does not open with Document control`);
  if (!titles[titles.length - 1]?.startsWith('Evidence')) out.push(`${d.id}: does not close with Evidence`);
  // Every section names who fills it ("Address plan · Infrastructure").
  for (const t of titles) if (!t.includes('·')) out.push(`${d.id}: section "${t}" names no role`);
  if (!d.shared) out.push(`${d.id}: not a team document`);
  return out;
}

const ALL = [...AZURE_COURSES, ...AWS_COURSES];

describe.each(ALL.map((c) => [c.id, c] as const))('R90 cloud capstone — %s', (id, course: Course) => {
  const graded = course.weeks.filter((w) => isGradedWeek(course, w.number));

  it('four graded weeks, none locked; the later courses open with a setup week', () => {
    expect(graded.map((w) => w.number)).toEqual([1, 2, 3, 4]);
    expect(graded.map((w) => w.stage)).toEqual([1, 2, 3, 4]);
    expect(course.noGatekeeping).toBe(true);
    expect(course.gates).toEqual([]);
    // A class is sixteen groups.
    expect(course.teamCount ?? 3, `${id} teamCount`).toBeGreaterThanOrEqual(16);
    const first = id === 'azure-fundamentals' || id === 'aws-cloud-practitioner';
    expect(course.weeks.some((w) => w.setup), `${id} setup week`).toBe(!first);
  });

  it('every graded week is exactly one independent task per role', () => {
    for (const w of graded) {
      const tasks = course.tasks.filter((t) => t.week === w.number);
      expect(tasks.map((t) => t.role).sort(), `week ${w.number}`).toEqual(course.roles.map((r) => r.id).sort());
      expect(tasks.some((t) => t.shared), `week ${w.number}: a shared task makes a role wait`).toBe(false);
      expect(tasks.some((t) => (t.consumes?.length ?? 0) > 0), `week ${w.number}: a task consumes another's output`).toBe(false);
    }
  });

  it('every task is under an hour, five steps at most, one short line each, and records its work', () => {
    expect(course.tasks.flatMap(taskProblems)).toEqual([]);
  });

  it('R92 — free tier stated, portal first with the shell as the option, official docs with what to look for', () => {
    expect(course.tasks.flatMap(r92Problems)).toEqual([]);
    // Every exemption names a real step, so the list cannot go stale.
    for (const id of Object.keys(SHELL_ONLY)) {
      if (id.startsWith(course.tasks[0].id.slice(0, 3))) expect(ALL.some((c) => c.tasks.some((t) => t.steps.some((s) => s.id === id))), id).toBe(true);
    }
  });

  it('R93 — a reason on every step, flags explained in the first two weeks, teammate timing stated', () => {
    const first = course.weeks.find((w) => w.number === 1)!;
    // The course's local week 1 is the block's first global week.
    const base = id.includes('fundamentals') || id.includes('practitioner') ? 0 : id.includes('administrator') || id.includes('solutions') ? 4 : 8;
    expect(first.number).toBe(1);
    expect(course.tasks.flatMap((t) => r93Problems(t, t.week === 0 ? 0 : base + t.week))).toEqual([]);
  });

  it('R95 — the entry courses teach the exam: a domain first, nothing from the next course, identity and audit covered', () => {
    expect(course.tasks.flatMap((t) => r95Problems(course, t))).toEqual([]);
  });

  it('R97 — entry courses: three short clicks, what the screen shows, docs on every step; the shell is optional there only', () => {
    expect(course.tasks.flatMap((t) => r97Problems(course, t))).toEqual([]);
    expect(course.shellOptional ?? false, `${id} shellOptional`).toBe(ENTRY.has(id));
  });

  it('R98 — every role reaches every task of every week: nothing is hidden behind a role', () => {
    for (const w of graded) {
      const all = course.tasks.filter((t) => t.week === w.number).map((t) => t.id).sort();
      for (const r of course.roles) {
        expect(weekTasksOrdered(course, r.id, w.number).map((t) => t.id).sort(), `${id} week ${w.number} as ${r.id}`).toEqual(all);
        expect(weekTasksOrdered(course, r.id, w.number)[0].role, `${id} week ${w.number}: ${r.id}'s own task comes first`).toBe(r.id);
      }
    }
  });

  it('every task carries this course’s own exam tag, not another quarter’s', () => {
    const tag = course.certification!.includes('AZ-900') ? 'AZ_900' : course.certification!.includes('AZ-104') ? 'AZ_104' : course.certification!.includes('AZ-400') ? 'AZ_400'
      : course.certification!.includes('CLF') ? 'AWS_CLF' : course.certification!.includes('SAA') ? 'AWS_SAA' : 'AWS_DOP';
    for (const t of course.tasks) {
      expect(t.frameworks, t.id).toContain(tag);
      for (const s of t.steps) expect(s.frameworks, s.id).toContain(tag);
    }
  });

  it('four documents, one per graded week, each opening with Document control and closing with Evidence; the last is the capstone', () => {
    const docs = seedDeliverablesForCourse(id);
    expect(docs.map((d) => d.weeks)).toEqual([[1], [2], [3], [4]]);
    expect(docs.map((d) => d.num)).toEqual([1, 2, 3, 4]);
    expect(docs.flatMap(documentProblems)).toEqual([]);
    expect(docs.filter((d) => d.capstone).map((d) => d.num)).toEqual([4]);
    for (const d of docs) for (const f of d.feeds ?? []) expect(docs.some((x) => x.id === f), `${d.id} feeds ${f}`).toBe(true);
  });
});

describe('R90 — three quarters make one plan', () => {
  it.each([
    ['Azure', AZURE_BLOCKS, AZURE_COURSES],
    ['AWS', AWS_BLOCKS, AWS_COURSES],
  ] as const)('%s: the blocks cover weeks 1–12 exactly, in order', (_p, blocks, courses) => {
    const ranges = Object.values(blocks).map((b) => b.weeks);
    expect(ranges).toEqual([[1, 4], [5, 8], [9, 12]]);
    expect(courses.map((c) => c.id)).toEqual(Object.values(blocks).map((b) => b.id));
    // 48 authored tasks, each in exactly one course.
    expect(courses.reduce((n, c) => n + c.tasks.filter((t) => t.week > 0).length, 0)).toBe(48);
  });

  it('a later course’s Week 0 deploys the previous course’s end state from the template', () => {
    for (const [course, through] of [
      [AZURE_COURSES[1], 4], [AZURE_COURSES[2], 8], [AWS_COURSES[1], 4], [AWS_COURSES[2], 8],
    ] as const) {
      const setup = course.tasks.find((t) => t.week === 0)!;
      expect(setup.shared, course.id).toBe(true);
      const cmds = setup.steps.flatMap((s) => (s.commands ?? []).map((c) => c.cmd)).join('\n');
      expect(cmds, course.id).toMatch(new RegExp(`(throughWeek|ThroughWeek)=${through}\\b`));
    }
  });

  it('the two platforms are one course in two vocabularies, quarter by quarter', () => {
    for (let q = 0; q < 3; q++) {
      const az = AZURE_COURSES[q];
      const aws = AWS_COURSES[q];
      const arc = (c: Course) => c.weeks.map((w) => [w.number, w.phase, w.stage, w.difficulty, w.objectives?.length]);
      expect(arc(aws), `quarter ${q + 1}`).toEqual(arc(az));
      const shape = (c: Course) => c.tasks.map((t) => `${t.week}:${t.role}`);
      expect(shape(aws)).toEqual(shape(az));
      const docs = (id: string) => seedDeliverablesForCourse(id).map((d) => [d.num, d.title, d.file, d.sections.length]);
      expect(docs(aws.id)).toEqual(docs(az.id));
    }
  });
});

describe('R90 — the guards catch what they claim to', () => {
  const good = AZURE_COURSES[0].tasks.find((t) => t.id === 'az-w2-infra')!;

  it('a task that starts the VM and never stops it', () => {
    const bad = { ...good, steps: good.steps.filter((s) => !(s.commands ?? []).some((c) => c.cmd.includes('deallocate'))) };
    expect(taskProblems(bad).join()).toContain('never stops it');
  });

  it('an over-long task, too many steps, a long visible line', () => {
    const long = { ...good, estimatedTime: '90 min', steps: [...good.steps, good.steps[0], good.steps[0]].map((s, i) => (i === 0 ? { ...s, instruction: 'one two three four five six seven eight nine ten eleven twelve thirteen' } : s)) };
    const problems = taskProblems(long).join();
    expect(problems).toContain('over an hour');
    expect(problems).toContain(`${good.steps.length + 2} steps`);
    expect(problems).toContain('13 words');
  });

  it('R92: a task without docs, a doc off the official sites, a shell-only step, a VM task that never says stop', () => {
    expect(r92Problems({ ...good, docs: undefined }).join()).toContain('no documentation');
    expect(r92Problems({ ...good, docs: [{ title: 'x', url: 'https://example.com/a', lookFor: 'one two three four five' }] }).join()).toContain('not official');
    expect(r92Problems({ ...good, docs: [{ ...good.docs![0], lookFor: 'too short' }] }).join()).toContain('what to look for');
    expect(r92Problems({ ...good, freeTier: undefined }).join()).toContain('no free-tier line');
    expect(r92Problems({ ...good, freeTier: 'Free.' }).join()).toContain('never says to stop');
    const shellOnly = { ...good, steps: good.steps.map((s) => (s.commands ? { ...s, instructionList: undefined } : s)) };
    expect(r92Problems(shellOnly).join()).toContain('shell only');
  });

  it('R93: a label instead of a reason, a bare flag, a task that hides what it needs', () => {
    const bad = { ...good, steps: good.steps.map((s) => (s.usesForm ? s : { ...s, whatItMeans: 'Because.' })) };
    expect(r93Problems(bad, 1).join()).toContain('a label, not an explanation');
    const bare = { ...good, steps: good.steps.map((s) => ({ ...s, commands: s.commands?.map((c) => ({ ...c, flags: undefined })) })) };
    expect(r93Problems(bare, 1).join()).toContain('no breakdown');
    const quiet = { ...AZURE_COURSES[0].tasks.find((t) => t.id === 'az-w2-secops')!, prerequisites: undefined };
    expect(r93Problems(quiet, 2).join()).toContain('does not say so');
    // Weeks after the entry courses are not held to the flag rule.
    expect(r93Problems(bare, 5)).toEqual([]);
  });

  it('R95: nothing moved out of the entry courses was lost — each topic lives in the next course', () => {
    const next = (id: string) => ALL.find((c) => c.id === id)!.tasks.map(stepText).join('\n');
    const az = next('azure-administrator');
    const aws = next('aws-solutions-architect');
    for (const re of [/@Microsoft\.KeyVault/, /managed identity/i, /CORS/, /Origin:/, /layer/i]) expect(az, `Azure: ${re}`).toMatch(re);
    for (const re of [/Parameter Store/, /CORS/, /Origin:/, /IMDSv2|HttpTokens/, /layer/i]) expect(aws, `AWS: ${re}`).toMatch(re);
    for (const id of ['azure-devops', 'aws-devops']) expect(next(id)).toMatch(/ADR-001/);
  });

  it('R95: an entry task with no domain, a beyond-exam topic, or a Security task that skips MFA', () => {
    const course = AZURE_COURSES[0];
    expect(r95Problems(course, { ...good, learn: ['Budgets'] }).join()).toContain('does not open with an exam domain');
    const leak = { ...good, steps: [{ ...good.steps[0], whatItMeans: 'Point the setting at a Key Vault reference.' }, ...good.steps.slice(1)] };
    expect(r95Problems(course, leak).join()).toContain('belongs to the next course');
    const sec = course.tasks.find((t) => t.id === 'az-w1-secops')!;
    const noMfa = { ...sec, steps: sec.steps.map((s) => ({ ...s, title: s.title.replace(/MFA/g, ''), instruction: s.instruction?.replace(/MFA/g, ''), instructionList: s.instructionList?.map((a) => a.replace(/MFA/g, '')), whatItMeans: s.whatItMeans.replace(/MFA/g, ''), expectedOutput: s.expectedOutput?.replace(/MFA/g, ''), fixes: undefined, docs: undefined, description: s.description?.replace(/MFA/g, '') })), learn: sec.learn?.map((l) => l.replace(/MFA/gi, '')), definitionOfDone: [], docs: [], title: 'x', objective: 'x', freeTier: 'Free.', tools: [] };
    expect(r95Problems(course, noMfa).join()).toContain('does not cover');
  });

  it('R97: too many clicks, a long click, a long reason, no outcome, no step docs, an off-site doc, unmarked code', () => {
    const course = AZURE_COURSES[0];
    const first = (t: Task) => t.steps.find((s) => !s.usesForm)!;
    const vary = (patch: Partial<Task['steps'][number]>): Task => ({ ...good, steps: good.steps.map((s) => (s === first(good) ? { ...s, ...patch } : s)) });
    expect(r97Problems(course, good)).toEqual([]);
    expect(r97Problems(course, vary({ instructionList: ['a', 'b', 'c', 'd'] })).join()).toContain('4 clicks');
    expect(r97Problems(course, vary({ instructionList: ['one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen'] })).join()).toContain('17 words');
    expect(r97Problems(course, vary({ whatItMeans: Array(31).fill('word').join(' ') })).join()).toContain('reason is 31 words');
    expect(r97Problems(course, vary({ expectedOutput: undefined })).join()).toContain('what the screen shows');
    expect(r97Problems(course, vary({ docs: undefined })).join()).toContain('no documentation on the step');
    expect(r97Problems(course, vary({ docs: [{ title: 'x', url: 'https://example.com/a', lookFor: 'one two three four five' }] })).join()).toContain('not official');
    expect(r97Problems(course, vary({ commands: [{ cmd: 'const x = 1;' }], codeToPaste: undefined })).join()).toContain('codeToPaste');
    expect(r97Problems(course, { ...good, freeTier: Array(26).fill('free').join(' ') }).join()).toContain('26 words');
    // The later courses are not held to the entry rules.
    expect(r97Problems(AZURE_COURSES[1], vary({ docs: undefined }))).toEqual([]);
  });

  it('R93: the counter item is called "site" in the tasks, the templates and the Week 3 form', () => {
    const azFlow = AZURE_COURSES[0].tasks.find((t) => t.id === 'az-w3-arch')!.steps.flatMap((s) => s.instructionList ?? []).join(' ');
    const awsFlow = AWS_COURSES[0].tasks.find((t) => t.id === 'aws-w3-arch')!.steps.flatMap((s) => s.instructionList ?? []).join(' ');
    expect(azFlow).toContain('"site"');
    expect(awsFlow).toContain('"site"');
    expect(AWS_IAC.full.text).toMatch(/Key=\{"id": "site"\}/);
    expect(AWS_IAC.full.text).not.toContain('count1');
    expect(AZURE_IAC.full.text).not.toContain('count1');
    const code = AWS_COURSES[0].tasks.find((t) => t.id === 'aws-w3-dev')!.steps.flatMap((s) => (s.commands ?? []).map((c) => c.cmd)).join('\n');
    expect(code).toContain('Key={"id": "site"}');
  });

  it('R93/R95: Azure agrees on the setting name CosmosConnection across Week 3 dev, the Week 4 drill and the Week 5 vault', () => {
    const text = (id: string) => JSON.stringify(ALL.flatMap((c) => c.tasks).find((t) => t.id === id)!);
    for (const id of ['az-w3-dev', 'az-w4-dev', 'az-w5-infra']) expect(text(id), id).toContain('CosmosConnection');
    expect(text('az-w5-infra')).toContain('@Microsoft.KeyVault(SecretUri=');
    // The template's vault and Secrets User role arrive in Week 5, with the by-hand work.
    expect(AZURE_IAC.resources.find((r) => r.id === 'kvRoleFunc')!.week).toBe(5);
  });

  it('a document without its control block', () => {
    const doc = seedDeliverablesForCourse('azure-fundamentals')[0];
    expect(documentProblems({ ...doc, sections: doc.sections.slice(1) }).join()).toContain('Document control');
  });
});
