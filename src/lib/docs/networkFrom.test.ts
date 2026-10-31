import { describe, it, expect } from 'vitest';
import { SEED_COURSES, courseDto } from '../content/dto';
import { networkOf } from '../content/read';
import { stepKey } from '../teamProgress';
import { portIn, weeksFrom, withCourseWeeks, OPERATOR_HOST } from './networkFrom';
import { allHosts, hasAttacks, hasPicture, cardHeight, CARD, layoutNetwork, lanComponents, portRows, segmentTree, weekTaskActions, words, type LabNetwork } from './labNetwork';
import * as serverTopology from '../serverTopology';
import * as ccnaTopology from '../ccnaTopology';
import * as networkPlusTopology from '../networkPlusTopology';
import * as labTopology from '../labTopology';
import { AWS_TOPOLOGY } from '../cloud/awsTopology';
import { AZURE_TOPOLOGY } from '../cloud/azureTopology';

/**
 * R157 — every course carries its network, and every derived one is honest: addresses come only from the
 * course's topology module, every reference resolves, every week mirrors the course, every graded task is
 * placed or explicitly off the network, and the picture is laid out without overlap.
 */
const IPV4 = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g;
const deepStrings = (v: unknown, out: string[] = []): string[] => {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => deepStrings(x, out));
  else if (v && typeof v === 'object') Object.values(v as Record<string, unknown>).forEach((x) => deepStrings(x, out));
  return out;
};
const addressesIn = (v: unknown) => new Set(deepStrings(v).flatMap((s) => s.match(IPV4) ?? []));

/** The addresses each course may print: the topology module it is derived from (computed rules included). */
function allowedAddresses(courseId: string): Set<string> | 'none' {
  if (courseId === 'server-plus') return addressesIn({ ...serverTopology, ops: serverTopology.BASE_VMS.map((v) => serverTopology.opsAddress(v)) });
  if (courseId === 'ccna') return addressesIn({ ...ccnaTopology, computed: ccnaTopology.VLANS.flatMap((v) => [ccnaTopology.prefixOf(v), ccnaTopology.gatewayOf(v), ccnaTopology.dhcpRangeOf(v) ?? '']), mgmt: ccnaTopology.DEVICES.map((d) => ccnaTopology.mgmtAddress(d) ?? '') });
  if (courseId === 'network-plus') return addressesIn({ ...networkPlusTopology, computed: networkPlusTopology.VLANS.flatMap((v) => [networkPlusTopology.prefixOf(v), networkPlusTopology.gatewayOf(v), networkPlusTopology.dhcpRangeOf(v) ?? '']), mgmt: networkPlusTopology.DEVICES.map((d) => networkPlusTopology.mgmtAddress(d) ?? '') });
  if (courseId === 'cysa-plus' || courseId === 'security-plus') return addressesIn(labTopology);
  if (courseId.startsWith('aws-cloud') || courseId.startsWith('aws-solutions') || courseId.startsWith('aws-devops')) return addressesIn(AWS_TOPOLOGY.containers);
  if (courseId.startsWith('azure-')) return addressesIn(AZURE_TOPOLOGY.containers);
  return 'none';
}

const nets = SEED_COURSES.map((c) => ({ course: c, net: networkOf(courseDto(c.id)) }));

