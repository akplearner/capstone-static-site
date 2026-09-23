'use client';

import { useClientStore, notifyStore } from './useClientStore';
import { labAccessRepo, progressRepo } from './data';
import { HOST, OPS } from './serverTopology';
import { device, mgmtAddress } from './ccnaTopology';
import { IAC_TOOL_KEY, IAC_TOOLS, iacToolOf, type IacTool } from './iacTool';

// Personal lab access: the target IPs/credentials each student gets from their
// instructor, plus a quick reachability checklist. Values are substituted into
// command placeholders so copy-paste "just works".
//
// This is saved to the student's ACCOUNT when signed in, so their lab details
// follow them between devices, and to localStorage otherwise. It is the only
// student data that is owner-only in the database — not teammates, not
// instructors — because the notes field is where lab passwords end up. See
// supabase/migrations/0002_student_state.sql.

export interface LabAccess {
  values: Record<string, string>;
  checks: Record<string, boolean>;
  notes: string;
}

const EMPTY: LabAccess = { values: {}, checks: {}, notes: '' };

// Fields the student fills; `tokens` are the placeholders replaced in commands.
export interface LabField {
  key: string;
  label: string;
  placeholder: string;
  /** Placeholders replaced in commands. A field with none is a preference, not a substitution. */
  tokens: string[];
  /** A `select` renders a fixed choice instead of a text box. */
  kind?: 'text' | 'select';
  options?: { value: string; label: string }[];
}

export const LAB_FIELDS: LabField[] = [
  { key: 'YOUR_TARGET_IP', label: 'Your target IP', placeholder: 'e.g. 10.10.100.7', tokens: ['<YOUR_TARGET_IP>', '10.10.100.X', '10.10.100.x'] },
  { key: 'UBUNTU_IP', label: 'Ubuntu host IP', placeholder: 'e.g. 10.10.100.7', tokens: ['<UBUNTU_IP>'] },
  { key: 'WINDOWS_IP', label: 'Windows host IP', placeholder: 'e.g. 10.10.20.7', tokens: ['<WINDOWS_IP>'] },
  // The attacker is always Kali. The lowercase spellings are the ones the course
  // prose actually uses, and they were silently never substituted before.
  { key: 'ATTACKER_IP', label: 'Your Kali (attacker) IP', placeholder: 'e.g. 10.10.30.7', tokens: ['<ATTACKER_IP>', '<kali-ip>', '<attacker-ip>'] },
  { key: 'TEAM_NUM', label: 'Your team number', placeholder: 'e.g. 7', tokens: ['<#>', '<team>'] },
];

export const LAB_CHECKS: { key: string; label: string }[] = [
  { key: 'kali', label: 'Kali boots and is fully updated' },
  { key: 'target', label: 'Target answers a ping' },
  { key: 'dvwa', label: 'DVWA loads in a browser' },
  { key: 'scope', label: 'Read the Rules of Engagement (authorized scope)' },
];

/**
 * The build course's three numbers.
 *
 * Server+ has no target range, but it does have the one thing this mechanism
 * exists for: an address that is different for every team and appears in the
 * commands they copy. The course prints the RULE — 10.10.30.T — everywhere, and
 * a student had to substitute their own team number by hand each time. Both
 * spellings are registered as tokens, so the rule in a command becomes their
 * own address, while the rule in the surrounding prose stays a rule.
 *
 * `<tailscale-ip>` is the spelling the Week-1 remote-access step and its guide
 * procedure already use; registering it here is what makes them fill in.
 *
 * The third is Week 7's ops subnet, `10.20.T` — three octets, because the
 * fourth is the machine's. It is a substring of every ops address a Week 7–8
 * command names (`10.20.T.30`, `10.20.T.1`), and of no Core address (those sit
 * in `10.20.0.`), so a plain split/join fills exactly the team's block.
 */
export const SERVER_FIELDS: typeof LAB_FIELDS = [
  { key: 'PVE_HOST', label: 'Your Proxmox host address', placeholder: `e.g. ${HOST.exampleAddress}`, tokens: ['<PVE_HOST>', HOST.rule] },
  { key: 'PVE_TAILSCALE', label: 'Your host’s Tailscale address', placeholder: 'e.g. 100.101.102.103', tokens: ['<PVE_TAILSCALE>', '<tailscale-ip>'] },
  { key: 'OPS_SUBNET', label: 'Your ops subnet (Weeks 7–8)', placeholder: 'e.g. 10.20.7 — three octets', tokens: ['<OPS_SUBNET>', OPS.team.rule] },
  // Not a substitution — a preference. Weeks 6–8 are written for Terraform;
  // a team on OpenTofu picks it here and every terraform line becomes tofu
  // (src/lib/iacTool.ts). No tokens, so fillPlaceholders never sees it.
  {
    key: IAC_TOOL_KEY,
    label: 'Infrastructure-as-code tool (Weeks 6–8)',
    placeholder: '',
    tokens: [],
    kind: 'select',
    options: [
      { value: 'terraform', label: `${IAC_TOOLS.terraform.name} (HashiCorp)` },
      { value: 'opentofu', label: `${IAC_TOOLS.opentofu.name} (open-source fork)` },
    ],
  },
];

