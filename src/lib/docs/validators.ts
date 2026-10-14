/**
 * R113 — validators: checks that read pasted output as STATE, not as tokens.
 *
 * Token matching (`scoreOutput`) asks whether expected substrings appear in a
 * paste. A validator parses the paste as the tool's own report of the system
 * and compares what it observes with what the step expects: the rules, not
 * the words. `22/tcp ALLOW IN Anywhere` carries every token a step about SSH
 * might list and is still the wrong firewall; a validator says so.
 *
 * It still reads text the member pasted, in the browser. It is not a lab
 * agent and proves nothing about the machine (the agent that reads real state
 * is Phase 2), and this round it is shown live in the verify box, not
 * recorded. Pure: no clock, no storage, no repository.
 */

export interface ValidatorResult {
  pass: boolean;
  /** What the paste shows, one fact per line, in a stable order. */
  observed: string[];
  /** What the step expects, one fact per line. */
  expected: string[];
  /** Why it does not pass, in plain words; empty when it passes. */
  problems: string[];
}

export interface Validator {
  id: string;
  label: string;
  /** Control codes the check evidences (ids in the controls registry). */
  controlIds: string[];
  run(ctx: { output: string; params?: Record<string, unknown> }): ValidatorResult;
}

/** A step's opt-in: which validator, and what it should expect. */
export interface StepValidator {
  id: string;
  params?: Record<string, unknown>;
}

// ── ufw-least-privilege ─────────────────────────────────────────────────────

/** What a host firewall should allow in: ports open to everyone, and ports open only to named sources. */
export interface UfwParams {
  public: string[];
  restricted?: Record<string, string[]>;
}

interface UfwRule {
  to: string;
  action: 'ALLOW' | 'LIMIT' | 'DENY' | 'REJECT';
  direction: 'IN' | 'OUT' | 'FWD';
  from: string;
}

const RULE_RE = /^(?:\[\s*\d+\]\s*)?(.+?)\s{2,}(ALLOW|LIMIT|DENY|REJECT)(?:\s+(IN|OUT|FWD))?\s{2,}(.+?)\s*$/;
const ANYWHERE = 'Anywhere';

/** `22/tcp (v6)` and `Anywhere (v6)` are the IPv6 twins of the same rule. */
const bare = (s: string) => s.replace(/\s*\(v6\)\s*/g, '').replace(/\s+on\s+\S+$/, '').trim();

/** Every rule line of `ufw status`, `ufw status numbered` or `ufw status verbose`, IPv4 and IPv6 folded together. */
export function parseUfw(output: string): { status: 'active' | 'inactive' | null; defaultIncoming: string | null; rules: UfwRule[] } {
  let status: 'active' | 'inactive' | null = null;
  let defaultIncoming: string | null = null;
  const seen = new Set<string>();
  const rules: UfwRule[] = [];
  for (const raw of output.split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, '').trimEnd();
    const st = line.match(/^\s*Status:\s*(active|inactive)\b/i);
    if (st) {
      status = st[1].toLowerCase() as 'active' | 'inactive';
      continue;
    }
    const def = line.match(/^\s*Default:\s*([a-z]+)\s*\(incoming\)/i);
    if (def) {
      defaultIncoming = def[1].toLowerCase();
      continue;
    }
    const m = line.match(RULE_RE);
    if (!m || /^\s*To\s/.test(line) || /^\s*--/.test(line)) continue;
    const rule: UfwRule = { to: bare(m[1]), action: m[2] as UfwRule['action'], direction: (m[3] as UfwRule['direction']) ?? 'IN', from: bare(m[4]) };
    const key = `${rule.to}|${rule.action}|${rule.direction}|${rule.from}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rules.push(rule);
  }
  return { status, defaultIncoming, rules };
}

const ruleText = (to: string, from: string) => `${to} from ${from}`;

const ufwLeastPrivilege: Validator = {
  id: 'ufw-least-privilege',
  label: 'Host firewall, least privilege',
  controlIds: ['CIS.4', 'NIST.800-53.SC-7', 'NIST.CSF.PR.PS'],
  run({ output, params }) {
    const p = (params ?? {}) as Partial<UfwParams>;
    const publicPorts = p.public ?? [];
    const restricted = p.restricted ?? {};
    const { status, defaultIncoming, rules } = parseUfw(output);
    const inbound = rules.filter((r) => (r.action === 'ALLOW' || r.action === 'LIMIT') && r.direction === 'IN');
    const problems: string[] = [];

    if (status !== 'active') problems.push(status === 'inactive' ? 'The firewall is inactive.' : 'No "Status: active" line: paste the output from its first line.');
    if (defaultIncoming && defaultIncoming !== 'deny' && defaultIncoming !== 'reject') problems.push(`The default for incoming traffic is ${defaultIncoming}, not deny.`);

    for (const r of inbound) {
      if (r.to === ANYWHERE) problems.push(`Every port is allowed from ${r.from}.`);
      else if (r.from === ANYWHERE && !publicPorts.includes(r.to)) problems.push(`${r.to} is open to everyone; only ${publicPorts.join(', ') || 'nothing'} should be.`);
      else if (r.from !== ANYWHERE && !(restricted[r.to] ?? []).includes(r.from)) problems.push(`${ruleText(r.to, r.from)} is not in the step's allow-list.`);
    }
    for (const port of publicPorts) {
      if (!inbound.some((r) => r.to === port && r.from === ANYWHERE)) problems.push(`${port} is not open to everyone.`);
    }
    for (const [port, sources] of Object.entries(restricted)) {
      for (const from of sources) if (!inbound.some((r) => r.to === port && r.from === from)) problems.push(`${ruleText(port, from)} is missing.`);
    }

    const observed = [
      `status ${status ?? 'not shown'}`,
      ...(defaultIncoming ? [`default incoming ${defaultIncoming}`] : []),
      ...inbound.map((r) => ruleText(r.to, r.from)).sort(),
    ];
    const expected = [
      'status active',
      ...publicPorts.map((port) => ruleText(port, ANYWHERE)),
      ...Object.entries(restricted).flatMap(([port, sources]) => sources.map((from) => ruleText(port, from))),
      'nothing else allowed in',
    ];
    return { pass: problems.length === 0, observed, expected, problems };
  },
};

export const VALIDATORS: Validator[] = [ufwLeastPrivilege];

export function validatorOf(id: string): Validator | undefined {
  return VALIDATORS.find((v) => v.id === id);
}

/** Run a step's validator over a paste; null when the step names none or an unknown id. */
export function runValidator(spec: StepValidator | undefined, output: string): (ValidatorResult & { label: string; id: string }) | null {
  if (!spec) return null;
  const v = validatorOf(spec.id);
  if (!v) return null;
  return { ...v.run({ output, params: spec.params }), label: v.label, id: v.id };
}