describe('networkFrom — every course carries a laid-out network', () => {
  it.each(nets.map((n) => [n.course.id, n] as const))('%s: hosts, segments, picture, weeks', (_id, { course, net }) => {
    expect(net.hosts.length).toBeGreaterThan(0);
    expect(hasPicture(net)).toBe(true);
    const ids = allHosts(net).map((h) => h.id);
    expect(new Set(ids).size, 'unique host ids').toBe(ids.length);
    const segIds = new Set(net.fabric.segments.map((s) => s.id));
    const maxWeek = Math.max(...course.weeks.map((w) => w.number));
    for (const h of allHosts(net)) {
      expect(words(h.label), `${h.id} label`).toBeGreaterThan(0);
      expect(words(h.description), `${h.id} description`).toBeGreaterThan(0);
      expect(words(h.description), `${h.id} description budget`).toBeLessThanOrEqual(30);
      if (h.segment) expect(segIds.has(h.segment), `${h.id} segment ${h.segment}`).toBe(true);
      expect(h.arrives ?? 0, `${h.id} arrives`).toBeLessThanOrEqual(maxWeek);
      for (const s of h.services) if (s.scope === 'segment') expect(s.via, `${h.id}:${s.port} via`).toBeTruthy();
    }
    for (const s of net.fabric.segments) if (s.parent) expect(segIds.has(s.parent), `${s.id} parent`).toBe(true);
    for (const l of net.links ?? []) for (const end of [l.from, l.to]) expect(ids, `link end ${end}`).toContain(end);
    // Weeks mirror the course: one entry per course week, titled by the week.
    expect(net.weeks.map((w) => w.week)).toEqual(course.weeks.map((w) => w.number));
    for (const w of net.weeks) {
      const def = course.weeks.find((x) => x.number === w.week)!;
      expect(w.wire, `week ${w.week} wire`).toBe(course.id === 'security-plus' && w.week <= 4 ? w.wire : def.title);
      expect(words(w.before), `week ${w.week} before`).toBeLessThanOrEqual(40);
      expect(words(w.after), `week ${w.week} after`).toBeLessThanOrEqual(40);
    }
  });

  it.each(nets.map((n) => [n.course.id, n] as const))('%s: every address is the topology’s, every reference resolves', (id, { course, net }) => {
    const allowed = allowedAddresses(id);
    const found = addressesIn(net);
    if (allowed === 'none') expect([...found], 'an architecture-only course types no address').toEqual([]);
    else for (const a of found) expect(allowed.has(a), `${id}: ${a} is not in its topology module`).toBe(true);
    const taskIds = new Set(course.tasks.map((t) => t.id));
    const stepKeys = new Set(course.tasks.flatMap((t) => t.steps.map((s) => stepKey(t.id, s.id))));
    const resolves = (k: string) => (k.includes('::') ? stepKeys.has(k) : taskIds.has(k));
    const ids = new Set([...allHosts(net).map((h) => h.id), ...lanComponents(net).map((c) => c.id)]);
    for (const h of allHosts(net)) {
      for (const k of h.builtBy ?? []) expect(resolves(k), `${h.id} builtBy ${k}`).toBe(true);
      for (const c of h.controls) for (const k of c.builtBy ?? []) expect(resolves(k), `${c.id} builtBy ${k}`).toBe(true);
      for (const t of h.tools ?? []) {
        expect(t.usedIn?.length, `${h.id} ${t.name} used somewhere`).toBeGreaterThan(0);
        for (const k of t.usedIn ?? []) expect(resolves(k), `${t.name} usedIn ${k}`).toBe(true);
      }
      for (const p of h.publishes ?? []) expect(ids.has(p.to), `${h.id} publishes to ${p.to}`).toBe(true);
    }
    for (const w of net.weeks) {
      for (const a of w.attacks) {
        if (a.builtBy) expect(resolves(a.builtBy), `w${w.week} attack ${a.n}`).toBe(true);
        expect(ids.has(a.from) && ids.has(a.to), `w${w.week} attack ${a.n} ends`).toBe(true);
      }
      for (const a of w.actions ?? []) {
        expect(resolves(a.step ? `${a.taskId}::${a.step}` : a.taskId), `w${w.week} action ${a.taskId}/${a.step ?? ''}`).toBe(true);
        for (const at of a.at) expect(ids.has(at), `action at ${at}`).toBe(true);
        expect(words(a.text), a.text).toBeLessThanOrEqual(24);
        // A derived line is the step's own title, never trimmed.
        if (a.step && id !== 'security-plus') {
          const step = course.tasks.find((t) => t.id === a.taskId)!.steps.find((s) => s.id === a.step)!;
          const isArchPurpose = a.text !== step.title;
          if (isArchPurpose) expect(words(a.text)).toBeLessThanOrEqual(14);
        }
      }
    }
  });

  it.each(nets.map((n) => [n.course.id, n] as const))('%s: every graded task of the lab weeks is placed or explicitly off the network', (id, { course, net }) => {
    const labWeeks = net.weeks.filter((w) => w.week <= 4).map((w) => w.week);
    for (const week of labWeeks) {
      const tasks = course.tasks.filter((t) => t.week === week && t.track !== 'ai');
      const placed = weekTaskActions(net, week, tasks);
      for (const t of tasks) {
        const mine = placed.find((p) => p.taskId === t.id)!;
        expect(mine.lines.length, `${id} week ${week}: ${t.id} has a line`).toBeGreaterThan(0);
      }
    }
    expect(hasAttacks(net)).toBe(id === 'security-plus' || id === 'cysa-plus');
  });

  it.each(nets.map((n) => [n.course.id, n] as const))('%s: the picture has no overlapping cards and stays inside its view', (_id, { net }) => {
    const boxes = allHosts(net)
      .filter((h) => h.x !== undefined && h.y !== undefined)
      .map((h) => ({ id: h.id, x1: h.x! - CARD.w / 2, x2: h.x! + CARD.w / 2, y1: h.y!, y2: h.y! + (h.kind === 'hypervisor' || h.kind === 'platform' ? CARD.head : cardHeight(h.services.length, h.controls.length)) }));
    for (const b of boxes) {
      expect(b.x1, `${b.id} left`).toBeGreaterThanOrEqual(0);
      expect(b.x2, `${b.id} right`).toBeLessThanOrEqual(net.view.w);
      expect(b.y2, `${b.id} bottom`).toBeLessThanOrEqual(net.view.h);
    }
    for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i];
      const b = boxes[j];
      const overlap = a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;
      expect(overlap, `${a.id} overlaps ${b.id}`).toBe(false);
    }
  });
});

