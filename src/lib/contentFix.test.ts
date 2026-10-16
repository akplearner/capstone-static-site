import { describe, it, expect } from 'vitest';
import {
  FIX_BUNDLE_SCHEMA,
  FIX_COPY,
  FIX_SCHEMA,
  MAX_CHANGES,
  SUMMARY_MAX,
  applyChange,
  applyFixes,
  changesFrom,
  currentVersion,
  effectiveRevision,
  fieldSpec,
  fixBundle,
  fixDraft,
  fixVersion,
  foldDraft,
  ledger,
  ledgerSummary,
  missingVerifyTokens,
  newFix,
  patchableFields,
  readField,
  revertDraft,
  validateChanges,
  validateFix,
  type ContentFix,
  type FixChange,
  type FixDraft,
} from './contentFix';
import { SEED_COURSES } from './content/dto';
import { READING_BUDGET } from './readingBudget';
import type { Course } from './types';

const text = (n: number, word = 'word') => Array.from({ length: n }, () => word).join(' ');

/** A two-task course with every kind of patchable field, frozen so a mutation anywhere throws. */
function fixture(): Course {
  const c = {
    id: 'demo',
    title: 'Demo course',
    slug: 'demo',
    description: 'A course.',
    version: 2,
    roles: [],
    weeks: [],
    gates: [],
    tasks: [
      {
        id: 't1',
        role: 'net',
        week: 1,
        title: 'Harden the host',
        objective: 'Lock the host down.',
        definitionOfDone: ['Firewall on', 'Root login off'],
        prerequisites: ['A clean VM'],
        frameworks: [],
        deliverables: [],
        steps: [
          { id: 's1', title: 'Open a shell', description: 'Connect to the host.', instruction: 'SSH in as the admin user.', instructionList: ['Open a terminal', 'Run ssh'], command: 'ssh admin@host', commandExplanation: 'Opens a session.', expectedOutput: 'Welcome to host', outputExplanation: 'The banner means it worked.', whatItMeans: 'You are inside.', frameworks: [], verify: ['welcome'] },
          {
            id: 's2',
            title: 'Enable the firewall',
            description: 'Turn ufw on.',
            commands: [
              { cmd: 'sudo ufw enable', explain: 'Starts the firewall.', sample: 'Firewall is active' },
              { cmd: 'sudo ufw status', explain: 'Lists the rules.' },
            ],
            whatItMeans: 'Packets are filtered.',
            frameworks: [],
            verify: ['active'],
          },
        ],
      },
      { id: 't2', role: 'net', week: 2, title: 'Second task', objective: 'Do more.', frameworks: [], deliverables: [], steps: [{ id: 's3', title: 'Third step', description: 'Do it.', whatItMeans: 'Done.', frameworks: [] }] },
    ],
  } as unknown as Course;
  return deepFreeze(c);
}

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o as Record<string, unknown>)) deepFreeze(v);
  }
  return o;
}

let seq = 0;
function entry(over: Partial<ContentFix> & Pick<ContentFix, 'revision'>): ContentFix {
  return { schema: FIX_SCHEMA, id: `f${++seq}`, courseId: 'demo', kind: 'fix', summary: 'Fix', changes: [], issueIds: [], reverts: null, folds: [], foldedIn: '', docVersion: 2, by: 'Ana', at: '2026-10-16T09:00:00.000Z', ...over };
}

const chg = (over: Partial<FixChange> & Pick<FixChange, 'field' | 'before' | 'after'>): FixChange => ({ taskId: 't1', stepId: 's1', ...over });

