import type { Course } from '../types';
import type { DeliverableDef } from './types';
import { ARCH } from './msspContent';
import { toolsByTask } from './tools';
import { DELIVERABLE_SOPS, TASK_SOPS, sopOf, type SopKind } from './sops';
import { parseStandard } from './standards';
import { TASK_SKILLS } from './skills';
import { WORK_ROLE_OF } from './workRoles';

/**
 * R108 — the environment profile: what a company publishes so a learner can
 * be measured against its own stack. Infrastructure, architecture, tools,
 * methodology (the runbooks and SOP kinds it follows), policies (the control
 * codes it holds itself to), a ticket taxonomy with the service levels it
 * promises, and the competencies it requires per work role. Every id is an
 * id of the published ontology, so a profile joins the registries without
 * translation. The service levels are declared by the publisher and never
 * measured by the platform: nothing here times a member.
 *
 * A company publishes a profile as a file (`content/schemas/environment-profile.schema.json`);
 * no server receives one (ADR-0007). The one sample is the platform's own
 * managed-security entity, built from the MSSP course so that every id
 * resolves by construction; `scripts/export-profiles.ts` writes it to
 * `content/profiles/` and `src/lib/content/profiles.ts` reads it back.
 */

export const ENVIRONMENT_PROFILE_SCHEMA = 'capstone-environment-profile/1';
export const SAMPLE_PROFILE_ID = 'profile.sample-mssp';
export const SAMPLE_PROFILE_COURSE = 'mssp';

export interface ProfileInfrastructure {
  id: string;
  label: string;
  /** Twelve words or fewer. */
  purpose: string;
}

export interface ProfileTicket {
  kind: string;
  priority: string;
  /** Declared by the publisher; the platform never measures against it. */
  sla: { acknowledge: string; resolve: string };
}

export interface ProfileWorkRole {
  /** A `WORK_ROLES` id. */
  workRole: string;
  /** `SKILLS` ids. */
  requiredCompetencies: string[];
}

export interface EnvironmentProfile {
  schema: typeof ENVIRONMENT_PROFILE_SCHEMA;
  /** 'profile.<slug>' */
  id: string;
  version: string;
  name: string;
  publisher: string;
  /** Twenty-five words or fewer. */
  architecture: string;
  infrastructure: ProfileInfrastructure[];
  /** `TOOLS` ids. */
  tools: string[];
  /** `SOPS` ids: the runbooks and procedures the company follows. */
  methodology: string[];
  /** `CONTROLS` codes or `STANDARDS` ids the company holds itself to. */
  policies: string[];
  ticketTaxonomy: ProfileTicket[];
  workRoles: ProfileWorkRole[];
  requiredSops: SopKind[];
}

const TICKETS: ProfileTicket[] = [
  { kind: 'Security alert', priority: 'P1', sla: { acknowledge: '15 minutes', resolve: '4 hours' } },
  { kind: 'Security alert', priority: 'P2', sla: { acknowledge: '1 hour', resolve: '1 business day' } },
  { kind: 'Vulnerability finding', priority: 'critical', sla: { acknowledge: '1 business day', resolve: '14 days' } },
  { kind: 'Change request', priority: 'standard', sla: { acknowledge: '1 business day', resolve: 'the next change window' } },
  { kind: 'Audit evidence request', priority: 'standard', sla: { acknowledge: '2 business days', resolve: '10 business days' } },
];

const uniq = (xs: string[]) => [...new Set(xs)].sort();

/**
 * The sample profile, derived from the MSSP course: its architecture nodes,
 * the tools its tasks use, the SOP kinds its forms are instances of, the
 * control codes its forms cite, and the competencies each of its roles
 * practises, keyed by the work role that role prepares for.
 */
export function sampleProfile(course: Pick<Course, 'id' | 'tasks' | 'roles'>, forms: Pick<DeliverableDef, 'id' | 'standard'>[]): EnvironmentProfile {
  const skillsOfTask = TASK_SKILLS[course.id] ?? {};
  const byRole = new Map<string, Set<string>>();
  for (const role of course.roles) {
    const workRole = WORK_ROLE_OF[course.id]?.[role.id]?.[0];
    if (!workRole) continue;
    const set = byRole.get(workRole) ?? new Set<string>();
    for (const t of course.tasks) if (t.role === role.id) for (const id of skillsOfTask[t.id] ?? []) set.add(id);
    byRole.set(workRole, set);
  }
  const methodology = uniq([...Object.values(DELIVERABLE_SOPS[course.id] ?? {}).flat(), ...Object.values(TASK_SOPS[course.id] ?? {}).flat()]);
  return {
    schema: ENVIRONMENT_PROFILE_SCHEMA,
    id: SAMPLE_PROFILE_ID,
    version: '1.0.0',
    name: 'Sample managed security service provider',
    publisher: 'Capstone Labs, as a sample',
    architecture: 'One client estate under contract feeding one managed SOC; nine records govern the engagement from scoping to the evidence packet.',
    infrastructure: ARCH.nodes.filter((n) => n.kind !== 'record' && n.kind !== 'people').map((n) => ({ id: n.id, label: n.label, purpose: n.purpose })),
    tools: uniq(Object.values(toolsByTask(course)).flat()),
    methodology,
    policies: uniq(forms.flatMap((f) => parseStandard(f.standard).map((c) => c.code))),
    ticketTaxonomy: TICKETS,
    workRoles: [...byRole].map(([workRole, ids]) => ({ workRole, requiredCompetencies: [...ids].sort() })),
    requiredSops: uniq(methodology.map((id) => sopOf(id)?.kind ?? '').filter(Boolean)) as SopKind[],
  };
}

/** The exact bytes the exporter writes. */
export function profileJson(p: EnvironmentProfile): string {
  return JSON.stringify(p, null, 2) + '\n';
}
