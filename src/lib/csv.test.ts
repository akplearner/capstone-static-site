import { describe, expect, it } from 'vitest';
import { FORMULA_START, csvEscape, toCsv } from './csv';

describe('R135 — a CSV cell is never a formula', () => {
  it('quotes commas, quotes and line breaks as before', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape('x\ny')).toBe('"x\ny"');
    expect(csvEscape(null)).toBe('');
    expect(csvEscape(3)).toBe('3');
  });

  it('prefixes a cell that a spreadsheet would run', () => {
    for (const bad of ['=HYPERLINK("http://x")', '=cmd|calc!A1', '+1', '-1', '@SUM(A1)', '\tx', '\rx']) {
      expect(FORMULA_START.test(bad), bad).toBe(true);
      expect(csvEscape(bad).replace(/^"/, '').startsWith("'"), bad).toBe(true);
    }
    expect(csvEscape('=1+1')).toBe("'=1+1");
    expect(csvEscape('=a,b')).toBe('"\'=a,b"');
    // Ordinary text, numbers and dates are untouched.
    for (const fine of ['hello', '10.10.10.1', '2026-01-12', 'x = 1', '']) expect(csvEscape(fine), fine).toBe(fine);
  });

  it('toCsv applies it to every cell, header included', () => {
    expect(toCsv(['=h'], [['=v', 'ok']])).toBe("'=h\r\n'=v,ok\r\n");
  });
});