describe('contentFix — what a fix may touch', () => {
  it('names the fields of a task, of a step and of each command, and refuses the rest', () => {
    for (const f of ['title', 'objective', 'definitionOfDone', 'prerequisites']) expect(fieldSpec(f, 'task'), f).not.toBeNull();
    for (const f of ['title', 'description', 'instruction', 'instructionList', 'command', 'commandExplanation', 'expectedOutput', 'outputExplanation', 'whatItMeans', 'commands.0.cmd', 'commands.3.explain', 'commands.12.sample']) expect(fieldSpec(f, 'step'), f).not.toBeNull();
    // Structure and identity stay code changes: ids, roles, week, gates, verify tokens, deliverables, frameworks.
    for (const f of ['id', 'role', 'week', 'steps', 'verify', 'deliverables', 'frameworks', 'commands', 'commands.0', 'commands.x.cmd', 'commands.0.on', 'handoff']) {
      expect(fieldSpec(f, 'step'), f).toBeNull();
      expect(fieldSpec(f, 'task'), f).toBeNull();
    }
    expect(fieldSpec('instruction', 'task'), 'a step field is not a task field').toBeNull();
    expect(fieldSpec('commands.1.explain', 'step')?.label).toBe('What command 2 does');
  });

  it('reads a field as text: absent is empty, a list is one item per line, a missing target is null', () => {
    const c = fixture();
    expect(readField(c, { taskId: 't1' }, 'title')).toBe('Harden the host');
    expect(readField(c, { taskId: 't1' }, 'definitionOfDone')).toBe('Firewall on\nRoot login off');
    expect(readField(c, { taskId: 't1', stepId: 's1' }, 'instructionList')).toBe('Open a terminal\nRun ssh');
    expect(readField(c, { taskId: 't1', stepId: 's2' }, 'commands.1.cmd')).toBe('sudo ufw status');
    expect(readField(c, { taskId: 't1', stepId: 's2' }, 'commands.1.sample'), 'absent reads empty').toBe('');
    expect(readField(c, { taskId: 't2' }, 'prerequisites')).toBe('');
    expect(readField(c, { taskId: 't1', stepId: 's2' }, 'commands.2.cmd'), 'no third command').toBeNull();
    expect(readField(c, { taskId: 'nope' }, 'title')).toBeNull();
    expect(readField(c, { taskId: 't1', stepId: 'nope' }, 'title')).toBeNull();
    expect(readField(c, { taskId: 't1' }, 'id')).toBeNull();
    const multi = { ...c, tasks: [{ ...c.tasks[0], definitionOfDone: ['one\ntwo'] }] } as Course;
    expect(readField(multi, { taskId: 't1' }, 'definitionOfDone'), 'a list item holding a newline cannot round-trip as lines').toBeNull();
  });
});

