import type { Course, Framework, RoleDef, Step, Task, WeekDef } from '../../types';

/**
 * The shared shape of the two cloud capstones (R87) — Azure and AWS, twelve
 * weeks each, the same four roles, the same week plan. Only the services and
 * the commands differ, so the course files hold content and this holds form.
 *
 * Every step is three tiers (see `StepDetail`): ONE short line always visible;
 * the clicks, the commands and their sample output behind "Show me how"; the
 * reason and the common fixes behind "Why, and if it breaks".
 */

export const CLOUD_ROLES: RoleDef[] = [
  { id: 'arch', name: 'Cloud Architect', mission: 'Owns the design, the standards, the cost and each week’s document.', color: '#0369a1', icon: 'Layers', label: '📐 Cloud Architect' },
  { id: 'infra', name: 'Infrastructure Admin', mission: 'Builds the network, the VM, the data and the templates.', color: '#15803d', icon: 'Server', label: '🧱 Infrastructure Admin' },
  { id: 'dev', name: 'App & DevOps', mission: 'Ships the website, the API and the pipeline.', color: '#b45309', icon: 'Code', label: '🚀 App & DevOps' },
  { id: 'secops', name: 'Security & Ops', mission: 'Locks access down, watches it run, and works the incidents.', color: '#7c3aed', icon: 'Shield', label: '🛡️ Security & Ops' },
];

/** The MD's difficulty arc: Beginner 1–4, Intermediate 5–8, Advanced 9–11, Integrated 12. */
export function phaseOf(week: number): { phase: string; stage: 1 | 2 | 3 | 4; difficulty: 1 | 2 | 3 | 4 } {
  if (week <= 4) return { phase: 'Beginner', stage: week === 1 ? 1 : week <= 3 ? 2 : 3, difficulty: week <= 2 ? 1 : 2 };
  if (week <= 8) return { phase: 'Intermediate', stage: 4, difficulty: 3 };
  if (week <= 11) return { phase: 'Advanced', stage: 4, difficulty: 4 };
  return { phase: 'Integrated', stage: 4, difficulty: 4 };
}

export interface WeekPlan {
  n: number;
  title: string;
  theme: string;
  objective: string;
  milestone: string;
  /** One objective label per role, in role order: arch, infra, dev, secops. */
  labels: [string, string, string, string];
}

export function cloudWeeks(prefix: string, plans: WeekPlan[]): WeekDef[] {
  return plans.map((p) => {
    const { phase, stage, difficulty } = phaseOf(p.n);
    return {
      number: p.n,
      title: p.title,
      theme: p.theme,
      objective: p.objective,
      runs: `Week ${p.n}`,
      stage,
      phase,
      difficulty,
      milestone: p.milestone,
      objectives: CLOUD_ROLES.map((r, i) => ({
        id: `${prefix}-w${p.n}-${r.id}`,
        label: p.labels[i],
        tasks: [`${prefix}-w${p.n}-${r.id}`],
      })),
    };
  });
}

