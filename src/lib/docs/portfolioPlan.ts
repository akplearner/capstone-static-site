import type { Course, Step } from '../types';
import type { Raci } from './types';

/**
 * R142 — where each course's Portfolio sits, as data.
 *
 * The owner's blueprint says every certification earns a deployable portfolio
 * project: a certification, hands-on experience, a repository, a case study,
 * resume bullets and an architecture diagram, so an employer sees evidence
 * rather than a pass mark. The Portfolio is the one form that holds those
 * five things. It is built once (`portfolioForm.ts`) and placed in every
 * course from this table: the last graded week, feeding the capstone, shared
 * by the whole team, and written by one named step of the task that writes
 * the capstone (`withPortfolioStep`), so the chain rule, the RACI rule and
 * "every form is written by a step" all hold without touching fifteen seed
 * files by hand.
 *
 * The cloud courses are in the table too, under the quarter prefixes the
 * factory gives their forms (`azf`, `awsa`, …); `sliceCourse` applies the step.
 */
export interface PortfolioPlanEntry {
  courseId: string;
  /** The form-id prefix the course's forms use: `srv`, `ccna`, `awsf`. The form is `${prefix}_portfolio`. */
  prefix: string;
  /** One past the course's last form number, so the file sorts last. */
  num: number;
  /** The last graded week. */
  week: number;
  /** The capstone's id: the Portfolio feeds it in the same week. */
  capstone: string;
  raci: Raci;
  /** The task whose last step writes the Portfolio. */
  writtenBy: string;
  /** What the team built, in the words the case study opens with; eight words or fewer. */
  project: string;
}

const r = (drafts: string, reviews: string, approves: string, informed?: string[]): Raci => (informed ? { drafts, reviews, approves, informed } : { drafts, reviews, approves });

export const PORTFOLIO_PLAN: PortfolioPlanEntry[] = [
  { courseId: 'security-plus', prefix: 'sec', num: 15, week: 4, capstone: 'final_report', raci: r('grc', 'red', 'grc', ['blue']), writtenBy: 'grc-w4-report', project: 'a tested and hardened two-host range' },
  { courseId: 'mssp', prefix: 'mssp', num: 10, week: 4, capstone: 'mssp_evidence_packet', raci: r('grc', 'blue', 'grc', ['red']), writtenBy: 'mg-w4b', project: 'an audit-ready SOC 2 and ISO 27001 engagement' },
  { courseId: 'cysa-plus', prefix: 'cysa', num: 13, week: 4, capstone: 'cysa_exec_debrief', raci: r('grc', 'red', 'blue'), writtenBy: 'cg-w4b', project: 'a live SOC on a Wazuh stack' },
  { courseId: 'server-plus', prefix: 'srv', num: 9, week: 4, capstone: 'srv_as_built', raci: r('mgmt', 'net', 'mgmt', ['win', 'lnx']), writtenBy: 'sp-w4-handover', project: 'a client server room, built and handed over' },
  { courseId: 'ccna', prefix: 'ccna', num: 11, week: 4, capstone: 'ccna_handover', raci: r('arch', 'ops', 'auto', ['impl']), writtenBy: 'ccna-w4-harden', project: 'a routed, switched and secured company network' },
  { courseId: 'a-plus', prefix: 'ap', num: 9, week: 4, capstone: 'ap_handover', raci: r('records', 'os', 'support', ['hw']), writtenBy: 'ap-w4-handover', project: 'a working endpoint built from bare hardware' },
  { courseId: 'ai-foundations', prefix: 'aif', num: 9, week: 4, capstone: 'aif_handover', raci: r('records', 'build', 'concepts', ['language']), writtenBy: 'aif-w4-handover', project: 'a small AI assistant, built, evaluated and handed over' },
  { courseId: 'docker-dca', prefix: 'dca', num: 8, week: 4, capstone: 'dca_handover', raci: r('records', 'stack', 'images', ['net']), writtenBy: 'dca-w4-handover', project: 'a containerized stack, built, orchestrated and handed over' },
  { courseId: 'kubernetes-cka', prefix: 'cka', num: 8, week: 4, capstone: 'cka_handover', raci: r('records', 'workloads', 'cluster', ['net']), writtenBy: 'cka-w4-handover', project: 'a Kubernetes cluster, built, operated, recovered and handed over' },
  { courseId: 'nvidia-ai-infrastructure', prefix: 'nca', num: 8, week: 4, capstone: 'nca_handover', raci: r('records', 'datacenter', 'infra', ['knowledge']), writtenBy: 'nca-w4-handover', project: 'an AI infrastructure plan, sized, costed, operated and handed over' },
  { courseId: 'aws-ai-practitioner', prefix: 'awsai', num: 9, week: 4, capstone: 'awsai_handover', raci: r('records', 'build', 'concepts', ['language']), writtenBy: 'awsai-w4-handover', project: 'a small generative-AI assistant on Bedrock, built, secured and handed over' },
  { courseId: 'network-plus', prefix: 'np', num: 9, week: 4, capstone: 'np_handover', raci: r('design', 'ops', 'rt', ['sw']), writtenBy: 'np-w4-handover', project: 'a small multi-subnet branch network' },
  { courseId: 'secai-plus', prefix: 'secai', num: 9, week: 4, capstone: 'secai_release_package', raci: r('governance', 'redteam', 'governance', ['defender']), writtenBy: 'sa-w4-gov', project: 'an AI product attacked, defended and released' },
  { courseId: 'cissp', prefix: 'cissp', num: 13, week: 6, capstone: 'cissp_ssp', raci: r('govrisk', 'archnet', 'govrisk', ['idops']), writtenBy: 'ci-w6-gov', project: 'a security programme across eight domains' },
  { courseId: 'azure-fundamentals', prefix: 'azf', num: 5, week: 4, capstone: 'azf_incident', raci: r('arch', 'secops', 'dev', ['infra']), writtenBy: 'az-w4-arch', project: 'a small company built in Azure' },
  { courseId: 'azure-administrator', prefix: 'aza', num: 5, week: 4, capstone: 'aza_dr', raci: r('arch', 'secops', 'dev', ['infra']), writtenBy: 'az-w8-arch', project: 'an Azure estate run like production' },
  { courseId: 'azure-devops', prefix: 'azd', num: 5, week: 4, capstone: 'azd_handover', raci: r('arch', 'secops', 'dev', ['infra']), writtenBy: 'az-w12-arch', project: 'an Azure platform deployed from a pipeline' },
  { courseId: 'aws-cloud-practitioner', prefix: 'awsf', num: 5, week: 4, capstone: 'awsf_incident', raci: r('arch', 'secops', 'dev', ['infra']), writtenBy: 'aws-w4-arch', project: 'a small company built in AWS' },
  { courseId: 'aws-solutions-architect', prefix: 'awsa', num: 5, week: 4, capstone: 'awsa_dr', raci: r('arch', 'secops', 'dev', ['infra']), writtenBy: 'aws-w8-arch', project: 'an AWS estate run like production' },
  { courseId: 'aws-devops', prefix: 'awsd', num: 5, week: 4, capstone: 'awsd_handover', raci: r('arch', 'secops', 'dev', ['infra']), writtenBy: 'aws-w12-arch', project: 'an AWS platform deployed from a pipeline' },
];

