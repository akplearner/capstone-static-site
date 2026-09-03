import { describe, it, expect } from 'vitest';
import { fillPlaceholders, hasUnfilled, labProfile, hasLabAccess, SERVER_FIELDS } from './labAccess';
import { SERVER_PLUS } from './data/seed/serverPlus';
import { PROCEDURES } from './docs/serverProcedures';
import { HOST } from './serverTopology';

describe('fillPlaceholders', () => {
  it('replaces every token for a filled field', () => {
    const values = { YOUR_TARGET_IP: '192.168.56.5' };
    expect(fillPlaceholders('nmap <YOUR_TARGET_IP>', values)).toBe('nmap 192.168.56.5');
    expect(fillPlaceholders('nmap 10.10.100.X', values)).toBe('nmap 192.168.56.5');
    expect(fillPlaceholders('nmap 10.10.100.x', values)).toBe('nmap 192.168.56.5');
  });

  it('leaves unknown tokens untouched', () => {
    expect(fillPlaceholders('ssh <WINDOWS_IP>', { YOUR_TARGET_IP: '1.2.3.4' })).toBe('ssh <WINDOWS_IP>');
  });

  it('ignores empty / whitespace values', () => {
    expect(fillPlaceholders('nmap <YOUR_TARGET_IP>', { YOUR_TARGET_IP: '   ' })).toBe('nmap <YOUR_TARGET_IP>');
  });
});

describe('hasUnfilled', () => {
  it('detects angle-bracket placeholders', () => {
    expect(hasUnfilled('nmap <YOUR_TARGET_IP>')).toBe(true);
  });

  it('detects the 10.10.100.X sample token (upper and lower case)', () => {
    expect(hasUnfilled('nmap 10.10.100.X')).toBe(true);
    expect(hasUnfilled('nmap 10.10.100.x')).toBe(true);
  });

  it('detects the lowercase spellings declared on a field', () => {
    expect(hasUnfilled('ping <kali-ip>')).toBe(true);
    expect(hasUnfilled('team<#>')).toBe(true);
  });

  it('returns false for a fully-resolved command', () => {
    expect(hasUnfilled('nmap 192.168.56.5')).toBe(false);
  });

  // Markup is not a placeholder. Flagging it sent a student to a Lab access
  // panel to "fill in" the HTML of their own welcome page, or their Wazuh XML.
  it('does not flag markup that merely looks like a token', () => {
    expect(
      hasUnfilled('echo "<html><body><h1>Welcome to the Team X capstone website</h1></body></html>" | sudo tee /var/www/html/index.html')
    ).toBe(false);
    expect(hasUnfilled('<ossec_config>\n  <localfile>\n    <log_format>syslog</log_format>')).toBe(false);
  });
});

/**
 * The build course collects lab access too.
 *
 * Server+ used to declare an EMPTY profile, which switched off four things at
 * once: the panel, the substitution, the "this still shows a placeholder"
 * warning, and the matching troubleshooting row. It now collects the two
 * numbers that differ per team — the host address and its Tailscale address —
 * so the rule in a command becomes the student's own number.
 */
describe('the Server+ profile', () => {
  it('collects the two addresses that differ per team', () => {
    expect(hasLabAccess('server-plus')).toBe(true);
    const keys = labProfile('server-plus').fields.map((f) => f.key);
    expect(keys).toEqual(['PVE_HOST', 'PVE_TAILSCALE']);
  });

  it('names what it collects, rather than the attack lab’s targets', () => {
    // The default heading says "your targets", which a build course has none of.
    expect(labProfile('server-plus').title).toBeTruthy();
    expect(labProfile('server-plus').title).not.toContain('target');
  });

  it('substitutes the host rule and the Tailscale spelling the content uses', () => {
    const values = { PVE_HOST: '10.10.30.7', PVE_TAILSCALE: '100.101.102.103' };
    expect(fillPlaceholders(`ssh root@${HOST.rule}`, values)).toBe('ssh root@10.10.30.7');
    expect(fillPlaceholders('ssh root@<tailscale-ip>', values)).toBe('ssh root@100.101.102.103');
    // …and flags them as unfilled while the student has not set them.
    expect(hasUnfilled('ssh root@<tailscale-ip>')).toBe(true);
    expect(hasUnfilled(`ssh root@${HOST.rule}`)).toBe(true);
  });

  it('leaves the security lab alone', () => {
    expect(labProfile('cysa-plus').fields.map((f) => f.key)).toContain('ATTACKER_IP');
    expect(labProfile('cysa-plus').fields.map((f) => f.key)).not.toContain('PVE_HOST');
  });
});

/**
 * A placeholder nobody can fill is worse than the literal it replaced: it
 * renders raw, it copies raw, and the warning that points at the panel names a
 * field the panel does not have. So every angle token in Server+ commands must
 * resolve to a field this course actually collects.
 */
describe('every Server+ placeholder is one a student can set', () => {
  const serverTokens = new Set(SERVER_FIELDS.flatMap((f) => f.tokens));
  const commandText = [
    ...SERVER_PLUS.tasks.flatMap((t) => t.steps.flatMap((s) => [s.command ?? '', ...(s.commands ?? []).map((c) => c.cmd)])),
    ...PROCEDURES.flatMap((p) => p.steps.map((s) => s.cmd ?? '')),
  ].filter(Boolean);

  it('has commands to check', () => {
    expect(commandText.length).toBeGreaterThan(50);
  });

  it('uses no angle placeholder the Server+ panel cannot fill', () => {
    // Lowercase markup (<html>, <body>) is not a placeholder — the same rule
    // `hasUnfilled` applies. Only hyphenated or UPPER_SNAKE forms count.
    const unresolved = new Set<string>();
    for (const cmd of commandText) {
      for (const tok of cmd.match(/<[A-Za-z][A-Za-z0-9_-]*>/g) ?? []) {
        const isPlaceholder = /^<[A-Z][A-Z0-9_]*>$/.test(tok) || tok.includes('-');
        if (isPlaceholder && !serverTokens.has(tok)) unresolved.add(tok);
      }
    }
    expect(Array.from(unresolved), 'register these on a SERVER_FIELDS entry, or stop using them').toEqual([]);
  });
});
