import type { RoleFlowKind } from './roleFlow';

/**
 * R105 — the roles' content: what the seed does not say about a role, and
 * how the role pictures move.
 *
 * The seed (`RoleDef`) stays the source for id, name, mission, colour and
 * icon, because the instructor edits those in RolesEditor. A profile adds
 * the summary a student reads before choosing, the responsibilities, how
 * the role works (terminal, documents, both) and its week-by-week arc.
 * Hand-offs are NOT here: `roleFlow()` derives them from the RACI on every
 * form, and a derived fact typed twice is a fact that drifts.
 *
 * `dto.ts` writes this module into every course document as `content.roles`;
 * components read it through `rolesOf(doc)` and never import the tables.
 *
 * Register (content-integrity R105): third person, present tense, the lane
 * is the subject; no "you", no contractions, no em dash, no emoji. Summary
 * ≤ 20 words, arc ≤ 25, three or four responsibilities of ≤ 6 words each.
 *
 * Motion is a spec, not a number: every field names a token of the motion
 * scale (`src/lib/motion.ts`) and `resolveRoleMotion()` turns it into
 * transitions. Reduced motion makes the whole spec a no-op.
 */

export type RoleWorks = 'commands' | 'documents' | 'both';

/** Token names of the motion scale; a type query, so this module loads nothing at runtime. */
export type DurToken = keyof typeof import('@/lib/motion').DUR;
export type EaseToken = keyof typeof import('@/lib/motion').EASE;

export interface RoleProfile {
  /** = `RoleDef.id`, in the seed's order. */
  id: string;
  /** One sentence a student reads before choosing; ≤ 20 words. */
  summary: string;
  /** Three or four noun phrases, ≤ 6 words each. */
  responsibilities: string[];
  works: RoleWorks;
  /** The week-by-week arc, ≤ 25 words: "Week 1 …; Week 2 …". */
  arc: string;
}

export interface RoleMotion {
  /** Gap between consecutive boxes, rows or picker buttons. */
  stagger: DurToken;
  /** How long an arrow takes to draw in. */
  draw: 'reveal' | 'meter';
  ease: EaseToken;
}

export interface RoleContent {
  PROFILES: RoleProfile[];
  MOTION: RoleMotion;
}

export const DEFAULT_MOTION: RoleMotion = { stagger: 'press', draw: 'meter', ease: 'out' };

export const WORKS_LABEL: Record<RoleWorks, string> = {
  commands: 'Runs commands in a terminal.',
  documents: 'Authors documents; no terminal needed.',
  both: 'Runs commands and authors documents.',
};

export const WORKS_SHORT: Record<RoleWorks, string> = { commands: 'Commands', documents: 'Documents', both: 'Both' };

export const FLOW_KIND_LABEL: Record<RoleFlowKind, string> = { review: 'Reviews', approve: 'Approves', feeds: 'Feeds' };

export const FLOW_HOW_TO_READ = 'One box per role and an arrow per direction that carries documents, weighted by their count. Select a role to show only its hand-offs.';

const p = (id: string, works: RoleWorks, summary: string, responsibilities: string[], arc: string): RoleProfile => ({ id, summary, responsibilities, works, arc });

const SECURITY_PLUS: RoleContent = {
  MOTION: { ...DEFAULT_MOTION, stagger: 'swap' },
  PROFILES: [
    p('red', 'commands', 'Finds and proves the weaknesses in the in-scope hosts before a real attacker does.', ['Reconnaissance and enumeration', 'Vulnerability discovery', 'Authorized exploitation with proof', 'Penetration test report'], 'Week 1 reconnaissance; Week 2 vulnerability discovery; Week 3 authorized attacks with evidence; Week 4 technical findings briefing.'),
    p('blue', 'both', 'Hardens the hosts, watches for the attack and responds when it lands.', ['Host hardening baseline', 'Detection engineering', 'Live detection and containment', 'Incident report'], 'Week 1 hardens Ubuntu and Windows; Week 2 baseline capture and detections; Week 3 detects and contains the breach; Week 4 reports the incident.'),
    p('grc', 'documents', 'Sets the rules, scores the risk and turns the team’s work into the reports a client reads.', ['Scope and rules of engagement', 'Asset inventory and risk register', 'Policy and response runbook', 'Final report and briefing'], 'Week 1 framework mapping and hardening standard; Week 2 risk register and vulnerability SOP; Week 3 response runbook and custody; Week 4 final report.'),
  ],
};

const CYSA_PLUS: RoleContent = {
  MOTION: { ...DEFAULT_MOTION, stagger: 'swap' },
  PROFILES: [
    p('blue', 'both', 'Watches the alerts and decides what is real, what is noise and what to escalate.', ['Sensor deployment and baseline', 'Alert triage', 'Known-vulnerability review', 'Incident detection'], 'Week 1 deploys the sensor and writes the baseline; Week 2 triages the alerts; Week 3 reads the known vulnerabilities; Week 4 finds the incident.'),
    p('grc', 'both', 'Digs into suspicious activity in logs and packets and proves what happened.', ['Coverage validation', 'Investigation and packet capture', 'Scan validation', 'Attack timeline and debrief'], 'Week 1 validates every data source; Week 2 investigates and captures packets; Week 3 scans from the attacker side; Week 4 attack timeline and debrief.'),
    p('red', 'both', 'Contains the attack, keeps the evidence clean and writes the report leadership reads.', ['Endpoint sensor deployment', 'Indicator database', 'Risk ranking and fix plan', 'Containment, evidence and report'], 'Week 1 Windows sensor; Week 2 findings into indicators; Week 3 risk ranking and fix plan; Week 4 containment, evidence and report.'),
  ],
};

