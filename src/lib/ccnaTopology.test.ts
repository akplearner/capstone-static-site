import { describe, it, expect } from 'vitest';
import {
  DEVICES,
  ISP,
  LINKS,
  POLICY,
  SERVICES,
  SITES,
  VLANS,
  WAN,
  addressIn,
  device,
  devicesAt,
  gatewayOf,
  mgmtAddress,
  policyFor,
  prefixOf,
  site,
  vlan,
  vlansAt,
} from './ccnaTopology';

/**
 * The addressing model is derived, not typed — so these are the tests that say the
 * derivation is right. An addressing plan that disagrees with itself is the most
 * expensive kind of documentation error: every command, diagram and form built on
 * it inherits the mistake, and a student cannot tell which half is wrong.
 */
describe('the CCNA addressing plan', () => {
  it('puts the VLAN id in the third octet, at both sites', () => {
    for (const v of VLANS) {
      const octet = site(v.site).octet;
      expect(prefixOf(v), `VLAN ${v.id}`).toBe(`10.${octet}.${v.id}.0/24`);
      expect(gatewayOf(v), `VLAN ${v.id}`).toBe(`10.${octet}.${v.id}.1`);
    }
  });

  it('gives every VLAN its own prefix — no two overlap', () => {
    const prefixes = VLANS.map(prefixOf);
    expect(new Set(prefixes).size).toBe(prefixes.length);
  });

  it('keeps every DHCP pool inside its own /24 and clear of the gateway', () => {
    for (const v of VLANS) {
      if (!v.dhcp) continue;
      expect(v.dhcp.from, `VLAN ${v.id} pool start`).toBeGreaterThan(1);
      expect(v.dhcp.to, `VLAN ${v.id} pool end`).toBeLessThan(255);
      expect(v.dhcp.from, `VLAN ${v.id} pool`).toBeLessThan(v.dhcp.to);
    }
  });

  it('never hands out an address a device holds statically', () => {
    for (const d of DEVICES) {
      if (!d.mgmt) continue;
      const v = vlan(d.mgmt.vlan);
      if (!v.dhcp) continue;
      const inPool = d.mgmt.host >= v.dhcp.from && d.mgmt.host <= v.dhcp.to;
      expect(inPool, `${d.name} at .${d.mgmt.host} sits inside VLAN ${v.id}'s DHCP pool`).toBe(false);
    }
  });

  it('gives each site at least one management VLAN, and only one', () => {
    for (const s of SITES) {
      const mgmt = vlansAt(s.id).filter((v) => v.management);
      expect(mgmt, s.name).toHaveLength(1);
    }
  });

  it('addresses the WAN as a point-to-point /30 with two usable addresses', () => {
    expect(WAN.prefix.endsWith('/30')).toBe(true);
    expect(WAN.mask).toBe('255.255.255.252');
    expect(WAN.hq).not.toBe(WAN.branch);
    // Both ends sit in the same /30.
    const net = WAN.prefix.split('/')[0].split('.').slice(0, 3).join('.');
    expect(WAN.hq.startsWith(net)).toBe(true);
    expect(WAN.branch.startsWith(net)).toBe(true);
  });

  it('uses the documentation range for anything "public", never a real address', () => {
    // RFC 5737 reserves 198.51.100.0/24 for documentation. A design document that
    // ships somebody else's real address is a document nobody should copy.
    for (const a of [ISP.outside, ISP.gateway]) expect(a.startsWith('198.51.100.')).toBe(true);
  });
});

describe('the devices and the links', () => {
  it('has a unique name per device, and every name resolves', () => {
    const names = DEVICES.map((d) => d.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(device(n).name).toBe(n);
  });

  it('gives every managed device a management address in a real VLAN', () => {
    for (const d of DEVICES) {
      if (d.class === 'workstation' || !d.mgmt) continue;
      expect(() => vlan(d.mgmt!.vlan), d.name).not.toThrow();
      expect(mgmtAddress(d), d.name).toBe(addressIn(vlan(d.mgmt.vlan), d.mgmt.host));
    }
  });

  it('never gives two devices the same address', () => {
    const addresses = DEVICES.map(mgmtAddress).filter(Boolean);
    expect(new Set(addresses).size).toBe(addresses.length);
  });

  it('links only devices that exist, and never a device to itself', () => {
    for (const l of LINKS) {
      expect(() => device(l.from.device), `${l.from.device}`).not.toThrow();
      expect(() => device(l.to.device), `${l.to.device}`).not.toThrow();
      expect(l.from.device).not.toBe(l.to.device);
    }
  });

  it('never carries a VLAN over a trunk that the far site does not have', () => {
    for (const l of LINKS) {
      if (!l.vlans) continue;
      const sites = new Set([device(l.from.device).site, device(l.to.device).site]);
      for (const id of l.vlans) {
        expect(sites.has(vlan(id).site), `${l.from.device}–${l.to.device} carries VLAN ${id}`).toBe(true);
      }
    }
  });

  it('brings each device in on or after the week its site arrives', () => {
    // A device cannot be built before the building it is in appears in the story.
    const siteArrival: Record<string, number> = { hq: 1, branch: 3 };
    for (const d of DEVICES) {
      if (d.arrives === 0) continue; // the workstation is there from Week 0
      expect(d.arrives, `${d.name}`).toBeGreaterThanOrEqual(siteArrival[d.site]);
    }
  });

  it('puts at least one device at every site, in build order', () => {
    for (const s of SITES) {
      const ds = devicesAt(s.id);
      expect(ds.length, s.name).toBeGreaterThan(0);
      const weeks = ds.map((d) => d.arrives);
      expect(weeks, s.name).toEqual([...weeks].sort((a, b) => a - b));
    }
  });
});

describe('the policy the ACLs will enforce', () => {
  it('only names VLANs that exist', () => {
    for (const p of POLICY) {
      expect(() => vlan(p.from), `from ${p.from}`).not.toThrow();
      const to = p.to;
      if (to !== 'internet') expect(() => vlan(to), `to ${to}`).not.toThrow();
    }
  });

  it('gives every rule a reason in business words', () => {
    for (const p of POLICY) {
      expect(p.because.length, `${p.from}→${p.to}`).toBeGreaterThan(20);
    }
  });

  it('says both what guest may do and what it may not — the pair is the lesson', () => {
    const guest = policyFor(50);
    expect(guest.some((p) => p.allow)).toBe(true);
    expect(guest.some((p) => !p.allow)).toBe(true);
  });

  it('keeps the management VLAN off limits to users', () => {
    expect(POLICY.some((p) => p.to === 99 && !p.allow)).toBe(true);
  });
});

describe('the services', () => {
  it('are the addresses of the devices that provide them, not copies', () => {
    expect(SERVICES.dns).toBe(mgmtAddress(device('SRV-CORE')));
    expect(SERVICES.syslog).toBe(mgmtAddress(device('NETOPS')));
  });
});
