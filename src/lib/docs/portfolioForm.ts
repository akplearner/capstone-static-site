import type { Column } from '../grc/templates';
import { PORTFOLIO_PLAN, PORTFOLIO_TITLE, portfolioFile, portfolioId, type PortfolioPlanEntry } from './portfolioPlan';
import type { DeliverableData, DeliverableDef, Field } from './types';

/**
 * R142 — the Portfolio form, built once and placed in every course.
 *
 * What an employer asks of a graduate is not the pass mark but what they
 * built: a repository to read, a case study to follow, resume bullets to
 * check and a diagram to argue with. The Portfolio is that record, filled by
 * the whole team in the last graded week and fed into the capstone, so the
 * capstone is defended with the portfolio beside it. The case study has to
 * run two hundred words or more (a Definition-of-Done check, not a hint), and
 * the repository has to be a link.
 *
 * The form carries the same document-control block every form carries, so
 * the Document-control KPI reads it like any other. `portfolioOf` reads a
 * team's Portfolio back as one typed record for the member export.
 */

/** The case study is two hundred words or more: 199 words each followed by whitespace, then one more. */
export const CASE_STUDY_WORDS = 200;
export const CASE_STUDY_PATTERN = String.raw`^\s*(\S+\s+){199,}\S+`;
export const REPO_URL_PATTERN = String.raw`^https?://\S+$`;

const c = (field: string, label: string, type: Column['type'], extra: Partial<Column> = {}): Column => ({ field, label, type, ...extra });

const CONTROL: Field[] = [
  { field: 'doc_id', label: 'Document ID', type: 'text', required: true, placeholder: 'CAP-PF-001' },
  { field: 'version', label: 'Version', type: 'text', required: true, placeholder: '1.0' },
  { field: 'doc_owner', label: 'Owner', type: 'text', required: true, placeholder: 'The role that drafts it, and a name' },
  { field: 'doc_date', label: 'Date', type: 'date', required: true },
  { field: 'doc_status', label: 'Status', type: 'select', options: ['Draft', 'In review', 'Approved', 'Issued'], required: true },
];

