import type { Course, Step, Task } from './types';
import type { EvidenceArtifact, StepEvidence, VerificationReceipt } from './data/types';
import type { ProfileRow, SkillProfile } from './skillProfile';
import type { Dimension } from './docs/metricCatalogue';
import type { EarnedRow } from './earnedSkills';
import { getTasksByRole, isGradedWeek } from './course-helpers';
import { verifiableSteps } from './evidenceLedger';
import { levelRank } from './skillProfile';
import { localDay } from './localDate';

/**
 * R126 — what a number on the record is made of.
 *
 * Each figure in "Your record" is a count of something; this says WHAT, so a member can open a figure
 * and see the steps (actions), commands, tools and procedures behind it, each with the task it came from
 * and a link to it. It is a projection over the same facts the figure was counted from, handed in per
 * course: it reads no repository, no clock and no window, and it counts nothing a figure does not.
 *
 * A step is a contributor in two ways: ticked (the member did it) and verified (the member pasted output
 * that matched). The figures ask different questions of the same steps, so every list is built from the
 * step set the figure itself counts: "Steps done" from the ticked required steps of the role's graded
 * weeks, "Steps verified" from the verifiable steps whose record is verified, "Commands verified" from
 * the verified steps that run a command, and the skill, tool, procedure and exam-domain figures from the
 * rows reached and the tasks mapped to them. A row the earned-skills ledger holds above what the live run
 * reads (R125) is listed too, marked as kept from an earlier run, with the steps it was earned from.
 */

export const RECORD_METRICS = ['steps-done', 'tasks-done', 'weeks-sealed', 'capstones', 'steps-verified', 'commands', 'evidence', 'days', 'skills', 'tools', 'procedures', 'domains'] as const;
export type RecordMetric = (typeof RECORD_METRICS)[number];

/** One course's facts, as the figures were counted: handed in by the page, which reads the repositories. */
export interface CourseFacts {
  course: Course;
  role: string;
  /** The profile with the member's earned rows laid over it (R125). */
  profile: SkillProfile;
  isStepDone: (taskId: string, stepId: string) => boolean;
  evidence: Record<string, StepEvidence>;
  receipts: Record<string, VerificationReceipt> | null;
  artifacts: EvidenceArtifact[];
  /** This course's earned-skills ledger. */
  earned: readonly EarnedRow[];
  /** `dimension:id` of the rows the ledger holds above what the live run reads. */
  kept: readonly string[];
  capstoneFiled: boolean;
  /** The graded weeks cleared, by number. */
  clearedWeeks: readonly number[];
  /** Whether a procedure row cites controls (the form it is followed on names them): half of "followed to standard". */
  cites?: (row: ProfileRow) => boolean;
}

export interface DetailItem {
  key: string;
  label: string;
  /** Where it came from: course, week, task. */
  sub?: string;
  /** A command, shown as code. */
  code?: string;
  /** A deep link to the task. */
  href?: string;
  /** Short facts: verified, ticked, receipted, kept, a level, counts. */
  marks?: string[];
  /** When, in epoch milliseconds, where the facts say. */
  at?: number;
}

export type SectionId = 'primary' | 'actions' | 'commands' | 'tools' | 'procedures';

export interface DetailSection {
  id: SectionId;
  title: string;
  items: DetailItem[];
}

export interface MetricDetail {
  metric: RecordMetric;
  /** What the figure counts, in a sentence. */
  rule: string;
  sections: DetailSection[];
}