/** The step builders, bound to a course's frameworks and CLI location. */
export function stepKit(frameworks: Framework[], shell: string) {
  const short = (s: string) => (s.split(/\s+/).length > 26 ? `${s.split(/\s+/).slice(0, 25).join(' ')}…` : s);

  /** Clicks in a console. The outcome is a sentence, not terminal text. */
  const portal = (
    id: string,
    title: string,
    line: string,
    where: string,
    actions: string[],
    outcome: string,
    why: string,
    extra: Partial<Step> = {}
  ): Step => ({
    id,
    title,
    description: short(outcome),
    where,
    instruction: line,
    instructionList: actions,
    expectedOutput: outcome,
    outputKind: 'result',
    whatItMeans: why,
    frameworks,
    ...extra,
  });

  /** Commands in the cloud shell, each with what it prints and why. */
  const cli = (
    id: string,
    title: string,
    line: string,
    commands: { cmd: string; explain: string; sample: string }[],
    verify: string[],
    why: string,
    extra: Partial<Step> = {}
  ): Step => ({
    id,
    title,
    description: short(title),
    where: shell,
    instruction: line,
    commands,
    verify,
    whatItMeans: why,
    frameworks,
    ...extra,
  });

  /** R92: the portal clicks first, the shell command as the alternative, one
   *  verify for both — the way every hands-on step of the course reads. */
  const both = (
    id: string,
    title: string,
    line: string,
    where: string,
    clicks: string[],
    shell: { cmd: string; explain: string; sample: string }[],
    verify: string[],
    why: string,
    extra: Partial<Step> = {}
  ): Step => ({
    id,
    title,
    description: short(title),
    where,
    instruction: line,
    instructionList: clicks,
    commands: shell,
    verify,
    whatItMeans: why,
    frameworks,
    ...extra,
  });

  /** The last step of every task: write it into the week's team document. */
  const record = (id: string, form: string, file: string, section: string, actions: string[], why: string): Step => ({
    id,
    title: `Record it in the ${form}`,
    description: `Your section: ${section}.`,
    where: 'Deliverables tab',
    instruction: `Fill your section of the ${form}.`,
    instructionList: actions,
    usesForm: form,
    producesDeliverable: file,
    whatItMeans: why,
    frameworks,
  });

  return { portal, cli, both, record };
}

export function cloudTask(t: {
  id: string;
  role: string;
  week: number;
  title: string;
  objective: string;
  minutes: number;
  file: string;
  frameworks: Framework[];
  learn: string[];
  done: string[];
  tools?: string[];
  /** R92: the documentation to read first, and the free-tier line. */
  docs?: Task['docs'];
  freeTier?: string;
  steps: Step[];
}): Task {
  return {
    id: t.id,
    role: t.role,
    week: t.week,
    title: t.title,
    objective: t.objective,
    frameworks: t.frameworks,
    deliverables: [t.file],
    estimatedTime: `${t.minutes} min`,
    difficulty: phaseOf(t.week).difficulty,
    learn: t.learn,
    tools: t.tools,
    definitionOfDone: t.done,
    docs: t.docs,
    freeTier: t.freeTier,
    steps: t.steps,
  };
}

/** The weekly delivery cycle from the course outline. */
export const CLOUD_CYCLE = [
  { label: 'Plan', detail: 'Read the week, split the four tasks, agree names.' },
  { label: 'Build', detail: 'Each role deploys its own part.' },
  { label: 'Validate', detail: 'Prove it works — and that what must fail, fails.' },
  { label: 'Document', detail: 'Fill your section of the week’s document.' },
  { label: 'Review', detail: 'Check costs, stop the VM, update the diagram.' },
];

/** Twelve document files, in week order — the same names in both courses. */
export const CLOUD_FILES = [
  '01_Cloud_Foundation_and_Naming_Standard.md',
  '02_Solution_Architecture_Document.md',
  '03_Application_and_API_Design_Spec.md',
  '04_Monitoring_and_Incident_Report.md',
  '05_Access_Control_Matrix_and_Secrets_Register.md',
  '06_Network_Design_Document.md',
  '07_Server_Configuration_and_Runbook.md',
  '08_Backup_and_Disaster_Recovery_Plan.md',
  '09_IaC_Design_and_Deployment_Record.md',
  '10_Change_Request_and_Release_Record.md',
  '11_Governance_Security_and_Cost_Report.md',
  '12_Operational_Handover_Package.md',
] as const;

export const CLOUD_FORMS = [
  'Cloud Foundation & Naming Standard',
  'Solution Architecture Document',
  'Application & API Design Specification',
  'Monitoring & Incident Report',
  'Access Control Matrix & Secrets Register',
  'Network Design Document',
  'Server Configuration & Maintenance Runbook',
  'Backup & Disaster Recovery Plan',
  'IaC Design & Deployment Record',
  'Change Request & Release Record',
  'Governance, Security & Cost Report',
  'Operational Handover Package',
] as const;

