import type { ProfileRow, SkillProfile } from './skillProfile';
import type { MemberProfileCourse, MemberProfileExport } from './memberExport';
import type { SkillsContent } from './content/read';
import type { CertDef } from './docs/certs';
import { SHARE_MAX_BYTES } from '../../supabase/functions/_shared/shareGuard';

/**
 * R124 — the copy a candidate link serves, built to fit.
 *
 * A link holds a frozen copy of the member's portfolio export, and the `share` function refuses a
 * copy over 256 KB (`SHARE_MAX_BYTES`). The export was never built to be shared: it carries every
 * row of every course, reached or not, each with some twenty counters, plus the member's own
 * gaps and raw indicators. One large course came to 100 KB and the thirteen to 525 KB, so a member
 * with four courses could not make a link at all, whatever they had done.
 *
 * The copy keeps what a reader of a link uses and drops what only the member's own pages need:
 *  - a row carries its id and level, and only the seven counters a reader uses that are not zero;
 *  - a row the member has not reached stays as id and level (the denominator survives, the twenty
 *    zeros do not);
 *  - R130: a row's dimension, label and references are NOT in the copy. The reader has the published
 *    ontology (every course document ships with the app), so `hydrateShareCourse` puts them back by
 *    id; the ontology deprecates and never removes an id, so an old link still resolves. A standards
 *    row keeps its references, because those are the codes the member's own forms cited. A copy from
 *    before this round carries labels, and the reader keeps them;
 *  - the member's gaps, their raw indicators (the KPIs carry the board), the mapped task and form
 *    ids and the "next task" hint stay out: they are for the member, not for a reader;
 *  - the member chooses the courses, and the dialog shows the size before the click.
 *
 * It is still the member profile (`capstone-member-profile/3` since R132) with `signature: null`: the published schema allows a row
 * to omit its dimension, label and a zero counter and a course to omit gaps and indicators, and says
 * so. Pure: no clock, no store, no window.
 */

/**
 * The counters a row keeps when they are not zero: how much of the mapped work was ticked and
 * verified, over how many tasks, with how many hashed files and how many approved forms. The rest
 * (tasks exercised or done, self-attested, in order, form control, drafts) feed the member's own
 * pages and the KPIs, which the copy carries already computed.
 */
const COUNTERS = ['tickedSteps', 'requiredSteps', 'verifiableSteps', 'verifiedSteps', 'verifiedTasks', 'artifacts', 'deliverablesApproved', 'uses', 'successes'] as const;

/** R132: the dimensions whose rows are facts rather than registry ids, so a reader has no ontology to put the words back from. */
const FACT_DIMENSIONS = new Set(['troubleshooting', 'decisions', 'execution']);

export type ShareRow = Pick<ProfileRow, 'id' | 'level'> &
  Partial<Pick<ProfileRow, 'dimension' | 'label' | (typeof COUNTERS)[number] | 'standardRefs' | 'lastVerifiedAt' | 'firstVerifiedAt' | 'current' | 'retained'>>;

export interface ShareSkillProfile {
  courseId: string;
  role: string;
  denominator: string;
  rows: Record<string, ShareRow[]>;
  loaded: SkillProfile['loaded'];
  draftedForms: string[];
}

/** R132: a KPI as a link carries it: the registry fields (family, metric, unit, scored) come back from the ontology by id. */
export type ShareKpi = Pick<MemberProfileCourse['kpis'][number], 'id' | 'value' | 'of' | 'pct' | 'loaded' | 'fact' | 'beside' | 'contribution'> & Partial<Pick<MemberProfileCourse['kpis'][number], 'family' | 'metricId' | 'unit' | 'scored'>>;
/** R132: a score as a link carries it: the value and what it stands on; the components come back from the published weights and the KPIs. */
export type ShareScore = Pick<MemberProfileCourse['scores'][number], 'id' | 'value' | 'counted' | 'of' | 'loaded'> & Partial<Pick<MemberProfileCourse['scores'][number], 'components'>>;

/** R141: a facet as a link carries it: the figure, not the words or the components. */
export type ShareFacet = Pick<NonNullable<MemberProfileCourse['competency']>['facets'][number], 'id' | 'value' | 'counted' | 'of' | 'loaded'>;
export type ShareCompetency = Omit<NonNullable<MemberProfileCourse['competency']>, 'facets'> & { facets: ShareFacet[] };

export type ShareCourse = Omit<MemberProfileCourse, 'skills' | 'kpis' | 'scores' | 'competency' | 'skillValidation'> & { skills: ShareSkillProfile; kpis: ShareKpi[]; scores: ShareScore[]; competency?: ShareCompetency };

export interface ShareProfile extends Omit<MemberProfileExport, 'courses'> {
  courses: ShareCourse[];
}

/** One row as a link carries it. */
export function shareRow(r: ProfileRow): ShareRow {
  const out: ShareRow = { id: r.id, level: r.level };
  // R132: a fact row's label is its own (a form's table, a decision block's title): no registry holds it.
  if (FACT_DIMENSIONS.has(r.dimension)) out.label = r.label;
  if (r.level === 'not-started') return out;
  // Only a standards row's references are the member's own (the codes their forms cited); every
  // other dimension's references are the registry's and come back from it.
  if (r.dimension === 'standards' && r.standardRefs?.length) out.standardRefs = r.standardRefs;
  for (const k of COUNTERS) if (r[k]) out[k] = r[k];
  if (r.lastVerifiedAt) out.lastVerifiedAt = r.lastVerifiedAt;
  if (r.current !== undefined) out.current = r.current;
  // R132: the first stamp stays out; `retained` is the fact a reader uses, and it is carried only when true.
  if (r.retained) out.retained = true;
  return out;
}