/** The words of the detail, in one place. Impersonal, plain. */
export const DETAIL_COPY = {
  rule: {
    'steps-done': 'Required steps ticked, in the graded weeks of each course, for the role taken.',
    'tasks-done': 'Tasks whose required steps are all ticked, in the graded weeks.',
    'weeks-sealed': 'Graded weeks in which every task of the role is done.',
    capstones: 'Courses whose capstone has been filed.',
    'steps-verified': 'Checkable steps whose pasted output matched what the step expects.',
    commands: 'Verified steps that run a command: the commands behind the figure.',
    evidence: 'Files hashed in the custody log: the file stays on the device, the digest is kept.',
    days: 'Calendar days with a recorded attempt, verification or hashed file.',
    skills: 'Skills reached at the verified level or above: practised on the task or tasks mapped to it, with output that matched.',
    tools: 'Tools exercised on the tasks mapped to them.',
    procedures: 'Procedures reached at the verified level; "followed to standard" once the form is reviewed and cites controls.',
    domains: 'Exam domains reached at the verified level: the tasks mapped to a domain were verified.',
  } satisfies Record<RecordMetric, string>,
  title: {
    primary: {
      'steps-done': 'Steps',
      'tasks-done': 'Tasks',
      'weeks-sealed': 'Weeks',
      capstones: 'Courses',
      'steps-verified': 'Steps',
      commands: 'Commands',
      evidence: 'Files hashed',
      days: 'Days',
      skills: 'Skills',
      tools: 'Tools',
      procedures: 'Procedures',
      domains: 'Exam domains',
    } satisfies Record<RecordMetric, string>,
    actions: 'Actions',
    commands: 'Commands',
    tools: 'Tools',
    procedures: 'Procedures',
  },
  empty: 'Nothing has counted yet.',
  kept: 'kept from an earlier run',
} as const;

const key = (taskId: string, stepId: string) => `${taskId}::${stepId}`;
/** `dimension:id`, the same text `earnedKey` writes for a ledger row. */
const rowKey = (row: Pick<ProfileRow, 'dimension' | 'id'>) => `${row.dimension}:${row.id}`;
const ledgerKey = (e: Pick<EarnedRow, 'dimension' | 'id'>) => `${e.dimension}:${e.id}`;
const required = (t: Task) => t.steps.filter((s) => !s.optional);
const gradedTasks = (f: CourseFacts) => getTasksByRole(f.course, f.role).filter((t) => isGradedWeek(f.course, t.week));
const runsCommand = (s: Step) => !!(s.command || s.commands?.length);

/** A step that contributes, and how. */
interface Hit {
  f: CourseFacts;
  task: Task;
  step: Step;
  verified: boolean;
  receipted: boolean;
  at?: number;
  kept: boolean;
}

function hitOf(f: CourseFacts, task: Task, step: Step, earlier?: Pick<EarnedRow, 'level' | 'levelAt'>): Hit {
  // A step kept from an earlier run is as the ledger recorded it: verified when the row was earned verified, and when.
  if (earlier) return { f, task, step, verified: levelRank(earlier.level) >= levelRank('verified'), receipted: false, at: earlier.levelAt || undefined, kept: true };
  const rec = f.evidence[key(task.id, step.id)];
  const verified = !!rec?.verified;
  return { f, task, step, verified, receipted: verified && !!f.receipts?.[key(task.id, step.id)], at: verified ? rec?.verifiedAt : rec?.firstAttemptAt, kept: false };
}

const tickedHits = (f: CourseFacts): Hit[] => gradedTasks(f).flatMap((t) => required(t).filter((s) => f.isStepDone(t.id, s.id)).map((s) => hitOf(f, t, s)));
const verifiedHits = (f: CourseFacts): Hit[] => gradedTasks(f).flatMap((t) => verifiableSteps(required(t)).filter((s) => f.evidence[key(t.id, s.id)]?.verified).map((s) => hitOf(f, t, s)));

/** Which course the item came from, when there is more than one. */
const where = (f: CourseFacts, many: boolean, ...rest: string[]) => [...(many ? [f.course.title] : []), ...rest].join(' · ');
const hrefOf = (f: CourseFacts, task: Task) => `/courses/${f.course.id}?tab=tasks&week=${task.week}&task=${task.id}`;
const stepKey = (h: Hit) => `${h.f.course.id}/${h.task.id}/${h.step.id}`;

function stepItem(h: Hit, many: boolean): DetailItem {
  return {
    key: stepKey(h),
    label: h.step.title,
    sub: where(h.f, many, `Week ${h.task.week}`, h.task.title),
    href: hrefOf(h.f, h.task),
    marks: [h.verified ? 'verified' : 'ticked', ...(h.receipted ? ['receipted'] : []), ...(h.kept ? ['kept'] : [])],
    ...(h.at ? { at: h.at } : {}),
  };
}

