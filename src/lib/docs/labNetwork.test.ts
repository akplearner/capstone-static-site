import { describe, it, expect } from 'vitest';
import { NETWORK } from './securityNetwork';
import { attackSentence, attackSteps, controlsAt, netBuiltEntries, servicesAt, words } from './labNetwork';
import { ARCH } from './securityContent';
import { SEED_COURSES } from '../content/dto';
import { stepKey } from '../teamProgress';
import { LAB_HOSTS, LAB_SUBNET } from '../labTopology';

/**
 * R152 — the Security+ lab network is real: every address is a lab host, every control and attack names
 * work that exists, the before/after projection actually changes the system, the attack ids never clash
 * with the architecture picture's, and DVWA is on :8080 everywhere.
 */
const course = SEED_COURSES.find((c) => c.id === 'security-plus')!;
const taskIds = new Set(course.tasks.map((t) => t.id));
const stepKeys = new Set(course.tasks.flatMap((t) => t.steps.map((s) => stepKey(t.id, s.id))));
const resolves = (entry: string) => (entry.includes('::') ? stepKeys.has(entry) : taskIds.has(entry));

describe('securityNetwork — addresses and subnet', () => {
  it('every host address is a lab host and the subnet is the lab subnet', () => {
    const ips = new Set(LAB_HOSTS.map((h) => h.ip));
    for (const h of NETWORK.hosts) if (h.addr) expect(ips.has(h.addr), `${h.id} ${h.addr}`).toBe(true);
    expect(NETWORK.subnet).toBe(LAB_SUBNET);
    expect(NETWORK.hosts.length).toBe(3);
  });

  it('DVWA is on :8080 and no host still lists it on :80', () => {
    const ubuntu = NETWORK.hosts.find((h) => h.id === 'ubuntu')!;
    expect(ubuntu.services.some((s) => s.port === 8080 && /dvwa/i.test(s.name))).toBe(true);
    expect(ubuntu.services.some((s) => s.port === 80 && /dvwa/i.test(s.name))).toBe(false);
  });
});

describe('securityNetwork — every builtBy is real work', () => {
  it('controls and attacks resolve to a task or task::step of the course', () => {
    const bad: string[] = [];
    for (const { id, builtBy } of netBuiltEntries(NETWORK)) for (const e of builtBy) if (!resolves(e)) bad.push(`${id}: ${e}`);
    expect(bad, bad.join('; ')).toEqual([]);
    expect(netBuiltEntries(NETWORK).length).toBeGreaterThan(8);
  });
});

describe('securityNetwork — ids never collide with the architecture picture', () => {
  it('no network built id equals an ARCH node id', () => {
    const archIds = new Set(ARCH.nodes.map((n) => n.id));
    for (const { id } of netBuiltEntries(NETWORK)) expect(archIds.has(id), id).toBe(false);
  });
});

describe('securityNetwork — the projection changes the system', () => {
  it('a Blue host gains at least one control from before to after in a graded week', () => {
    const ubuntu = NETWORK.hosts.find((h) => h.id === 'ubuntu')!;
    const changed = NETWORK.weeks.some((w) => controlsAt(ubuntu, w.week, 'after').length > controlsAt(ubuntu, w.week, 'before').length);
    expect(changed).toBe(true);
  });

  it('services honour their window', () => {
    const ubuntu = NETWORK.hosts.find((h) => h.id === 'ubuntu')!;
    expect(servicesAt(ubuntu, 0, 'after').some((s) => s.port === 8080)).toBe(true);
  });
});

describe('securityNetwork — the step-through', () => {
  it('weeks 0–3 each have at least one step, week 4 has none, and steps are ordered', () => {
    for (const w of [0, 1, 2, 3]) expect(attackSteps(NETWORK, w).length, `week ${w}`).toBeGreaterThan(0);
    expect(attackSteps(NETWORK, 4).length).toBe(0);
    for (const w of NETWORK.weeks) {
      const ns = attackSteps(NETWORK, w.week).map((a) => a.n);
      expect(ns).toEqual([...ns].sort((a, b) => a - b));
    }
  });

  it('a self-test draws on its host and is dropped when onlyAttacks', () => {
    const w3 = attackSteps(NETWORK, 3);
    const self = w3.find((a) => a.selfTest)!;
    expect(self.from).toBe(self.to);
    expect(attackSteps(NETWORK, 3, true).some((a) => a.selfTest)).toBe(false);
  });
});

describe('securityNetwork — word budgets', () => {
  it('before/after ≤ 25 words, tool ≤ 6, each step sentence ≤ 30, control label ≤ 6', () => {
    for (const w of NETWORK.weeks) {
      expect(words(w.before), `w${w.week} before`).toBeLessThanOrEqual(25);
      expect(words(w.after), `w${w.week} after`).toBeLessThanOrEqual(25);
      for (const a of w.attacks) {
        expect(words(a.tool), `w${w.week} tool`).toBeLessThanOrEqual(6);
        expect(words(attackSentence(a, NETWORK.hosts)), `w${w.week} sentence`).toBeLessThanOrEqual(30);
      }
    }
    for (const h of NETWORK.hosts) for (const c of h.controls) expect(words(c.label), c.id).toBeLessThanOrEqual(6);
    expect(words(NETWORK.copy.howToRead)).toBeLessThanOrEqual(70);
    expect(words(NETWORK.copy.footer)).toBeLessThanOrEqual(30);
  });
});