// ── One 12-week plan, three 4-week courses (R90) ────────────────────────────
//
// The instructor splits each platform into three courses, one per cert level:
// Fundamentals (Weeks 1–4), Administrator / Solutions Architect (5–8), DevOps
// (9–12). The tasks, documents, diagram and template are still authored ONCE
// against the global week numbers 1–12; a course is a slice of them, renumbered
// 1–4, plus a Week 0 that deploys the previous course's end state from the
// template (`throughWeek`) for a team that did not take it.

export interface CloudBlock {
  /** Which quarter of the plan: global weeks [from, to]. */
  weeks: [number, number];
  id: string;
  title: string;
  description: string;
  certification: string;
  level: Course['level'];
  audience: string;
  /** The exam tag every task of this course carries (with WAF). */
  framework: Framework;
  /** The tag the shared tasks were authored with, to be replaced. */
  authoredFramework: Framework;
  /** One sentence for the overview: what this course starts from and adds. */
  intro: string;
}

/** Local week number inside a block. */
export const localWeek = (block: Pick<CloudBlock, 'weeks'>, globalWeek: number) => globalWeek - block.weeks[0] + 1;

function retag<T extends { frameworks: Framework[] }>(x: T, from: Framework, to: Framework): T {
  return { ...x, frameworks: x.frameworks.map((f) => (f === from ? to : f)) };
}

export function sliceCourse(
  block: CloudBlock,
  opts: { vendor: string; plans: WeekPlan[]; tasks: Task[]; weeks: WeekDef[]; setup?: { week: WeekDef; task: Task } }
): Course {
  const [a, b] = block.weeks;
  const inBlock = (w: number) => w >= a && w <= b;
  const weeks: WeekDef[] = opts.weeks
    .filter((w) => inBlock(w.number))
    .map((w) => ({
      ...w,
      number: localWeek(block, w.number),
      runs: `Week ${localWeek(block, w.number)}`,
      // Four graded weeks cut the four stages, whichever quarter this is.
      stage: localWeek(block, w.number) as 1 | 2 | 3 | 4,
    }));
  const tasks: Task[] = opts.tasks
    .filter((t) => inBlock(t.week))
    .map((t) => ({
      ...retag(t, block.authoredFramework, block.framework),
      week: localWeek(block, t.week),
      steps: t.steps.map((s) => retag(s, block.authoredFramework, block.framework)),
    }));
  if (opts.setup) {
    weeks.unshift(opts.setup.week);
    const t = opts.setup.task;
    tasks.unshift({ ...retag(t, block.authoredFramework, block.framework), steps: t.steps.map((s) => retag(s, block.authoredFramework, block.framework)) });
  }
  return {
    id: block.id,
    title: block.title,
    slug: block.id,
    description: block.description,
    vendor: opts.vendor,
    certification: block.certification,
    level: block.level,
    audience: block.audience,
    roles: CLOUD_ROLES,
    weeks,
    gates: [],
    tasks,
    noGatekeeping: true,
    // A class is sixteen groups (R91), like the security capstones.
    teamCount: 16,
    manualSections: ['cloud-iac'],
    topologyPicture: 'cloud',
    lifecyclePath: CLOUD_CYCLE,
    isSeed: true,
    version: 1,
  };
}

/** The setup week every course after the first opens with. */
export function setupWeek(prefix: string, previous: string): WeekDef {
  return {
    number: 0,
    title: 'Start where the last course left off',
    theme: 'The environment you inherit',
    objective: `Have the environment ${previous} builds — deployed from the template if your team did not build it.`,
    runs: 'Week 0',
    setup: true,
    stage: 0,
    phase: 'Setup',
    difficulty: 1,
    objectives: [{ id: `${prefix}-w0-setup`, label: 'Stand up the inherited environment', tasks: [`${prefix}-w0-setup`] }],
    milestone: `The resources ${previous} ends with exist in your team's environment, and the Guide's picture for Week 0 matches them.`,
  };
}