function commandItems(hits: Hit[], many: boolean): DetailItem[] {
  const out: DetailItem[] = [];
  for (const h of hits) {
    const base = { label: h.step.title, sub: where(h.f, many, `Week ${h.task.week}`, h.task.title), href: hrefOf(h.f, h.task), marks: [h.verified ? 'verified' : 'ticked', ...(h.kept ? ['kept'] : [])] };
    if (h.step.commands?.length) h.step.commands.forEach((c, i) => out.push({ key: `${stepKey(h)}#${i}`, ...base, code: c.cmd }));
    else if (h.step.command) out.push({ key: `${stepKey(h)}#0`, ...base, code: h.step.command });
  }
  return out;
}

const short = (titles: string[]) => (titles.length > 3 ? `${titles.slice(0, 3).join(' · ')} and ${titles.length - 3} more` : titles.join(' · '));

/** Rows of a dimension, reached, with the tasks of `taskIds` they were exercised on: tools and procedures behind a set of steps. */
function rowItems(facts: CourseFacts[], dimension: Extract<Dimension, 'tools' | 'procedures'>, taskIdsByCourse: Map<string, Set<string>>, many: boolean): DetailItem[] {
  const out: DetailItem[] = [];
  for (const f of facts) {
    const ids = taskIdsByCourse.get(f.course.id);
    if (!ids || ids.size === 0) continue;
    for (const row of f.profile.rows[dimension]) {
      if (row.level === 'not-started') continue;
      const mine = row.tasks.filter((t) => ids.has(t));
      if (mine.length === 0) continue;
      const titles = mine.map((t) => f.course.tasks.find((x) => x.id === t)?.title ?? t);
      out.push({ key: `${f.course.id}/${row.id}`, label: row.label, sub: where(f, many, short(titles)), marks: [row.level] });
    }
  }
  return out;
}

function tasksOf(hits: Hit[]): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const h of hits) {
    const set = out.get(h.f.course.id) ?? new Set<string>();
    set.add(h.task.id);
    out.set(h.f.course.id, set);
  }
  return out;
}

/** The steps behind a profile row: this run's, or, for a row the ledger holds above it, the ones it was earned from. */
function rowHits(f: CourseFacts, row: ProfileRow): Hit[] {
  if (f.kept.includes(rowKey(row))) {
    const entry = f.earned.find((e) => ledgerKey(e) === rowKey(row));
    const out: Hit[] = [];
    for (const via of entry?.via ?? []) {
      const task = f.course.tasks.find((t) => t.id === via.taskId);
      if (!task) continue;
      for (const stepId of via.stepIds) {
        const step = task.steps.find((s) => s.id === stepId);
        if (step && entry) out.push(hitOf(f, task, step, entry));
      }
    }
    return out;
  }
  const verifiedOnly = levelRank(row.level) >= levelRank('verified');
  return row.tasks.flatMap((id) => {
    const task = f.course.tasks.find((t) => t.id === id);
    if (!task) return [];
    return required(task)
      .filter((s) => (verifiedOnly && f.evidence[key(task.id, s.id)]?.verified) || (!verifiedOnly && f.isStepDone(task.id, s.id)))
      .map((s) => hitOf(f, task, s));
  });
}

function uniqueHits(hits: Hit[]): Hit[] {
  const seen = new Set<string>();
  return hits.filter((h) => (seen.has(stepKey(h)) ? false : (seen.add(stepKey(h)), true)));
}

/** A reached row as a list entry: its label, where it was exercised, its level, and whether it was kept from an earlier run. */
function rowEntry(f: CourseFacts, row: ProfileRow, many: boolean, extraMarks: string[] = []): DetailItem {
  const isKept = f.kept.includes(rowKey(row));
  const titles = row.tasks.map((t) => f.course.tasks.find((x) => x.id === t)?.title ?? t);
  const entry = isKept ? f.earned.find((e) => ledgerKey(e) === rowKey(row)) : undefined;
  return {
    key: `${f.course.id}/${row.dimension}/${row.id}`,
    label: row.label,
    sub: where(f, many, short(titles)),
    marks: [row.level, ...extraMarks, ...(isKept ? ['kept'] : [])],
    ...(entry ? { at: entry.levelAt } : row.lastVerifiedAt ? { at: row.lastVerifiedAt } : {}),
  };
}

