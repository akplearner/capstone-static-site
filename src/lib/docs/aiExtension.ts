import type { Course, Step, Task, WeekObjective } from '../types';

/**
 * R143 — the AI extension every graded week now carries.
 *
 * The owner's rule: the four graded weeks stay about passing the exam, and
 * each one gains one small AI extension on top — the same build, taken one
 * step further with a local AI assistant. It is premium content and it is
 * optional (`track: 'ai'`, `shared: true`, never required), so it never holds
 * a week open, cuts no stone and earns no mark; but what it teaches counts in
 * the skills profile, so a learner who does it is measured on it.
 *
 * The task is built once here and placed in every course from `AI_EXTENSION_PLAN`
 * (`withAiExtensions`, applied in every seed and in the cloud factory), and the
 * same plan emits the registry fragments the ontology joins on
 * (`aiExtensionSkills`, `aiExtensionPractices`), so a course cannot carry the
 * task without the skills it teaches being published too.
 *
 * Every step is authored to the strict step contract (where, a short
 * instruction, two to four actions, an official page, how it breaks, and for
 * the command step a flag-by-flag explanation with its sample), so the task
 * passes on SecAI+ and CISSP as well as everywhere else.
 */

export interface AiExtensionSpec {
  /** The id prefix the course's AI tasks use: `${prefix}-w${week}-ai`. */
  prefix: string;
  /** The graded weeks that get an AI extension. */
  weeks: number[];
  /** The role the shared task is filed under (any real role of the course; it is open to all). */
  role: string;
  /** Per week, the one-line topic — what this week's build is taken further with AI. Eight words or fewer. */
  topics: Record<number, string>;
}

const AI_STANDARD = 'NIST_AI_RMF';
const AI_DOC = 'https://www.nist.gov/itl/ai-risk-management-framework';

export const AI_EXTENSION_PLAN: Record<string, AiExtensionSpec> = {
  'security-plus': { prefix: 'sec', role: 'grc', weeks: [1, 2, 3, 4], topics: { 1: 'explain the hardening baseline', 2: 'summarise the risks found', 3: 'draft the incident timeline', 4: 'review the final report' } },
  mssp: { prefix: 'mssp', role: 'grc', weeks: [1, 2, 3, 4], topics: { 1: 'map a control to evidence', 2: 'check the control matrix', 3: 'triage a detection alert', 4: 'draft an audit answer' } },
  'cysa-plus': { prefix: 'cysa', role: 'grc', weeks: [1, 2, 3, 4], topics: { 1: 'read the monitoring baseline', 2: 'explain an alert triage', 3: 'rank the vulnerabilities', 4: 'write the executive debrief' } },
  'server-plus': { prefix: 'srv', role: 'mgmt', weeks: [1, 2, 3, 4], topics: { 1: 'explain the hardware plan', 2: 'draft an operations SOP', 3: 'check the IP plan', 4: 'summarise the as-built' } },
  ccna: { prefix: 'ccna', role: 'ops', weeks: [1, 2, 3, 4], topics: { 1: 'explain the high-level design', 2: 'check the IP plan', 3: 'read a validation result', 4: 'draft the ACL rationale' } },
  'a-plus': { prefix: 'ap', role: 'records', weeks: [1, 2, 3, 4], topics: { 1: 'explain the build sheet', 2: 'read a backup log', 3: 'draft a support ticket', 4: 'summarise the handover' } },
  'ai-foundations': { prefix: 'aif', role: 'records', weeks: [1, 2, 3, 4], topics: { 1: 'explain the capabilities map', 2: 'check the responsible-AI findings', 3: 'draft the build record', 4: 'summarise the handover' } },
  'aws-ai-practitioner': { prefix: 'awsai', role: 'records', weeks: [1, 2, 3, 4], topics: { 1: 'explain the capabilities map', 2: 'check the responsible-AI findings', 3: 'draft the build record', 4: 'summarise the handover' } },
  'network-plus': { prefix: 'np', role: 'ops', weeks: [1, 2, 3, 4], topics: { 1: 'check the IP plan', 2: 'read a verification log', 3: 'explain a change', 4: 'draft the migration plan' } },
  'secai-plus': { prefix: 'secai', role: 'governance', weeks: [1, 2, 3, 4], topics: { 1: 'map the system model', 2: 'explain an attack case', 3: 'check a control', 4: 'draft the assurance answer' } },
  cissp: { prefix: 'cissp', role: 'govrisk', weeks: [1, 2, 3, 4, 5, 6], topics: { 1: 'explain a risk', 2: 'check an asset class', 3: 'read a network rule', 4: 'draft an access review', 5: 'summarise an assessment', 6: 'review the security plan' } },
  'azure-fundamentals': { prefix: 'azf', role: 'arch', weeks: [1, 2, 3, 4], topics: { 1: 'explain the naming standard', 2: 'read the architecture', 3: 'check the API design', 4: 'draft the incident note' } },
  'azure-administrator': { prefix: 'aza', role: 'arch', weeks: [1, 2, 3, 4], topics: { 1: 'read the access matrix', 2: 'explain the network', 3: 'draft a runbook step', 4: 'summarise the recovery plan' } },
  'azure-devops': { prefix: 'azd', role: 'arch', weeks: [1, 2, 3, 4], topics: { 1: 'explain the template', 2: 'draft a change request', 3: 'read the cost report', 4: 'summarise the handover' } },
  'aws-cloud-practitioner': { prefix: 'awsf', role: 'arch', weeks: [1, 2, 3, 4], topics: { 1: 'explain the naming standard', 2: 'read the architecture', 3: 'check the API design', 4: 'draft the incident note' } },
  'aws-solutions-architect': { prefix: 'awsa', role: 'arch', weeks: [1, 2, 3, 4], topics: { 1: 'read the access matrix', 2: 'explain the network', 3: 'draft a runbook step', 4: 'summarise the recovery plan' } },
  'aws-devops': { prefix: 'awsd', role: 'arch', weeks: [1, 2, 3, 4], topics: { 1: 'explain the template', 2: 'draft a change request', 3: 'read the cost report', 4: 'summarise the handover' } },
};