describe('contentFix — the apply rule', () => {
  it('applies when the text is the before, is a no-op when it is already the after, and skips anything else', () => {
    const c = fixture();
    const change = chg({ field: 'title', before: 'Open a shell', after: 'Open a terminal' });
    const applied = applyChange(c, change);
    expect(applied.outcome).toBe('applied');
    expect(readField(applied.course, change, 'title')).toBe('Open a terminal');
    expect(applyChange(applied.course, change).outcome, 'already the after').toBe('noop');
    expect(applyChange(applied.course, change).course, 'a no-op returns the same course').toBe(applied.course);
    expect(applyChange(c, { ...change, before: 'something else' }).outcome).toBe('stale');
    expect(applyChange(c, { ...change, taskId: 'gone' }).outcome).toBe('missing');
    expect(applyChange(c, { ...change, field: 'verify' }).outcome, 'a field a fix may not touch').toBe('missing');
  });

  it('shares what it did not touch and never mutates its input', () => {
    const c = fixture(); // frozen: a write anywhere throws
    const next = applyChange(c, chg({ taskId: 't1', stepId: 's2', field: 'commands.0.explain', before: 'Starts the firewall.', after: 'Turns the firewall on.' })).course;
    expect(next.tasks[1], 'the other task is the same object').toBe(c.tasks[1]);
    expect(next.tasks[0].steps[0], 'the other step is the same object').toBe(c.tasks[0].steps[0]);
    expect(next.tasks[0].steps[1].commands![1], 'the other command is the same object').toBe(c.tasks[0].steps[1].commands![1]);
    expect(next.tasks[0].steps[1].commands![0].explain).toBe('Turns the firewall on.');
    expect(c.tasks[0].steps[1].commands![0].explain, 'the input is untouched').toBe('Starts the firewall.');
  });

  it('sets a list one item per line, and adds or removes an optional field when the text goes from or to empty', () => {
    const c = fixture();
    const list = applyChange(c, chg({ field: 'instructionList', before: 'Open a terminal\nRun ssh', after: 'Open a terminal\nRun ssh admin@host\nAccept the key' })).course;
    expect(list.tasks[0].steps[0].instructionList).toEqual(['Open a terminal', 'Run ssh admin@host', 'Accept the key']);
    const added = applyChange(c, { taskId: 't2', stepId: 's3', field: 'instruction', before: '', after: 'Do the third step.' }).course;
    expect(added.tasks[1].steps[0].instruction).toBe('Do the third step.');
    const removed = applyChange(added, { taskId: 't2', stepId: 's3', field: 'instruction', before: 'Do the third step.', after: '' }).course;
    expect('instruction' in removed.tasks[1].steps[0], 'back to absent, as it was').toBe(false);
    // A required field is set empty, never deleted.
    expect(applyChange(c, { taskId: 't2', field: 'title', before: 'Second task', after: '' }).course.tasks[1].title).toBe('');
  });

  it('with no entries the course is the same object; with entries it carries the revision, and entries apply in revision order whatever order they arrive in', () => {
    const c = fixture();
    expect(applyFixes(c, []).course).toBe(c);
    expect(applyFixes(c, []).revision).toBe(0);
    const a = entry({ revision: 1, changes: [chg({ field: 'title', before: 'Open a shell', after: 'Open a terminal' })] });
    const b = entry({ revision: 2, changes: [chg({ field: 'title', before: 'Open a terminal', after: 'Open a console' })] });
    for (const order of [[a, b], [b, a]]) {
      const r = applyFixes(c, order);
      expect(r.course.tasks[0].steps[0].title).toBe('Open a console');
      expect(r.course.revision).toBe(2);
      expect(r.revision).toBe(2);
      expect([...r.outcomes.entries()]).toEqual([[1, ['applied']], [2, ['applied']]]);
    }
    expect(effectiveRevision([a, b])).toBe(2);
    expect(effectiveRevision([])).toBe(0);
  });

  it('a fold and a revert count in the revision even though a fold changes no text', () => {
    const c = fixture();
    const a = entry({ revision: 1, changes: [chg({ field: 'title', before: 'Open a shell', after: 'Open a terminal' })] });
    const fold = entry({ revision: 2, kind: 'fold', folds: [1] });
    const r = applyFixes(c, [a, fold]);
    expect(r.course.revision).toBe(2);
    expect(r.course.tasks[0].steps[0].title).toBe('Open a terminal');
  });

  it('a fix already folded into the code is harmless: the text is the after, so it is a no-op', () => {
    const c = fixture();
    const folded = applyChange(c, chg({ field: 'title', before: 'Open a shell', after: 'Open a terminal' })).course; // the code now says it
    const r = applyFixes(folded, [entry({ revision: 1, changes: [chg({ field: 'title', before: 'Open a shell', after: 'Open a terminal' })] })]);
    expect([...r.outcomes.values()]).toEqual([['noop']]);
    expect(r.course.tasks[0].steps[0].title).toBe('Open a terminal');
  });

  it('versions read {document}.{revision}', () => {
    const c = fixture();
    expect(currentVersion(c)).toBe('2.0');
    expect(currentVersion({ version: 2, revision: 7 })).toBe('2.7');
    expect(currentVersion({})).toBe('1.0');
    expect(fixVersion({ docVersion: 3, revision: 9 })).toBe('3.9');
  });
});

