import { describe, it, expect } from 'vitest';
import { NETWORK } from './securityNetwork';
import { ATTACK_CATALOGUE, attackSentence, attackSteps, catalogueUses, controlsAt, findComponent, lanComponents, netBuiltEntries, portRows, serviceId, servicesAt, toolRows, weekTaskActions, words } from './labNetwork';
import { ARCH } from './securityContent';
import { SEED_COURSES } from '../content/dto';
import { stepKey } from '../teamProgress';
import { LAB_DOCKER, LAB_GATEWAY, LAB_HOSTS, LAB_SUBNET } from '../labTopology';

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

describe('securityNetwork — descriptions (R153)', () => {
  it('every host, service, control and attack has a description within budget', () => {
    for (const h of [...NETWORK.hosts, NETWORK.fabric.hypervisor]) {
      expect(words(h.description), h.id).toBeGreaterThan(0);
      expect(words(h.description), h.id).toBeLessThanOrEqual(20);
      for (const s of h.services) { expect(words(s.description), `${h.id}:${s.port}`).toBeGreaterThan(0); expect(words(s.description)).toBeLessThanOrEqual(20); }
      for (const c of h.controls) { expect(words(c.description), c.id).toBeGreaterThan(0); expect(words(c.description)).toBeLessThanOrEqual(20); }
    }
    for (const w of NETWORK.weeks) for (const a of w.attacks) { expect(words(a.description), `w${w.week}:${a.n}`).toBeGreaterThan(0); expect(words(a.description)).toBeLessThanOrEqual(20); }
  });

  it('findComponent resolves hosts, services and controls, and nulls on a bad id', () => {
    expect(findComponent(NETWORK, 'host', 'ubuntu')?.label).toBe('Ubuntu web server');
    expect(findComponent(NETWORK, 'service', serviceId('ubuntu', 8080))?.label).toMatch(/DVWA/i);
    expect(findComponent(NETWORK, 'control', 'ctl:ubuntu-ufw')?.description.length).toBeGreaterThan(0);
    expect(findComponent(NETWORK, 'host', 'nope')).toBeNull();
    expect(findComponent(NETWORK, 'service', serviceId('ubuntu', 9999))).toBeNull();
  });
});

/**
 * R156 — the full LAN reference is real too: every address is the topology's, Docker publishes exactly the
 * one port the Week-0 command does, the database and the resolver stub never claim the LAN, every tool is
 * one the course's tasks actually list and every use resolves, and every graded task of weeks 0–4 is
 * placed on the network by something.
 */