export const aiTaskId = (spec: AiExtensionSpec, week: number) => `${spec.prefix}-w${week}-ai`;

/** The skills the week's AI task teaches: all four nodes are used across a course's weeks. */
function aiSkillsFor(week: number, weeks: number[]): string[] {
  return week === weeks[0]
    ? ['comp.ai.prompt-for-the-task', 'comp.ai.local-assistant', 'comp.ai.verify-ai-output']
    : ['comp.ai.local-assistant', 'comp.ai.ground-in-records', 'comp.ai.verify-ai-output'];
}

function aiTask(spec: AiExtensionSpec, week: number): Task {
  const id = aiTaskId(spec, week);
  const topic = spec.topics[week];
  const s1: Step = {
    id: `${id}-s1`,
    title: 'Run a local model',
    description: 'A model that runs on your own machine, offline.',
    where: 'Your own machine — a terminal',
    instruction: 'Pull a small local model and list it.',
    instructionList: [
      'Install Ollama from the official site if it is not already there.',
      'Run the pull command for a small model.',
      'List the installed models and confirm it is there.',
    ],
    commands: [
      {
        cmd: 'ollama pull llama3.2 && ollama list',
        explain: 'Pulls a small model that runs offline, then lists what is installed so you can see it is ready.',
        sample: 'NAME             ID            SIZE      MODIFIED\nllama3.2:latest  a80c4f17acd5  2.0 GB    2 seconds ago',
        flags: [
          { flag: 'pull llama3.2', meaning: 'Downloads the model once; it then runs offline.' },
          { flag: 'list', meaning: 'Prints the installed models as a table.' },
        ],
      },
    ],
    expectedOutput: 'NAME             ID            SIZE      MODIFIED\nllama3.2:latest  a80c4f17acd5  2.0 GB    2 seconds ago',
    outputKind: 'console',
    outputHighlights: [{ text: 'llama3.2', label: 'your offline model, ready' }],
    verify: ['llama3.2'],
    whatItMeans: 'A model on your own machine answers without sending your work to anyone. Everything after this runs offline.',
    docs: [{ title: 'NIST AI Risk Management Framework', url: AI_DOC, lookFor: 'the Manage function: run AI with controls, and keep a person accountable for what it produces.' }],
    fixes: [
      { symptom: 'ollama: command not found', fix: 'Install it from the official site, then open a new terminal so the command is on the path.' },
      { symptom: 'The pull is slow or fails', fix: 'The model is two gigabytes; on a slow link pull llama3.2:1b instead and list again.' },
    ],
    frameworks: [AI_STANDARD],
  };
  const s2: Step = {
    id: `${id}-s2`,
    title: 'Ground it, and check the answer',
    description: 'The model answers from your record; you keep what the evidence supports.',
    where: 'Deliverables tab, then the terminal',
    instruction: `Ask the model to ${topic}, then check it.`,
    instructionList: [
      'Paste one of your own records into the prompt as the context.',
      'Ask the model to explain or check that record for this week.',
      'Read the answer against your evidence and keep only what is true.',
    ],
    expectedOutput: 'The model answers from your record, and you keep only the parts your evidence supports.',
    outputKind: 'result',
    whatItMeans: 'A grounded answer cites your own work; an ungrounded one guesses. The human check is what makes it safe to use.',
    docs: [{ title: 'NIST AI RMF Generative AI Profile', url: AI_DOC, lookFor: 'why a person must verify generative output before it is used, and how to record that check.' }],
    fixes: [
      { symptom: 'The answer invents a detail', fix: 'It was not grounded: paste the exact record and ask it to quote only from that text.' },
      { symptom: 'The answer is too long to check', fix: 'Ask for three bullet points, each traceable to a line of your record.' },
    ],
    frameworks: [AI_STANDARD],
  };
  return {
    id,
    role: spec.role,
    week,
    title: `AI extension: ${topic}`,
    objective: `Use a local AI assistant on what you built this week: ${topic}, grounded and checked.`,
    steps: [s1, s2],
    frameworks: [AI_STANDARD],
    deliverables: [],
    estimatedTime: '30 min',
    difficulty: 2,
    learn: ['Local models', 'Grounding in your own records', 'Verifying AI output'],
    tools: ['Ollama'],
    definitionOfDone: ['A local model runs offline', 'Its answer is grounded in a record and checked against the evidence'],
    shared: true,
    track: 'ai',
  };
}