describe('contentFix — the ledger', () => {
  const t1 = chg({ field: 'title', before: 'Open a shell', after: 'Open a terminal' });
  const t2 = chg({ field: 'title', before: 'Open a terminal', after: 'Open a console' });

  it('a fix is live until something undoes it, and can be reverted while its after is the text', () => {
    const rows = ledger(fixture(), [entry({ revision: 1, changes: [t1] })]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ state: 'live', skipped: 0, canRevert: true, blockedBy: null });
  });

  it('a second fix on the same text blocks the first fix’s revert and names the one to revert first', () => {
    const rows = ledger(fixture(), [entry({ revision: 1, changes: [t1] }), entry({ revision: 2, changes: [t2] })]);
    expect(rows[0]).toMatchObject({ state: 'live', canRevert: false, blockedBy: 2 });
    expect(rows[1]).toMatchObject({ state: 'live', canRevert: true });
  });

  it('a revert is a new entry carrying the inverse; the fix reads Reverted and the text is back as it was', () => {
    const base = fixture();
    const fix = entry({ revision: 1, changes: [t1, chg({ field: 'whatItMeans', before: 'You are inside.', after: 'The session is open.' })] });
    const rev = entry({ revision: 2, ...revertDraft(fix) });
    expect(rev.kind).toBe('revert');
    expect(rev.reverts).toBe(1);
    expect(rev.changes.map((c) => c.field), 'inverse, in reverse order').toEqual(['whatItMeans', 'title']);
    expect(rev.changes[1]).toMatchObject({ before: 'Open a terminal', after: 'Open a shell' });
    const rows = ledger(base, [fix, rev]);
    expect(rows[0].state).toBe('reverted');
    expect(rows[0].canRevert).toBe(false);
    expect(rows[1]).toMatchObject({ state: null, canRevert: false });
    const { course } = applyFixes(base, [fix, rev]);
    const { revision, ...rest } = course;
    expect(revision).toBe(2);
    expect(rest).toEqual(base);
  });

  it('after the later fix is reverted, the earlier one can be reverted again', () => {
    const base = fixture();
    const a = entry({ revision: 1, changes: [t1] });
    const b = entry({ revision: 2, changes: [t2] });
    const rb = entry({ revision: 3, ...revertDraft(b) });
    const rows = ledger(base, [a, b, rb]);
    expect(rows[0]).toMatchObject({ state: 'live', canRevert: true });
    expect(rows[1].state).toBe('reverted');
  });

  it('a fold marks fixes In code; a fix whose text changed underneath it is Stale; a partly stale one stays live but cannot be reverted', () => {
    const base = fixture();
    const a = entry({ revision: 1, changes: [t1] });
    const fold = entry({ revision: 2, ...foldDraft([1], 'deploy 2026-10-20') });
    expect(ledger(base, [a, fold])[0].state).toBe('in_code');
    expect(ledger(base, [a, fold])[1]).toMatchObject({ state: null });

    const stale = entry({ revision: 1, changes: [chg({ field: 'title', before: 'Not the text', after: 'Whatever' })] });
    expect(ledger(base, [stale])[0]).toMatchObject({ state: 'stale', skipped: 1, canRevert: false });

    const partly = entry({ revision: 1, changes: [t1, chg({ field: 'whatItMeans', before: 'Not the text', after: 'Whatever' })] });
    expect(ledger(base, [partly])[0]).toMatchObject({ state: 'live', skipped: 1, canRevert: false });
  });

  it('counts the states for the banner', () => {
    const base = fixture();
    const rows = ledger(base, [
      entry({ revision: 1, changes: [t1] }),
      entry({ revision: 2, changes: [chg({ field: 'whatItMeans', before: 'You are inside.', after: 'Inside.' })] }),
      entry({ revision: 3, ...foldDraft([2], '') }),
      entry({ revision: 4, changes: [chg({ field: 'title', before: 'Nope', after: 'X' })] }),
    ]);
    expect(ledgerSummary(rows)).toEqual({ live: 1, reverted: 0, inCode: 1, stale: 1 });
  });

  it('the drafts say what they are', () => {
    const fix = entry({ revision: 4, summary: 'Fix the flag', changes: [t1] });
    expect(revertDraft(fix)).toMatchObject({ kind: 'revert', reverts: 4, folds: [], issueIds: [] });
    expect(revertDraft(fix).summary).toBe('Revert revision 4: Fix the flag');
    expect(revertDraft({ ...fix, summary: 'x'.repeat(500) }).summary).toHaveLength(SUMMARY_MAX);
    expect(foldDraft([3, 1], '  commit abc  ')).toMatchObject({ kind: 'fold', folds: [1, 3], foldedIn: 'commit abc', changes: [] });
    expect(foldDraft([3, 1], '').summary).toBe('In code: revisions 1, 3');
    expect(foldDraft([2], '').summary).toBe('In code: revision 2');
    expect(fixDraft('  Fix a typo  ', [t1], ['r1'])).toEqual({ kind: 'fix', summary: 'Fix a typo', changes: [t1], issueIds: ['r1'], reverts: null, folds: [], foldedIn: '' });
    expect(newFix('demo', fixDraft('S', [t1], []), { id: 'x', revision: 3, docVersion: 2, by: 'Ana', at: '2026-10-16T09:00:00.000Z' })).toMatchObject({ schema: FIX_SCHEMA, id: 'x', courseId: 'demo', revision: 3, docVersion: 2, by: 'Ana', kind: 'fix' });
  });
});

