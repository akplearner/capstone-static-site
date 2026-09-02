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
  'cysa-plus': {
    blue: {
      blurb: 'Tier 1 · SOC Analyst — you watch the alerts and decide what’s real, what’s noise, and what to escalate.',
      works: 'both',
      arc: 'Wk1 stand up monitoring & baseline → Wk2 triage the alerts → Wk3 read the known vulnerabilities → Wk4 find the incident and mark its start.',
      handsOffTo: 'the Threat Hunter (the alerts worth investigating)',
      waitsOnFrom: 'nobody \u2014 you install and verify your own Ubuntu sensor',
    },
    grc: {
      blurb: 'Tier 2 · Threat Hunter — you dig into the suspicious activity in logs and packets and prove what actually happened.',
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
};

export function roleGuide(roleId: string, courseId?: string): RoleGuide {
  if (courseId && BY_COURSE[courseId]?.[roleId]) return BY_COURSE[courseId][roleId];
  return GUIDES[roleId] ?? FALLBACK;
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
export function hasSpecificGuide(roleId: string, courseId?: string): boolean {
  return !!((courseId && BY_COURSE[courseId]?.[roleId]) || GUIDES[roleId]);
}

/** Short "you mostly …" label for the role. */
export function worksLabel(works: RoleGuide['works']): string {
  if (works === 'commands') return 'You mostly run commands in a terminal.';
  if (works === 'documents') return 'You mostly author documents (no terminal needed).';
  return 'You both run commands and author documents.';
}
