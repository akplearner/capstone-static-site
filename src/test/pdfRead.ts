import { A4 } from '@/lib/pdf';

/**
 * Reading a PDF back for tests (R127). The writer's files are uncompressed with one text run per line of the
 * content stream, so a test can recover every run, its position and its font without a PDF library; the
 * Chromium sweep checks the same files with PDFium and pypdf, which are independent readers.
 */

/** The file as a string with one character per byte, so offsets are byte offsets. */
export const binary = (bytes: Uint8Array): string => {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return s;
};

/** Undo `pdfLiteral`: the bytes a literal string stands for. */
export function unliteral(lit: string): string {
  const body = lit.slice(1, -1);
  let out = '';
  for (let i = 0; i < body.length; i++) {
    if (body[i] !== '\\') {
      out += body[i];
      continue;
    }
    const oct = /^[0-7]{3}/.exec(body.slice(i + 1));
    if (oct) {
      out += String.fromCharCode(parseInt(oct[0], 8));
      i += 3;
    } else {
      out += body[i + 1];
      i += 1;
    }
  }
  return out;
}

export interface ReadText {
  text: string;
  /** Distance from the TOP of the page, as the writer is given it. */
  baseline: number;
  x: number;
  size: number;
  font: string;
}

/** The 0x80–0x9F block of WinAnsi, which differs from Latin-1 (kept here so no runtime's TextDecoder is relied on). */
const HIGH = '\u20ac\u0081\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160\u2039\u0152\u008d\u017d\u008f\u0090\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122\u0161\u203a\u0153\u009d\u017e\u0178';

/** WinAnsi bytes (one per character) back to the text they spell. */
export const fromWinAnsi = (bytes: string): string => Array.from(bytes, (c) => (c.charCodeAt(0) >= 0x80 && c.charCodeAt(0) <= 0x9f ? HIGH[c.charCodeAt(0) - 0x80] : c)).join('');

/** Every text run on every page, in the order written, read back from the file's content streams. */
export function readTexts(bytes: Uint8Array): ReadText[][] {
  const file = binary(bytes);
  const pages: ReadText[][] = [];
  for (const m of file.matchAll(/<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/g)) {
    const runs: ReadText[] = [];
    for (const line of m[2].split('\n')) {
      const t = /^BT \/(F\d) ([\d.]+) Tf [\d. ]+ rg (?:[\d.-]+ Tc )?([\d.-]+) ([\d.-]+) Td (\(.*\)) Tj(?: 0 Tc)? ET$/.exec(line);
      if (t) runs.push({ font: t[1], size: Number(t[2]), x: Number(t[3]), baseline: A4.height - Number(t[4]), text: fromWinAnsi(unliteral(t[5])) });
    }
    pages.push(runs);
  }
  return pages;
}

export const allText = (bytes: Uint8Array): string =>
  readTexts(bytes)
    .map((p) => p.map((r) => r.text).join('\n'))
    .join('\n');
