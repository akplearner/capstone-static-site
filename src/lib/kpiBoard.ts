import type { ProfileRow, SkillProfile, TimingFacts } from './skillProfile';
import { levelRank } from './skillProfile';
import type { CertContent, SkillsContent } from './content/read';
import type { KpiDef, KpiFact, KpiFamily, KpiUnit } from './docs/kpis';
import type { WorkRoleDef } from './docs/workRoles';
import type { EnvironmentProfile } from './docs/environmentProfile';
import { scoreValues, type ScoreValue } from './scores';

/**
 * R108 — the KPI board: the numbers read off one member's skill profile, each
 * a ratio of counts the registry (`content.skills.KPIS`) defines, with the
 * kind of fact it reads and whether that fact was handed in.
 *
 * R132 — `capstone-kpi-board/3` since R140: eight families of four (thirty-two KPIs),
 * seven scores computed by the published method (`content.skills.SCORING`,
 * `scores.ts`) and the timing block (minutes between two recorded stamps). A
 * pure projection: no clock is read (the profile carries the stamps and the
 * page's `asOf`), a team fact is labelled as one, a number whose facts were
 * not loaded says so rather than printing zero as if it were measured, and
 * nothing orders one member against another.
 *
 * "Measured against" is a work role (the nodes of its competency areas) or
 * an environment profile (the competencies it requires); the coverage tile
 * prints how many of the required competencies this course does not teach,
 * so a low fraction reads as a gap in the syllabus, never as a failure.
 */

export const KPI_BOARD_SCHEMA = 'capstone-kpi-board/3';

export interface MeasureAgainst {
  kind: 'work-role' | 'profile';
  id: string;
  label: string;
  /** `SKILLS` ids. */
  requiredCompetencies: string[];
}

export interface KpiValue {
  id: string;
  family: KpiFamily;
  metricId: string;
  /** ratio and count: a count; minutes: the median minutes. */
  value: number;
  /** ratio: the denominator; count: 0; minutes: the steps timed. */
  of: number;
  /** 0..100; 0 when there is no denominator. For minutes: the share of timed steps resolved within the hour. */
  pct: number;
  unit: KpiUnit;
  /** R132: a published score reads this row. */
  scored: boolean;
  /** False when the fact behind it was not handed in (team facts load on the course page). */
  loaded: boolean;
  /**
   * R137: false when the row is loaded and there is nothing to measure: `notMeasured` says whether this
   * course gives this role nothing here (`role`: the KPI is not measured in this course for this role) or
   * there is simply nothing to count yet (`yet`). A count is always measured. A score skips the row either way.
   */
  applies: boolean;
  notMeasured?: 'role' | 'yet';
  fact: KpiFact;
  /** First-try is never shown alone: persistence rides beside it. */
  beside?: { value: number; of: number };
  /**
   * R111, on the seven attributable team KPIs (P1 to P4, O1 to O3): the same
   * count on the forms the member's role drafts. Controls cited, rubric green
   * and handoffs already count only the role's forms, the member's own
   * submissions and the member's own tasks, so there it equals the value.
   * Capstone filed is the whole team's and carries none.
   */
  contribution?: { value: number; of: number };
}

export interface KpiBoard {
  schema: typeof KPI_BOARD_SCHEMA;
  ontologyVersion: string;
  courseId: string;
  role: string;
  /** The work roles this course role prepares for, by id. */
  workRoles: string[];
  measuredAgainst: { kind: MeasureAgainst['kind']; id: string; label: string; required: number; untaught: number };
  families: { id: KpiFamily; label: string }[];
  /** Exactly thirty-two (since R140), in registry order. */
  kpis: KpiValue[];
  /** R132: the scores (seven since R140), in registry order, each with its components. */
  scores: ScoreValue[];
  /** R132: minutes between two recorded stamps per verified step. */
  timing: TimingFacts;
}

export interface KpiBoardInput {
  profile: SkillProfile;
  registry: Pick<SkillsContent, 'KPIS' | 'KPI_FAMILIES' | 'CONTROL_OF' | 'WORK_ROLE_OF' | 'SCORING'>;
  cert: Pick<CertContent, 'CERT'>;
  measure: MeasureAgainst;
  /** From `isCapstoneFiled` and `deriveCrewProgress`; team facts. */
  outcome: { capstoneFiled: boolean; weeksCleared: number; weeksTotal: number };
  ontologyVersion: string;
}