describe('securityNetwork — the full LAN (R156)', () => {
  it('the gateway adapter and the Docker bridge come from the topology; the one published port is 8080 → 80', () => {
    expect(NETWORK.fabric.adapter?.addr).toBe(LAB_GATEWAY);
    const ubuntu = NETWORK.hosts.find((h) => h.id === 'ubuntu')!;
    expect(ubuntu.docker?.bridge).toBe(LAB_DOCKER.bridge);
    expect(ubuntu.docker?.subnet).toBe(LAB_DOCKER.subnet);
    const dvwa = ubuntu.docker!.containers.find((c) => c.id === 'dvwa')!;
    expect(dvwa.addr).toBe(LAB_DOCKER.dvwa);
    expect(dvwa.ports).toEqual([{ host: 8080, container: 80, proto: 'tcp' }]);
    expect(dvwa.image).toBe('vulnerables/web-dvwa');
    // Nothing else on the lab publishes a container port, and no host carries a Docker engine but Ubuntu.
    expect(NETWORK.hosts.filter((h) => h.docker).map((h) => h.id)).toEqual(['ubuntu']);
  });

  it('the database and the resolver stub are internal; the LAN sees SSH, the host web, DVWA and RDP only', () => {
    const lan = portRows(NETWORK).filter((r) => r.scope === 'lan').map((r) => `${r.hostId}:${r.port}`);
    expect(lan.sort()).toEqual(['ubuntu:22', 'ubuntu:80', 'ubuntu:8080', 'windows:3389']);
    const internal = portRows(NETWORK).filter((r) => r.scope === 'internal').map((r) => r.port);
    expect(internal.sort()).toEqual([3306, 53]);
    expect(portRows(NETWORK).find((r) => r.port === 8080)!.behind).toBe('dvwa container:80');
  });

  it('every component has a label and description; hosts and the container have addresses from the topology', () => {
    const comps = lanComponents(NETWORK);
    expect(comps.map((c) => c.id)).toEqual(['hypervisor', 'adapter', 'kali', 'ubuntu', 'dvwa', 'windows']);
    for (const c of comps) {
      expect(words(c.description), c.id).toBeGreaterThan(0);
      expect(words(c.description), c.id).toBeLessThanOrEqual(24);
    }
    const addrs = new Set([...LAB_HOSTS.map((h) => h.ip), LAB_GATEWAY, LAB_DOCKER.dvwa]);
    for (const c of comps) if (c.addr) expect(addrs.has(c.addr), `${c.id} ${c.addr}`).toBe(true);
    expect(comps.find((c) => c.id === 'dvwa')!.on).toBe('ubuntu');
  });

  it('every tool is one the task lists, every use resolves to real work, and purposes are short', () => {
    const rows = toolRows(NETWORK);
    expect(rows.length).toBeGreaterThan(20);
    for (const { hostId, tool } of rows) {
      expect(tool.usedIn?.length, `${hostId} ${tool.name} is used somewhere`).toBeGreaterThan(0);
      expect(words(tool.purpose), tool.name).toBeLessThanOrEqual(14);
      const first = tool.name.toLowerCase().split(/[\s·(]+/)[0];
      for (const key of tool.usedIn ?? []) {
        expect(resolves(key), `${tool.name}: ${key}`).toBe(true);
        const task = course.tasks.find((t) => t.id === key.split('::')[0])!;
        const listed = (task.tools ?? []).join(' ').toLowerCase();
        const commands = task.steps.flatMap((st) => [st.command ?? '', ...(st.commands ?? []).map((c) => c.cmd)]).join(' ').toLowerCase();
        expect(listed.includes(first) || commands.includes(first), `${task.id} names ${tool.name}`).toBe(true);
      }
    }
  });

  it('every graded task of weeks 0–4 is placed on the network, and every explicit action resolves', () => {
    for (const w of NETWORK.weeks) {
      const tasks = course.tasks.filter((t) => t.week === w.week && t.track !== 'ai');
      const placed = weekTaskActions(NETWORK, w.week, tasks);
      for (const t of tasks) {
        const mine = placed.find((p) => p.taskId === t.id)!;
        expect(mine.lines.length, `week ${w.week}: ${t.id} does something on the network`).toBeGreaterThan(0);
      }
      for (const a of w.actions ?? []) {
        expect(resolves(a.step ? `${a.taskId}::${a.step}` : a.taskId), `${a.taskId}/${a.step ?? ''}`).toBe(true);
        expect(words(a.text), a.text).toBeLessThanOrEqual(22);
        for (const at of a.at) expect(lanComponents(NETWORK).some((c) => c.id === at), `${a.taskId} at ${at}`).toBe(true);
      }
    }
    // The derived lines: Red's Week-3 injection names the path and the tool; Blue's Week-1 ufw is a control line.
    const w3 = weekTaskActions(NETWORK, 3, [{ id: 'red-w3-attacks', role: 'red' }]).find((t) => t.taskId === 'red-w3-attacks')!;
    expect(w3.lines[0]).toMatchObject({ kind: 'attack', step: 'red-w3-s1', at: ['kali', 'ubuntu'] });
    expect(w3.lines[0].text).toMatch(/^1\. Injection — Kali attacker → Ubuntu web server:8080 · /);
    // A control that answers an attack is placed once (as the answer), never again as "arrives this week".
    const b3 = weekTaskActions(NETWORK, 3, [{ id: 'blue-w3-detection', role: 'blue' }]).find((t) => t.taskId === 'blue-w3-detection')!;
    expect(b3.lines.filter((l) => /web-log watch/.test(l.text)).length).toBe(1);
    expect(b3.lines.filter((l) => /ufw deny/.test(l.text)).length).toBe(1);
    const w1 = weekTaskActions(NETWORK, 1, [{ id: 'blue-w1-hardening', role: 'blue' }]).find((t) => t.taskId === 'blue-w1-hardening')!;
    expect(w1.lines.some((l) => l.kind === 'control' && /^ufw firewall \(hardening\)/.test(l.text) && l.at[0] === 'ubuntu')).toBe(true);
  });

  it('the catalogue covers every kind used, with definitions in budget, and says where each is used', () => {
    const kinds = new Set(NETWORK.weeks.flatMap((w) => w.attacks.map((a) => a.kind)));
    for (const k of kinds) expect(ATTACK_CATALOGUE.some((e) => e.kind === k), k).toBe(true);
    for (const e of ATTACK_CATALOGUE) {
      expect(words(e.definition), e.kind).toBeLessThanOrEqual(24);
      expect(words(e.answer), e.kind).toBeLessThanOrEqual(20);
    }
    expect(catalogueUses(NETWORK, 'injection')).toEqual([{ week: 3, n: 1, port: 8080, to: 'ubuntu' }]);
    expect(catalogueUses(NETWORK, 'brute-force').map((u) => `${u.week}:${u.n}`)).toEqual(['3:2', '3:5']);
  });

  it('the reference copy is present and within budget', () => {
    const ref = NETWORK.copy.reference!;
    for (const [k, v] of Object.entries(ref)) expect(words(v), k).toBeLessThanOrEqual(45);
  });
});
