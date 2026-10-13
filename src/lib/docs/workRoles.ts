import { SKILLS } from './skills';

/**
 * R108 — work roles: the skills spine a hiring reader recognises. Each row
 * is a NICE Framework work role (NIST SP 800-181) named by its title, the
 * competency areas of `skills.ts` it expects, and the competency nodes those
 * areas hold, so a member's verified skills can be measured against a job
 * rather than only against an exam. `WORK_ROLE_OF` maps every course role to
 * the work roles it prepares for; the first one is the board's default
 * "measured against".
 *
 * `niceId` carries the work role id of the 2017 edition of SP 800-181, which
 * is the edition these titles were transcribed from; the 2024 NICE Framework
 * Components renumbered the work roles, and no test can reach the published
 * list, so a correction is a registry edit (`checkedYear` says when the list
 * was last read). The area mapping is this platform's own crosswalk, not
 * NIST's.
 */

export interface WorkRoleDef {
  /** 'role.<slug>' */
  id: string;
  /** The NICE work role title, eight words or fewer. */
  label: string;
  framework: 'NICE';
  /** The SP 800-181 (2017) work role id; absent until transcribed. */
  niceId?: string;
  checkedYear: number;
  url: string;
  /** `AREA_LABEL` keys the role expects. */
  areas: string[];
  /** Every competency node in those areas, derived; the default measure. */
  requiredCompetencies: string[];
}

const NICE_URL = 'https://niccs.cisa.gov/workforce-development/nice-framework';

const r = (slug: string, label: string, niceId: string, areas: string[]): WorkRoleDef => ({
  id: `role.${slug}`,
  label,
  framework: 'NICE',
  niceId,
  checkedYear: 2025,
  url: NICE_URL,
  areas,
  requiredCompetencies: SKILLS.filter((n) => areas.includes(n.area) && !n.deprecated).map((n) => n.id),
});

export const WORK_ROLES: WorkRoleDef[] = [
  r('cyber-defense-analyst', 'Cyber Defense Analyst', 'PR-CDA-001', ['detect', 'harden', 'ops']),
  r('incident-responder', 'Cyber Defense Incident Responder', 'PR-CIR-001', ['respond', 'forensics', 'detect']),
  r('vulnerability-assessment-analyst', 'Vulnerability Assessment Analyst', 'PR-VAM-001', ['vuln', 'recon', 'report']),
  r('exploitation-analyst', 'Exploitation Analyst', 'AN-EXP-001', ['recon', 'exploit', 'report', 'ai-attack']),
  r('threat-analyst', 'Threat and Warning Analyst', 'AN-TWA-001', ['detect', 'recon', 'forensics']),
  r('systems-security-analyst', 'Systems Security Analyst', 'OM-ANA-001', ['harden', 'identity', 'crypto', 'data', 'arch']),
  r('security-control-assessor', 'Security Control Assessor', 'SP-RSK-002', ['audit', 'grc', 'risk', 'report']),
  r('cyber-policy-planner', 'Cyber Policy and Strategy Planner', 'OV-SPP-002', ['grc', 'risk', 'docs']),
  r('issm', 'Information Systems Security Manager', 'OV-MGT-001', ['grc', 'risk', 'audit', 'ops', 'report']),
  r('system-administrator', 'System Administrator', 'OM-ADM-001', ['sysadmin', 'hardware', 'virt', 'continuity', 'observe', 'docs']),
  r('network-operations-specialist', 'Network Operations Specialist', 'OM-NET-001', ['network', 'arch', 'observe', 'docs']),
  r('security-architect', 'Security Architect', 'SP-ARC-002', ['arch', 'crypto', 'identity', 'cloud', 'data']),
  r('software-developer', 'Software Developer', 'SP-DEV-001', ['automation', 'cloud', 'docs']),
];

const SECURITY_PLUS = {
  red: ['role.exploitation-analyst', 'role.vulnerability-assessment-analyst'],
  blue: ['role.cyber-defense-analyst', 'role.incident-responder'],
  grc: ['role.security-control-assessor', 'role.cyber-policy-planner'],
};

const CLOUD = {
  arch: ['role.security-architect'],
  infra: ['role.system-administrator'],
  dev: ['role.software-developer'],
  secops: ['role.cyber-defense-analyst', 'role.systems-security-analyst'],
};

/** courseId → roleId → work role ids, the first being the default measure. */
export const WORK_ROLE_OF: Record<string, Record<string, string[]>> = {
  'security-plus': SECURITY_PLUS,
  mssp: {
    red: ['role.exploitation-analyst', 'role.vulnerability-assessment-analyst'],
    blue: ['role.cyber-defense-analyst', 'role.incident-responder'],
    grc: ['role.issm', 'role.security-control-assessor'],
  },
  'cysa-plus': {
    blue: ['role.cyber-defense-analyst', 'role.incident-responder'],
    grc: ['role.threat-analyst', 'role.security-control-assessor'],
    red: ['role.vulnerability-assessment-analyst', 'role.incident-responder'],
  },
  'server-plus': {
    net: ['role.network-operations-specialist'],
    win: ['role.system-administrator'],
    lnx: ['role.system-administrator'],
    mgmt: ['role.system-administrator', 'role.issm'],
  },
  ccna: {
    arch: ['role.network-operations-specialist', 'role.security-architect'],
    impl: ['role.network-operations-specialist'],
    ops: ['role.network-operations-specialist'],
    auto: ['role.software-developer', 'role.network-operations-specialist'],
  },
  'secai-plus': {
    redteam: ['role.exploitation-analyst', 'role.threat-analyst'],
    defender: ['role.systems-security-analyst', 'role.cyber-defense-analyst'],
    governance: ['role.cyber-policy-planner', 'role.security-control-assessor'],
  },
  cissp: {
    govrisk: ['role.issm', 'role.cyber-policy-planner'],
    archnet: ['role.security-architect', 'role.systems-security-analyst'],
    idops: ['role.systems-security-analyst', 'role.incident-responder'],
  },
  'azure-fundamentals': CLOUD,
  'azure-administrator': CLOUD,
  'azure-devops': CLOUD,
  'aws-cloud-practitioner': CLOUD,
  'aws-solutions-architect': CLOUD,
  'aws-devops': CLOUD,
};

/* ── helpers (lowercase: never written to a document) ───────────────────── */

const byId = new Map(WORK_ROLES.map((x) => [x.id, x]));

export function workRoleOf(id: string): WorkRoleDef | undefined {
  return byId.get(id);
}

/** The work roles a course role prepares for, in order; empty when unmapped. */
export function workRolesOf(courseId: string, roleId: string): WorkRoleDef[] {
  return (WORK_ROLE_OF[courseId]?.[roleId] ?? []).map((id) => byId.get(id)).filter((x): x is WorkRoleDef => !!x);
}