/** R132: rows a reader can derive: retention from the skills rows' stamps, execution from the KPIs. */
const DERIVABLE_DIMENSIONS = new Set(['retention', 'execution']);

export function shareCourse(c: MemberProfileCourse): ShareCourse {
  const rows: Record<string, ShareRow[]> = {};
  for (const [dimension, list] of Object.entries(c.skills.rows)) rows[dimension] = DERIVABLE_DIMENSIONS.has(dimension) ? [] : list.map(shareRow);
  // R141: a link's copy keeps the facets as eight small rows (the reader restores the words and the
  // components from the registry) and leaves the per-skill validation out.
  const { skillValidation: _skillValidation, competency, ...rest } = c;
  void _skillValidation;
  return {
    ...rest,
    ...(competency ? { competency: { ...competency, facets: competency.facets.map((f) => ({ id: f.id, value: f.value, counted: f.counted, of: f.of, loaded: f.loaded })) } } : {}),
    skills: { courseId: c.skills.courseId, role: c.skills.role, denominator: c.skills.denominator, rows, loaded: c.skills.loaded, draftedForms: c.skills.draftedForms },
    kpis: c.kpis.map((k) => ({ id: k.id, value: k.value, of: k.of, pct: k.pct, loaded: k.loaded, fact: k.fact, ...(k.beside ? { beside: k.beside } : {}), ...(k.contribution ? { contribution: k.contribution } : {}) })),
    scores: c.scores.map((sc) => ({ id: sc.id, value: sc.value, counted: sc.counted, of: sc.of, loaded: sc.loaded })),
  };
}

/**
 * The profile as a link carries it. `courseIds` chooses the courses (omitted: all of them); the
 * summary is the one the full profile computed, so the figures a reader sees are the member's own
 * and the course list says which courses stand behind them.
 */
export function shareProfileCopy(profile: MemberProfileExport, courseIds?: readonly string[]): ShareProfile {
  const keep = courseIds ? new Set(courseIds) : null;
  return { ...profile, courses: profile.courses.filter((c) => !keep || keep.has(c.courseId)).map(shareCourse) };
}

/** The registries a reader resolves a row's words from: the course document's skills section and its certification. */
export type ShareRegistry = Pick<SkillsContent, 'SKILLS' | 'TOOLS' | 'SOPS' | 'TACTICS' | 'PRACTICES' | 'STANDARDS'>;

/** A row as the reader shows it: its dimension, label and references back, from the ontology by id. */
export type HydratedShareRow = ShareRow & Pick<ProfileRow, 'dimension' | 'label'>;

/**
 * R130 — put the words back on a copy's rows from the published ontology. A row that carries its
 * own label (a copy from before this round) keeps it; a row whose id the registry no longer knows
 * is shown under its id rather than dropped, because the level and the counters are still the
 * member's. Pure.
 */
export function hydrateShareCourse(skills: ShareSkillProfile, registry: ShareRegistry, cert: CertDef | null): ShareSkillProfile & { rows: Record<string, HydratedShareRow[]> } {
  const words = new Map<string, { label: string; refs?: string[] }>();
  for (const n of registry.SKILLS) words.set(`skills:${n.id}`, { label: n.label, refs: n.objectiveRefs });
  for (const t of registry.TOOLS) words.set(`tools:${t.id}`, { label: t.label });
  for (const s of registry.SOPS) words.set(`procedures:${s.id}`, { label: s.label, refs: s.standardRefs });
  for (const t of registry.TACTICS) words.set(`tactics:${t.id}`, { label: t.label });
  for (const p of registry.PRACTICES) words.set(`practices:${p.id}`, { label: p.label, refs: [p.anchor] });
  for (const s of registry.STANDARDS) words.set(`standards:${s.id}`, { label: s.label });
  for (const d of cert?.domains ?? []) words.set(`domains:${d.id}`, { label: d.name });
  // R132: a retention row is a skill, by id.
  for (const n of registry.SKILLS) words.set(`retention:${n.id}`, { label: n.label });
  const rows: Record<string, HydratedShareRow[]> = {};
  for (const [dimension, list] of Object.entries(skills.rows)) {
    rows[dimension] = list.map((r) => {
      const w = words.get(`${dimension}:${r.id}`);
      const out: HydratedShareRow = { ...r, dimension: (r.dimension ?? dimension) as ProfileRow['dimension'], label: r.label ?? w?.label ?? r.id };
      if (!out.standardRefs && w?.refs?.length && r.level !== 'not-started') out.standardRefs = w.refs;
      return out;
    });
  }
  return { ...skills, rows };
}

/** The bytes the share function counts: the copy as compact JSON, as UTF-8. */
export function copyBytes(copy: unknown): number {
  return new TextEncoder().encode(JSON.stringify(copy)).length;
}

export const SHARE_LIMIT_BYTES = SHARE_MAX_BYTES;

/** "143 KB", at least 1: sizes are shown whole, because a limit measured in bytes helps nobody. */
export function kb(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** What each course comes to on its own, in bytes, by course id: the sizes the dialog lists beside each course. */
export function courseSizes(build: (courseIds?: readonly string[]) => unknown, courseIds: readonly string[]): Record<string, number> {
  const byCourse: Record<string, number> = {};
  for (const id of courseIds) byCourse[id] = copyBytes(build([id]));
  return byCourse;
}
