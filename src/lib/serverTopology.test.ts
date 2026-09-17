import { describe, it, expect } from 'vitest';
import {
  BASE_VMS,
  CROSS_ZONE_ALLOW,
  HOST_RULES_FILE,
  PUBLISHED_PORTS,
  SITE,
  hostRulesCommand,
  hostRulesFile,
  vm,
} from './serverTopology';
import { SERVER_PLUS } from './data/seed/serverPlus';
import { PROCEDURES } from './docs/serverProcedures';

const step = (id: string) => SERVER_PLUS.tasks.flatMap((t) => t.steps).find((s) => s.id === id);
const procedure = (id: string) => PROCEDURES.find((p) => p.id === id);
const count = (text: string, re: RegExp) => (text.match(re) ?? []).length;

describe('the host rules file — one model, rendered everywhere', () => {
  const holes = hostRulesFile('the-holes');
  const wayOut = hostRulesFile('the-way-out');

  it('every published port and cross-zone allow names a base VM', () => {
    const names = new Set(BASE_VMS.map((v) => v.hostname));
    for (const p of PUBLISHED_PORTS) expect(names.has(p.to), `${p.hostPort} → ${p.to}`).toBe(true);
    for (const r of CROSS_ZONE_ALLOW) expect(names.has(r.to), `${r.port} → ${r.to}`).toBe(true);
  });

  it('publishes the site, TLS, the upload path and SSH to the database host', () => {
    const byHostPort = Object.fromEntries(PUBLISHED_PORTS.map((p) => [p.hostPort, `${p.to}:${p.port}`]));
    expect(byHostPort).toEqual({ 80: 'websrv:80', 443: 'websrv:443', 2200: 'websrv:22', 2222: 'linuxsrv:22' });
    expect(SITE.uploadPort).toBe(2200);
  });

  it('the Week-3 file has one DNAT per published port and nothing else published', () => {
    for (const p of PUBLISHED_PORTS) {
      const line = `-A PREROUTING -i vmbr0 -p tcp --dport ${p.hostPort} -j DNAT --to-destination ${vm(p.to).address}:${p.port}`;
      expect(count(holes, new RegExp(line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))).toBe(1);
    }
    expect(count(holes, /-j DNAT/g)).toBe(PUBLISHED_PORTS.length);
  });

  it('forwards are closed by default, with the DMZ allowed only DNS and the database inside', () => {
    expect(holes).toContain(':FORWARD DROP [0:0]');
    expect(holes).toContain('-A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT');
    for (const r of CROSS_ZONE_ALLOW) {
      expect(holes).toContain(`-A FORWARD -i vmbr1 -o vmbr2 -d ${vm(r.to).address} -p ${r.proto} --dport ${r.port} -j ACCEPT`);
    }
    // No blanket DMZ → private rule, and no source NAT between the zones.
    expect(holes).not.toMatch(/-A FORWARD -i vmbr1 -o vmbr2 -j ACCEPT/);
    expect(holes).not.toMatch(/-s 172\.16\.0\.0\/24 -d 192\.168\.0\.0\/24/);
    expect(count(holes, /-j MASQUERADE/g)).toBe(1);
    expect(holes).toContain('-A POSTROUTING -o vmbr0 -j MASQUERADE');
    expect(count(holes, /-j LOG --log-prefix "FWD-DROP "/g)).toBe(1);
  });

  it('the Week-2 file is the way out and nothing more', () => {
    expect(wayOut).toContain(':FORWARD DROP [0:0]');
    expect(wayOut).toContain('-A FORWARD -i vmbr1 -o vmbr0 -j ACCEPT');
    expect(wayOut).toContain('-A FORWARD -i vmbr2 -o vmbr0 -j ACCEPT');
    expect(wayOut).not.toContain('DNAT');
    expect(wayOut).not.toContain('-o vmbr2 -d');
    expect(count(wayOut, /-j MASQUERADE/g)).toBe(1);
  });

  it('is a well-formed iptables-restore file', () => {
    for (const text of [holes, wayOut]) {
      const tables = text.match(/^\*(filter|nat)$/gm) ?? [];
      expect(tables).toEqual(['*filter', '*nat']);
      expect(count(text, /^COMMIT$/gm)).toBe(2);
      expect(text.endsWith('\n')).toBe(true);
      // Every rule line is a chain append; nothing else leaks in.
      for (const line of text.split('\n').filter((l) => l && !l.startsWith('#') && !l.startsWith('*') && !l.startsWith(':') && l !== 'COMMIT')) {
        expect(line, line).toMatch(/^-A (FORWARD|PREROUTING|POSTROUTING) /);
      }
    }
  });

  it('the seed step and the guide procedure embed the same file, from this module', () => {
    const cmd = hostRulesCommand('the-holes');
    expect(cmd.startsWith(`cat > ${HOST_RULES_FILE} <<'EOF'\n`)).toBe(true);
    expect(cmd.endsWith(`EOF\niptables-restore < ${HOST_RULES_FILE}`)).toBe(true);
    const seed = step('sp-w3-connect-s3');
    const guide = procedure('enable-routing-nat');
    expect(seed?.commands?.some((c) => c.cmd === cmd)).toBe(true);
    expect(guide?.steps.some((s) => s.cmd === cmd)).toBe(true);
    const week2 = hostRulesCommand('the-way-out');
    expect(step('sp-w2-install-s3')?.commands?.some((c) => c.cmd === week2)).toBe(true);
    expect(procedure('create-zone-bridges')?.steps.some((s) => s.cmd === week2)).toBe(true);
  });

  it('the Week-3 verify tokens are the published ports, no more and no fewer', () => {
    const tokens = PUBLISHED_PORTS.map((p) => `to:${vm(p.to).address}:${p.port}`);
    expect(step('sp-w3-connect-s3')?.verify).toEqual(tokens);
  });

  it('the site is built, uploaded through the published port, and proven from the campus', () => {
    const upload = step('sp-w3-connect-s3b');
    expect(upload?.guideRef?.procedureId).toBe('build-and-upload-site');
    expect(upload?.commands?.some((c) => c.cmd.includes(`scp -P ${SITE.uploadPort} -r site/*`))).toBe(true);
    expect(upload?.commands?.some((c) => c.cmd.includes('site/index.html'))).toBe(true);
    expect(upload?.usesForm).toBe('IP Plan & Connectivity Proof');
    const guide = procedure('build-and-upload-site');
    expect(guide?.week).toBe(3);
    expect(guide?.steps.some((s) => s.cmd?.includes(`scp -P ${SITE.uploadPort}`))).toBe(true);
    // The guide keeps the rules before the upload: no port, no upload.
    const w3 = PROCEDURES.filter((p) => p.week === 3).map((p) => p.id);
    expect(w3.indexOf('build-and-upload-site')).toBe(w3.indexOf('enable-routing-nat') + 1);
  });
});
