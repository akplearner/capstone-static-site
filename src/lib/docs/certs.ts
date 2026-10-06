import type { Course, Level, Task } from '../types';

/**
 * R106 — the certification ladder: every vendor, every credential a course
 * prepares for, its exam domains with their weights, its exam fee, and the
 * rung before and after it. One registry, written into every course document
 * as `content.cert` and into `content/courses/index.json`, so the catalogue,
 * the Guide and the generated coverage sheets read one source.
 *
 * Domain coverage is a projection: `TASK_DOMAINS` says which domain each task
 * of the seven self-authored courses practises, and the cloud tasks say it
 * themselves in `learn[0]` ("SAA-C03 · Design Resilient Architectures").
 * `coverageOf(course, map)` joins the two; nothing derived is stored.
 *
 * Weights are the published exam outlines (a range is stored at its midpoint
 * with the range kept as text); fees are list prices in USD and go stale, so
 * each carries the year it was checked. A domain the course does not
 * practise says so in `gapNote` rather than pretending.
 */

export interface ExamDomain {
  id: string;
  name: string;
  /** Percent of the exam, midpoint of the published range. */
  weight: number;
  /** The published range when the vendor gives one. */
  weightLabel?: string;
  /** Why this course does not practise the domain, when it does not. */
  gapNote?: string;
}

export interface CertDef {
  /** = the course id it prepares for. */
  courseId: string;
  vendorId: 'comptia' | 'cisco' | 'isc2' | 'microsoft' | 'aws' | 'engagement';
  vendor: string;
  /** The exam code, or the framework pair for an engagement. */
  code: string;
  name: string;
  level: Level;
  /** The vendor's own word for the tier, where it differs ("Expert" for AZ-400). */
  vendorLevel?: string;
  /** Whether a timed exam exists; an engagement has none. */
  exam: boolean;
  examFeeUsd: number;
  feeCheckedYear: number;
  domains: ExamDomain[];
  /** The course a student takes before this one, if any (ids of this registry). */
  prerequisite?: string;
  next?: string;
}

const d = (id: string, name: string, weight: number, weightLabel?: string, gapNote?: string): ExamDomain => ({ id, name, weight, ...(weightLabel ? { weightLabel } : {}), ...(gapNote ? { gapNote } : {}) });

