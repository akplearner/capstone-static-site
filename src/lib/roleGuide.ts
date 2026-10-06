/**
 * Per-role plain-English guidance shown at join, on the dashboard, and in
 * onboarding. The four-word `RoleDef.mission` is too terse for a beginner to
 * choose a role or know what their week-by-week job is — this fills that gap.
 * Keyed by role id (red/blue/grc); `get` falls back to a generic entry so any
 * course still works.
 */
export interface RoleGuide {
  /** One sentence: what this role is, in human terms. */
  blurb: string;
  /** Whether the role mostly runs commands or authors documents. */
  works: 'commands' | 'documents' | 'both';
  /** The week-by-week arc, one short line. */
  arc: string;
  /** Who this role hands work to. */
  handsOffTo: string;
  /** Who this role depends on. */
  waitsOnFrom: string;
}

const GUIDES: Record<string, RoleGuide> = {
  red: {
    blurb: 'You’re the ethical attacker — you find and prove the weaknesses before a real attacker does.',
    works: 'commands',
    arc: 'Wk1 recon → Wk2 scan for weaknesses → Wk3 exploit with proof → Wk4 write up findings.',
    handsOffTo: 'GRC (your findings) and Blue (your attack evidence)',
    waitsOnFrom: 'GRC (the signed scope that authorizes testing)',
  },
  blue: {
    blurb: 'You’re the defender — you harden the systems, watch for the attack, and respond when it happens.',
    works: 'both',
    arc: 'Wk1 harden the hosts → Wk2 set up monitoring → Wk3 detect & contain the attack → Wk4 report the incident.',
    handsOffTo: 'GRC (what you hardened and the incident write-up)',
    waitsOnFrom: 'GRC (the hardening standard) and Red (the attack to detect)',
  },
  grc: {
    blurb: 'You’re governance — you set the rules, score the risk, and turn everyone’s work into the reports.',
    works: 'documents',
    arc: 'Wk1 scope & asset inventory → Wk2 risk register → Wk3 policy & response plan → Wk4 final report & briefing.',
    handsOffTo: 'Red & Blue (scope, standards) and leadership (the final report)',
    waitsOnFrom: 'Red (findings) and Blue (hardening & incident details)',
  },
};

const FALLBACK: RoleGuide = {
  blurb: 'Your role in the engagement — work the weekly tasks and produce your deliverables.',
  works: 'both',
  arc: 'Work each week’s tasks in order and hand your outputs to the team.',
  handsOffTo: 'your teammates',
  waitsOnFrom: 'your teammates',
};

