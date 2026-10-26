import { describe, it, expect } from 'vitest';
import { DEVICES, LINKS, POLICY, VLANS, WAN, addressIn, device, dhcpRangeOf, gatewayOf, mgmtAddress, prefixOf, vlan } from './networkPlusTopology';
import { VLANS as CCNA_VLANS, SITES as CCNA_SITES } from './ccnaTopology';

/**
 * R131 — the branch is derived, not typed: every prefix, gateway and pool
 * follows the one rule (the third octet is the VLAN id), no pool holds a
 * static device, every link lands on a device that exists, the policy names
 * real VLANs, and nothing overlaps another course's ranges.
 */
describe('networkPlusTopology', () => {
  it('derives every address from the VLAN id in its own second octet', () => {
    for (const v of VLANS) {
      expect(prefixOf(v)).toBe(`10.70.${v.id}.0/24`);
      expect(gatewayOf(v)).toBe(`10.70.${v.id}.1`);
      expect(addressIn(v, 5)).toBe(`10.70.${v.id}.5`);
    }
    expect(dhcpRangeOf(vlan(99))).toBeUndefined();
    expect(dhcpRangeOf(vlan(10))).toBe('10.70.10.50 – 10.70.10.199');
  });

  it('keeps static devices out of every DHCP pool, and gives the switches and the router a management address', () => {
    for (const d of DEVICES) {
      if (d.host === undefined || d.vlan === undefined) continue;
      const v = vlan(d.vlan);
      if (v.pool) expect(d.host < v.pool[0] || d.host > v.pool[1], `${d.name} inside the ${v.name} pool`).toBe(true);
    }
    expect(mgmtAddress(device('SW-01'))).toBe('10.70.99.11');
    expect(mgmtAddress(device('R1-BR'))).toBe('10.70.99.1');
    expect(mgmtAddress(device('PC-STAFF-1'))).toBeUndefined();
  });

  it('every link joins two devices that exist, access links name a VLAN, and the policy names real VLANs', () => {
    const names = new Set(DEVICES.map((d) => d.name));
    for (const l of LINKS) {
      expect(names.has(l.from), l.from).toBe(true);
      expect(names.has(l.to), l.to).toBe(true);
      if (l.kind === 'access') expect(VLANS.some((v) => v.id === l.vlan), `${l.from} ${l.fromPort} vlan`).toBe(true);
    }
    for (const p of POLICY) {
      expect(VLANS.some((v) => v.id === p.from)).toBe(true);
      if (typeof p.to === 'number') expect(VLANS.some((v) => v.id === p.to)).toBe(true);
    }
    expect(POLICY.some((p) => p.from === 30 && p.to === 10 && !p.allow), 'guest is refused the staff VLAN').toBe(true);
  });

  it('overlaps no other course: its second octet is not a CCNA site, and the ISP link is RFC 5737', () => {
    for (const s of CCNA_SITES) expect(s.octet).not.toBe(70);
    for (const v of CCNA_VLANS) expect(prefixOf(vlan(VLANS[0].id))).not.toBe(`10.${CCNA_SITES[0].octet}.${v.id}.0/24`);
    expect(WAN.prefix.startsWith('203.0.113.')).toBe(true);
    expect(WAN.router).not.toBe(WAN.isp);
  });
});