export const CERTS: Record<string, CertDef> = {
  'security-plus': {
    courseId: 'security-plus', vendorId: 'comptia', vendor: 'CompTIA', code: 'SY0-701', name: 'Security+', level: 'associate', exam: true, examFeeUsd: 404, feeCheckedYear: 2026,
    next: 'cysa-plus',
    domains: [
      d('d1', 'General Security Concepts', 12, undefined, 'Read with the exam guide; the lab assumes the vocabulary'),
      d('d2', 'Threats, Vulnerabilities, and Mitigations', 22),
      d('d3', 'Security Architecture', 18),
      d('d4', 'Security Operations', 28),
      d('d5', 'Security Program Management and Oversight', 20),
    ],
  },
  'cysa-plus': {
    courseId: 'cysa-plus', vendorId: 'comptia', vendor: 'CompTIA', code: 'CS0-003', name: 'CySA+', level: 'professional', exam: true, examFeeUsd: 404, feeCheckedYear: 2026,
    prerequisite: 'security-plus', next: 'secai-plus',
    domains: [d('d1', 'Security Operations', 33), d('d2', 'Vulnerability Management', 30), d('d3', 'Incident Response and Management', 20), d('d4', 'Reporting and Communication', 17)],
  },
  'server-plus': {
    courseId: 'server-plus', vendorId: 'comptia', vendor: 'CompTIA', code: 'SK0-005', name: 'Server+', level: 'associate', exam: true, examFeeUsd: 369, feeCheckedYear: 2026,
    domains: [d('d1', 'Server Hardware Installation and Management', 18), d('d2', 'Server Administration', 30), d('d3', 'Security and Disaster Recovery', 24), d('d4', 'Troubleshooting', 28)],
  },
  'secai-plus': {
    courseId: 'secai-plus', vendorId: 'comptia', vendor: 'CompTIA', code: 'CY0-001', name: 'SecAI+', level: 'professional', exam: true, examFeeUsd: 404, feeCheckedYear: 2026,
    prerequisite: 'cysa-plus',
    domains: [d('d1', 'AI Concepts and Data', 25, 'approx.'), d('d2', 'Securing AI Systems', 25, 'approx.'), d('d3', 'AI-Assisted Security', 25, 'approx.'), d('d4', 'AI Governance and Compliance', 25, 'approx.')],
  },
  mssp: {
    courseId: 'mssp', vendorId: 'engagement', vendor: 'Engagement', code: 'SOC 2 · ISO 27001', name: 'SOC 2 + ISO 27001 readiness', level: 'professional', exam: false, examFeeUsd: 0, feeCheckedYear: 2026,
    prerequisite: 'security-plus',
    domains: [
      d('c1', 'Context and scope (ISO 27001 cl. 4)', 20, undefined, 'Scope and the rules of engagement are set in the setup week; the graded weeks start from a signed scope'),
      d('c2', 'Leadership, planning and risk (cl. 5–6)', 20),
      d('c3', 'Support, operation and controls (cl. 7–8, Annex A)', 20),
      d('c4', 'Performance evaluation (cl. 9)', 20),
      d('c5', 'Improvement (cl. 10)', 20),
    ],
  },
  ccna: {
    courseId: 'ccna', vendorId: 'cisco', vendor: 'Cisco', code: '200-301', name: 'CCNA', level: 'associate', exam: true, examFeeUsd: 300, feeCheckedYear: 2026,
    domains: [d('d1', 'Network Fundamentals', 20), d('d2', 'Network Access', 20), d('d3', 'IP Connectivity', 25), d('d4', 'IP Services', 10), d('d5', 'Security Fundamentals', 15), d('d6', 'Automation and Programmability', 10)],
  },
  cissp: {
    courseId: 'cissp', vendorId: 'isc2', vendor: 'ISC2', code: 'CISSP', name: 'CISSP', level: 'expert', exam: true, examFeeUsd: 749, feeCheckedYear: 2026,
    prerequisite: 'cysa-plus',
    domains: [
      d('d1', 'Security and Risk Management', 16),
      d('d2', 'Asset Security', 10),
      d('d3', 'Security Architecture and Engineering', 13),
      d('d4', 'Communication and Network Security', 13),
      d('d5', 'Identity and Access Management', 13),
      d('d6', 'Security Assessment and Testing', 12),
      d('d7', 'Security Operations', 13),
      d('d8', 'Software Development Security', 10),
    ],
  },
  'azure-fundamentals': {
    courseId: 'azure-fundamentals', vendorId: 'microsoft', vendor: 'Microsoft', code: 'AZ-900', name: 'Azure Fundamentals', level: 'entry', vendorLevel: 'Fundamentals', exam: true, examFeeUsd: 99, feeCheckedYear: 2026,
    next: 'azure-administrator',
    domains: [d('d1', 'Cloud concepts', 27, '25–30%'), d('d2', 'Azure architecture and services', 37, '35–40%'), d('d3', 'Azure management and governance', 32, '30–35%')],
  },
  'azure-administrator': {
    courseId: 'azure-administrator', vendorId: 'microsoft', vendor: 'Microsoft', code: 'AZ-104', name: 'Azure Administrator', level: 'associate', vendorLevel: 'Associate', exam: true, examFeeUsd: 165, feeCheckedYear: 2026,
    prerequisite: 'azure-fundamentals', next: 'azure-devops',
    domains: [
      d('d1', 'Manage Azure identities and governance', 23, '20–25%'),
      d('d2', 'Implement and manage storage', 18, '15–20%'),
      d('d3', 'Deploy and manage Azure compute resources', 23, '20–25%'),
      d('d4', 'Implement and manage virtual networking', 18, '15–20%'),
      d('d5', 'Monitor and maintain Azure resources', 13, '10–15%'),
    ],
  },
  'azure-devops': {
    courseId: 'azure-devops', vendorId: 'microsoft', vendor: 'Microsoft', code: 'AZ-400', name: 'DevOps Engineer', level: 'expert', vendorLevel: 'Expert', exam: true, examFeeUsd: 165, feeCheckedYear: 2026,
    prerequisite: 'azure-administrator',
    domains: [
      d('d1', 'Design and implement processes and communications', 13, '11–15%'),
      d('d2', 'Design and implement a source control strategy', 12, '10–15%'),
      d('d3', 'Design and implement build and release pipelines', 52, '50–55%'),
      d('d4', 'Develop a security and compliance plan', 12, '10–15%'),
      d('d5', 'Implement an instrumentation strategy', 7, '5–10%'),
    ],
  },
  'aws-cloud-practitioner': {
    courseId: 'aws-cloud-practitioner', vendorId: 'aws', vendor: 'AWS', code: 'CLF-C02', name: 'Cloud Practitioner', level: 'entry', vendorLevel: 'Foundational', exam: true, examFeeUsd: 100, feeCheckedYear: 2026,
    next: 'aws-solutions-architect',
    domains: [d('d1', 'Cloud Concepts', 24), d('d2', 'Security and Compliance', 30), d('d3', 'Cloud Technology and Services', 34), d('d4', 'Billing, Pricing and Support', 12)],
  },
  'aws-solutions-architect': {
    courseId: 'aws-solutions-architect', vendorId: 'aws', vendor: 'AWS', code: 'SAA-C03', name: 'Solutions Architect – Associate', level: 'associate', vendorLevel: 'Associate', exam: true, examFeeUsd: 150, feeCheckedYear: 2026,
    prerequisite: 'aws-cloud-practitioner', next: 'aws-devops',
    domains: [d('d1', 'Design Secure Architectures', 30), d('d2', 'Design Resilient Architectures', 26), d('d3', 'Design High-Performing Architectures', 24), d('d4', 'Design Cost-Optimized Architectures', 20)],
  },
  'aws-devops': {
    courseId: 'aws-devops', vendorId: 'aws', vendor: 'AWS', code: 'DOP-C02', name: 'DevOps Engineer – Professional', level: 'professional', vendorLevel: 'Professional', exam: true, examFeeUsd: 300, feeCheckedYear: 2026,
    prerequisite: 'aws-solutions-architect',
    domains: [
      d('d1', 'SDLC Automation', 22),
      d('d2', 'Configuration Management and IaC', 17),
      d('d3', 'Resilient Cloud Solutions', 15),
      d('d4', 'Monitoring and Logging', 15),
      d('d5', 'Incident and Event Response', 14),
      d('d6', 'Security and Compliance', 17),
    ],
  },
};