// Per-course overrides. The default GUIDES describe the Security+ Red/Blue/GRC
// engagement; other courses reuse the same role ids with different meaning, so
// give them their own blurbs (keyed by courseId → roleId).
const BY_COURSE: Record<string, Record<string, RoleGuide>> = {
  'secai-plus': {
    redteam: {
      blurb: 'AI Red Team — you test the Hub’s AI on your own instance and prove each case with evidence.',
      works: 'both',
      arc: 'Wk1 two cases → Wk2 six cases mapped → Wk3 automate the suite → Wk4 reproduce and four paper cases.',
      handsOffTo: 'the AI Defender (what to block and log)',
      waitsOnFrom: 'the Governance Lead (the signed lab rule)',
    },
    defender: {
      blurb: 'AI Defender — you build the controls, logging and alerts that stop and catch each case.',
      works: 'both',
      arc: 'Wk1 close SA-1, log everything → Wk2 guardrails and redaction → Wk3 pipeline gates and alerts → Wk4 rebuild clean and hand over.',
      handsOffTo: 'the Governance Lead (controls for the register)',
      waitsOnFrom: 'the AI Red Team (the proven cases)',
    },
    governance: {
      blurb: 'AI Governance Lead — you map the system, own the risks and rules, and sign each release.',
      works: 'both',
      arc: 'Wk1 map and sign v1 → Wk2 data and compliance → Wk3 shadow AI and accuracy → Wk4 accept risks and answer customers.',
      handsOffTo: 'the customer (evidence-backed answers)',
      waitsOnFrom: 'both teammates (cases and controls for the release)',
    },
  },
  cissp: {
    govrisk: {
      blurb: 'Governance & Risk — policy, assets, risk and the maturity score: the program’s spine.',
      works: 'both',
      arc: 'Wk1 document → Wk2 specify and score → Wk3 suppliers and migration → Wk4 categorize → Wk5 assess → Wk6 federal-ready.',
      handsOffTo: 'the customer and the contracting officer (evidence)',
      waitsOnFrom: 'both teammates (their mappings and proofs)',
    },
    archnet: {
      blurb: 'Architecture & Network — the cloud design, the network zones and the change pipeline.',
      works: 'both',
      arc: 'Wk1 draw it → Wk2 crypto and rules → Wk3 prove pipeline, TLS, segmentation → Wk4 AI gateway → Wk5 re-test → Wk6 federal.',
      handsOffTo: 'Governance (federal mappings for the SSP)',
      waitsOnFrom: 'Governance (the asset inventory)',
    },
    idops: {
      blurb: 'Identity & Operations — identity, access, logging, incident response and recovery.',
      works: 'both',
      arc: 'Wk1 access and logging → Wk2 recovery targets → Wk3 MFA and federation → Wk4 detection and restore → Wk5 tabletop → Wk6 federal reporting.',
      handsOffTo: 'Governance (incident reporting for the SSP)',
      waitsOnFrom: 'Architecture (the zones to operate in)',
    },
  },
  'cysa-plus': {
    blue: {
      blurb: 'Tier 1 · SOC Analyst — you watch the alerts and decide what’s real, what’s noise, and what to escalate.',
      works: 'both',
      arc: 'Wk1 stand up monitoring & baseline → Wk2 triage the alerts → Wk3 read the known vulnerabilities → Wk4 find the incident, mark its start.',
      handsOffTo: 'the Threat Hunter (the alerts worth investigating)',
      waitsOnFrom: 'nobody \u2014 you install and verify your own Ubuntu sensor',
    },
    grc: {
      blurb: 'Tier 2 · Threat Hunter — you dig into suspicious activity in logs and packets and prove what happened.',
      works: 'both',
      arc: 'Wk1 confirm every data source reports → Wk2 investigate & capture packets → Wk3 scan to confirm the weaknesses → Wk4 rebuild the attack timeline.',
      handsOffTo: 'the Incident Responder (indicators & the timeline)',
      waitsOnFrom: 'the SOC Analyst (the alerts to chase)',
    },
    red: {
      blurb: 'Tier 3 · Incident Responder — you contain the attack, keep the evidence clean, and write the report leadership reads.',
      works: 'both',
      arc: 'Wk1 deploy the agents → Wk2 turn findings into indicators → Wk3 rank the risk & fix plan → Wk4 contain, preserve evidence, and report.',
      handsOffTo: 'leadership (the incident report & executive summary)',
      waitsOnFrom: 'the SOC Analyst & Threat Hunter (alerts, indicators, timeline)',
    },
  },
  mssp: {
    red: {
      blurb: 'Offensive Security — you test the in-scope systems and feed the gaps to GRC.',
      works: 'commands',
      arc: 'Scope → attack-surface & validation testing → retest the fixes → evidence for the audit.',
      handsOffTo: 'GRC (findings & retest results)',
      waitsOnFrom: 'GRC (the signed scope)',
    },
    blue: {
      blurb: 'MDR / Detection & Response — you stand up detections and prove they work with real metrics.',
      works: 'both',
      arc: 'Baseline → implement controls & detections → validate & measure (MTTD/MTTR) → detection evidence.',
      handsOffTo: 'GRC (control & detection evidence)',
      waitsOnFrom: 'GRC (the Statement of Applicability)',
    },
    grc: {
      blurb: 'GRC / vCISO — you own scope, risk, controls, and the audit-evidence spine.',
      works: 'documents',
      arc: 'Engagement & SoA → control matrix → internal audit → assemble the evidence package.',
      handsOffTo: 'Red & Blue (scope & controls) and the auditor (the evidence)',
      waitsOnFrom: 'Red & Blue (findings & control evidence)',
    },
  },
  // The cloud capstones (R87): same four roles on both platforms; each has
  // its own task every week, so nobody waits on anybody to start.
  ...Object.fromEntries(
    ['azure-fundamentals', 'azure-administrator', 'azure-devops', 'aws-cloud-practitioner', 'aws-solutions-architect', 'aws-devops'].map((id) => [
      id,
      {
        arch: {
          blurb: 'Cloud Architect — you set the standards, own the cost and the design, and assemble each week’s document.',
          works: 'documents',
          arc: 'Standards & budget → architecture & cost → access & network design → IaC map → handover.',
          handsOffTo: 'the whole team (the standard every resource follows)',
          waitsOnFrom: 'nobody to start — each role fills its own section',
        },
        infra: {
          blurb: 'Infrastructure Admin — you build the network, the VM, the data store and, later, the template.',
          works: 'commands',
          arc: 'Network → VM → database → alerts → subnets & disks → snapshots → IaC → rebuild from the template.',
          handsOffTo: 'App & DevOps (the resources they deploy onto)',
          waitsOnFrom: 'nobody to start — your task stands alone each week',
        },
        dev: {
          blurb: 'App & DevOps — you ship the website, the serverless API and the pipeline that deploys them.',
          works: 'both',
          arc: 'Repo → website → API → debugging → identity → patching → restores → deploy from code → CI/CD.',
          handsOffTo: 'Security & Ops (the endpoints to lock down)',
          waitsOnFrom: 'nobody to start — your task stands alone each week',
        },
        secops: {
          blurb: 'Security & Ops — you lock access down, prove what must fail does fail, and work the incidents.',
          works: 'both',
          arc: 'Firewall → SSH from your IP → CORS → incident → denials → no open ports → drills → OIDC → posture.',
          handsOffTo: 'the Architect (findings for the document)',
          waitsOnFrom: 'nobody to start — your task stands alone each week',
        },
      } satisfies Record<string, RoleGuide>,
    ])
  ),
};

