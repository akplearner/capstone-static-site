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

export function roleGuide(roleId: string): RoleGuide {
  return GUIDES[roleId] ?? FALLBACK;
}

/** Short "you mostly …" label for the role. */
export function worksLabel(works: RoleGuide['works']): string {
  if (works === 'commands') return 'You mostly run commands in a terminal.';
  if (works === 'documents') return 'You mostly author documents (no terminal needed).';
  return 'You both run commands and author documents.';
}