/**
 * Which exam domain each task of the self-authored courses practises. The
 * cloud courses carry the domain in `learn[0]` instead (R95), so they have no
 * entry here. Setup-week tasks are mapped too, but coverage counts graded
 * weeks only.
 */
export const TASK_DOMAINS: Record<string, Record<string, string>> = {
  'security-plus': {
    'red-w0-setup': 'd1', 'red-w1-osint': 'd2', 'red-w2-enumeration': 'd2', 'red-w3-attacks': 'd2', 'red-w4-briefing': 'd5',
    'blue-w0-setup': 'd3', 'blue-w1-hardening': 'd3', 'blue-w2-baseline': 'd4', 'blue-w3-detection': 'd4', 'blue-w4-response': 'd4',
    'grc-w0-setup': 'd5', 'grc-w1-framework': 'd5', 'grc-w2-risk': 'd5', 'grc-w3-custody': 'd4', 'grc-w4-report': 'd5',
  },
  'cysa-plus': {
    'cr-w0': 'd1', 'cb-w0': 'd1', 'cg-w0': 'd1', 'cr-w1': 'd1', 'cb-w1': 'd1', 'cg-w1': 'd1', 'cb-w2': 'd1', 'cg-w2': 'd1', 'cr-w2': 'd3',
    'cb-w3': 'd2', 'cg-w3': 'd2', 'cr-w3': 'd2', 'cb-w4': 'd3', 'cg-w4': 'd3', 'cg-w4b': 'd4', 'cr-w4': 'd4',
  },
  mssp: {
    'mg-w0': 'c1', 'mr-w0': 'c1', 'mb-w0': 'c3', 'mg-w1': 'c2', 'mr-w1': 'c2', 'mb-w1': 'c2', 'mg-w2': 'c3', 'mb-w2': 'c3', 'mr-w2': 'c2',
    'mr-w3': 'c4', 'mb-w3': 'c3', 'mg-w3': 'c4', 'mr-w4': 'c5', 'mb-w4': 'c4', 'mg-w4a': 'c4', 'mg-w4b': 'c4',
  },
  'server-plus': {
    'sp-w0-pxe': 'd1', 'sp-w0-starter': 'd2', 'sp-w0-orient': 'd2', 'sp-w1-bringup': 'd1', 'sp-w1-document': 'd1', 'sp-w1-raid': 'd1', 'sp-w1-install': 'd2',
    'sp-w2-business': 'd2', 'sp-w2-rackplan': 'd1', 'sp-w2-rack': 'd1', 'sp-w2-install': 'd2', 'sp-w2-deploy': 'd2', 'sp-w3-topology': 'd2', 'sp-w3-connect': 'd4', 'sp-w3-sops': 'd2',
    'sp-w4-secure': 'd3', 'sp-w4-dr': 'd3', 'sp-w4-handover': 'd2', 'sp-w5-plan': 'd2', 'sp-w5-secmon': 'd4', 'sp-w5-pulse': 'd3', 'sp-w5-wazuh': 'd3', 'sp-w5-terraform': 'd2', 'sp-w5-netbox': 'd2', 'sp-w5-glpi': 'd2', 'sp-w5-record': 'd2',
    'sp-w6-spine': 'd1', 'sp-w6-ops': 'd2', 'sp-w6-git': 'd2', 'sp-w6-terraform': 'd2', 'sp-w6-ansible': 'd2', 'sp-w6-observe': 'd4', 'sp-w6-vault': 'd3', 'sp-w6-xdr': 'd3', 'sp-w6-rebuild': 'd3',
    'sp-w1-net': 'd1', 'sp-w2-net': 'd2', 'sp-w3-net': 'd4', 'sp-w4-net': 'd4', 'sp-w1-win': 'd2', 'sp-w2-win': 'd2', 'sp-w3-win': 'd2', 'sp-w4-win': 'd3',
    'sp-w1-lnx': 'd1', 'sp-w2-lnx': 'd2', 'sp-w3-lnx': 'd4', 'sp-w4-lnx': 'd3', 'sp-w1-mgmt': 'd3', 'sp-w2-mgmt': 'd2', 'sp-w3-mgmt': 'd2', 'sp-w4-mgmt': 'd2',
    'sp-w6-net': 'd2', 'sp-w5-win': 'd4', 'sp-w5-lnx': 'd4', 'sp-w6-mgmt': 'd2', 'sp-w7-net': 'd1', 'sp-w8-win': 'd2', 'sp-w8-lnx': 'd3', 'sp-w8-mgmt': 'd4',
  },
  ccna: {
    'ccna-w0-path': 'd1', 'ccna-w0-register': 'd1', 'ccna-w1-discover': 'd1', 'ccna-w1-design': 'd1', 'ccna-w1-bringup': 'd2', 'ccna-w2-vlans': 'd2', 'ccna-w2-route': 'd3', 'ccna-w2-resilience': 'd2',
    'ccna-w3-wan': 'd3', 'ccna-w3-internet': 'd4', 'ccna-w4-policy': 'd5', 'ccna-w4-harden': 'd5', 'ccna-w4-wireless': 'd2', 'ccna-w5-sot': 'd6', 'ccna-w5-change': 'd4', 'ccna-w6-noc': 'd4', 'ccna-w6-ticket': 'd3',
    'ccna-w7-data': 'd6', 'ccna-w7-ansible': 'd6', 'ccna-w8-incident': 'd3', 'ccna-w8-handover': 'd1',
  },
  'secai-plus': {
    'sa-w0-gov': 'd4', 'sa-w0-def': 'd2', 'sa-w0-red': 'd1', 'sa-w1-gov': 'd4', 'sa-w1-red': 'd2', 'sa-w1-def': 'd2', 'sa-w2-red': 'd2', 'sa-w2-def': 'd2', 'sa-w2-gov': 'd1',
    'sa-w3-def': 'd3', 'sa-w3-red': 'd3', 'sa-w3-gov': 'd4', 'sa-w4-def': 'd2', 'sa-w4-red': 'd3', 'sa-w4-gov': 'd4',
  },
  cissp: {
    'ci-w0-gov': 'd1', 'ci-w0-arch': 'd3', 'ci-w0-idops': 'd5', 'ci-w1-gov': 'd1', 'ci-w1-arch': 'd3', 'ci-w1-idops': 'd5', 'ci-w2-gov': 'd2', 'ci-w2-arch': 'd3', 'ci-w2-idops': 'd7',
    'ci-w3-arch': 'd8', 'ci-w3-idops': 'd5', 'ci-w3-gov': 'd1', 'ci-w4-idops': 'd7', 'ci-w4-gov': 'd2', 'ci-w4-arch': 'd4', 'ci-w5-gov': 'd6', 'ci-w5-arch': 'd6', 'ci-w5-idops': 'd6',
    'ci-w6-gov': 'd1', 'ci-w6-arch': 'd4', 'ci-w6-idops': 'd7',
  },
};