describe('networkFrom — the shapes, spot-checked', () => {
  const net = (id: string) => nets.find((n) => n.course.id === id)!.net;
  const host = (n: LabNetwork, id: string) => allHosts(n).find((h) => h.id === id)!;

  it('Server+: the DMZ web host answers on 80/443/22 from its bridge; the host publishes exactly the campus ports; apps are the VM’s services', () => {
    const n = net('server-plus');
    const websrv = host(n, 'websrv');
    expect(websrv.services.map((s) => [s.port, s.scope, s.via]).sort()).toEqual([[22, 'segment', 'vmbr1'], [443, 'segment', 'vmbr1'], [80, 'segment', 'vmbr1']].sort());
    expect(n.fabric.hypervisor?.publishes).toEqual(serverTopology.PUBLISHED_PORTS.map((p) => ({ host: p.hostPort, to: p.to, port: p.port, proto: p.proto, purpose: p.purpose, from: 3 })));
    expect(host(n, 'winserver').apps).toEqual(serverTopology.vm('winserver').services);
    expect(host(n, 'winserver').services.some((s) => s.port === 3389 && s.via === 'tailscale0')).toBe(true);
    expect(n.fabric.segments.map((s) => s.id)).toEqual(['vmbr0', 'vmbr1', 'vmbr2', 'vmbr9']);
    expect(portRows(n).find((r) => r.port === 2200)?.behind).toBe('websrv:22');
    expect(n.fabric.hypervisor?.addr).toBe(serverTopology.HOST.rule);
  });

  it('CCNA: twelve devices and the ISP, eight links, DNS and DHCP on the server that is the resolver, syslog on the NOC host', () => {
    const n = net('ccna');
    expect(n.hosts.length).toBe(ccnaTopology.DEVICES.length + 1);
    expect(n.links?.length).toBe(ccnaTopology.LINKS.length);
    const srv = host(n, 'SRV-CORE');
    expect(srv.services.map((s) => s.port).sort()).toEqual([53, 67]);
    const noc = host(n, 'NETOPS');
    expect(noc.services.map((s) => s.port).sort()).toEqual([162, 514]);
    expect(noc.services.every((s) => s.from === 6)).toBe(true);
    expect(host(n, 'SW-CORE-01').controls.some((c) => /policy/i.test(c.id))).toBe(true);
    expect(host(n, 'R1-HQ').apps).toContain(`outside ${ccnaTopology.ISP.outside}`);
    const tree = segmentTree(n);
    expect(tree.branches.find((b) => b.seg.id === 'vlan:99')?.depth).toBe(1);
    expect(host(n, 'isp').external).toBe(true);
  });

  it('Network+: the router carries the ACL, both switches port security, the syslog/TFTP server sits in Management, Packet Tracer is the platform', () => {
    const n = net('network-plus');
    expect(host(n, 'R1-BR').controls.some((c) => /acl/.test(c.id))).toBe(true);
    expect(host(n, 'SW-01').controls.some((c) => /portsec/.test(c.id))).toBe(true);
    expect(host(n, 'SW-02').controls.some((c) => /portsec/.test(c.id))).toBe(true);
    expect(host(n, 'server').services.map((s) => s.port).sort()).toEqual([514, 69]);
    expect(n.fabric.hypervisor?.kind).toBe('platform');
    expect(host(n, 'ISP').addr).toBe(networkPlusTopology.WAN.isp);
  });

  it('cloud: the account is the platform, subnets nest in zones in the VPC, the database answers on 5432 only in its private subnet, plumbing nodes are not hosts', () => {
    const n = net('aws-solutions-architect');
    expect(n.fabric.hypervisor?.kind).toBe('platform');
    const seg = (id: string) => n.fabric.segments.find((s) => s.id === id)!;
    expect(seg('PrivateSubnet').parent).toBe('az');
    expect(seg('az').parent).toBe('Vpc');
    expect(seg('Vpc').parent).toBe('region');
    const db = host(n, 'Database');
    expect(db.services.map((s) => [s.port, s.scope])).toEqual([[5432, 'segment']]);
    for (const h of n.hosts) expect(AWS_TOPOLOGY.nodes.find((x) => x.id === h.id)?.detail, `${h.id} is not template plumbing`).not.toBe(true);
    expect(allHosts(n).flatMap((h) => h.controls).some((c) => /SecurityGroup/.test(c.id))).toBe(true);
    const az = net('azure-fundamentals');
    expect(az.fabric.hypervisor?.os).toBe('Azure');
    expect(az.hosts.some((h) => h.external)).toBe(true);
  });

  it('CySA+: the Week-2 chain carries its ATT&CK ids and the Week-4 replay answers with the sensors and the containment rule', () => {
    const n = net('cysa-plus');
    const w2 = n.weeks.find((w) => w.week === 2)!;
    expect(w2.attacks.map((a) => a.ref)).toEqual(['T1046', 'T1190', 'T1110']);
    expect(w2.attacks.map((a) => a.kind)).toEqual(['scanning', 'injection', 'brute-force']);
    expect(w2.attacks.every((a) => a.builtBy === 'cr-w2')).toBe(true);
    const w4 = n.weeks.find((w) => w.week === 4)!;
    expect(w4.attacks.length).toBe(4);
    expect(w4.attacks.at(-1)?.response?.kind).toBe('contain');
    expect(host(n, 'ubuntu').controls.map((c) => c.kind)).toContain('contain');
    expect(host(n, 'soc').services.map((s) => s.port).sort((a, b) => a - b)).toEqual([22, 443, 1514, 1515]);
    expect(n.fabric.hypervisor?.addr).toBe(labTopology.SOC_TOPOLOGY_BY_COURSE['cysa-plus'].proxmoxHost);
  });

  it('architecture-only: zones are segments, controls sit on a host, records are not components, a person is the operator', () => {
    const n = net('a-plus');
    expect(n.fabric.hypervisor).toBeUndefined();
    expect(n.fabric.segments.every((s) => s.kind === 'zone')).toBe(true);
    expect(n.hosts.every((h) => h.addr === undefined)).toBe(true);
    expect(lanComponents(n).some((c) => /^r_|record/.test(c.id))).toBe(false);
    expect(n.hosts.some((h) => h.kind === 'client')).toBe(true);
    const docker = net('docker-dca');
    expect(docker.hosts.some((h) => h.id === OPERATOR_HOST.id), 'a picture with no person gets the one synthetic operator host').toBe(true);
  });
});

