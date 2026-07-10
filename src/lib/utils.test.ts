import { describe, it, expect } from 'vitest';
import { validateEvidenceFileName } from './utils';

describe('validateEvidenceFileName', () => {
  it('accepts a well-formed name', () => {
    expect(validateEvidenceFileName('20260623_Team01_nmap_scan.txt').valid).toBe(true);
  });

  it('accepts the newly-allowed jpg/jpeg/mp4 extensions', () => {
    expect(validateEvidenceFileName('20260623_Team01_sqlmap_dump.jpg').valid).toBe(true);
    expect(validateEvidenceFileName('20260623_Team01_sqlmap_dump.jpeg').valid).toBe(true);
    expect(validateEvidenceFileName('20260623_Team07_screen_record.mp4').valid).toBe(true);
  });

  it('accepts png/pdf/log/pcap', () => {
    for (const ext of ['png', 'pdf', 'log', 'pcap']) {
      expect(validateEvidenceFileName(`20260623_Team01_tool_action.${ext}`).valid).toBe(true);
    }
  });

  it('rejects a disallowed extension', () => {
    expect(validateEvidenceFileName('20260623_Team01_tool_action.exe').valid).toBe(false);
    expect(validateEvidenceFileName('20260623_Team01_tool_action.docx').valid).toBe(false);
  });

  it('rejects a bad date or team segment', () => {
    expect(validateEvidenceFileName('2026_Team01_tool_action.png').valid).toBe(false);
    expect(validateEvidenceFileName('20260623_Group01_tool_action.png').valid).toBe(false);
    expect(validateEvidenceFileName('20260623_Team1_tool_action.png').valid).toBe(false);
  });

  it('rejects missing segments', () => {
    expect(validateEvidenceFileName('20260623_Team01_scan.png').valid).toBe(false);
    expect(validateEvidenceFileName('random.png').valid).toBe(false);
  });
});