/**
 * The CCNA capstone's lab.
 *
 * Its addressing is a WORKED EXAMPLE rather than a per-team rule (each team has
 * its own bench or its own emulator instance, not a slice of a shared range), so
 * there is only one address to substitute — the management address a team really
 * gave its first switch. The other two are preferences with no tokens: the path
 * and the emulator, which decide which procedure a week hands you, the same way
 * the IaC tool choice does for Server+.
 */
/** The example the placeholder shows: the first access switch's management
 *  address, read from the model rather than typed beside it. */
const CCNA_EXAMPLE_MGMT = mgmtAddress(device('SW-ACC-01'))!;

export const CCNA_FIELDS: typeof LAB_FIELDS = [
  {
    key: 'CCNA_MGMT',
    label: 'Your first switch’s management address',
    placeholder: `e.g. ${CCNA_EXAMPLE_MGMT}`,
    tokens: ['<CCNA_MGMT>', '<SWITCH_MGMT>'],
  },
  {
    key: 'CCNA_PATH',
    label: 'How your build runs',
    placeholder: '',
    tokens: [],
    kind: 'select',
    options: [
      { value: 'emulated', label: 'Emulated — the topology runs as software' },
      { value: 'physical', label: 'Physical kit — real switches and routers' },
    ],
  },
  {
    key: 'CCNA_EMULATOR',
    label: 'Which emulator',
    placeholder: '',
    tokens: [],
    kind: 'select',
    options: [
      { value: 'packet-tracer', label: 'Cisco Packet Tracer' },
      { value: 'cml', label: 'Cisco Modeling Labs' },
      { value: 'gns3', label: 'GNS3' },
      { value: 'containerlab', label: 'containerlab' },
      { value: 'none', label: 'None — hardware only' },
    ],
  },
];

export const CCNA_CHECKS: typeof LAB_CHECKS = [
  { key: 'prompt', label: 'You can reach a device prompt — console, SSH or the emulator' },
  { key: 'register', label: 'Every device you have is a row in the Kit & Capability Register' },
  { key: 'capabilities', label: 'Each capability is answered Yes or No, with the output that proves it' },
];

export const SERVER_CHECKS: typeof LAB_CHECKS = [
  { key: 'console', label: 'The Proxmox console answers on campus' },
  { key: 'remote', label: 'It answers from off campus over Tailscale' },
  { key: 'named', label: 'You sign in with your own account, not root' },
];

/**
 * Every field the substitution walks, whatever course a command belongs to.
 *
 * `fillPlaceholders` and `hasUnfilled` read THIS, not a course profile: a token
 * is a token wherever it appears, and a field that lived only inside a profile
 * would render an input the filler never looked at — a box that silently does
 * nothing. The profile below governs the FORM; this governs substitution.
 */
const ALL_FIELDS = [...LAB_FIELDS, ...SERVER_FIELDS, ...CCNA_FIELDS];

/**
 * What a given course's lab actually consists of.
 *
 * The two lists above describe the attack-and-defend lab the security courses
 * run: a Kali attacker, a DVWA target, a Windows and an Ubuntu host. They were
 * rendered on EVERY course, so a Server+ student building a rack-mount server
 * was asked for "Your Kali (attacker) IP" and told to confirm "DVWA loads in a
 * browser" — for a course that has no attacker, no DVWA, and no commands at all.
 *
 * A course therefore declares its own profile. The default is the security lab,
 * so Security+/CySA+/MSSP are unchanged; a course with an empty profile has no
 * lab access to collect and the panel does not render for it at all.
 *
 * Note this only governs the FORM. `fillPlaceholders` and `hasUnfilled` work off
 * ALL_FIELDS, because a token is a token whatever course it appears in — and any
 * course that stops using one simply never renders it.
 */
export interface LabProfile {
  fields: typeof LAB_FIELDS;
  checks: typeof LAB_CHECKS;
  /** Panel heading. The default names targets, which a build course has none of. */
  title?: string;
  /** The one sentence under the heading. */
  intro?: string;
}

