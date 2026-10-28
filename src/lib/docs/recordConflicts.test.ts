import { describe, expect, it } from 'vitest';
import { seedDeliverablesForCourse } from './definitions';
import { gbOf, hostPortOf, projectRecord, recordConflicts, conflictsOnForm, threadsOf } from './projectRecord';
import type { DeliverableData } from './types';

const srv = seedDeliverablesForCourse('server-plus');
const ccna = seedDeliverablesForCourse('ccna');
const azf = seedDeliverablesForCourse('azure-fundamentals');

const conflicts = (docs: Record<string, DeliverableData>, defs = srv) => recordConflicts(projectRecord(docs, defs));
const rules = (docs: Record<string, DeliverableData>, defs = srv) => conflicts(docs, defs).map((c) => c.rule);
const register = (text: string) => {
  expect(text, 'second person').not.toMatch(/\b(you|your|yours)\b/i);
  expect(text, 'one sentence').toMatch(/\.$/);
};

/**
 * R139 — every conflict rule, positively and negatively, over hand-built
 * records. A rule that fires on the worked example or on a value it cannot
 * parse is worse than no rule, so each has its quiet case too.
 */
describe('R139 — record conflicts', () => {
  const machines = (names: string[]) => ({ fields: {}, groups: { machines: names.map((hostname) => ({ hostname, zone: 'vmbr2 — private' })) } });
  const addresses = (rows: { hostname: string; address: string }[]) => ({ fields: {}, groups: { addresses: rows.map((r) => ({ ...r, gateway: '192.168.0.1', dns: '192.168.0.2' })) } });

  it('one address on two machines, and the same address twice in a table', () => {
    const docs = { srv_business_reqs: machines(['websrv', 'linuxsrv']), srv_ip_plan: addresses([{ hostname: 'websrv', address: '192.168.0.3/24' }, { hostname: 'linuxsrv', address: '192.168.0.3/24' }]) };
    const out = conflicts(docs);
    expect(out.map((c) => c.rule)).toContain('duplicate-address');
    const c = out.find((x) => x.rule === 'duplicate-address' && x.message.includes('websrv'))!;
    expect(c.keys).toEqual(['srv_ip_plan.addresses[0].address', 'srv_ip_plan.addresses[1].address']);
    expect(c.severity).toBe('error');
    register(c.message);
    expect(conflictsOnForm(out, 'srv_ip_plan').length).toBeGreaterThan(0);
    expect(conflictsOnForm(out, 'srv_hardware')).toEqual([]);
    // Two machines, two addresses: quiet.
    expect(rules({ srv_business_reqs: machines(['websrv', 'linuxsrv']), srv_ip_plan: addresses([{ hostname: 'websrv', address: '172.16.0.10/24' }, { hostname: 'linuxsrv', address: '192.168.0.3/24' }]) })).toEqual([]);
    // A DNS server address that equals another host's address is not a duplicate: dns is not an address a host holds.
    expect(rules({ srv_business_reqs: machines(['websrv', 'winserver']), srv_ip_plan: addresses([{ hostname: 'winserver', address: '192.168.0.2/24' }, { hostname: 'websrv', address: '172.16.0.10/24' }]) })).toEqual([]);
  });

  it('a VLAN id or a prefix used twice, and prefixes that overlap', () => {
    const lld = (rows: { vlan: string; prefix: string; gateway: string }[]): DeliverableData => ({ fields: {}, groups: { vlans: rows.map((r) => ({ ...r, purpose: 'x', dhcp: 'x' })) } });
    const twice = conflicts({ ccna_lld: lld([{ vlan: '10 — Staff', prefix: '10.0.10.0/24', gateway: '10.0.10.1' }, { vlan: '10 — Staff', prefix: '10.0.20.0/24', gateway: '10.0.20.1' }]) }, ccna);
    expect(twice.map((c) => c.rule)).toEqual(['duplicate-value']);
    expect(twice[0].message).toContain('VLAN 10 — Staff appears 2 times');
    const overlap = rules({ ccna_lld: lld([{ vlan: '10 — Staff', prefix: '10.0.0.0/16', gateway: '10.0.0.1' }, { vlan: '20 — Guests', prefix: '10.0.20.0/24', gateway: '10.0.20.1' }]) }, ccna);
    expect(overlap).toEqual(['prefixes-overlap']);
    expect(rules({ ccna_lld: lld([{ vlan: '10 — Staff', prefix: '10.0.10.0/24', gateway: '10.0.10.1' }, { vlan: '20 — Guests', prefix: '10.0.20.0/24', gateway: '10.0.20.1' }]) }, ccna)).toEqual([]);
    // A prefix that does not parse never fires.
    expect(rules({ ccna_lld: lld([{ vlan: '10 — Staff', prefix: 'the staff range', gateway: '10.0.10.1' }, { vlan: '20 — Guests', prefix: '10.0.20.0/24', gateway: '10.0.20.1' }]) }, ccna)).toEqual([]);
  });

  it('a gateway outside its own prefix, and a cloud VM address outside the first subnet', () => {
    const lld: DeliverableData = { fields: {}, groups: { vlans: [{ vlan: '10 — Staff', purpose: 'x', prefix: '10.0.10.0/24', gateway: '10.0.20.1', dhcp: 'x' }] } };
    const out = conflicts({ ccna_lld: lld }, ccna);
    expect(out.map((c) => c.rule)).toEqual(['address-outside-prefix']);
    expect(out[0].keys).toEqual(['ccna_lld.vlans[0].gateway', 'ccna_lld.vlans[0].prefix']);
    register(out[0].message);
    const cloud = (ip: string) => ({
      azf_foundation: { fields: { net_cidr: '10.10.0.0/16', subnet_cidr: '10.10.1.0/24' }, groups: {} },
      azf_sad: { fields: { vm_name: 'vm-tools-team01', vm_size: 'Standard_B1s', vm_private_ip: ip }, groups: {} },
    });
    expect(rules(cloud('10.10.2.4'), azf)).toEqual(['address-outside-prefix']);
    expect(rules(cloud('10.10.1.4'), azf)).toEqual([]);
  });

  it('a port assigned twice on one machine, not across machines', () => {
    const ports = (rows: { host: string; port: string }[]): DeliverableData => ({ fields: {}, groups: { ports: rows.map((r) => ({ ...r, service: 'x', who: 'x', decision: 'Keep — justified' })) } });
    const out = conflicts({ srv_business_reqs: machines(['websrv', 'linuxsrv']), srv_standards: ports([{ host: 'websrv', port: '80/tcp' }, { host: 'websrv', port: '80/tcp' }]) });
    expect(out.map((c) => c.rule)).toEqual(['port-reused']);
    expect(out[0].message).toBe('Port 80 is assigned 2 times on websrv.');
    expect(rules({ srv_business_reqs: machines(['websrv', 'linuxsrv']), srv_standards: ports([{ host: 'websrv', port: '80/tcp' }, { host: 'linuxsrv', port: '80/tcp' }]) })).toEqual([]);
    // The host's published ports are the host's: the same host port twice is a reuse.
    const published = (ports: string[]): DeliverableData => ({ fields: {}, groups: { published: ports.map((host_port) => ({ host_port, to: 'websrv:80', service: 'nginx', why: 'x', proof: 'x' })) } });
    expect(rules({ srv_ip_plan: published(['80/tcp', '80/tcp']) })).toEqual(expect.arrayContaining(['duplicate-value']));
    expect(rules({ srv_ip_plan: published(['80/tcp', '443/tcp']) })).toEqual([]);
  });

  it('a machine named but never declared — only once the team has declared any, never an address or a place', () => {
    const baseline = (hosts: string[]): DeliverableData => ({ fields: {}, groups: { baseline: hosts.map((host) => ({ host, what: 'x', command: 'x', file: 'x', hash: 'x' })) } });
    const out = conflicts({ srv_business_reqs: machines(['websrv']), srv_standards: baseline(['websrv', 'dbsrv', 'Campus LAN', '10.10.30.1']) });
    expect(out.map((c) => [c.rule, c.severity])).toEqual([['undeclared-host', 'warn']]);
    expect(out[0].message).toBe("dbsrv is named here but not declared among the team's machines.");
    expect(rules({ srv_standards: baseline(['dbsrv']) })).toEqual([]);
    expect(rules({ srv_business_reqs: machines(['WebSrv']), srv_standards: baseline(['websrv']) })).toEqual([]);
  });

  it('RAM committed above what the hardware reports, and vCPUs past twice the threads', () => {
    const hardware: DeliverableData = { fields: {}, groups: { discovery: [
      { component: 'CPU model & cores', command: 'lscpu', found: '2× Xeon E5-2640 v3 — 16C / 32T', notes: '' },
      { component: 'Memory size, type & ECC', command: 'dmidecode', found: '32 GB RDIMM ECC — 4 of 24 slots used', notes: '' },
    ] } };
    const vms = (rows: [string, string, string][]): DeliverableData => ({ fields: {}, groups: { vms: rows.map(([hostname, vcpu, ram_gb]) => ({ hostname, vcpu, ram_gb, disk_gb: '40', note: '' })) } });
    const over = conflicts({ srv_hardware: hardware, srv_bringup: vms([['websrv', '4', '16'], ['linuxsrv', '4', '24']]) });
    expect(over.map((c) => [c.rule, c.severity])).toEqual([['ram-over-committed', 'error']]);
    expect(over[0].message).toBe('40 GB of RAM is committed to the machines; the host reports 32 GB.');
    expect(over[0].keys).toContain('srv_hardware.discovery[1].found');
    expect(rules({ srv_hardware: hardware, srv_bringup: vms([['websrv', '4', '8'], ['linuxsrv', '4', '8']]) })).toEqual([]);
    const cpu = conflicts({ srv_hardware: hardware, srv_bringup: vms([['websrv', '40', '8'], ['linuxsrv', '32', '8']]) });
    expect(cpu.map((c) => [c.rule, c.severity])).toEqual([['cpu-over-committed', 'warn']]);
    // Without a discovery, nothing to set the sizes against.
    expect(rules({ srv_bringup: vms([['websrv', '64', '512']]) })).toEqual([]);
  });

  it('a published port that forwards to a host and port no listening row records — once the ports table has rows', () => {
    const plan: DeliverableData = { fields: {}, groups: { published: [{ host_port: '80/tcp', to: 'websrv:80', service: 'nginx', why: 'x', proof: 'x' }, { host_port: '2200/tcp', to: 'websrv:22', service: 'sshd', why: 'x', proof: 'x' }] } };
    const ports = (rows: [string, string][]): DeliverableData => ({ fields: {}, groups: { ports: rows.map(([host, port]) => ({ host, port, service: 'x', who: 'x', decision: 'Keep — justified' })) } });
    const out = conflicts({ srv_ip_plan: plan, srv_standards: ports([['websrv', '80/tcp']]) });
    expect(out.map((c) => [c.rule, c.severity])).toEqual([['published-port-not-listening', 'warn']]);
    expect(out[0].message).toBe('websrv:22 is published, but no listening port 22 is recorded on websrv.');
    expect(rules({ srv_ip_plan: plan, srv_standards: ports([['websrv', '80/tcp'], ['websrv', '22/tcp']]) })).toEqual([]);
    expect(rules({ srv_ip_plan: plan })).toEqual([]);
  });

  it('ids are stable for the same facts and the parsers read what the forms write', () => {
    const docs = { srv_business_reqs: machines(['a', 'b']), srv_ip_plan: addresses([{ hostname: 'a', address: '10.0.0.1' }, { hostname: 'b', address: '10.0.0.1' }]) };
    expect(conflicts(docs).map((c) => c.id)).toEqual(conflicts(docs).map((c) => c.id));
    expect(conflicts(docs)[0].id).toBe('conflict:duplicate-address:srv_ip_plan.addresses[0].address+srv_ip_plan.addresses[1].address');
    expect(gbOf('32 GB RDIMM ECC — 4 of 24 slots used')).toBe(32);
    expect(gbOf('1 TB NVMe')).toBe(1024);
    expect(gbOf('no number here')).toBeNull();
    expect(threadsOf('2× Xeon E5-2640 v3 — 16C / 32T')).toBe(32);
    expect(threadsOf('8 cores')).toBe(8);
    expect(hostPortOf('websrv:80')).toEqual({ host: 'websrv', port: 80 });
    expect(hostPortOf('the website')).toBeNull();
  });
});