describe('contentFix — what a panel offers', () => {
  it('offers the text a student can see: the commands list, or the single command, never both', () => {
    const c = fixture();
    const listed = patchableFields(c, { taskId: 't1', stepId: 's2' }).map((f) => f.field);
    expect(listed).toEqual(['title', 'description', 'commands.0.cmd', 'commands.0.explain', 'commands.0.sample', 'commands.1.cmd', 'commands.1.explain', 'whatItMeans']);
    const single = patchableFields(c, { taskId: 't1', stepId: 's1' }).map((f) => f.field);
    expect(single).toEqual(['title', 'description', 'instruction', 'instructionList', 'command', 'commandExplanation', 'expectedOutput', 'outputExplanation', 'whatItMeans']);
    expect(patchableFields(c, { taskId: 't1' }).map((f) => f.field)).toEqual(['title', 'objective', 'definitionOfDone', 'prerequisites']);
    expect(patchableFields(c, { taskId: 'gone' })).toEqual([]);
    expect(patchableFields(c, { taskId: 't1', stepId: 'gone' })).toEqual([]);
    expect(patchableFields(c, { taskId: 't1', stepId: 's1' }).find((f) => f.field === 'instructionList')).toMatchObject({ shape: 'list', value: 'Open a terminal\nRun ssh', label: 'Actions' });
  });

  it('turns edits into changes: one per field whose text differs, none for the rest', () => {
    const c = fixture();
    const target = { taskId: 't1', stepId: 's1' };
    expect(changesFrom(c, target, { title: 'Open a shell', description: 'Connect to the server.', nope: 'x', verify: 'y' })).toEqual([{ taskId: 't1', stepId: 's1', field: 'description', before: 'Connect to the host.', after: 'Connect to the server.' }]);
    expect(changesFrom(c, { taskId: 't1' }, { title: 'Harden it' })).toEqual([{ taskId: 't1', field: 'title', before: 'Harden the host', after: 'Harden it' }]);
    expect(changesFrom(c, target, {})).toEqual([]);
  });
});

