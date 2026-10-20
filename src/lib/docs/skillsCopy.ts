import type { Dimension } from './metricCatalogue';
import type { KpiFamily } from './kpis';

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

export type BoardCopy = (typeof SKILLS_COPY)['board'];
export type SkillsCopy = typeof SKILLS_COPY;

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
  inCourse: 'in this course',
  abilityLabels: {
    firstTry: 'First-try verifications',
    persistence: 'Verified after more than one paste',
    partialProgress: 'Partial progress',
    evidenceNaming: 'Files named to convention',
    activeDays: 'Active days',
    activeWeeks: 'Active weeks',
    reportsFiled: 'Reports filed',
    reportsResolved: 'Reports resolved',
    notesWritten: 'Notes written',
    drafted: 'Forms drafted',
    reviewed: 'Forms reviewed',
    issued: 'Forms issued',
    submissionsFrozen: 'Submissions frozen',
    rubricAllGreen: 'Submissions rubric-green',
    dodMet: 'Checks met',
    teammateStepsTicked: 'Teammate steps ticked',
    handoffsCompleted: 'Hand-offs completed',
    peerReviewsGiven: 'Peer reviews given',
    inOrder: 'Steps verified in order',
    commandSteps: 'Command steps verified',
    controlsCited: 'Controls cited',
    docControl: 'Document control complete',
    instructorApproved: 'Instructor approved',
    raciRespected: 'Moves made in the RACI role',
    receipted: 'Verified steps receipted',
    rehashConfirmed: 'Files re-hashed unchanged',
  } as Record<string, string>,
  skillsByCourse: 'skills verified',
  recordSkills: 'of practised',
  recordTools: 'tools used',
  /** R109: the dashboard's two cross-course KPI totals. */
  recordCommands: 'checkable command steps',
  recordProcedures: 'procedures followed',
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
  /** R127: the words of the PDF export that are sentences. */
  pdf: {
    claim: 'This summary lists what the member ticked, verified and filed, and the issues the member reported.',
    unsigned: 'It is unsigned: it records checks made in the browser and receipts of stamps, not proof of the machine.',
  },
  dashboardSection: 'Skills by course',
  tiles: { skillsVerified: 'Skills verified', toolsUsed: 'Tools used', kpiBoard: 'Skill board', commandsVerified: 'Commands verified', proceduresToStandard: 'Procedures to standard' },
  /** R108: the Skill board page, its tiles, the constellation, the cohort report. */
  board: {
    title: 'Skill board',
    lede: 'Sixteen numbers this course keeps for this member, each counted over facts that exist, and the competencies lit by level.',
    familiesHeading: 'Four families of four',
    audience: { student: 'Student', hiring: 'Hiring', agent: 'Agent' },
    factOwn: 'Own fact: ticks, pastes and hashes by this member.',
    factTeam: 'Team fact: a document the team filled, approved or issued.',
    factContent: 'Content fact: read from the course and the registries.',
    notLoaded: 'Team facts load on the course page.',
    replay: 'Replay',
    measuredAgainst: 'Measured against',
    importProfile: 'Import a profile file',
    importFailed: 'The file is not an environment profile',
    untaught: 'not taught by this course',
    workRole: 'Roles this course prepares for',
    heroUnit: 'skills verified',
    perTool: 'Verified steps on the tasks that use each tool',
    credentialName: 'Capstone member profile',
    issuer: 'Capstone Labs',
    jsonCaption: 'The same sixteen as the capstone-kpi-board/1 document an agent reads.',
    schemaNote: 'The shape is published as content/schemas/kpi-board.schema.json.',
    copyJson: 'Copy JSON',
    mapTitle: 'Competency map',
    mapHowToRead: 'One star per competency this role practises, grouped by area; brighter means verified, a ring means the team approved the document.',
    mapIdle: 'Hover or focus a star to read it.',
    weeksLabel: 'Weeks cleared',
    tableTitle: 'The sixteen, as a table',
    nextTask: 'Next task',
    /** R114: a candidate link to a frozen copy of the export. */
    createLink: 'Create link',
    credentialClaim: 'An Open Badges 3.0 envelope around the member profile, unsigned: it carries no proof and claims none.',
    cohortTitle: 'KPI bands per cohort',
    cohortLede: 'Counts per band for the members shown; nobody is ranked; team facts are judged through the review week.',
    cohortColumns: ['KPI', 'Family', 'Fact', 'Members', 'Not started', 'In progress', 'Complete', 'No denominator', 'Sum'] as string[],
    bands: { notStarted: 'Not started', inProgress: 'In progress', complete: 'Complete', noDenominator: 'No denominator' },
    /** R109: the KPI pack on the Home card and the dashboard card, and the DTO chip beside it. */
    packTitle: 'Sixteen KPIs',
    packIdle: 'Hover or focus a socket to read it.',
    packKeys: 'Arrow keys move between sockets. Enter pins the read-out.',
    download: 'Download PDF',
    /** R111: the role's own share of a team fact, and a row's currency. */
    contribution: 'drafted by this role',
    contributionColumn: 'Drafted by this role',
    lastVerified: 'Last verified',
    current: 'current',
    stale: 'verified earlier',
    familyShort: { ability: 'Ability', execution: 'Execution', procedure: 'Procedure', outcome: 'Outcome' } as Record<KpiFamily, string>,
  },
};