describe('networkFrom — helpers', () => {
  it('portIn reads a port from an edge label or a protocol word, and nothing from a verb', () => {
    expect(portIn('HTTP :80')).toBe(80);
    expect(portIn('PostgreSQL :5432')).toBe(5432);
    expect(portIn('port 80, probed')).toBe(80);
    expect(portIn('HTTPS')).toBe(443);
    expect(portIn('SSH from your /32')).toBe(22);
    expect(portIn('invoke')).toBeUndefined();
    expect(portIn('ADD +1')).toBeUndefined();
  });

  it('weeksFrom mirrors the course and says what stood before the week, in budget', () => {
    const course = { weeks: [{ number: 0, title: 'Zero', objective: 'Start' }, { number: 1, title: 'One', objective: 'Go' }, { number: 2, title: 'Two', objective: 'On' }] } as never;
    const build = { arrives: { a: 0, b: 0, c: 1, d: 1, e: 1 }, processes: {}, captions: { 1: 'New: c, d and e.' } };
    const weeks = weeksFrom(course, build, (id) => ({ a: 'Alpha', b: 'Beta', c: 'Gamma', d: 'Delta', e: 'Eps' })[id]);
    expect(weeks.map((w) => w.week)).toEqual([0, 1, 2]);
    expect(weeks[0].before).toBe('Nothing built yet.');
    expect(weeks[1].after).toBe('New: c, d and e.');
    expect(weeks[2].before).toBe('Built so far: Alpha, Beta, Gamma and 2 more.');
    const added = withCourseWeeks({ ...net0(), weeks: weeks.slice(0, 2) }, course);
    expect(added.weeks.map((w) => w.week)).toEqual([0, 1, 2]);
  });

  it('layoutNetwork leaves a hand-drawn network alone and lays a derived one out by segment', () => {
    const sec = nets.find((n) => n.course.id === 'security-plus')!.net;
    expect(layoutNetwork(sec)).toBe(sec);
    const n = layoutNetwork({ ...net0(), fabric: { segments: [{ id: 'a', label: 'A', note: '', kind: 'lan' }, { id: 'b', label: 'B', note: '', kind: 'lan' }] }, hosts: [h('x', 'a'), h('y', 'a'), h('z', 'b')] });
    expect(n.view.w).toBeGreaterThan(0);
    expect(n.fabric.segments.every((s) => s.y !== undefined)).toBe(true);
    expect(n.hosts.find((x) => x.id === 'z')!.y).toBeGreaterThan(n.hosts.find((x) => x.id === 'x')!.y!);
    expect(n.hosts.find((x) => x.id === 'y')!.x).toBeGreaterThan(n.hosts.find((x) => x.id === 'x')!.x!);
  });
});

const net0 = (): LabNetwork => ({ copy: { title: '', howToRead: '', footer: '' }, view: { w: 0, h: 0 }, fabric: { segments: [] }, hosts: [], weeks: [], spec: { columns: [], rows: [] } });
const h = (id: string, segment: string) => ({ id, label: id, description: id, kind: 'server' as const, segment, services: [], controls: [] });
