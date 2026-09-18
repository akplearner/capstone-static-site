/**
 * Topology symbols: how a command names an address without carrying one.
 *
 * Every command in the base build used to hold its addresses as literal text —
 * `curl -I http://172.16.0.10` was a string, not a reference to the DMZ web
 * server. That is fine for one classroom where the addressing never moves, and
 * it is the single thing that stops a procedure being reused: point the same
 * build at a business on a different subnet and all 226 commands are wrong.
 *
 * So a command is authored against the MODEL:
 *
 *     curl -I http://<vm.websrv.address>
 *
 * and `resolveSymbols` turns it into the text a student sees, once, at module
 * load. `hostRulesFile()` in `serverTopology.ts` has always generated the whole
 * firewall ruleset from the model this way; this is the same idea applied to
 * every other command.
 *
 * TWO SUBSTITUTIONS, IN ORDER, AND THEY ARE NOT THE SAME THING:
 *
 *   1. symbols  — the INSTANCE's addressing, resolved here at load.
 *                 `<vm.websrv.address>` → `172.16.0.10`
 *   2. lab fill — the STUDENT's own numbers, substituted at render by
 *                 `fillPlaceholders` in `labAccess.ts`.
 *                 `10.10.30.T` → `10.10.30.7`
 *
 * The host rule is deliberately both: `<host.rule>` resolves to `10.10.30.T`,
 * which is itself a lab token, so a team still sees its own address. Symbols are
 * lowercase and dotted; lab tokens are UPPER_SNAKE or hyphenated. Nothing
 * matches both, and `hasUnfilled` keeps working unchanged.
 */
import {
  BASE_VMS,
  BRIDGES,
  CAMPUS_LAN,
  HOST,
  SITE,
} from './serverTopology';

/** The network address of a CIDR block: `172.16.0.0/24` → `172.16.0.0`. */
export function networkOf(cidr: string): string {
  return cidr.split('/')[0];
}

/**
 * The dotted-quad mask of a CIDR block: `172.16.0.0/24` → `255.255.255.0`.
 *
 * Windows `route add` and the Ubuntu installer both ask for a mask rather than
 * a prefix length, so the model has to be able to say it both ways.
 */
export function netmaskOf(cidr: string): string {
  const bits = Number(cidr.split('/')[1]);
  if (!Number.isInteger(bits) || bits < 0 || bits > 32) {
    throw new Error(`not a CIDR prefix length: ${cidr}`);
  }
  const octets = [0, 1, 2, 3].map((i) => {
    const take = Math.min(8, Math.max(0, bits - i * 8));
    return 256 - 2 ** (8 - take);
  });
  return octets.join('.');
}

/**
 * The symbol table for the base build, derived from the topology module.
 *
 * Derived rather than listed, for the reason the DTO's topology export is
 * derived: a hand-kept list is only as current as the last person who
 * remembered to extend it, and that list was two thirds complete by the time
 * anyone checked.
 */
export function symbolTable(): Record<string, string> {
  const t: Record<string, string> = {};
  for (const v of BASE_VMS) {
    t[`vm.${v.hostname}.address`] = v.address;
    t[`vm.${v.hostname}.hostname`] = v.hostname;
  }
  for (const b of BRIDGES) {
    t[`bridge.${b.id}.gateway`] = b.gateway;
    t[`bridge.${b.id}.cidr`] = b.cidr;
    t[`bridge.${b.id}.network`] = networkOf(b.cidr);
    t[`bridge.${b.id}.netmask`] = netmaskOf(b.cidr);
  }
  t['campus.gateway'] = CAMPUS_LAN.gateway;
  t['campus.cidr'] = CAMPUS_LAN.cidr;
  t['campus.network'] = networkOf(CAMPUS_LAN.cidr);
  t['host.rule'] = HOST.rule;
  t['host.hostname'] = HOST.hostname;
  t['host.consolePort'] = String(HOST.consolePort);
  t['host.exampleAddress'] = HOST.exampleAddress;
  t['site.root'] = SITE.root;
  t['site.uploadUser'] = SITE.uploadUser;
  t['site.uploadPort'] = String(SITE.uploadPort);
  return t;
}

/** The table for the built-in courses, built once. */
export const SYMBOLS: Record<string, string> = symbolTable();

/** A dotted lowercase symbol in angle brackets: `<vm.websrv.address>`. */
export const SYMBOL_RE = /<([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9_-]+)+)>/g;

/**
 * Replace every symbol in `text` with its value.
 *
 * An unknown symbol throws rather than passing through. A typo that silently
 * left `<vm.webserv.address>` on the screen would be worse than a build
 * failure, and the guard that forbids literal addresses would not catch it.
 */
export function resolveSymbols(text: string, table: Record<string, string> = SYMBOLS): string {
  return text.replace(SYMBOL_RE, (whole, name: string) => {
    const value = table[name];
    if (value === undefined) throw new Error(`unknown topology symbol ${whole}`);
    return value;
  });
}

/** Every symbol `text` names, in order of first appearance. */
export function symbolsIn(text: string): string[] {
  return [...new Set(Array.from(text.matchAll(SYMBOL_RE), (m) => m[1]))];
}

/**
 * The addresses a command may NOT write literally, mapped to the symbol that
 * should be there. The inverted address guard reads this.
 */
export function literalToSymbol(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(SYMBOLS)) {
    // Only address-shaped values, and the first symbol wins so the message
    // names `vm.websrv.address` rather than some later alias of the same value.
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.[0-9A-Za-z]/.test(value)) continue;
    if (!(value in out)) out[value] = `<${name}>`;
  }
  return out;
}

/**
 * Addresses that are genuinely not this topology, so they stay literal.
 *
 * Loopback, the two public resolvers the course uses before its own DNS exists,
 * the any-address iptables prints, and the broadcast address.
 */
export const NOT_TOPOLOGY = ['127.0.0.1', '8.8.8.8', '1.1.1.1', '0.0.0.0', '255.255.255.255'];
