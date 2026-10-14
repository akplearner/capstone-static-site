import type { ProfileRow, SkillProfile } from './skillProfile';
import { levelRank } from './skillProfile';
import type { CertContent, SkillsContent } from './content/read';
import type { KpiDef, KpiFact, KpiFamily } from './docs/kpis';
import type { WorkRoleDef } from './docs/workRoles';
import type { EnvironmentProfile } from './docs/environmentProfile';

/**
 * R108 — the KPI board: sixteen numbers read off one member's skill profile,
 * each a ratio of counts the registry (`content.skills.KPIS`) defines, with
 * the kind of fact it reads and whether that fact was handed in. A pure
 * projection with the honesty rules of `skillProfile.ts`: nothing is scored,
 * ranked or badged, no clock is read, a team fact is labelled as one, and a
 * number whose facts were not loaded says so rather than printing zero as
 * if it were measured.
 *
 * "Measured against" is a work role (the nodes of its competency areas) or
 * an environment profile (the competencies it requires); the coverage tile
 * prints how many of the required competencies this course does not teach,
 * so a low fraction reads as a gap in the syllabus, never as a failure.
 */

export const KPI_BOARD_SCHEMA = 'capstone-kpi-board/1';

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
  value: number;
  of: number;
  /** 0..100; 0 when there is no denominator. */
  pct: number;
  /** False when the fact behind it was not handed in (team facts load on the course page). */
  loaded: boolean;
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
  /** Exactly sixteen, in registry order. */
  kpis: KpiValue[];
}

export interface KpiBoardInput {
  profile: SkillProfile;
  registry: Pick<SkillsContent, 'KPIS' | 'KPI_FAMILIES' | 'CONTROL_OF' | 'WORK_ROLE_OF'>;
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
  const { profile, registry, cert, measure, outcome } = input;
  const { rows, abilities } = profile;
  const team = profile.loaded.team;
  const skills = rows.skills;
  const weightOf = new Map((cert.CERT?.domains ?? []).map((d) => [d.id, d.weight]));
  const practisedDomains = rows.domains.filter((r) => r.tasks.length > 0);
  const coverage = profileCoverage(measure.requiredCompetencies, skills);
  const indicator = (i: { value: number; of?: number; loaded: boolean }) => ({ value: i.value, of: i.of ?? 0, loaded: i.loaded });
  const citing = (r: ProfileRow) => r.deliverables.some((id) => (registry.CONTROL_OF[id] ?? []).length > 0);

  // R111: the role's own share of each attributable team fact.
  const drafted = new Set(profile.draftedForms ?? []);
  const ownRow = (r: ProfileRow) => r.deliverables.some((id) => drafted.has(id));
  const same = (i: { value: number; of?: number }) => ({ value: i.value, of: i.of ?? 0 });
  const ownOf = (i: { value: number; of?: number; own?: { value: number; of: number } }) => i.own ?? same(i);
  const values: Record<string, { value: number; of: number; loaded: boolean; beside?: { value: number; of: number }; contribution?: { value: number; of: number } }> = {
    'kpi.ability.skills-verified': { value: skills.filter(atLeastVerified).length, of: skills.filter((r) => r.verifiableSteps > 0).length, loaded: true },
    'kpi.ability.exam-weight-verified': {
      value: practisedDomains.filter(atLeastVerified).reduce((n, r) => n + (weightOf.get(r.id) ?? 0), 0),
      of: practisedDomains.reduce((n, r) => n + (weightOf.get(r.id) ?? 0), 0),
      loaded: true,
    },
    'kpi.ability.profile-coverage': { value: coverage.value, of: coverage.of, loaded: true },
    'kpi.ability.skills-transferred': { value: skills.filter((r) => atLeastVerified(r) && r.verifiedTasks >= 2).length, of: skills.filter(atLeastVerified).length, loaded: true },
    'kpi.execution.steps-in-order': indicator(abilities.inOrder),
    'kpi.execution.first-try': { ...indicator(abilities.firstTry), beside: { value: abilities.persistence.value, of: abilities.persistence.of ?? 0 } },
    'kpi.execution.commands-verified': indicator(abilities.commandSteps),
    'kpi.execution.evidence-named': indicator(abilities.evidenceNaming),
    'kpi.procedure.followed-to-standard': {
      value: rows.procedures.filter((r) => r.level === 'reviewed' && citing(r)).length,
      of: rows.procedures.filter(atLeastVerified).length,
      loaded: team,
      contribution: {
        value: rows.procedures.filter((r) => r.level === 'reviewed' && citing(r) && ownRow(r)).length,
        of: rows.procedures.filter((r) => atLeastVerified(r) && ownRow(r)).length,
      },
    },
    'kpi.procedure.dod-met': { ...indicator(abilities.dodMet), contribution: ownOf(abilities.dodMet) },
    'kpi.procedure.controls-cited': { ...indicator(abilities.controlsCited), contribution: same(abilities.controlsCited) },
    'kpi.procedure.document-control': { ...indicator(abilities.docControl), contribution: ownOf(abilities.docControl) },
    'kpi.outcome.rubric-green': { ...indicator(abilities.rubricAllGreen), contribution: same(abilities.rubricAllGreen) },
    'kpi.outcome.handoffs': { ...indicator(abilities.handoffsCompleted), contribution: same(abilities.handoffsCompleted) },
    'kpi.outcome.instructor-approved': { ...indicator(abilities.instructorApproved), contribution: ownOf(abilities.instructorApproved) },
    'kpi.outcome.capstone-filed': { value: outcome.capstoneFiled ? 1 : 0, of: 1, loaded: team },
  };

  const kpis: KpiValue[] = registry.KPIS.map((def: KpiDef) => {
    const v = values[def.id] ?? { value: 0, of: 0, loaded: false };
    return {
      id: def.id,
      family: def.family,
      metricId: def.metricId,
      value: v.value,
      of: v.of,
      pct: pctOf(v.value, v.of),
      loaded: v.loaded,
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
    value += k.value;
    of += k.of;
  }
  return { value, of, loaded };
}
