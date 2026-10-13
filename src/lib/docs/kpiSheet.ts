import type { Course, Task } from '../types';
import type { DeliverableDef } from './types';
import { domainOf, type CertDef } from './certs';
import { getTasksByRole, isSetupWeek } from '../course-helpers';
import { verifiableSteps } from '../evidenceLedger';
import type { KpiDef, KpiFamily } from './kpis';
import type { WorkRoleDef } from './workRoles';

/**
 * R108 — the KPI board's denominators per course: what each of the sixteen
 * numbers is counted over in this course, role by role, read from the
 * content alone (no member). The skills sheet prints the table; nothing is
 * stored. Lowercase only: this module reaches no document.
 */

export interface KpiSheetRegistry {
  KPIS: KpiDef[];
  SKILL_OF: Record<string, string[]>;
  SOP_OF: Record<string, string[]>;
  SOP_OF_TASK: Record<string, string[]>;
  CONTROL_OF: Record<string, string[]>;
  WORK_ROLES: WorkRoleDef[];
  /** This course's map: role id → work role ids. */
  WORK_ROLE_OF: Record<string, string[]>;
}

export interface KpiSheetRow {
  id: string;
  label: string;
  family: KpiFamily;
  /** The catalogue row and the kind of fact. */
  reads: string;
  /** Per role, joined; or the one phrase for a KPI with no content denominator. */
  denominators: string;
}

const hasCommand = (s: Task['steps'][number]) => !!(s.command || s.commands?.length);

export function kpiDenominators(course: Course, reg: KpiSheetRegistry, forms: DeliverableDef[], cert: { CERT: CertDef | null; DOMAIN_OF: Record<string, string> }): KpiSheetRow[] {
  const roles = course.roles.map((r) => r.id);
  const perRole = (f: (role: string) => string) => roles.map((r) => `${r}: ${f(r)}`).join('; ');
  const own = (role: string) => getTasksByRole(course, role).filter((t) => !isSetupWeek(course, t.week));
  const required = (t: Task) => t.steps.filter((s) => !s.optional);
  const ownForms = (role: string) => forms.filter((d) => d.owner === role || d.shared);
  const draftForms = (role: string) => forms.filter((d) => d.owner === role || d.raci?.drafts === role);
  const raciForms = (role: string) => forms.filter((d) => d.owner === role || d.shared || d.raci?.drafts === role || d.raci?.reviews === role || d.raci?.approves === role);
  const skillsOf = (tasks: Task[]) => new Set(tasks.flatMap((t) => reg.SKILL_OF[t.id] ?? []));
  const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

  const text: Record<string, string> = {
    'kpi.ability.skills-verified': perRole((role) => count(skillsOf(own(role).filter((t) => verifiableSteps(required(t)).length > 0)).size, 'skill with a verifiable step', 'skills with a verifiable step')),
    'kpi.ability.exam-weight-verified': cert.CERT
      ? perRole((role) => {
          const seen = new Map<string, number>();
          for (const t of own(role)) {
            const d = domainOf(cert.CERT!, cert.DOMAIN_OF, t);
            if (d) seen.set(d.id, d.weight);
          }
          return `${[...seen.values()].reduce((a, b) => a + b, 0)} percent of the exam over ${count(seen.size, 'domain')}`;
        })
      : 'no exam registered for this course',
    'kpi.ability.profile-coverage': perRole((role) => {
      const wr = reg.WORK_ROLES.find((w) => w.id === (reg.WORK_ROLE_OF[role] ?? [])[0]);
      if (!wr) return 'no work role mapped';
      const taught = skillsOf(own(role));
      return `${wr.label}: ${wr.requiredCompetencies.length} required, ${wr.requiredCompetencies.filter((id) => !taught.has(id)).length} not taught here`;
    }),
    'kpi.ability.skills-transferred': perRole((role) => {
      const tally = new Map<string, number>();
      for (const t of own(role)) for (const id of reg.SKILL_OF[t.id] ?? []) tally.set(id, (tally.get(id) ?? 0) + 1);
      return count([...tally.values()].filter((n) => n >= 2).length, 'skill on two or more tasks', 'skills on two or more tasks');
    }),
    'kpi.execution.steps-in-order': perRole((role) => count(own(role).filter((t) => verifiableSteps(required(t)).length >= 2).length, 'task with two or more verifiable steps', 'tasks with two or more verifiable steps')),
    'kpi.execution.first-try': perRole((role) => count(own(role).reduce((n, t) => n + verifiableSteps(required(t)).length, 0), 'verifiable step')),
    'kpi.execution.commands-verified': perRole((role) => count(own(role).reduce((n, t) => n + verifiableSteps(required(t)).filter(hasCommand).length, 0), 'verifiable step that runs a command', 'verifiable steps that run a command')),
    'kpi.execution.evidence-named': 'the files the member hashes; no content denominator',
    'kpi.procedure.followed-to-standard': perRole((role) => count(new Set([...own(role).flatMap((t) => reg.SOP_OF_TASK[t.id] ?? []), ...raciForms(role).flatMap((d) => reg.SOP_OF[d.id] ?? [])]).size, 'procedure')),
    'kpi.procedure.dod-met': perRole((role) => `${count(ownForms(role).reduce((n, d) => n + (d.dod?.length ?? 0), 0), 'check')} on ${count(ownForms(role).length, 'form')}`),
    'kpi.procedure.controls-cited': perRole((role) => `${count(new Set(draftForms(role).flatMap((d) => reg.CONTROL_OF[d.id] ?? [])).size, 'control code')} on ${count(draftForms(role).length, 'form')}`),
    'kpi.procedure.document-control': perRole((role) => count(ownForms(role).length, 'form')),
    'kpi.outcome.rubric-green': 'the submissions the member freezes; no content denominator',
    'kpi.outcome.handoffs': perRole((role) => count(own(role).reduce((n, t) => n + (t.handoff ?? []).filter((h) => h.deliverable).length, 0), 'hand-off')),
    'kpi.outcome.instructor-approved': perRole((role) => count(ownForms(role).length, 'form')),
    'kpi.outcome.capstone-filed': 'one capstone per course',
  };

  return reg.KPIS.map((k) => ({ id: k.id, label: k.label, family: k.family, reads: `${k.metricId} (${k.fact})`, denominators: text[k.id] ?? '' }));
}