const MSSP: RoleContent = {
  MOTION: { ...DEFAULT_MOTION, stagger: 'swap' },
  PROFILES: [
    p('red', 'commands', 'Tests the in-scope systems and hands the gaps to governance for the audit.', ['Attack-surface assessment', 'Control threat modelling', 'Penetration test and retest', 'Attestation of closure'], 'Phase 1 attack-surface assessment; Phase 2 threat model of the controls; Phase 3 penetration test and retest; Phase 4 close-out and attestation.'),
    p('blue', 'both', 'Stands up detections for the client and proves they work with measured response times.', ['Logging and sensors', 'CIS baseline gap scan', 'Technical control implementation', 'Detection metrics'], 'Phase 1 baseline gap scan; Phase 2 technical controls; Phase 3 detection engineering; Phase 4 detection and response metrics.'),
    p('grc', 'documents', 'Owns the scope, the risk, the controls and the evidence spine the auditor reads.', ['Engagement and statement of applicability', 'Control matrix', 'Internal audit', 'Audit evidence packet'], 'Phase 1 risk assessment and statement of applicability; Phase 2 control matrix; Phase 3 validation and evidence; Phase 4 internal audit and evidence packet.'),
  ],
};

const SERVER_PLUS: RoleContent = {
  MOTION: DEFAULT_MOTION,
  PROFILES: [
    p('net', 'both', 'Leads the network record: cabling, addressing, topology and the proof that it all connects.', ['Cabling and port plan', 'Bridges and NIC mapping', 'Routing and published ports', 'Connectivity proof'], 'Week 1 cabling and port plan; Week 2 bridges and NIC mapping; Week 3 routing and published ports; Week 4 recovery of the network path.'),
    p('win', 'both', 'Leads the Windows record: the Server VM, its roles, its patching and its restore.', ['Windows baseline', 'Directory, DNS and DHCP', 'Patching and restore', 'Operating procedures'], 'Week 1 requirements; Week 2 baseline captured; Week 3 procedures, password policy and DHCP scope; Week 4 patching and the restore.'),
    p('lnx', 'both', 'Leads the Linux record: the hypervisor, the Linux VM, its services and its snapshots.', ['Firmware and virtualization', 'Hypervisor and Linux baseline', 'Networking and persistence', 'Allow-list and snapshot restore'], 'Week 1 firmware and virtualization flags; Week 2 hypervisor and Linux baseline; Week 3 netplan and persistence; Week 4 allow-list and snapshot restore.'),
    p('mgmt', 'documents', 'Leads the records that outlive the build: requirements, assets, change control and the handover.', ['Business requirements', 'Rack and asset record', 'Change control', 'As-built handover package'], 'Week 1 compliance and SLA mapping; Week 2 naming standard; Week 3 change control with an approver; Week 4 the numbers and the handover.'),
  ],
};

const CCNA: RoleContent = {
  MOTION: DEFAULT_MOTION,
  PROFILES: [
    p('arch', 'documents', 'Owns the requirements, the design and the addressing plan, and reviews every change for design fit.', ['Kit register and requirements', 'High-level and low-level design', 'Second-building design', 'Network handover'], 'Week 0 kit and requirements; Week 1 discovery and design; Week 3 the second building; Week 8 handover of the network.'),
    p('impl', 'commands', 'Builds the switches, the VLANs, the routing and the wireless, and reviews the configuration itself.', ['Switch bring-up', 'VLANs and inter-VLAN routing', 'Internet edge', 'Wireless build'], 'Week 1 first switches up; Week 2 departments cut and routed; Week 3 one way out to the internet; Week 4 WLANs on the air.'),
    p('ops', 'both', 'Runs the network: monitoring, backups, tickets and change records, and reviews the rollback on every change.', ['Resilience test', 'Source of truth and backups', 'Monitoring and NOC', 'Tickets and change records'], 'Week 2 survives a pulled cable; Week 5 source of truth and backups; Week 6 small NOC and tickets; Week 8 works a real fault.'),
    p('auto', 'commands', 'Turns policy into access lists, hardens the management plane and configures from the source of truth.', ['Access-list policy', 'Management-plane hardening', 'Network as data', 'Configuration from source'], 'Week 4 access lists and the management plane; Week 7 the network as data and configuration from the source of truth.'),
  ],
};