/** One row per (dimension, id) across courses: a skill in two courses is one skill, listed with both. */
function mergeAcrossCourses(items: DetailItem[]): DetailItem[] {
  const by = new Map<string, DetailItem>();
  for (const item of items) {
    const id = item.key.split('/').slice(1).join('/');
    const have = by.get(id);
    if (!have) by.set(id, item);
    else {
      by.set(id, { ...have, sub: [have.sub, item.sub].filter(Boolean).join(' · '), marks: [...new Set([...(have.marks ?? []), ...(item.marks ?? [])])] });
    }
  }
  return [...by.values()];
}

function section(id: SectionId, title: string, items: DetailItem[]): DetailSection[] {
  return items.length > 0 ? [{ id, title, items }] : [];
}

/** The four supporting lists behind a set of steps: the steps, their commands, the tools and the procedures. */
function behind(hits: Hit[], facts: CourseFacts[], many: boolean, skip: SectionId[] = []): DetailSection[] {
  const uniq = uniqueHits(hits);
  const taskIds = tasksOf(uniq);
  return [
    ...(skip.includes('actions') ? [] : section('actions', DETAIL_COPY.title.actions, uniq.map((h) => stepItem(h, many)))),
    ...(skip.includes('commands') ? [] : section('commands', DETAIL_COPY.title.commands, commandItems(uniq, many))),
    ...(skip.includes('tools') ? [] : section('tools', DETAIL_COPY.title.tools, rowItems(facts, 'tools', taskIds, many))),
    ...(skip.includes('procedures') ? [] : section('procedures', DETAIL_COPY.title.procedures, rowItems(facts, 'procedures', taskIds, many))),
  ];
}

const many = (facts: CourseFacts[]) => facts.length > 1;