export function portfolioForm(p: PortfolioPlanEntry): DeliverableDef {
  const handoff = p.raci.approves !== p.raci.drafts ? { handoff: { to: p.raci.approves, when: 'approved' as const } } : {};
  return {
    id: portfolioId(p),
    courseId: p.courseId,
    num: p.num,
    file: portfolioFile(p),
    title: PORTFOLIO_TITLE,
    owner: p.raci.drafts,
    shared: true,
    portfolio: true,
    folder: 'Portfolio',
    standard: 'Architecture description · ISO/IEC/IEEE 42010 · NIST SP 800-53 PL-2',
    weeks: [p.week],
    kind: 'template',
    exportFormat: 'md',
    feeds: [p.capstone],
    raci: p.raci,
    ...handoff,
    purpose: `What the team can show for ${p.project}: the repository, a case study, three resume bullets, the architecture diagram and the skills demonstrated.`,
    howTo: 'Every member fills it. Paste the repository link, write the case study in two hundred words or more, write three resume bullets, name the diagram and list the skills with their evidence.',
    buildSteps: [
      'Repository: the team repository that holds the configuration, the scripts and the documents, with a README that opens on the diagram.',
      'Case study: the problem the client had, what was built, the decisions taken and why, the result and what is still open.',
      'Resume bullets: an action verb, the tool, the scale and a measurable result, one line each.',
      'Diagram: the course picture or a file the team drew, hashed in the evidence log, that the case study refers to.',
      'Skills: one row per skill demonstrated, with the step, form or file that is the evidence.',
    ],
    meaning: 'A stranger reads the case study, opens the repository, checks a bullet against the evidence and finds them consistent.',
    useIt: 'The capstone is defended with the Portfolio beside it; the member export and a candidate link carry the repository and the bullets.',
    pitfalls: ['A case study under two hundred words: the check fails until it is a story, not a caption.', 'A bullet with no number in it.', 'A repository link nobody outside the team can open.'],
    sections: [
      { kind: 'fields', title: 'Document control', fields: CONTROL },
      {
        kind: 'fields',
        title: 'The project',
        fields: [
          { field: 'repo_url', label: 'Repository', type: 'text', required: true, placeholder: 'https://github.com/org/capstone-team01', help: 'The link a reader opens first. Public, or shared with the instructor.' },
          { field: 'case_study', label: 'Case study', type: 'area', required: true, placeholder: `The client needed ${p.project}. The team …`, help: 'Two hundred words or more: the problem, what was built, the decisions and why, the result, what is still open.' },
          { field: 'diagram_ref', label: 'Architecture diagram', type: 'text', required: true, placeholder: 'The course picture, or 20261030_Team01_architecture.png', help: 'What the case study refers to when it says "the diagram".' },
        ],
      },
      {
        kind: 'fields',
        title: 'Resume bullets',
        fields: [
          { field: 'resume_1', label: 'Bullet one', type: 'text', required: true, placeholder: 'Built and hardened two servers to a CIS baseline; closed 14 of 15 findings in four weeks.' },
          { field: 'resume_2', label: 'Bullet two', type: 'text', required: true, placeholder: 'Wrote the incident runbook and ran a live containment in under eleven minutes.' },
          { field: 'resume_3', label: 'Bullet three', type: 'text', required: true, placeholder: 'Documented the architecture and the risk register a receiving team ran from on day one.' },
        ],
      },
      {
        kind: 'group',
        group: {
          group: 'skills_demonstrated',
          label: 'Skills demonstrated',
          help: 'One row per skill, with the evidence that proves it and where that evidence sits.',
          columns: [
            c('skill', 'Skill', 'text', { placeholder: 'Host hardening to a benchmark' }),
            c('evidence', 'Evidence', 'text', { placeholder: 'Hardening Baseline, 12 controls done; ufw status output' }),
            c('where', 'Where', 'text', { placeholder: 'Week 2 · Deliverables · Hardening Baseline' }),
          ],
          seed: [{ skill: 'Host hardening to a benchmark', evidence: 'Hardening Baseline, 12 controls done; ufw status output', where: 'Week 2 · Deliverables · Hardening Baseline' }],
        },
      },
    ],
    dod: [
      { label: 'Document control is complete', when: { fields: ['doc_id', 'version', 'doc_owner', 'doc_date', 'doc_status'] } },
      { label: 'The repository is a link', when: { field: 'repo_url', matches: REPO_URL_PATTERN } },
      { label: 'The case study runs two hundred words or more', when: { field: 'case_study', matches: CASE_STUDY_PATTERN } },
      { label: 'Three resume bullets and the diagram are written', when: { fields: ['resume_1', 'resume_2', 'resume_3', 'diagram_ref'] } },
      { label: 'At least three skills with their evidence', when: { group: 'skills_demonstrated', where: { filled: ['skill', 'evidence'] }, atLeast: 3 } },
    ],
    checks: [
      { field: 'repo_url', rule: 'pattern', value: REPO_URL_PATTERN, hint: 'A link that starts with https://' },
      { field: 'case_study', rule: 'pattern', value: CASE_STUDY_PATTERN, hint: 'Two hundred words or more' },
    ],
  };
}

/** Every course's Portfolio, from the plan. */
export const PORTFOLIO_FORMS: DeliverableDef[] = PORTFOLIO_PLAN.map(portfolioForm);

/** The words in a text, as the check counts them. */
export function wordCount(text: string | undefined): number {
  return (text ?? '').trim().split(/\s+/).filter(Boolean).length;
}

/** A team's Portfolio, read back as one record. */
export interface PortfolioRecord {
  formId: string;
  repoUrl: string;
  caseStudy: string;
  caseStudyWords: number;
  /** True once the case study runs two hundred words or more. */
  complete: boolean;
  bullets: string[];
  diagramRef: string;
  skills: { skill: string; evidence: string; where: string }[];
}

/**
 * The Portfolio of a team, or null when the course has none or nothing was
 * written. Reads the saved data by the course's Portfolio definition, so a
 * renamed field is caught here rather than in an export.
 */
export function portfolioOf(docs: Record<string, DeliverableData | undefined>, defs: Pick<DeliverableDef, 'id' | 'portfolio'>[]): PortfolioRecord | null {
  const def = defs.find((d) => d.portfolio);
  const data = def ? docs[def.id] : undefined;
  if (!def || !data) return null;
  const f = data.fields;
  const bullets = [f.resume_1, f.resume_2, f.resume_3].map((b) => (b ?? '').trim()).filter(Boolean);
  const skills = (data.groups.skills_demonstrated ?? []).map((r) => ({ skill: r.skill ?? '', evidence: r.evidence ?? '', where: r.where ?? '' })).filter((r) => r.skill.trim());
  const caseStudy = (f.case_study ?? '').trim();
  const repoUrl = (f.repo_url ?? '').trim();
  if (!repoUrl && !caseStudy && bullets.length === 0 && skills.length === 0) return null;
  const words = wordCount(caseStudy);
  return { formId: def.id, repoUrl, caseStudy, caseStudyWords: words, complete: words >= CASE_STUDY_WORDS, bullets, diagramRef: (f.diagram_ref ?? '').trim(), skills };
}