const LAB_PROFILES: Record<string, LabProfile> = {
  // A build course has no target range — but it does have one address per team
  // and one Tailscale address per host, both of which appear in commands the
  // student copies. That is exactly what this panel is for, so the course
  // collects those two rather than nothing. It asked for "Your Kali (attacker)
  // IP" before the profiles existed, which is why it briefly collected nothing
  // at all.
  'server-plus': {
    fields: SERVER_FIELDS,
    checks: SERVER_CHECKS,
    title: 'Your server — addresses & reachability',
    intro: `Enter your own host addresses and every command below fills them in for you, instead of the ${HOST.rule} rule — and pick which IaC tool every Week 5–6 line uses. Saved to your account, visible only to you.`,
  },
  // The network course collects one address and two decisions. The decisions are
  // what matter: they pick which procedure each later week gives you.
  ccna: {
    fields: CCNA_FIELDS,
    checks: CCNA_CHECKS,
    title: 'Your lab — the kit and how you reach it',
    intro:
      'Say whether you are emulating or on real hardware, and give the management address you actually set. Your Week-0 register decides which procedure each week hands you. Saved to your account, visible only to you.',
  },
};

export function labProfile(courseId: string): LabProfile {
  return LAB_PROFILES[courseId] ?? { fields: LAB_FIELDS, checks: LAB_CHECKS };
}

/** True when the course collects any lab access at all. The panel is skipped
 *  entirely when false — an empty card with a heading is worse than no card. */
export function hasLabAccess(courseId: string): boolean {
  const p = labProfile(courseId);
  return p.fields.length > 0 || p.checks.length > 0;
}

/** The member this data belongs to. Derived here rather than threaded through
 *  every caller, so the public API stays `getLabAccess(courseId)` and no call
 *  site changed when this moved off localStorage. Both repo implementations
 *  expose the same context, and the Supabase one ignores the id in favour of the
 *  authenticated session. */
function memberIdFor(courseId: string): string {
  return progressRepo.getContext(courseId)?.memberId ?? 'guest';
}

export function getLabAccess(courseId: string): LabAccess {
  if (typeof window === 'undefined') return EMPTY;
  const stored = labAccessRepo.get(courseId, memberIdFor(courseId));
  // Spread over EMPTY so a row written before a field existed still parses.
  return stored ? { ...EMPTY, ...stored } : EMPTY;
}

export function saveLabAccess(courseId: string, data: LabAccess): void {
  if (typeof window === 'undefined') return;
  labAccessRepo.save(courseId, memberIdFor(courseId), data);
  notifyStore();
}

export function useLabAccess(courseId: string): LabAccess {
  return useClientStore<LabAccess>(() => getLabAccess(courseId), EMPTY);
}

/** Terraform unless the student chose OpenTofu in Lab access. */
export function useIacTool(courseId: string): IacTool {
  return useClientStore<IacTool>(() => iacToolOf(getLabAccess(courseId).values), 'terraform');
}

/** Replace lab placeholders (e.g. <YOUR_TARGET_IP>, 10.10.100.X) with the student's
 *  values. Only known tokens are touched; literal example IPs are left alone. */
export function fillPlaceholders(text: string, values: Record<string, string>): string {
  let out = text;
  for (const f of ALL_FIELDS) {
    const val = values[f.key]?.trim();
    if (!val) continue;
    for (const tok of f.tokens) out = out.split(tok).join(val);
  }
  return out;
}

/** True if the text still carries a lab placeholder: the general UPPER_SNAKE
 *  angle form, or any token a field declares literally. Deriving the second half
 *  from LAB_FIELDS means it can never drift from the actual tokens (e.g. a
 *  subnet rename like 10.10.10.X → 10.10.100.X, or the lowercase spellings
 *  <kali-ip> / <team> / <#> that the prose actually uses). */
export function hasUnfilled(text: string): boolean {
  // UPPER_SNAKE only. A placeholder is written in caps by convention; a
  // lowercase angle word is markup, and matching it flagged real config as
  // unfilled — <html>/<body>/<h1> in the NGINX welcome-page command, and every
  // <ossec_config> / <localfile> / <log_format> in the Wazuh XML, each shown to
  // the student as "this still shows a placeholder like 10.10.100.X". The
  // lowercase tokens that ARE placeholders are declared on a field, so they are
  // caught by the literal pass below rather than by guessing from shape.
  if (/<[A-Z][A-Z0-9_]*>/.test(text)) return true;
  return ALL_FIELDS.some((f) => f.tokens.some((tok) => text.includes(tok)));
}