describe('contentFix — what a fix may not do', () => {
  const ok = (changes: FixChange[], opts?: Parameters<typeof validateChanges>[2]) => validateChanges(fixture(), changes, opts).map((p) => p.code);

  it('accepts a plain wording fix', () => {
    expect(ok([chg({ field: 'description', before: 'Connect to the host.', after: 'Connect to the server.' })])).toEqual([]);
  });

  it('refuses nothing, too many, the same field twice, a missing target, a field a fix may not touch, text that moved, and no change', () => {
    expect(ok([])).toEqual(['nothing']);
    const one = chg({ field: 'description', before: 'Connect to the host.', after: 'Connect to the server.' });
    expect(ok(Array.from({ length: MAX_CHANGES + 1 }, (_, i) => ({ ...one, field: `commands.${i}.cmd`, before: 'x', after: 'y' })))).toContain('many');
    expect(ok([one, { ...one, after: 'Other.' }])).toEqual(['twice']);
    expect(ok([{ ...one, taskId: 'gone' }])).toEqual(['missing']);
    expect(ok([{ ...one, stepId: 'gone' }])).toEqual(['missing']);
    expect(ok([{ ...one, field: 'verify', before: '', after: 'x' }])).toEqual(['field']);
    expect(ok([{ ...one, field: 'commands.5.cmd', before: '', after: 'x' }])).toEqual(['field']);
    expect(ok([{ ...one, before: 'Connect to the other host.' }])).toEqual(['stale']);
    expect(ok([{ ...one, after: one.before }])).toEqual(['same']);
  });

  it('refuses emptying a field, control characters, over-long text, a second line in a one-line field, and a blank list item', () => {
    expect(ok([chg({ field: 'title', before: 'Open a shell', after: '   ' })])).toEqual(['empty']);
    expect(ok([chg({ field: 'commandExplanation', before: 'Opens a session.', after: '' })]), 'an optional field is replaced, not removed, by a fix').toEqual(['empty']);
    expect(ok([chg({ field: 'description', before: 'Connect to the host.', after: 'Bad\u0007bell' })])).toEqual(['chars']);
    expect(ok([chg({ field: 'description', before: 'Connect to the host.', after: 'x'.repeat(601) })])).toEqual(['long']);
    // Text already past the cap may be corrected, not lengthened.
    const c = fixture();
    const overlong = 'y'.repeat(650);
    const pastCap = { ...c, tasks: [{ ...c.tasks[0], steps: [{ ...c.tasks[0].steps[0], description: overlong }, c.tasks[0].steps[1]] }, c.tasks[1]] } as Course;
    const longEdit = (after: string) => validateChanges(pastCap, [chg({ field: 'description', before: overlong, after })]).map((p) => p.code);
    expect(longEdit(`z${overlong.slice(1)}`)).toEqual([]);
    expect(longEdit(overlong.slice(10))).toEqual([]);
    expect(longEdit(`${overlong}y`)).toEqual(['long']);
    expect(ok([chg({ field: 'title', before: 'Open a shell', after: 'Open\na shell' })])).toEqual(['line']);
    expect(ok([chg({ field: 'instructionList', before: 'Open a terminal\nRun ssh', after: 'Open a terminal\n\nRun ssh' })])).toEqual(['blank']);
    expect(ok([chg({ field: 'expectedOutput', before: 'Welcome to host', after: 'Welcome to host\n\tindented\n' })]), 'tabs and newlines are text').toEqual([]);
  });

  it('holds the words to the reading budgets the seeds are held to, but not a sentence that was already past them', () => {
    const b = READING_BUDGET;
    const desc = (after: string, before = 'Connect to the host.') => ok([chg({ field: 'description', before, after })]);
    expect(desc(text(b.descriptionProse - 1))).toEqual([]);
    expect(desc(text(b.descriptionProse))).toEqual(['budget']);
    const long = text(b.descriptionProse + 5);
    const c = fixture();
    const longCourse = { ...c, tasks: [{ ...c.tasks[0], steps: [{ ...c.tasks[0].steps[0], description: long }, c.tasks[0].steps[1]] }, c.tasks[1]] } as Course;
    const edit = (after: string) => validateChanges(longCourse, [chg({ field: 'description', before: long, after })]).map((p) => p.code);
    expect(edit(long.replace('word', 'term')), 'a typo fixed in text already past the limit').toEqual([]);
    expect(edit(text(b.descriptionProse + 4)), 'shorter').toEqual([]);
    expect(edit(text(b.descriptionProse + 6)), 'longer still').toEqual(['budget']);

    expect(ok([chg({ field: 'instruction', before: 'SSH in as the admin user.', after: text(b.instructionProse) })])).toEqual([]);
    expect(ok([chg({ field: 'instruction', before: 'SSH in as the admin user.', after: text(b.instructionProse + 1) })])).toEqual(['budget']);
    expect(ok([chg({ field: 'instructionList', before: 'Open a terminal\nRun ssh', after: `Open a terminal\n${text(b.actionProse)}` })])).toEqual([]);
    expect(ok([chg({ field: 'instructionList', before: 'Open a terminal\nRun ssh', after: `Open a terminal\n${text(b.actionProse + 1)}` })])).toEqual(['budget']);
    expect(ok([chg({ field: 'whatItMeans', before: 'You are inside.', after: text(b.longWords - 1) })])).toEqual([]);
    expect(ok([chg({ field: 'whatItMeans', before: 'You are inside.', after: text(b.longWords) })])).toEqual(['budget']);
    expect(ok([chg({ taskId: 't1', stepId: 's2', field: 'commands.0.explain', before: 'Starts the firewall.', after: text(b.explainProse - 1) })])).toEqual([]);
    expect(ok([chg({ taskId: 't1', stepId: 's2', field: 'commands.0.explain', before: 'Starts the firewall.', after: text(b.explainProse) })])).toEqual(['budget']);
    expect(ok([{ taskId: 't1', field: 'objective', before: 'Lock the host down.', after: text(b.taskObjectiveProse) }])).toEqual([]);
    expect(ok([{ taskId: 't1', field: 'objective', before: 'Lock the host down.', after: text(b.taskObjectiveProse + 1) }])).toEqual(['budget']);
    expect(ok([{ taskId: 't1', field: 'objective', before: 'Lock the host down.', after: `${text(b.taskObjectiveProse)} — — —` }]), 'a dash is not a word').toEqual([]);
  });

  it('keeps every self-check token in the output a step shows, and does not blame a step that already broke the rule', () => {
    // s1 verifies "welcome" against expectedOutput.
    const out = (after: string) => validateChanges(fixture(), [chg({ field: 'expectedOutput', before: 'Welcome to host', after })]);
    expect(out('Welcome to the server').map((p) => p.code)).toEqual([]);
    expect(out('WELCOME').map((p) => p.code), 'case does not matter, as in the self-check').toEqual([]);
    const lost = out('Logged in');
    expect(lost.map((p) => p.code)).toEqual(['verify']);
    expect(lost[0]).toMatchObject({ field: 'expectedOutput', index: 0 });
    expect(lost[0].message).toContain('“welcome”');
    // s2 verifies "active" against a command's sample.
    const sample = (after: string) => validateChanges(fixture(), [chg({ taskId: 't1', stepId: 's2', field: 'commands.0.sample', before: 'Firewall is active', after })]).map((p) => p.code);
    expect(sample('Firewall is active (exits 0)')).toEqual([]);
    expect(sample('Firewall started')).toEqual(['verify']);
    // A token shown in either place counts, as in content-integrity.test.ts.
    const c = fixture();
    const both = { ...c, tasks: [{ ...c.tasks[0], steps: [c.tasks[0].steps[0], { ...c.tasks[0].steps[1], expectedOutput: 'The firewall is active.' }] }, c.tasks[1]] } as Course;
    expect(validateChanges(both, [chg({ taskId: 't1', stepId: 's2', field: 'commands.0.sample', before: 'Firewall is active', after: 'Started' })]).map((p) => p.code)).toEqual([]);
    // A step that shows no output has nothing to check, and one that already lacked a token is not newly broken.
    expect(missingVerifyTokens({ id: 's', title: 't', description: '', whatItMeans: '', frameworks: [], verify: ['x'] })).toEqual([]);
    const broken = { ...c, tasks: [{ ...c.tasks[0], steps: [{ ...c.tasks[0].steps[0], expectedOutput: 'Hello' }, c.tasks[0].steps[1]] }, c.tasks[1]] } as Course;
    expect(validateChanges(broken, [chg({ field: 'expectedOutput', before: 'Hello', after: 'Hello again' })]).map((p) => p.code)).toEqual([]);
    expect(validateChanges(broken, [chg({ field: 'description', before: 'Connect to the host.', after: 'Connect.' })]).map((p) => p.code)).toEqual([]);
  });

  it('checks the lab-access placeholders a fix adds, when it is told which ones the course fills in', () => {
    const labTokens = new Set(['<kali-ip>']);
    const inst = (after: string) => ok([chg({ field: 'instruction', before: 'SSH in as the admin user.', after })], { labTokens });
    expect(inst('SSH to <kali-ip> as admin.')).toEqual([]);
    expect(inst('SSH to <kali-ipp> as admin.')).toEqual(['placeholder']);
    expect(inst('Edit <ossec_config> and save.'), 'an XML element with no hyphen is not a placeholder').toEqual([]);
    expect(ok([chg({ field: 'instruction', before: 'SSH in as the admin user.', after: 'SSH to <anything-here>.' })]), 'unchecked when the course’s tokens are not given').toEqual([]);
    const msg = validateChanges(fixture(), [chg({ field: 'instruction', before: 'SSH in as the admin user.', after: 'SSH to <kali-ipp>.' })], { labTokens })[0].message;
    expect(msg).toBe('“<kali-ipp>” is not a lab-access token.');
  });

  it('a fix as a whole also needs its one line of why', () => {
    const draft: FixDraft = fixDraft('Fix the host name', [chg({ field: 'description', before: 'Connect to the host.', after: 'Connect to the server.' })], []);
    expect(validateFix(fixture(), draft)).toEqual([]);
    expect(validateFix(fixture(), { ...draft, summary: '  ' }).map((p) => p.code)).toEqual(['summary']);
    expect(validateFix(fixture(), { ...draft, summary: 'x'.repeat(SUMMARY_MAX + 1) }).map((p) => p.code)).toEqual(['summary']);
  });

  it('says it in the register: short, impersonal, and one sentence for every code', () => {
    for (const [code, msg] of Object.entries(FIX_COPY)) {
      expect(msg, code).not.toMatch(/\b(you|your|yours|we|our)\b/i);
      expect(msg, code).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(msg.split(/\s+/).length, `${code}: short`).toBeLessThanOrEqual(25);
    }
  });
});

