import { describe, it, expect } from 'vitest';
import { fillPlaceholders, hasUnfilled } from './labAccess';

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