/** The list behind one figure on the record, for the courses started. */
export function metricDetail(metric: RecordMetric, facts: CourseFacts[]): MetricDetail {
  const m = many(facts);
  const rule = DETAIL_COPY.rule[metric];
  const title = DETAIL_COPY.title.primary[metric];
  const primary = (items: DetailItem[]) => section('primary', title, items);
  const done: MetricDetail = { metric, rule, sections: [] };

  switch (metric) {
    case 'steps-done': {
      const hits = facts.flatMap(tickedHits);
      return { ...done, sections: [...primary(hits.map((h) => stepItem(h, m))), ...behind(hits, facts, m, ['actions'])] };
    }
    case 'tasks-done': {
      const taskHits: Hit[] = [];
      const items: DetailItem[] = [];
      for (const f of facts) {
        for (const t of gradedTasks(f)) {
          const steps = required(t);
          if (steps.length === 0 || !steps.every((s) => f.isStepDone(t.id, s.id))) continue;
          items.push({ key: `${f.course.id}/${t.id}`, label: t.title, sub: where(f, m, `Week ${t.week}`, `${steps.length} step${steps.length === 1 ? '' : 's'}`), href: hrefOf(f, t), marks: ['done'] });
          for (const s of steps) taskHits.push(hitOf(f, t, s));
        }
      }
      return { ...done, sections: [...primary(items), ...behind(taskHits, facts, m, ['actions'])] };
    }
    case 'weeks-sealed': {
      const items: DetailItem[] = [];
      const hits: Hit[] = [];
      for (const f of facts) {
        for (const week of f.clearedWeeks) {
          const tasks = gradedTasks(f).filter((t) => t.week === week);
          const def = f.course.weeks.find((w) => w.number === week);
          items.push({ key: `${f.course.id}/w${week}`, label: `Week ${week}${def?.title ? `: ${def.title}` : ''}`, sub: where(f, m, `${tasks.length} task${tasks.length === 1 ? '' : 's'}`), marks: ['sealed'] });
          for (const t of tasks) for (const s of required(t)) hits.push(hitOf(f, t, s));
        }
      }
      return { ...done, sections: [...primary(items), ...behind(hits, facts, m, ['actions'])] };
    }
    case 'capstones': {
      return { ...done, sections: primary(facts.map((f) => ({ key: f.course.id, label: f.course.title, sub: f.capstoneFiled ? 'The capstone has been filed.' : 'The capstone has not been filed yet.', marks: [f.capstoneFiled ? 'filed' : 'open'] }))) };
    }
    case 'steps-verified': {
      const hits = facts.flatMap(verifiedHits);
      return { ...done, sections: [...primary(hits.map((h) => stepItem(h, m))), ...behind(hits, facts, m, ['actions'])] };
    }
    case 'commands': {
      const hits = facts.flatMap(verifiedHits).filter((h) => runsCommand(h.step));
      return { ...done, sections: [...primary(commandItems(hits, m)), ...behind(hits, facts, m, ['commands'])] };
    }
    case 'evidence': {
      const items = facts
        .flatMap((f) => f.artifacts.filter((a) => a.courseId === f.course.id).map((a) => ({ f, a })))
        .sort((x, y) => y.a.hashedAt - x.a.hashedAt)
        .map(({ f, a }): DetailItem => ({
          key: `${f.course.id}/${a.sha256}`,
          label: a.filename,
          sub: where(f, m, `sha256 ${a.sha256.slice(0, 12)}…`, `${Math.max(1, Math.round(a.sizeBytes / 1024))} KB`, ...(a.week !== undefined ? [`Week ${a.week}`] : [])),
          marks: [a.nameOk ? 'named' : 'name off convention'],
          at: a.hashedAt,
        }));
      return { ...done, sections: primary(items) };
    }
    case 'days': {
      const days = new Map<string, { verified: number; attempted: number; files: number; last: number }>();
      const bump = (at: number | undefined, field: 'verified' | 'attempted' | 'files') => {
        if (!at) return;
        const d = localDay(at);
        const row = days.get(d) ?? { verified: 0, attempted: 0, files: 0, last: 0 };
        row[field] += 1;
        row.last = Math.max(row.last, at);
        days.set(d, row);
      };
      for (const f of facts) {
        for (const t of gradedTasks(f)) {
          for (const s of required(t)) {
            const rec = f.evidence[key(t.id, s.id)];
            if (!rec) continue;
            bump(rec.firstAttemptAt, 'attempted');
            if (rec.verified) bump(rec.verifiedAt, 'verified');
          }
        }
        for (const a of f.artifacts) if (a.courseId === f.course.id) bump(a.hashedAt, 'files');
      }
      const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
      const items = [...days.entries()]
        .sort((a, b) => (a[0] < b[0] ? 1 : -1))
        .map(([day, r]): DetailItem => ({
          key: day,
          label: day,
          sub: [r.attempted ? `${plural(r.attempted, 'step')} attempted` : '', r.verified ? `${plural(r.verified, 'step')} verified` : '', r.files ? `${plural(r.files, 'file')} hashed` : ''].filter(Boolean).join(' · '),
          at: r.last,
        }));
      return { ...done, sections: primary(items) };
    }
    case 'skills':
    case 'domains':
    case 'tools':
    case 'procedures': {
      const dimension = metric === 'domains' ? 'domains' : metric;
      const atLeast = metric === 'tools' ? 'practised' : 'verified';
      const items: DetailItem[] = [];
      const hits: Hit[] = [];
      for (const f of facts) {
        for (const row of f.profile.rows[dimension]) {
          if (levelRank(row.level) < levelRank(atLeast)) continue;
          const followed = metric === 'procedures' && row.level === 'reviewed' && (f.cites?.(row) ?? false);
          items.push(rowEntry(f, row, m, metric === 'procedures' ? [followed ? 'followed to standard' : 'not yet to standard'] : []));
          hits.push(...rowHits(f, row));
        }
      }
      const merged = metric === 'domains' ? items : mergeAcrossCourses(items);
      const skip: SectionId[] = metric === 'tools' ? ['tools'] : metric === 'procedures' ? ['procedures'] : [];
      return { ...done, sections: [...primary(merged), ...behind(hits, facts, m, skip)] };
    }
  }
}

/** How many entries the figure's own list holds: what the page checks against the number it prints. */
export function primaryCount(detail: MetricDetail): number {
  return detail.sections.find((s) => s.id === 'primary')?.items.length ?? 0;
}