const SECAI_PLUS: RoleContent = {
  MOTION: { ...DEFAULT_MOTION, stagger: 'swap' },
  PROFILES: [
    p('redteam', 'both', 'Tests the Hub’s AI on a dedicated instance and proves each attack case with evidence.', ['Baseline transcripts', 'Attack casebook', 'Automated test suite', 'Reproduction and paper cases'], 'Week 1 two cases proven; Week 2 six cases and a threat model; Week 3 automated suite; Week 4 reproduction and four paper cases.'),
    p('defender', 'both', 'Builds the controls, the logging and the alerts that stop and catch each case.', ['Attempt logging', 'Guardrails and redaction', 'Pipeline gates and alerts', 'Clean rebuild and monitoring'], 'Week 1 closes SA-1 and logs every attempt; Week 2 guardrails and redaction; Week 3 pipeline gates and alerts; Week 4 clean rebuild and handover.'),
    p('governance', 'both', 'Maps the system, owns the risks and the rules, and signs each release.', ['Lab rule and evidence ledger', 'System map and governance pack', 'Data map and compliance', 'Release notes and sign-off'], 'Week 1 system map and v1 sign-off; Week 2 data and compliance; Week 3 shadow AI and accuracy; Week 4 risk acceptance and customer answers.'),
  ],
};

const CISSP: RoleContent = {
  MOTION: { ...DEFAULT_MOTION, stagger: 'swap' },
  PROFILES: [
    p('govrisk', 'documents', 'Writes governance, assets, risk and the maturity score, and assembles the system security plan.', ['Governance and risk sheets', 'Supplier and migration proof', 'Control assessment', 'System security plan'], 'Week 1 governance and first score; Week 2 risk and metrics; Week 3 suppliers and migration; Week 4 categorization; Week 5 assessment; Week 6 SSP.'),
    p('archnet', 'both', 'Designs the cloud, the network zones and the change pipeline, and proves them with scans.', ['Architecture and network sheets', 'Cryptography and rule base', 'Pipeline and component proof', 'Federal mapping'], 'Week 1 architecture and network; Week 2 cryptography and rules; Week 3 pipeline proof; Week 4 AI controls; Week 5 re-test; Week 6 federal mapping.'),
    p('idops', 'both', 'Runs identity, access, logging, incident response and recovery, and proves each with a drill.', ['Identity and operations sheets', 'Access, recovery and response', 'MFA and federation proof', 'Tabletop and incident reporting'], 'Week 1 identity and operations; Week 2 access and recovery; Week 3 MFA and federation; Week 4 detection, restore; Week 5 tabletop; Week 6 reporting.'),
  ],
};

const CLOUD: RoleContent = {
  MOTION: DEFAULT_MOTION,
  PROFILES: [
    p('arch', 'documents', 'Sets the standards, owns the cost and the design, and assembles each week’s document.', ['Standards and budget', 'Architecture and cost', 'Access and network design', 'Infrastructure map and handover'], 'Standards and budget; architecture and cost; access and network design; infrastructure-as-code map; handover.'),
    p('infra', 'commands', 'Builds the network, the virtual machine, the data store and, later, the template that rebuilds them.', ['Network and virtual machine', 'Database and alerts', 'Subnets, disks and snapshots', 'Template rebuild'], 'Network; virtual machine; database; alerts; subnets and disks; snapshots; infrastructure as code; rebuild from the template.'),
    p('dev', 'both', 'Ships the website, the serverless API and the pipeline that deploys them.', ['Repository and website', 'Serverless API', 'Identity and patching', 'Deploy from code'], 'Repository; website; API; debugging; identity; patching; restores; deploy from code; CI/CD.'),
    p('secops', 'both', 'Locks access down, proves what must fail does fail, and works the incidents.', ['Firewall and access rules', 'Denial proofs', 'Incident and recovery drills', 'Identity federation and posture'], 'Firewall; SSH from one address; CORS; incident; denials; no open ports; drills; OIDC; posture.'),
  ],
};

const CLOUD_IDS = ['azure-fundamentals', 'azure-administrator', 'azure-devops', 'aws-cloud-practitioner', 'aws-solutions-architect', 'aws-devops'];

export const ROLE_CONTENT: Record<string, RoleContent> = {
  'security-plus': SECURITY_PLUS,
  'cysa-plus': CYSA_PLUS,
  mssp: MSSP,
  'server-plus': SERVER_PLUS,
  ccna: CCNA,
  'secai-plus': SECAI_PLUS,
  cissp: CISSP,
  ...Object.fromEntries(CLOUD_IDS.map((id) => [id, CLOUD])),
};

const EMPTY: RoleContent = { PROFILES: [], MOTION: DEFAULT_MOTION };

/** The role content of a course; a course without any gets no profiles and the default motion. */
export function roleContentFor(courseId: string): RoleContent {
  return ROLE_CONTENT[courseId] ?? EMPTY;
}

export function profileOf(profiles: RoleProfile[], id: string): RoleProfile | undefined {
  return profiles.find((x) => x.id === id);
}

/** 'Offensive Security (Red Team)' → { fn: 'Offensive Security', tag: 'Red Team' }; 'Student' → { fn: 'Student' }. */
export function splitRoleName(name: string): { fn: string; tag?: string } {
  const m = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(name);
  return m ? { fn: m[1], tag: m[2] } : { fn: name.trim() };
}