describe('contentFix — the bundle a developer folds from', () => {
  it('lists the live fixes with the titles to search for, and the whole ledger', () => {
    const base = fixture();
    const a = entry({ revision: 1, summary: 'Rename the step', changes: [chg({ field: 'title', before: 'Open a shell', after: 'Open a terminal' })] });
    const b = entry({ revision: 2, summary: 'Reword', changes: [chg({ taskId: 't2', stepId: 's3', field: 'whatItMeans', before: 'Done.', after: 'Finished.' })] });
    const folded = entry({ revision: 3, ...foldDraft([2], 'abc123') });
    const bundle = fixBundle(base, [folded, b, a], { seedFile: 'src/lib/data/seed/demo.ts' });
    expect(bundle).toMatchObject({ schema: FIX_BUNDLE_SCHEMA, courseId: 'demo', courseTitle: 'Demo course', seedFile: 'src/lib/data/seed/demo.ts', version: '2.3' });
    expect(bundle.live).toEqual([{ revision: 1, version: '2.1', summary: 'Rename the step', changes: [{ taskId: 't1', stepId: 's1', field: 'title', before: 'Open a shell', after: 'Open a terminal', taskTitle: 'Harden the host', stepTitle: 'Open a shell' }] }]);
    expect(bundle.fixes.map((f) => f.revision), 'oldest first').toEqual([1, 2, 3]);
    expect(fixBundle(base, [], {}).seedFile, 'an edited copy has no seed file').toBeNull();
    expect(fixBundle(base, []).version).toBe('2.0');
  });
});