const VERIFIED = levelRank('verified');
const atLeastVerified = (r: ProfileRow) => levelRank(r.level) >= VERIFIED;
const pctOf = (value: number, of: number) => (of > 0 ? Math.round((100 * value) / of) : 0);

/** Required competencies at verified or better, over required; and how many the course never taught this role. */
export function profileCoverage(required: string[], rows: ProfileRow[]): { value: number; of: number; untaught: number } {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ids = [...new Set(required)];
  let value = 0;
  let untaught = 0;
  for (const id of ids) {
    const row = byId.get(id);
    if (!row) untaught += 1;
    else if (atLeastVerified(row)) value += 1;
  }
  return { value, of: ids.length, untaught };
}

export function workRoleMeasure(role: WorkRoleDef): MeasureAgainst {
  return { kind: 'work-role', id: role.id, label: role.label, requiredCompetencies: [...role.requiredCompetencies] };
}

/** A profile's requirements for the given work roles; every requirement when none of them appears in the profile. */
export function profileMeasure(profile: EnvironmentProfile, workRoleIds: string[]): MeasureAgainst {
  const mine = profile.workRoles.filter((w) => workRoleIds.includes(w.workRole));
  const picked = mine.length ? mine : profile.workRoles;
  return { kind: 'profile', id: profile.id, label: profile.name, requiredCompetencies: [...new Set(picked.flatMap((w) => w.requiredCompetencies))].sort() };
}

