import { describe, it, expect } from 'vitest';
import {
  NOT_TOPOLOGY,
  SYMBOLS,
  literalToSymbol,
  netmaskOf,
  networkOf,
  resolveSymbols,
  symbolsIn,
} from './topologySymbols';
import { BASE_VMS, BRIDGES, CAMPUS_LAN, HOST, SITE, vm, bridge } from './serverTopology';

describe('CIDR arithmetic', () => {
  it('takes the network address off a block', () => {
    expect(networkOf('172.16.0.0/24')).toBe('172.16.0.0');
    expect(networkOf('10.10.0.0/16')).toBe('10.10.0.0');
  });

  it('turns a prefix length into a dotted mask', () => {
    expect(netmaskOf('172.16.0.0/24')).toBe('255.255.255.0');
    expect(netmaskOf('10.10.0.0/16')).toBe('255.255.0.0');
    expect(netmaskOf('10.0.0.0/8')).toBe('255.0.0.0');
    expect(netmaskOf('192.168.1.0/30')).toBe('255.255.255.252');
    expect(netmaskOf('0.0.0.0/0')).toBe('0.0.0.0');
  });

  it('refuses something that is not a prefix length', () => {
    expect(() => netmaskOf('172.16.0.0')).toThrow();
    expect(() => netmaskOf('172.16.0.0/33')).toThrow();
  });
});

describe('the symbol table is the topology model, not a copy of it', () => {
  it('names every base VM by its own address', () => {
    for (const v of BASE_VMS) expect(SYMBOLS[`vm.${v.hostname}.address`]).toBe(v.address);
  });

  it('names every bridge four ways, all agreeing with the model', () => {
    for (const b of BRIDGES) {
      expect(SYMBOLS[`bridge.${b.id}.gateway`]).toBe(b.gateway);
      expect(SYMBOLS[`bridge.${b.id}.cidr`]).toBe(b.cidr);
      expect(SYMBOLS[`bridge.${b.id}.network`]).toBe(networkOf(b.cidr));
      expect(SYMBOLS[`bridge.${b.id}.netmask`]).toBe(netmaskOf(b.cidr));
    }
  });

  it('carries the campus, the host and the site', () => {
    expect(SYMBOLS['campus.gateway']).toBe(CAMPUS_LAN.gateway);
    expect(SYMBOLS['host.rule']).toBe(HOST.rule);
    expect(SYMBOLS['site.uploadPort']).toBe(String(SITE.uploadPort));
  });
});

describe('resolving a command', () => {
  it('replaces a symbol with the address the model holds', () => {
    expect(resolveSymbols('curl -I http://<vm.websrv.address>')).toBe(
      `curl -I http://${vm('websrv').address}`
    );
  });

  it('replaces several symbols, including repeats', () => {
    const out = resolveSymbols('ping <bridge.vmbr1.gateway> && ping <bridge.vmbr1.gateway>');
    expect(out).toBe(`ping ${bridge('vmbr1').gateway} && ping ${bridge('vmbr1').gateway}`);
  });

  it('leaves the student lab tokens alone — they are filled later, per team', () => {
    // `<host.rule>` resolves to the RULE, which is itself a lab token; the
    // student's own number arrives at render, in fillPlaceholders.
    expect(resolveSymbols('ssh root@<host.rule>')).toBe(`ssh root@${HOST.rule}`);
    expect(resolveSymbols('ssh alex@<tailscale-ip>')).toBe('ssh alex@<tailscale-ip>');
    expect(resolveSymbols('nmap <PVE_HOST>')).toBe('nmap <PVE_HOST>');
  });

  it('leaves markup that merely looks like a symbol alone', () => {
    const html = '<html><body><h1>Welcome</h1></body></html>';
    expect(resolveSymbols(html)).toBe(html);
    expect(resolveSymbols('<ossec_config>\n  <localfile>')).toBe('<ossec_config>\n  <localfile>');
  });

  it('throws on a symbol the model does not know, rather than printing it', () => {
    expect(() => resolveSymbols('ping <vm.webserv.address>')).toThrow(/unknown topology symbol/);
  });

  it('lists the symbols a string names', () => {
    expect(symbolsIn('scp -P <site.uploadPort> x <site.uploadUser>@<host.rule>:<site.root>')).toEqual([
      'site.uploadPort',
      'site.uploadUser',
      'host.rule',
      'site.root',
    ]);
  });
});

describe('the literal-to-symbol map the address guard reads', () => {
  const map = literalToSymbol();

  it('maps every base VM address to a symbol', () => {
    for (const v of BASE_VMS) expect(map[v.address]).toBe(`<vm.${v.hostname}.address>`);
  });

  it('maps the zone gateways', () => {
    for (const b of BRIDGES) expect(map[b.gateway]).toBe(`<bridge.${b.id}.gateway>`);
  });

  it('holds no address that is not this topology', () => {
    for (const a of NOT_TOPOLOGY) expect(map[a]).toBeUndefined();
  });
});
