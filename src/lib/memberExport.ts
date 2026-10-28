import type { SkillProfile, SkillPortfolio } from './skillProfile';
import type { CourseMetrics, PortfolioSummary } from './metrics';
import { competencyOf, type CompetencyDto } from './competency';
import { skillValidationOf, type SkillValidationDto } from './skillValidation';
import type { ValidationAnswer } from './data/types';
import type { EvidenceArtifact } from './data/types';
import type { KpiBoard } from './kpiBoard';
import type { TimingFacts } from './skillProfile';
import type { ScoreValue } from './scores';
import type { RecordCategoryCard } from './recordCard';
import type { WorkRoleDef } from './docs/workRoles';
import type { SkillsCopy } from './docs/skillsCopy';
import { MEMBER_PROFILE_SCHEMA, ONTOLOGY_VERSION } from './docs/ontology';

/**
 * R109 — the member-profile export and the credential envelope, built in one
 * place for every surface that offers them (the portfolio, the dashboard).
 * Pure: the caller hands in the rows it computed, the words off its document,
 * the timestamp and, for the credential, the origin and the digest, so this
 * module reads no clock, no window and no repository.
 *
 * The profile is `content/schemas/member-profile.schema.json`
 * (`capstone-member-profile/3` since R132: the board's scores and timing ride
 * on each course); the credential is `content/schemas/credential.schema.json`,
 * an Open Badges 3.0 envelope that carries no proof and claims none. Both stay
 * member-initiated.
 */

/** What the credential's evidence entry names: the profile a link carries. R127: the files themselves are PDFs now (`recordPdf.ts`). */
export const PROFILE_FILENAME = 'capstone-portfolio.json';

/** One course as the pages compute it; a page adds its display-only fields on top. */
export interface MemberCourseRow {
  courseId: string;
  title: string;
  /** The role's display name. */
  role: string;
  stage: number;
  capstoneFiled: boolean;
  metrics: CourseMetrics;
  skills: SkillProfile;
  artifacts: EvidenceArtifact[];
  /** Resolved by the page from this course's own document (`WORK_ROLES` is filtered per course). */
  workRoles: WorkRoleDef[];
  board: KpiBoard;
  examCode: string | null;
  /** R141: the member's validation answers on the course, so the export carries the skill validation; absent where a page has not read them. */
  validation?: ValidationAnswer[];
}

export type ExportCopy = Pick<SkillsCopy, 'exportClaim' | 'exportSchemaNote'> & { board: Pick<SkillsCopy['board'], 'issuer' | 'credentialName' | 'credentialClaim' | 'contribution'> };

export interface MemberExportInput {
  subject: string;
  copy: ExportCopy;
  pathId: string | null;
  summary: PortfolioSummary;
  skills: SkillPortfolio;
  rows: MemberCourseRow[];
  /** Passed in by the page: this module reads no clock. */
  generatedAt: string;
  /** R134: the fourteen category cards across the courses, with the tier at ten verified uses; absent where a page has not built them. */
  categories?: RecordCategoryCard[];
}

export interface MemberProfileCourse {
  courseId: string;
  title: string;
  role: string;
  stage: number;
  capstoneFiled: boolean;
  metrics: CourseMetrics;
  skills: SkillProfile;
  artifacts: EvidenceArtifact[];
  workRoles: string[];
  kpis: KpiBoard['kpis'];
  /** R132: the scores by the published method and the minutes between two recorded stamps. */
  scores: ScoreValue[];
  /** R141: the eight competency facets, a lens over the same board. */
  competency?: CompetencyDto;
  /** R141: per skill, first demonstrated, last validated, confidence, retained; absent where the page handed no answers in. */
  skillValidation?: SkillValidationDto;
  timing: TimingFacts;
}

export interface MemberProfileExport {
  schema: typeof MEMBER_PROFILE_SCHEMA;
  ontologyVersion: string;
  generatedAt: string;
  subject: { display: string };
  claim: string;
  path: string | null;
  summary: PortfolioSummary & SkillPortfolio;
  courses: MemberProfileCourse[];
  /** R134: the record by category, across the courses. */
  categories?: RecordCategoryCard[];
  signature: null;
}

export function buildMemberProfile(input: MemberExportInput): MemberProfileExport {
  return {
    schema: MEMBER_PROFILE_SCHEMA,
    ontologyVersion: ONTOLOGY_VERSION,
    generatedAt: input.generatedAt,
    subject: { display: input.subject },
    claim: input.copy.exportClaim,
    path: input.pathId,
    summary: { ...input.summary, ...input.skills },
    courses: input.rows.map((r) => ({
      courseId: r.courseId,
      title: r.title,
      role: r.role,
      stage: r.stage,
      capstoneFiled: r.capstoneFiled,
      metrics: r.metrics,
      skills: r.skills,
      artifacts: r.artifacts,
      workRoles: r.workRoles.map((w) => w.id),
      kpis: r.board.kpis,
      scores: r.board.scores,
      timing: r.board.timing,
      // R141: the facets always; the skill validation when the page handed the answers in.
      competency: competencyOf(r.board),
      ...(r.validation ? { skillValidation: skillValidationOf(r.skills, r.validation) } : {}),
    })),
    ...(input.categories ? { categories: input.categories } : {}),
    signature: null,
  };
}

