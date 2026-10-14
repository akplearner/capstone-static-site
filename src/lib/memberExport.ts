import type { SkillProfile, SkillPortfolio } from './skillProfile';
import type { CourseMetrics, PortfolioSummary } from './metrics';
import type { EvidenceArtifact } from './data/types';
import type { KpiBoard } from './kpiBoard';
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
 * The profile is `content/schemas/member-profile.schema.json`; the credential
 * is `content/schemas/credential.schema.json`, an Open Badges 3.0 envelope
 * that carries no proof and claims none. Both stay member-initiated.
 */

export const PROFILE_FILENAME = 'capstone-portfolio.json';
export const CREDENTIAL_FILENAME = 'capstone-credential.json';

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
}

export type ExportCopy = Pick<SkillsCopy, 'exportClaim' | 'exportSchemaNote'> & { board: Pick<SkillsCopy['board'], 'issuer' | 'credentialName' | 'credentialClaim'> };

export interface MemberExportInput {
  subject: string;
  copy: ExportCopy;
  pathId: string | null;
  summary: PortfolioSummary;
  skills: SkillPortfolio;
  rows: MemberCourseRow[];
  /** Passed in by the page: this module reads no clock. */
  generatedAt: string;
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
    })),
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
      result: rows.flatMap((r) => r.board.kpis.map((k) => ({ type: ['Result'] as ['Result'], resultDescription: `${r.courseId} ${k.id}`, value: k.loaded ? `${k.value} of ${k.of}` : '—' }))),
    },
    evidence: [{ type: ['Evidence'], id: `sha256:${digest}`, name: PROFILE_FILENAME, description: copy.exportSchemaNote }],
    claim: copy.board.credentialClaim,
  };
}