export function certFor(courseId: string): CertDef | undefined {
  return CERTS[courseId];
}

/** The domain a task practises: the map for the self-authored courses, `learn[0]` ("CODE · Domain") for the cloud ones. */
export function domainOf(cert: CertDef, map: Record<string, string>, task: Pick<Task, 'id' | 'learn'>): ExamDomain | undefined {
  const mapped = map[task.id];
  if (mapped) return cert.domains.find((x) => x.id === mapped);
  const m = /^(\S[^·]*?)\s*·\s*(.+)$/.exec(task.learn?.[0] ?? '');
  if (!m || m[1].trim() !== cert.code) return undefined;
  return cert.domains.find((x) => x.name === m[2].trim());
}

export interface DomainCoverage {
  domain: ExamDomain;
  /** Graded tasks that practise it, by id. */
  tasks: string[];
}

export interface CertCoverage {
  rows: DomainCoverage[];
  /** Tasks of graded weeks that name no domain of this exam. */
  unmapped: string[];
  /** Sum of the weights of the domains at least one graded task practises. */
  coveredWeight: number;
}

/** Coverage of the exam by the course's graded tasks — a projection, never stored. */
export function coverageOf(course: Pick<Course, 'tasks' | 'weeks'>, cert: CertDef, map: Record<string, string>): CertCoverage {
  const setup = new Set(course.weeks.filter((w) => w.setup || w.number === 0).map((w) => w.number));
  const rows: DomainCoverage[] = cert.domains.map((domain) => ({ domain, tasks: [] }));
  const unmapped: string[] = [];
  for (const t of course.tasks) {
    if (setup.has(t.week)) continue;
    const dom = domainOf(cert, map, t);
    if (!dom) unmapped.push(t.id);
    else rows.find((r) => r.domain.id === dom.id)!.tasks.push(t.id);
  }
  const coveredWeight = rows.filter((r) => r.tasks.length).reduce((n, r) => n + r.domain.weight, 0);
  return { rows, unmapped, coveredWeight };
}

export interface LadderRung { courseId: string; code: string; name: string; level: Level }

/** The rungs of one vendor's ladder, lowest first, as the document carries them. */
export function ladderRows(courseId: string): LadderRung[] {
  return ladderOf(courseId).map((c) => ({ courseId: c.courseId, code: c.code, name: c.name, level: c.level }));
}

/** The rungs of one vendor's ladder, lowest first. */
export function ladderOf(courseId: string): CertDef[] {
  let cur = CERTS[courseId];
  if (!cur) return [];
  while (cur.prerequisite && CERTS[cur.prerequisite]) cur = CERTS[cur.prerequisite];
  const out: CertDef[] = [cur];
  while (cur.next && CERTS[cur.next]) {
    cur = CERTS[cur.next];
    out.push(cur);
  }
  return out;
}
