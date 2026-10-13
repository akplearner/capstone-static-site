import { describe, it, expect } from 'vitest';
import { CONTROLS, CONTROL_EXCEPTIONS, STANDARDS, controlOf, controlsOf, parseStandard, standardOf, standardsCited, underControl } from './standards';
import { PRACTICES } from './tactics';
import { getFrameworkColor, getFrameworkDescription, getFrameworkLabel, getFrameworkWhy } from '../utils';

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const REGISTER = (s: string, what: string) => {
  expect(s, `${what}: second person`).not.toMatch(/\b(you|your|yours|we|our)\b/i);
  expect(s, `${what}: em dash or emoji`).not.toMatch(/—|\p{Extended_Pictographic}/u);
  expect(s, `${what}: contraction`).not.toMatch(/\b\w+n[’']t\b|\b\w+[’'](re|ll|ve|m)\b|\b(it|that|what|there|here)[’']s\b/i);
};

/** The ids the platform tagged tasks with before R107; every one must still resolve. */
const LEGACY = ['NIST_CSF', 'CIS', 'OWASP', 'CVSS', 'NIST_800_61', 'NIST_800_115', 'ISO_27001', 'SOC_2', 'STRIDE', 'CCNA', 'ITIL', 'AZ_900', 'AZ_104', 'AZ_400', 'AWS_CLF', 'AWS_SAA', 'AWS_DOP', 'WAF', 'SECAI', 'CISSP', 'NIST_AI_RMF', 'OWASP_LLM', 'MITRE_ATLAS', 'ISO_42001', 'NIST_800_53', 'NIST_800_171'];

describe('R107 — the standards register', () => {
  it('every standard has one id, a short label, a publisher and a reason in the register', () => {
    expect(new Set(STANDARDS.map((s) => s.id)).size).toBe(STANDARDS.length);
    for (const s of STANDARDS) {
      expect(s.id).toMatch(/^[A-Z][A-Z0-9_]+$/);
      expect(words(s.label), `${s.id} label ≤ 6 words`).toBeLessThanOrEqual(6);
      expect(words(s.description), `${s.id} description ≤ 20 words`).toBeLessThanOrEqual(20);
      expect(words(s.why), `${s.id} why ≤ 70 words`).toBeLessThanOrEqual(70);
      expect(words(s.why), `${s.id} why says something`).toBeGreaterThanOrEqual(12);
      expect(['framework', 'exam', 'practice', 'publication']).toContain(s.kind);
      expect(['info', 'accent', 'warn', 'danger', 'ok']).toContain(s.tone);
      expect(s.publisher.length).toBeGreaterThan(0);
      for (const text of [s.label, s.description, s.why]) REGISTER(text, s.id);
      if (s.url) expect(s.url).toMatch(/^https?:\/\//);
    }
    for (const id of LEGACY) expect(standardOf(id), `${id} still resolves`).toBeTruthy();
  });

  it('the controls catalogue is consistent: unique codes, real standards, parents of the same standard, codes that fit the pattern', () => {
    expect(new Set(CONTROLS.map((c) => c.code)).size).toBe(CONTROLS.length);
    for (const c of CONTROLS) {
      const std = standardOf(c.standard);
      expect(std, `${c.code} → ${c.standard}`).toBeTruthy();
      expect(words(c.label), `${c.code} label ≤ 8 words`).toBeLessThanOrEqual(8);
      if (c.parent) {
        const parent = controlOf(c.parent);
        expect(parent, `${c.code} parent ${c.parent}`).toBeTruthy();
        expect(parent!.standard, `${c.code} and its parent share a standard`).toBe(c.standard);
        expect(underControl(c.code, c.parent)).toBe(true);
      }
      if (std?.codePattern) expect(c.code, `${c.code} fits ${std.codePattern}`).toMatch(new RegExp(std.codePattern));
      if (c.scope) expect(() => new RegExp(c.scope!)).not.toThrow();
      REGISTER(c.label, c.code);
    }
    expect(controlsOf('NIST_CSF').map((c) => c.code)).toContain('NIST.CSF.DE.CM-01');
    expect(controlsOf('ITIL').length).toBeGreaterThanOrEqual(10);
  });

  it('parseStandard emits only catalogue rows, the most specific one, and nothing for free text', () => {
    const codes = (t: string) => parseStandard(t).map((r) => r.code);
    expect(codes('NIST CSF (DE.CM-1)')).toEqual(['NIST.CSF.DE.CM-01']);
    expect(codes('NIST SP 800-53 AC-6 (least privilege)')).toEqual(['NIST.800-53.AC-6']);
    expect(codes('ISO 27001:2022 Clause 6.1.3')).toEqual(['ISO27001.6.1.3']);
    expect(codes('SOC 2 CC7 · ISO 9.1')).toEqual(['ISO27001.9.1', 'SOC2.CC7']);
    expect(codes('PTES / NIST SP 800-115')).toEqual(['NIST.800-115', 'PTES']);
    expect(codes('OWASP LLM Top 10 · MITRE ATLAS')).toEqual(['OWASP.LLM', 'MITRE.ATLAS']);
    expect(codes('NIST CSF (Detect, Respond, Recover) · SP 800-61')).toEqual(['NIST.CSF.DE', 'NIST.CSF.RS', 'NIST.CSF.RC', 'NIST.800-61']);
    expect(codes('NIST SP 800-61 (Detection & Analysis)')).toEqual(['NIST.800-61.DETECT']);
    expect(codes('AWS Well-Architected — cost and security pillars')).toEqual(['WAF.security', 'WAF.cost']);
    expect(codes('Rules of Engagement')).toEqual([]);
    expect(codes('Detection Rules')).toEqual([]);
    expect(standardsCited('NIST SP 800-30 / ISO 27005')).toEqual(['NIST_800_30', 'ISO_27005']);
  });

  it('every exception names practices that exist', () => {
    const practices = new Set(PRACTICES.map((p) => p.id));
    for (const [text, ids] of Object.entries(CONTROL_EXCEPTIONS)) {
      expect(parseStandard(text), `${text} is an exception because it cites nothing`).toEqual([]);
      expect(ids.length, text).toBeGreaterThan(0);
      for (const id of ids) expect(practices.has(id), `${text} → ${id}`).toBe(true);
    }
  });

  it('the framework helpers read the register and fall back for an unknown id', () => {
    expect(getFrameworkLabel('NIST_CSF')).toBe('NIST CSF');
    expect(getFrameworkColor('CVSS')).toBe('bg-danger-soft text-danger');
    expect(getFrameworkDescription('SOC_2')).toContain('Trust Services Criteria');
    expect(getFrameworkWhy('ITIL')).toContain('change');
    expect(getFrameworkLabel('MY_OWN')).toBe('MY_OWN');
    expect(getFrameworkColor('MY_OWN')).toBe('bg-panel-2 text-muted');
    expect(getFrameworkDescription('MY_OWN')).toBe('');
    expect(getFrameworkWhy('MY_OWN')).toBe('');
  });
});