export function kpiBoard(input: KpiBoardInput): KpiBoard {
  const { profile, registry, cert, measure } = input;
  const { rows, abilities } = profile;
  const team = profile.loaded.team;
  const skills = rows.skills;
  const weightOf = new Map((cert.CERT?.domains ?? []).map((d) => [d.id, d.weight]));
  const practisedDomains = rows.domains.filter((r) => r.tasks.length > 0);
  const coverage = profileCoverage(measure.requiredCompetencies, skills);
  const indicator = (i: { value: number; of?: number; loaded: boolean; offered?: number }) => ({ value: i.value, of: i.of ?? 0, loaded: i.loaded, ...(i.offered !== undefined ? { offered: i.offered } : {}) });
  const citing = (r: ProfileRow) => r.deliverables.some((id) => (registry.CONTROL_OF[id] ?? []).length > 0);

  // R111: the role's own share of each attributable team fact.
  const drafted = new Set(profile.draftedForms ?? []);
  const ownRow = (r: ProfileRow) => r.deliverables.some((id) => drafted.has(id));
  const same = (i: { value: number; of?: number }) => ({ value: i.value, of: i.of ?? 0 });
  const ownOf = (i: { value: number; of?: number; own?: { value: number; of: number } }) => i.own ?? same(i);
  // R137: a skill has an evidence path when a checkable step or a mapped form can raise it; only those sit in
  // the denominator, and only those count in the numerator, so the percentage cannot pass one hundred.
  const evidenced = (r: ProfileRow) => r.verifiableSteps > 0 || r.deliverables.length > 0;
  const evidencedSkills = skills.filter(evidenced);
  const values: Record<string, { value: number; of: number; loaded: boolean; offered?: number; notMeasured?: 'yet'; pct?: number; beside?: { value: number; of: number }; contribution?: { value: number; of: number } }> = {
    // ── technical ──
    'kpi.technical.skills-verified': { value: evidencedSkills.filter(atLeastVerified).length, of: evidencedSkills.length, loaded: true, offered: evidencedSkills.length },
    // R137: "a domain with a verified step", as documented: a verified step, not a level a form or the ledger raised.
    'kpi.technical.exam-weight-verified': {
      value: practisedDomains.filter((r) => r.verifiedSteps > 0).reduce((n, r) => n + (weightOf.get(r.id) ?? 0), 0),
      of: practisedDomains.reduce((n, r) => n + (weightOf.get(r.id) ?? 0), 0),
      loaded: true,
      offered: practisedDomains.reduce((n, r) => n + (weightOf.get(r.id) ?? 0), 0),
    },
    'kpi.technical.commands-verified': indicator(abilities.commandSteps),
    'kpi.technical.procedures-to-standard': {
      value: rows.procedures.filter((r) => r.level === 'reviewed' && citing(r)).length,
      of: rows.procedures.filter(atLeastVerified).length,
      loaded: team,
      offered: rows.procedures.length,
      contribution: {
        value: rows.procedures.filter((r) => r.level === 'reviewed' && citing(r) && ownRow(r)).length,
        of: rows.procedures.filter((r) => atLeastVerified(r) && ownRow(r)).length,
      },
    },
    // ── problem solving ──
    'kpi.problem-solving.faults-resolved': indicator(abilities.faultsResolved),
    'kpi.problem-solving.persistence': indicator(abilities.persistence),
    'kpi.problem-solving.flags-cleared': indicator(abilities.flagsCleared),
    // Minutes: the median is the value, the steps timed the denominator, and the share within the hour the percentage.
    // R137: with no step timed there is nothing to measure yet; a null median (every timed step left over a day) keeps its zero and the board prints a dash.
    'kpi.problem-solving.time-to-resolution': { value: profile.timing.medianMinutes ?? 0, of: profile.timing.timedSteps, loaded: true, pct: pctOf(profile.timing.withinHour, profile.timing.timedSteps), ...(profile.timing.timedSteps === 0 ? { offered: abilities.persistence.offered ?? 0 } : {}) },
    // ── execution ──
    'kpi.execution.steps-in-order': indicator(abilities.inOrder),
    'kpi.execution.first-try': { ...indicator(abilities.firstTry), beside: { value: abilities.persistence.value, of: abilities.persistence.of ?? 0 } },
    'kpi.execution.evidence-named': indicator(abilities.evidenceNaming),
    'kpi.execution.dod-met': { ...indicator(abilities.dodMet), contribution: ownOf(abilities.dodMet) },
    // ── decision making ──
    'kpi.decision-making.decisions-recorded': indicator(abilities.decisionsRecorded),
    'kpi.decision-making.decisions-justified': indicator(abilities.decisionsJustified),
    'kpi.decision-making.decisions-approved': indicator(abilities.decisionsApproved),
    'kpi.decision-making.change-rollback': indicator(abilities.changeRollback),
    // ── teamwork ──
    'kpi.teamwork.handoffs': { ...indicator(abilities.handoffsCompleted), contribution: same(abilities.handoffsCompleted) },
    'kpi.teamwork.raci-respected': indicator(abilities.raciRespected),
    'kpi.teamwork.peer-reviews-given': indicator(abilities.peerReviewsGiven),
    'kpi.teamwork.teammate-steps': { value: abilities.teammateStepsTicked.value, of: 0, loaded: abilities.teammateStepsTicked.loaded, offered: 1 },
    // ── professionalism ──
    'kpi.professionalism.on-time': indicator(abilities.onTime),
    'kpi.professionalism.document-control': { ...indicator(abilities.docControl), contribution: ownOf(abilities.docControl) },
    'kpi.professionalism.controls-cited': { ...indicator(abilities.controlsCited), contribution: same(abilities.controlsCited) },
    'kpi.professionalism.instructor-approved': { ...indicator(abilities.instructorApproved), contribution: ownOf(abilities.instructorApproved) },
    // ── growth ──
    // R137: "skills with at least one verified step", as documented, over the same; offered where a skill maps to two tasks with checkable steps.
    'kpi.growth.skills-transferred': { value: skills.filter((r) => r.verifiedSteps > 0 && r.verifiedTasks >= 2).length, of: skills.filter((r) => r.verifiedSteps > 0).length, loaded: true, offered: skills.filter((r) => r.verifiableSteps > 0 && r.tasks.length >= 2).length },
    'kpi.growth.retention': indicator(abilities.retention),
    // Velocity: this window's verified steps over the previous window's; the percentage caps at one hundred. R137: with no prior window there is nothing to compare yet.
    'kpi.growth.learning-velocity': { ...indicator(abilities.learningVelocity), pct: abilities.learningVelocity.loaded && (abilities.learningVelocity.of ?? 0) > 0 ? Math.min(100, Math.round((100 * abilities.learningVelocity.value) / (abilities.learningVelocity.of ?? 1))) : 0 },
    // R137: over the competencies the course teaches; the untaught ones are listed beside the measure, never counted against the member.
    'kpi.growth.profile-coverage': { value: coverage.value, of: coverage.of - coverage.untaught, loaded: true, offered: coverage.of - coverage.untaught },
    // ── validation (R140) ── read from the answers to activities generated from the team's own record; the minutes are a count.
    'kpi.validation.recall-accuracy': indicator(abilities.recallAccuracy),
    'kpi.validation.applied-scenarios': indicator(abilities.scenariosApplied),
    'kpi.validation.conflicts-resolved': indicator(abilities.conflictsResolved),
    'kpi.validation.time-on-task': indicator(abilities.timeOnTask),
  };

  const kpis: KpiValue[] = registry.KPIS.map((def: KpiDef) => {
    const v = values[def.id] ?? { value: 0, of: 0, loaded: false };
    // R137: loaded with nothing to count is a state, not a zero: structural when the course offers the role nothing here.
    const notMeasured: KpiValue['notMeasured'] | undefined = !v.loaded ? undefined : v.notMeasured ? v.notMeasured : def.unit === 'count' ? undefined : v.of === 0 ? (v.offered === 0 ? 'role' : 'yet') : undefined;
    return {
      id: def.id,
      family: def.family,
      metricId: def.metricId,
      value: v.value,
      of: v.of,
      pct: v.pct ?? pctOf(v.value, v.of),
      unit: def.unit,
      scored: def.scored,
      loaded: v.loaded,
      applies: !notMeasured,
      ...(notMeasured ? { notMeasured } : {}),
      fact: def.fact,
      ...(v.beside ? { beside: v.beside } : {}),
      // Only where the fact was handed in: an unloaded team fact attributes nothing.
      ...(v.contribution && v.loaded ? { contribution: v.contribution } : {}),
    };
  });

  return {
    schema: KPI_BOARD_SCHEMA,
    ontologyVersion: input.ontologyVersion,
    courseId: profile.courseId,
    role: profile.role,
    workRoles: [...(registry.WORK_ROLE_OF[profile.role] ?? [])],
    measuredAgainst: { kind: measure.kind, id: measure.id, label: measure.label, required: coverage.of, untaught: coverage.untaught },
    families: registry.KPI_FAMILIES.map((f) => ({ id: f.id, label: f.label })),
    kpis,
    scores: scoreValues(registry.SCORING, kpis),
    timing: profile.timing,
  };
}

