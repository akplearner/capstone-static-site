import { describe, it, expect } from 'vitest';
import { buildWeekPackage, buildTeamPackage, weekPackageFileName, WeekAttachment } from './package';
import { emptyData } from './types';

// A zip's central directory stores each entry name as UTF-8 bytes; we can find the
// entry names by scanning the raw bytes without a full unzip.
function entryNames(zip: Uint8Array): string[] {
  const s = new TextDecoder('latin1').decode(zip);
  const names: string[] = [];
  // Local file headers start with PK\x03\x04; name length at offset 26-27, name at 30.
  for (let i = 0; i + 30 < zip.length; i++) {
    if (zip[i] === 0x50 && zip[i + 1] === 0x4b && zip[i + 2] === 0x03 && zip[i + 3] === 0x04) {
      const nameLen = zip[i + 26] | (zip[i + 27] << 8);
      names.push(s.slice(i + 30, i + 30 + nameLen));
    }
  }
  return names;
}

const meta = { team: '7', cohort: '2026-07', date: '2026-07-31', courseId: 'cysa-plus' };

describe('buildWeekPackage', () => {
  it('names the download per week', () => {
    expect(weekPackageFileName(meta, 1)).toBe('Capstone_Team7_Week1.zip');
  });

  it("includes only that week's deliverable(s), a README, and a custody log", () => {
    const zip = buildWeekPackage({}, meta, 'cysa-plus', 1, []);
    const names = entryNames(zip);
    // Week 1 CySA deliverables: SOC Monitoring (01) + Coverage Validation (06).
    expect(names.some((n) => n.includes('01_SOC_Monitoring_Report.md'))).toBe(true);
    expect(names.some((n) => n.includes('06_Coverage_Validation.md'))).toBe(true);
    // A week-2 deliverable must NOT be in the week-1 package.
    expect(names.some((n) => n.includes('02_Threat_Investigation_Report.md'))).toBe(false);
    expect(names.some((n) => n.endsWith('/README.md'))).toBe(true);
    expect(names.some((n) => n.endsWith('Evidence/CHAIN_OF_CUSTODY.md'))).toBe(true);
    expect(names.every((n) => n.startsWith('Capstone_Team7_Week1/'))).toBe(true);
  });

  it('bundles an attached file under Evidence/ and logs its SHA-256 in the custody log', () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);
    const attachment: WeekAttachment = { name: '20260731_Team07_alert.png', bytes, sha256: 'abc123def456', size: bytes.length };
    const zip = buildWeekPackage({}, meta, 'cysa-plus', 1, [attachment]);
    const names = entryNames(zip);
    expect(names.some((n) => n.endsWith('Evidence/20260731_Team07_alert.png'))).toBe(true);
    // The custody CSV should contain the file name and its hash.
    const raw = new TextDecoder('latin1').decode(zip);
    expect(raw).toContain('20260731_Team07_alert.png');
    expect(raw).toContain('abc123def456');
  });

  it('handles a week with saved form data without throwing', () => {
    const saved = { cysa_soc_monitoring: emptyData() };
    expect(() => buildWeekPackage(saved, meta, 'cysa-plus', 1, [])).not.toThrow();
  });

  it('puts the whole-course Evidence folder at the package root for CySA (not the Security+ testing folder)', () => {
    const zip = buildTeamPackage({}, { team: '7', cohort: '2026-07', date: '2026-07-31', courseId: 'cysa-plus' });
    const names = entryNames(zip);
    expect(names.some((n) => n.endsWith('Capstone_Team7/Evidence/CHAIN_OF_CUSTODY.md'))).toBe(true);
    // The Security+-only folder must NOT leak into a CySA package.
    expect(names.some((n) => n.includes('04_Testing_and_Findings'))).toBe(false);
  });

  it('keeps the Security+ Evidence folder nested under its testing folder', () => {
    const zip = buildTeamPackage({}, { team: '1', cohort: '2026-07', date: '2026-07-31', courseId: 'security-plus' });
    const names = entryNames(zip);
    expect(names.some((n) => n.endsWith('04_Testing_and_Findings/Evidence/CHAIN_OF_CUSTODY.md'))).toBe(true);
  });

  it('groups each deliverable under a per-role subfolder using the role name', () => {
    const roles = [
      { id: 'blue', name: 'SOC Analyst', mission: '', color: '#1', icon: 'shield' },
      { id: 'grc', name: 'Threat Hunter', mission: '', color: '#2', icon: 'search' },
      { id: 'red', name: 'Incident Responder', mission: '', color: '#3', icon: 'flame' },
    ];
    const zip = buildWeekPackage({}, meta, 'cysa-plus', 1, [], roles);
    const names = entryNames(zip);
    // Week 1 SOC Monitoring is owned by the SOC Analyst (blue) → sanitized folder.
    expect(names.some((n) => n.includes('/SOC_Analyst/01_SOC_Monitoring_Report.md'))).toBe(true);
  });
});