/** Place the AI task in the week's objectives: its own objective where there is room, else the smallest. */
function placeInObjectives(objectives: WeekObjective[] | undefined, id: string, prefix: string, week: number): WeekObjective[] {
  const objs = objectives ? objectives.map((o) => ({ ...o, tasks: [...o.tasks] })) : [];
  if (objs.length < 4) {
    objs.push({ id: `${prefix}-w${week}-ai-obj`, label: 'Extend the build with AI', tasks: [id] });
    return objs;
  }
  const target = objs.filter((o) => o.tasks.length < 3).sort((a, b) => a.tasks.length - b.tasks.length)[0];
  if (!target) throw new Error(`week ${week}: no room for the AI extension (every objective holds three tasks)`);
  target.tasks.push(id);
  return objs;
}

/**
 * The course with one AI extension task added to each graded week named in the
 * plan, each placed in that week's objectives. Pure; a course with no plan
 * entry comes back unchanged, and re-applying is a no-op.
 */
export function withAiExtensions<T extends Pick<Course, 'id' | 'tasks' | 'weeks'>>(course: T): T {
  const spec = AI_EXTENSION_PLAN[course.id];
  if (!spec) return course;
  if (course.tasks.some((t) => t.track === 'ai')) return course;
  const tasks = [...course.tasks];
  const weeks = course.weeks.map((w) => ({ ...w }));
  for (const week of spec.weeks) {
    const w = weeks.find((x) => x.number === week);
    if (!w) throw new Error(`${course.id}: the AI plan names week ${week}, which the course lacks`);
    const id = aiTaskId(spec, week);
    tasks.push(aiTask(spec, week));
    w.objectives = placeInObjectives(w.objectives, id, spec.prefix, week);
  }
  return { ...course, tasks, weeks };
}

/** `{ course: { taskId: skillIds } }` for TASK_SKILLS. */
export function aiExtensionSkills(): Record<string, Record<string, string[]>> {
  const out: Record<string, Record<string, string[]>> = {};
  for (const [courseId, spec] of Object.entries(AI_EXTENSION_PLAN)) {
    out[courseId] = Object.fromEntries(spec.weeks.map((w) => [aiTaskId(spec, w), aiSkillsFor(w, spec.weeks)]));
  }
  return out;
}

/** `{ course: { taskId: practiceIds } }` for TASK_PRACTICES. */
export function aiExtensionPractices(): Record<string, Record<string, string[]>> {
  const out: Record<string, Record<string, string[]>> = {};
  for (const [courseId, spec] of Object.entries(AI_EXTENSION_PLAN)) {
    out[courseId] = Object.fromEntries(spec.weeks.map((w) => [aiTaskId(spec, w), ['practice.human-in-the-loop']]));
  }
  return out;
}