describe('contentFix — over every built-in course', () => {
  it.each(SEED_COURSES.map((c) => [c.id, c] as const))('%s: a fix on a spread of its fields applies, reverts exactly, and a stale one changes nothing', (_id, course) => {
    // One change per patchable field of every 12th step and every 6th task, spread over the whole course.
    const changes: FixChange[] = [];
    course.tasks.forEach((task, ti) => {
      if (ti % 6 === 0) changes.push(...changesFrom(course, { taskId: task.id }, Object.fromEntries(patchableFields(course, { taskId: task.id }).map((f) => [f.field, `${f.value} (edited)`]))));
      task.steps.forEach((step, si) => {
        if ((ti * 7 + si) % 12 !== 0) return;
        const target = { taskId: task.id, stepId: step.id };
        changes.push(...changesFrom(course, target, Object.fromEntries(patchableFields(course, target).map((f) => [f.field, `${f.value} (edited)`]))));
      });
    });
    expect(changes.length, 'the sample touches a spread of fields').toBeGreaterThanOrEqual(10);

    const fix = entry({ courseId: course.id, revision: 1, changes });
    const applied = applyFixes(course, [fix]);
    expect(applied.course).not.toBe(course);
    expect(new Set(applied.outcomes.get(1)), 'every change applied').toEqual(new Set(['applied']));
    for (const c of changes) expect(readField(applied.course, c, c.field), `${c.taskId}/${c.stepId}/${c.field}`).toBe(c.after);
    expect(ledger(course, [fix])[0], 'and it can be reverted').toMatchObject({ state: 'live', canRevert: true, skipped: 0 });

    const rev = entry({ courseId: course.id, revision: 2, ...revertDraft(fix) });
    const { revision, ...rest } = applyFixes(course, [fix, rev]).course;
    expect(revision).toBe(2);
    expect(rest, 'the inverse restores the course exactly').toEqual(course);
    expect(ledger(course, [fix, rev])[0].state).toBe('reverted');

    // The same fix over a course whose text has moved on: nothing applies, nothing breaks.
    const moved = applyFixes(course, [entry({ courseId: course.id, revision: 1, changes: changes.map((c) => ({ ...c, before: `${c.before} (not the text)` })) })]);
    const { revision: r2, ...unchanged } = moved.course;
    expect(r2).toBe(1);
    expect(unchanged).toEqual(course);
    expect(new Set(moved.outcomes.get(1))).toEqual(new Set(['stale']));
  });

  it('a wording fix on a real step passes the same checks the suite holds the seeds to', () => {
    const course = SEED_COURSES.find((c) => c.id === 'security-plus')!;
    const task = course.tasks.find((t) => t.steps.some((s) => s.verify?.length && s.expectedOutput))!;
    const step = task.steps.find((s) => s.verify?.length && s.expectedOutput)!;
    const target = { taskId: task.id, stepId: step.id };
    expect(validateChanges(course, changesFrom(course, target, { whatItMeans: 'Reworded in one short sentence.' }))).toEqual([]);
    // Dropping the shown output a self-check token lives in is refused.
    const token = step.verify![0];
    const lost = validateChanges(course, changesFrom(course, target, { expectedOutput: step.expectedOutput!.split(token).join('REDACTED') }));
    expect(lost.map((p) => p.code)).toContain('verify');
  });
});