/**
 * The guides written for one course, keyed by role id — the generic
 * Red/Blue/GRC set under any per-course override. This is the data the course
 * document carries (`dto.roleGuide`, R78-D); a role absent from it has no
 * specific guide.
 */
export function roleGuidesFor(courseId: string): Record<string, RoleGuide> {
  return { ...GUIDES, ...(BY_COURSE[courseId] ?? {}) };
}

/** The guide for a role, from a map the caller read off the document. */
export function roleGuide(guides: Record<string, RoleGuide>, roleId: string): RoleGuide {
  return guides[roleId] ?? FALLBACK;
}

/**
 * Whether a role has its OWN written guide, as opposed to the generic fallback.
 *
 * The join picker needs this distinction: Server+ role ids (net/win/lnx/mgmt)
 * match nothing here, so all four roles rendered the identical fallback blurb —
 * 44 words of undifferentiated text at the exact moment a student chooses, while
 * each role's authored `mission` (the sentence that actually distinguishes them)
 * sat unused 400px lower on the page. When this is false the picker shows the
 * mission instead.
 */
export function hasSpecificGuide(guides: Record<string, RoleGuide>, roleId: string): boolean {
  return roleId in guides;
}

/** Short "you mostly …" label for the role. */
export function worksLabel(works: RoleGuide['works']): string {
  if (works === 'commands') return 'You mostly run commands in a terminal.';
  if (works === 'documents') return 'You mostly author documents (no terminal needed).';
  return 'You both run commands and author documents.';
}
