import { describe, it, expect } from 'vitest';
import { ARCH as SEC } from './securityContent';
import { ARCH as CYSA } from './cysaContent';
import { ARCH as MSSP } from './msspContent';
import { ARCH as SECAI } from './secaiContent';
import { ARCH as CISSP } from './cisspContent';
import { deliverablesForCourse } from './definitions';
import { LAB_HOSTS } from '../labTopology';
import { socTopology } from '../labTopology';
import type { ArchPicture } from './archPicture';

/**
 * R103 — every architecture picture is a real one: every part says what it
 * is for and which form records it, sits in a zone that exists, overlaps
 * nothing, and takes its address from a topology module rather than typing
 * one. The records lane holds only records.
 */
const PICTURES: [string, ArchPicture][] = [
  ['security-plus', SEC],
  ['cysa-plus', CYSA],
  ['mssp', MSSP],
  ['secai-plus', SECAI],
  ['cissp', CISSP],
];
const words = (t: string) => t.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
const BOX = { w: 150, h: 48 };
const PILL = { w: 120, h: 24 };
const TOPOLOGY_ADDRESSES = new Set<string>([
  ...LAB_HOSTS.map((h) => h.ip),
  ...(() => {
    const s = socTopology('cysa-plus')!;
    return [s.proxmoxHost, s.soc.ip, s.pod.ubuntu.ip, s.pod.windows.ip, s.attacker.ip];
  })(),
]);

describe.each(PICTURES)('R103 — the architecture picture of %s', (courseId, arch) => {
  const zones = new Map(arch.zones.map((z) => [z.id, z]));
  const ids = new Set(arch.nodes.map((n) => n.id));
  const forms = new Set(deliverablesForCourse(courseId).map((d) => d.id));

  it('has at least twelve parts, in zones that exist, with unique ids', () => {
    expect(arch.nodes.length).toBeGreaterThanOrEqual(12);
    expect(ids.size).toBe(arch.nodes.length);
    for (const n of arch.nodes) expect(zones.has(n.zone), `${n.id} zone ${n.zone}`).toBe(true);
  });

  it('every part says what it is for (≤12 words) and which form records it', () => {
    const bad: string[] = [];
    for (const n of arch.nodes) {
      if (!n.purpose || words(n.purpose) > 12) bad.push(`${n.id}: purpose ${words(n.purpose ?? '')}w`);
      if (!n.records) bad.push(`${n.id}: no records`);
      else if (!forms.has(n.records)) bad.push(`${n.id}: records '${n.records}' is not a form of ${courseId}`);
    }
    expect(bad, bad.join('; ')).toEqual([]);
  });

  it('the records lane holds every form of the course as a pill, and nothing else', () => {
    const lanes = arch.zones.filter((z) => z.lane);
    expect(lanes.length).toBe(1);
    const inLane = arch.nodes.filter((n) => n.zone === lanes[0].id);
    for (const n of inLane) expect(n.kind, `${n.id} in the lane`).toBe('record');
    for (const n of arch.nodes.filter((n) => n.kind === 'record')) expect(n.zone, `${n.id} outside the lane`).toBe(lanes[0].id);
    const recorded = new Set(inLane.map((n) => n.records));
    for (const f of forms) expect(recorded.has(f), `${f} has no pill`).toBe(true);
  });

  it('edges land on parts, and addresses come from a topology module', () => {
    for (const e of arch.edges) for (const end of [e.from, e.to]) expect(ids.has(end), `edge end ${end}`).toBe(true);
    for (const n of arch.nodes) {
      if (!n.addr) continue;
      expect(['security-plus', 'cysa-plus'].includes(courseId), `${courseId} ${n.id} has an address`).toBe(true);
      expect(TOPOLOGY_ADDRESSES.has(n.addr), `${n.id} address ${n.addr} is typed, not referenced`).toBe(true);
    }
  });

  it('no two boxes overlap, and every box sits inside its zone', () => {
    const rect = (n: (typeof arch.nodes)[number]) => {
      const s = n.kind === 'record' ? PILL : BOX;
      return { x1: n.x - s.w / 2, x2: n.x + s.w / 2, y1: n.y - s.h / 2, y2: n.y + s.h / 2 };
    };
    const bad: string[] = [];
    for (let i = 0; i < arch.nodes.length; i++) {
      const a = arch.nodes[i];
      const ra = rect(a);
      const z = zones.get(a.zone)!;
      if (ra.x1 < z.x || ra.x2 > z.x + z.w || ra.y1 < z.y || ra.y2 > z.y + z.h) bad.push(`${a.id} leaves zone ${z.id}`);
      for (let j = i + 1; j < arch.nodes.length; j++) {
        const rb = rect(arch.nodes[j]);
        if (ra.x1 < rb.x2 && rb.x1 < ra.x2 && ra.y1 < rb.y2 && rb.y1 < ra.y2) bad.push(`${a.id} overlaps ${arch.nodes[j].id}`);
      }
    }
    expect(bad, bad.join('; ')).toEqual([]);
    for (const z of arch.zones) expect(z.x + z.w <= arch.view.w && z.y + z.h <= arch.view.h, `zone ${z.id} leaves the view`).toBe(true);
  });
});