export const PORTFOLIO_TITLE = 'Portfolio';
export const PORTFOLIO_STEP_ID = 'portfolio';

export const portfolioId = (p: Pick<PortfolioPlanEntry, 'prefix'>) => `${p.prefix}_portfolio`;
export const portfolioFile = (p: Pick<PortfolioPlanEntry, 'num'>) => `${String(p.num).padStart(2, '0')}_Portfolio.md`;

export function portfolioPlanOf(courseId: string): PortfolioPlanEntry | undefined {
  return PORTFOLIO_PLAN.find((p) => p.courseId === courseId);
}

/** The step that writes the Portfolio: the last step of the task that writes the capstone. */
export function portfolioStep(frameworks: string[]): Step {
  return {
    id: PORTFOLIO_STEP_ID,
    title: 'Write the Portfolio',
    description: 'The repository, the case study, three resume bullets, the diagram and the skills shown, on the shared Portfolio form.',
    where: 'Deliverables tab',
    instruction: 'Fill the Portfolio with the whole team.',
    instructionList: [
      'Paste the link to the team repository, e.g. https://github.com/org/capstone-team01, that holds the configuration and documents.',
      'Write the case study in two hundred words or more: the problem, what was built, the decisions, the result.',
      'Write three resume bullets, each an action, a tool and a measurable result, e.g. "closed 14 of 15 findings".',
      'Name the diagram the case study refers to, then list the skills demonstrated with the evidence for each.',
    ],
    usesForm: PORTFOLIO_TITLE,
    expectedOutput: 'The Portfolio is filled: a repository link, a case study of two hundred words or more, three bullets, the diagram named, three or more skills with evidence.',
    outputKind: 'result',
    docs: [{ title: 'ISO/IEC/IEEE 42010: architecture description', url: 'https://www.iso.org/standard/74393.html', lookFor: 'What an architecture description must identify: stakeholders, concerns, viewpoints and the rationale for decisions.' }],
    whatItMeans: 'The certification proves what was learned; the Portfolio proves what was built. An employer reads this form, not the pass mark.',
    fixes: [
      { symptom: 'The case-study check stays red at two hundred words', fix: 'Words are counted on whitespace; a line of bullet dashes or a table is one word each. Write sentences.' },
      { symptom: 'The repository link is refused', fix: 'It has to start with https:// and hold no spaces; paste the address bar, not the repository name.' },
    ],
    frameworks,
  };
}

/**
 * The course with the Portfolio step appended to the task that writes the
 * capstone. Pure; a course with no plan entry comes back unchanged, and a
 * plan that names a task the course lacks is an authoring error worth a throw.
 */
export function withPortfolioStep<T extends Pick<Course, 'id' | 'tasks'>>(course: T): T {
  const plan = portfolioPlanOf(course.id);
  if (!plan) return course;
  const task = course.tasks.find((t) => t.id === plan.writtenBy);
  if (!task) throw new Error(`${course.id}: the Portfolio plan names task '${plan.writtenBy}', which the course lacks`);
  if (task.steps.some((s) => s.id === PORTFOLIO_STEP_ID)) return course;
  return { ...course, tasks: course.tasks.map((t) => (t === task ? { ...t, steps: [...t.steps, { ...portfolioStep(t.frameworks), producesDeliverable: portfolioFile(plan) }] } : t)) };
}
