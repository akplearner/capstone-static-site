import type { Dimension } from './metricCatalogue';

/**
 * R107 — every sentence the skills surfaces print: the Home card, the
 * dashboard strip, the portfolio sections and the export's claim. One
 * module, every course, so the three renderers and the sheet say the same
 * thing and the content-integrity budgets (twenty-five words a sentence, the
 * register) hold them.
 */

export type SkillLevel = 'not-started' | 'practised' | 'verified' | 'reviewed';

export const DIMENSION_LABEL: Record<Dimension, string> = {
  skills: 'Skills',
  tools: 'Tools',
  procedures: 'Procedures',
  tactics: 'Tactics',
  practices: 'Practices',
  standards: 'Standards',
  domains: 'Exam domains',
  evidence: 'Evidence',
  documentation: 'Documentation',
  collaboration: 'Collaboration',
  ability: 'Ability',
};

const LEVELS: Record<SkillLevel, string> = {
  'not-started': 'Not started',
  practised: 'Practised',
  verified: 'Verified from output',
  reviewed: 'Team document approved',
};

/** What each level means per dimension, so a team fact is never read as a personal one. */
export const LEVEL_LABEL: Record<Dimension, Record<SkillLevel, string>> = {
  skills: LEVELS,
  tools: { ...LEVELS, practised: 'Used', verified: 'Used on a verified step' },
  procedures: { 'not-started': 'Not started', practised: 'Started', verified: 'Followed, checks met', reviewed: 'Approved by the team' },
  tactics: { ...LEVELS, practised: 'Practised or defended' },
  practices: LEVELS,
  standards: { ...LEVELS, practised: 'Tagged on ticked work', verified: 'Tagged on verified output', reviewed: 'Cited by an approved form' },
  domains: LEVELS,
  evidence: LEVELS,
  documentation: { 'not-started': 'Not started', practised: 'Drafted', verified: 'Checks met', reviewed: 'Approved' },
  collaboration: LEVELS,
  ability: LEVELS,
};

export const SKILLS_COPY = {
  cardTitle: 'Skills',
  cardIntro: 'What this course has recorded for this member: exam domains, skills, tools, procedures and standards.',
  denominator: 'Counted over required steps of graded weeks the member ticked.',
  domainsHeading: 'Exam domains',
  domainColumns: ['Domain', 'Practised', 'Verified', 'Next task'] as string[],
  noTactics: 'Adversary tactics are not part of this course.',
  teamFact: 'A team document approved counts for every member of the team.',
  verifiedMeans: 'Verified means the pasted output held every expected token; it does not prove the lab state.',
  selfAttested: 'Ticked without matching output.',
  nextGap: 'Next task that closes a gap',
  noSpeed: 'Nothing here measures how fast the work was done.',
  loadedLater: 'Team facts load on the course page.',
  emptyDimension: 'Nothing recorded yet.',
  artifactsApprox: 'Files are counted per form and week, not per task.',
  procedureFollowed: 'Followed means every check due was met and the document-control block is complete.',
  procedureApproved: 'Approved means the team approved or issued the document.',
  standardsEffectiveness: 'Per standard: verified steps, approved forms and followed procedures that cite it.',
  abilityIntro: 'Indicators, not scores: first-try beside persistence, partial progress, investigation, consistency.',
  exportClaim: 'This export lists steps the member ticked and verified, hashes of outputs and files, and documents the team filed. It is unsigned.',
  exportSchemaNote: 'The shape is published as content/schemas/member-profile.schema.json.',
  portfolioSections: {
    skills: 'Skills proved',
    tools: 'Tools used',
    procedures: 'Procedures followed to standard',
    standards: 'Standards practised',
    domains: 'Exam domains',
    tactics: 'Tactics and practices',
  },
  dashboardSection: 'Skills by course',
  tiles: { skillsVerified: 'Skills verified', toolsUsed: 'Tools used' },
};