/** The bytes a Download writes and the credential's digest hashes. */
export function profileJson(profile: MemberProfileExport): string {
  return JSON.stringify(profile, null, 2);
}

export interface Alignment {
  type: ['Alignment'];
  targetName: string;
  targetCode: string;
  targetFramework: string;
  targetUrl?: string;
}

export interface CredentialExport {
  '@context': string[];
  type: ['VerifiableCredential', 'OpenBadgeCredential'];
  issuer: { id: string; type: 'Profile'; name: string };
  validFrom: string;
  credentialSubject: {
    type: ['AchievementSubject'];
    achievement: {
      id: string;
      type: ['Achievement'];
      name: string;
      description: string;
      criteria: { narrative: string };
      alignment: Alignment[];
    };
    result: { type: ['Result']; resultDescription: string; value: string }[];
  };
  evidence: { type: ['Evidence']; id: string; name: string; description: string }[];
  claim: string;
}

export interface CredentialInput {
  profile: MemberProfileExport;
  rows: MemberCourseRow[];
  copy: ExportCopy;
  /** The site the credential names as issuer; the page passes `window.location.origin`. */
  origin: string;
  /** `sha256Text(profileJson(profile))`, hashed by the page. */
  digest: string;
}

const atLeastVerified = (level: string) => level === 'verified' || level === 'reviewed';

/**
 * An Open Badges 3.0 `AchievementCredential` around the profile: alignment to
 * the competencies verified, the exam domains verified and the NICE work roles
 * the courses prepare for (de-duplicated by code), one result per KPI, and the
 * profile's digest as evidence. No `proof` property, and the schema admits
 * none: unsigned by construction, and the claim says so.
 */
export function buildCredential(input: CredentialInput): CredentialExport {
  const { profile, rows, copy, origin, digest } = input;
  const alignment: Alignment[] = [
    ...rows.flatMap((r) => r.skills.rows.skills.filter((s) => atLeastVerified(s.level)).map((s): Alignment => ({ type: ['Alignment'], targetName: s.label, targetCode: s.id, targetFramework: 'capstone-ontology' }))),
    ...rows.flatMap((r) => (r.examCode ? r.skills.rows.domains.filter((d) => atLeastVerified(d.level)).map((d): Alignment => ({ type: ['Alignment'], targetName: d.label, targetCode: `${r.examCode}.${d.id}`, targetFramework: r.examCode as string })) : [])),
    ...rows.flatMap((r) => r.workRoles.map((w): Alignment => ({ type: ['Alignment'], targetName: w.label, targetCode: w.niceId ?? w.id, targetFramework: 'NICE', targetUrl: w.url }))),
  ];
  const seen = new Set<string>();
  return {
    '@context': ['https://www.w3.org/ns/credentials/v2', 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: { id: origin, type: 'Profile', name: copy.board.issuer },
    validFrom: profile.generatedAt,
    credentialSubject: {
      type: ['AchievementSubject'],
      achievement: {
        id: `${origin}/achievements/member-profile`,
        type: ['Achievement'],
        name: copy.board.credentialName,
        description: copy.board.credentialClaim,
        criteria: { narrative: copy.exportClaim },
        alignment: alignment.filter((a) => (seen.has(a.targetCode) ? false : (seen.add(a.targetCode), true))),
      },
      // R111: a team KPI says how much of it sits on the forms the member's role drafts, where that differs.
      result: rows.flatMap((r) => [
        ...r.board.kpis.map((k) => ({ type: ['Result'] as ['Result'], resultDescription: `${r.courseId} ${k.id}`, value: !k.loaded ? '—' : k.unit === 'minutes' ? `${k.value} min over ${k.of}` : `${k.value} of ${k.of}${k.contribution && (k.contribution.value !== k.value || k.contribution.of !== k.of) ? ` (${copy.board.contribution} ${k.contribution.value} of ${k.contribution.of})` : ''}` })),
        // R132: the scores, each with how many of its components it stands on.
        ...r.board.scores.map((sc) => ({ type: ['Result'] as ['Result'], resultDescription: `${r.courseId} ${sc.id}`, value: !sc.loaded ? '—' : `${sc.value} of 100 (${sc.counted} of ${sc.of} components)` })),
      ]).concat(
        // R134: the record by category, across the courses: the tier and the verified uses behind it.
        (profile.categories ?? []).map((c) => ({ type: ['Result'] as ['Result'], resultDescription: `record ${c.id}`, value: `${c.tier}: ${c.verifiedUses} verified uses of ${c.threshold}` }))
      ),
    },
    evidence: [{ type: ['Evidence'], id: `sha256:${digest}`, name: PROFILE_FILENAME, description: copy.exportSchemaNote }],
    claim: copy.board.credentialClaim,
  };
}