/** The weeks-cleared context the capstone tile prints beside its one-of-one. */
export function weeksLine(outcome: KpiBoardInput['outcome']): { value: number; of: number } {
  return { value: outcome.weeksCleared, of: outcome.weeksTotal };
}

/**
 * R109 — the measure a surface uses when nobody picked one: the first work
 * role the course role prepares for, or a `role.none` sentinel with no
 * requirements when the course maps none. The board page, the portfolio, the
 * Home card and the dashboard all start here.
 */
export function defaultMeasure(registry: Pick<SkillsContent, 'WORK_ROLES' | 'WORK_ROLE_OF'>, role: string): MeasureAgainst {
  const firstId = (registry.WORK_ROLE_OF[role] ?? [])[0];
  const first = registry.WORK_ROLES.find((w) => w.id === firstId);
  return first ? workRoleMeasure(first) : { kind: 'work-role', id: 'role.none', label: '—', requiredCompetencies: [] };
}

/**
 * R109 — one KPI summed across boards (the dashboard's cross-course totals).
 * A board whose row was not loaded is left out and makes `loaded` false, so a
 * total never prints a zero that was not measured.
 */
export function sumKpi(boards: KpiBoard[], id: string): { value: number; of: number; loaded: boolean } {
  let value = 0;
  let of = 0;
  let loaded = true;
  for (const b of boards) {
    const k = b.kpis.find((x) => x.id === id);
    if (!k || !k.loaded) {
      loaded = false;
      continue;
    }
    // R137: a course where the KPI is not measured for the role adds nothing and takes nothing away.
    if (k.notMeasured === 'role') continue;
    value += k.value;
    of += k.of;
  }
  return { value, of, loaded };
}
