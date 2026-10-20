/**
 * R127 — a small PDF writer for the record exports.
 *
 * Exports used to be JSON files: the member profile, the credential, the KPI board, the issues. A learner
 * cannot open one and an employer will not. The admin asked for a compact PDF of skills, progress and issues
 * instead, and this is the writer under it: A4 pages, the three standard fonts every viewer carries (so nothing
 * is embedded and a file stays a few kilobytes), text with wrapping and page breaks, hairline rules and filled
 * rectangles. No dependency, no DOM and no clock: the caller passes the creation time, so the same input is
 * the same bytes and a test can read the file back.
 *
 * Text is set in WinAnsi (Latin-1 plus the usual typographic marks). A character outside it prints as "?"
 * rather than vanishing, so a gap in a name is visible. Widths are Adobe's Core 14 AFM advance widths, so a line
 * is broken where it will really end. Coordinates passed in are measured from the TOP-left of the page, in
 * points, because that is how a page is laid out; they are flipped when written.
 */

export type PdfFont = 'regular' | 'bold' | 'mono';
export type Rgb = readonly [number, number, number];

export const A4 = { width: 595.28, height: 841.89 } as const;

/** Advance widths (thousandths of an em) for WinAnsi codes 32..255, from Adobe's Core 14 AFM files. */
const HELVETICA: readonly number[] = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 556,
  556, 556, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 556, 611, 556,
  556, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 556, 500, 667,
  556, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 556, 737, 333,
  400, 584, 333, 333, 333, 556, 537, 278, 333, 333, 365, 556, 834, 834, 834, 611,
  667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
  722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
  556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500,
];

const HELVETICA_BOLD: readonly number[] = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 556,
  556, 611, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 611, 611, 611,
  611, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 611, 500, 667,
  556, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 556, 737, 333,
  400, 584, 333, 333, 333, 611, 556, 278, 333, 333, 365, 556, 834, 834, 834, 611,
  722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
  722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
  556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278,
  611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556,
];

const FONT_KEY: Record<PdfFont, string> = { regular: 'F1', bold: 'F2', mono: 'F3' };
const FONT_FACE: Record<PdfFont, string> = { regular: 'Helvetica', bold: 'Helvetica-Bold', mono: 'Courier' };

/** Where WinAnsi differs from Latin-1: the 0x80–0x9F block. */
const WIN_ANSI_HIGH = new Map<number, number>([
  [0x20ac, 0x80], [0x201a, 0x82], [0x0192, 0x83], [0x201e, 0x84], [0x2026, 0x85], [0x2020, 0x86], [0x2021, 0x87], [0x02c6, 0x88],
  [0x2030, 0x89], [0x0160, 0x8a], [0x2039, 0x8b], [0x0152, 0x8c], [0x017d, 0x8e], [0x2018, 0x91], [0x2019, 0x92], [0x201c, 0x93],
  [0x201d, 0x94], [0x2022, 0x95], [0x2013, 0x96], [0x2014, 0x97], [0x02dc, 0x98], [0x2122, 0x99], [0x0161, 0x9a], [0x203a, 0x9b],
  [0x0153, 0x9c], [0x017e, 0x9e], [0x0178, 0x9f],
]);

/** Marks with no WinAnsi code that have a plain spelling. */
const SPELLED: Record<string, string> = {
  '→': '->', '←': '<-', '↔': '<->', '≥': '>=', '≤': '<=', '≠': '!=',
  '−': '-', '‐': '-', '‑': '-', '‒': '-', '―': '-',
};
const SPACE_LIKE = /[   -   　]/g;
const ZERO_WIDTH = /[­​-‍⁠﻿]/g;

/** Text as WinAnsi bytes held in a string, one character per byte. Anything outside WinAnsi becomes "?". */
export function winAnsi(text: string): string {
  let out = '';
  for (const ch of text.normalize('NFC').replace(SPACE_LIKE, ' ').replace(ZERO_WIDTH, '')) {
    const cp = ch.codePointAt(0) as number;
    if (cp === 0x09) out += ' ';
    else if (cp < 0x20 || (cp >= 0x7f && cp < 0xa0)) continue;
    else if (cp <= 0x7e || (cp >= 0xa0 && cp <= 0xff)) out += ch;
    else if (WIN_ANSI_HIGH.has(cp)) out += String.fromCharCode(WIN_ANSI_HIGH.get(cp) as number);
    else out += SPELLED[ch] ?? '?';
  }
  return out;
}

/** A PDF literal string: parentheses and the backslash escaped, every byte outside printable ASCII written as an octal escape. */
export function pdfLiteral(bytes: string): string {
  let out = '(';
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes.charCodeAt(i);
    if (c === 0x5c || c === 0x28 || c === 0x29) out += `\\${bytes[i]}`;
    else if (c < 0x20 || c > 0x7e) out += `\\${c.toString(8).padStart(3, '0')}`;
    else out += bytes[i];
  }
  return `${out})`;
}

const advance = (font: PdfFont, code: number): number => (font === 'mono' ? 600 : ((font === 'bold' ? HELVETICA_BOLD : HELVETICA)[code - 32] ?? 556));

/** The width of a line of text in points. */
export function textWidth(text: string, font: PdfFont, size: number): number {
  const bytes = winAnsi(text);
  let units = 0;
  for (let i = 0; i < bytes.length; i++) units += advance(font, bytes.charCodeAt(i));
  return (units * size) / 1000;
}

/**
 * Break text into lines no wider than `width`. Newlines are kept as breaks, a blank line stays blank, and a
 * word wider than a whole line (a digest, a URL) is broken by characters instead of running off the page.
 */
export function wrapText(text: string, font: PdfFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r\n|\r|\n/)) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let line = '';
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (textWidth(trial, font, size) <= width) {
        line = trial;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      if (textWidth(word, font, size) <= width) {
        line = word;
        continue;
      }
      let chunk = '';
      for (const ch of word) {
        if (chunk && textWidth(chunk + ch, font, size) > width) {
          lines.push(chunk);
          chunk = ch;
        } else chunk += ch;
      }
      line = chunk;
    }
    lines.push(line);
  }
  return lines;
}

const num = (n: number): string => {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? '0' : String(r);
};
const rgb = (c: Rgb): string => c.map((v) => String(Math.round(Math.min(1, Math.max(0, v)) * 1000) / 1000)).join(' ');

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TextOptions {
  font?: PdfFont;
  size?: number;
  color?: Rgb;
  /** Line height in points. Default 1.35 × the size. */
  leading?: number;
  align?: 'left' | 'right' | 'center';
  /** Left edge and width of the column the text is set in. Default: the page's text box. */
  x?: number;
  width?: number;
  /** Extra space between letters, in points: for small capitals headings. */
  tracking?: number;
  /** Space left after the block, in points. */
  after?: number;
}

export interface PdfMeta {
  title: string;
  author?: string;
  subject?: string;
  keywords?: string;
  /** Epoch milliseconds: the caller's clock, so this module reads none. */
  created: number;
}

export interface FooterText {
  left?: string;
  right?: string;
}

const INK: Rgb = [0.09, 0.11, 0.15];

/** UTF-16BE with a byte order mark, as a hex string: any text, ASCII-clean in the file. */
function utf16Hex(text: string): string {
  let out = '<FEFF';
  for (let i = 0; i < text.length; i++) out += text.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase();
  return `${out}>`;
}

function pdfDate(ms: number): string {
  const d = new Date(ms);
  const p = (n: number, len = 2) => String(n).padStart(len, '0');
  return `D:${p(d.getUTCFullYear(), 4)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}

/**
 * One document under construction. Content flows down the page from a cursor; `need` starts a new page when
 * a block will not fit, so a row or a heading is never split from what it introduces. `finish` writes the
 * footers (it knows the page count only then) and returns the file.
 */
export class PdfWriter {
  readonly width = A4.width;
  readonly height = A4.height;
  readonly margin: Margins;
  private readonly pages: string[][] = [[]];
  private page = 0;
  private cursor: number;

  constructor(private readonly meta: PdfMeta, margin: Partial<Margins> = {}) {
    this.margin = { top: 50, right: 42, bottom: 58, left: 42, ...margin };
    this.cursor = this.margin.top;
  }

  /** Width of the text box. */
  get contentWidth(): number {
    return this.width - this.margin.left - this.margin.right;
  }
  /** The cursor: its distance from the top edge of the current page. */
  get y(): number {
    return this.cursor;
  }
  set y(v: number) {
    this.cursor = v;
  }
  /** The lowest the body may reach on a page. */
  get limit(): number {
    return this.height - this.margin.bottom;
  }
  get pageCount(): number {
    return this.pages.length;
  }
  get remaining(): number {
    return this.limit - this.cursor;
  }

  private ops(): string[] {
    return this.pages[this.page];
  }

  newPage(): void {
    this.pages.push([]);
    this.page = this.pages.length - 1;
    this.cursor = this.margin.top;
  }

  /** Start a new page unless `h` points still fit. True when it did start one. */
  need(h: number): boolean {
    if (this.cursor + h <= this.limit || this.cursor === this.margin.top) return false;
    this.newPage();
    return true;
  }

  gap(h: number): void {
    this.cursor += h;
  }

  fillRect(x: number, top: number, w: number, h: number, color: Rgb): void {
    this.ops().push(`q ${rgb(color)} rg ${num(x)} ${num(this.height - top - h)} ${num(w)} ${num(h)} re f Q`);
  }

  strokeRect(x: number, top: number, w: number, h: number, color: Rgb, weight = 0.5): void {
    this.ops().push(`q ${rgb(color)} RG ${num(weight)} w ${num(x)} ${num(this.height - top - h)} ${num(w)} ${num(h)} re S Q`);
  }

  line(x1: number, y1: number, x2: number, y2: number, color: Rgb, weight = 0.5): void {
    this.ops().push(`q ${rgb(color)} RG ${num(weight)} w ${num(x1)} ${num(this.height - y1)} m ${num(x2)} ${num(this.height - y2)} l S Q`);
  }

  /** One line of text with its baseline at `baseline`; for 'right' and 'center', `x` is the right edge or the middle. */
  textAt(x: number, baseline: number, text: string, opts: TextOptions = {}): void {
    const { font = 'regular', size = 9, color = INK, align = 'left', tracking = 0 } = opts;
    const shown = winAnsi(text);
    if (shown === '') return;
    const w = textWidth(text, font, size) + tracking * shown.length;
    const left = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
    // Character spacing belongs to the text state, which outlives BT…ET: a run that sets it must put it back.
    this.ops().push(`BT /${FONT_KEY[font]} ${num(size)} Tf ${rgb(color)} rg ${tracking ? `${num(tracking)} Tc ` : ''}${num(left)} ${num(this.height - baseline)} Td ${pdfLiteral(shown)} Tj${tracking ? ' 0 Tc' : ''} ET`);
  }

  /** Baseline for a line whose box starts at `top`: the text sits in the middle of the box. */
  baselineIn(top: number, leading: number, size: number): number {
    return top + leading / 2 + size * 0.36;
  }

  /** A block of text, wrapped to the column and carried over page breaks line by line. Returns the number of lines. */
  paragraph(text: string, opts: TextOptions = {}): number {
    const font = opts.font ?? 'regular';
    const size = opts.size ?? 9;
    const leading = opts.leading ?? Math.round(size * 1.35 * 10) / 10;
    const x = opts.x ?? this.margin.left;
    const width = opts.width ?? this.contentWidth;
    const align = opts.align ?? 'left';
    const anchor = align === 'right' ? x + width : align === 'center' ? x + width / 2 : x;
    const lines = wrapText(text, font, size, width);
    for (const line of lines) {
      this.need(leading);
      if (line) this.textAt(anchor, this.baselineIn(this.cursor, leading, size), line, { ...opts, font, size, align });
      this.cursor += leading;
    }
    this.cursor += opts.after ?? 0;
    return lines.length;
  }

  /** A hairline across the text box at the cursor. */
  rule(color: Rgb = [0.82, 0.84, 0.87], weight = 0.5): void {
    this.line(this.margin.left, this.cursor, this.width - this.margin.right, this.cursor, color, weight);
  }

  /**
   * Write the footers and return the file: header, objects, cross-reference table and trailer, every offset
   * counted as it is written.
   */
  finish(footer?: (page: number, total: number) => FooterText): Uint8Array<ArrayBuffer> {
    const total = this.pages.length;
    if (footer) {
      for (let i = 0; i < total; i++) {
        this.page = i;
        const { left, right } = footer(i + 1, total);
        const y = this.height - this.margin.bottom + 22;
        this.line(this.margin.left, y - 11, this.width - this.margin.right, y - 11, [0.82, 0.84, 0.87], 0.5);
        const style: TextOptions = { size: 7.5, color: [0.42, 0.45, 0.5] };
        if (left) this.textAt(this.margin.left, y, left, style);
        if (right) this.textAt(this.width - this.margin.right, y, right, { ...style, align: 'right' });
      }
      this.page = total - 1;
    }

    // Object numbers: 1 catalog, 2 pages, 3–5 fonts, 6 info, then a page and its content per page.
    const pageId = (i: number) => 7 + i * 2;
    const objects: string[] = [];
    objects[1] = '<< /Type /Catalog /Pages 2 0 R /Lang (en) /ViewerPreferences << /DisplayDocTitle true >> >>';
    objects[2] = `<< /Type /Pages /Kids [${this.pages.map((_, i) => `${pageId(i)} 0 R`).join(' ')}] /Count ${total} >>`;
    (['regular', 'bold', 'mono'] as const).forEach((f, i) => {
      objects[3 + i] = `<< /Type /Font /Subtype /Type1 /BaseFont /${FONT_FACE[f]} /Encoding /WinAnsiEncoding >>`;
    });
    const { title, author, subject, keywords, created } = this.meta;
    objects[6] = `<< /Title ${utf16Hex(title)}${author ? ` /Author ${utf16Hex(author)}` : ''}${subject ? ` /Subject ${utf16Hex(subject)}` : ''}${keywords ? ` /Keywords ${utf16Hex(keywords)}` : ''} /Creator ${utf16Hex('Capstone Quarry')} /Producer ${utf16Hex('Capstone Quarry')} /CreationDate (${pdfDate(created)}) /ModDate (${pdfDate(created)}) >>`;
    this.pages.forEach((ops, i) => {
      const stream = ops.join('\n');
      objects[pageId(i)] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4.width} ${A4.height}] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${pageId(i) + 1} 0 R >>`;
      objects[pageId(i) + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });

    let out = '%PDF-1.4\n%âãÏÓ\n';
    const offsets: number[] = [];
    for (let id = 1; id < objects.length; id++) {
      offsets[id] = out.length;
      out += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }
    const xref = out.length;
    out += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let id = 1; id < objects.length; id++) out += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
    out += `trailer\n<< /Size ${objects.length} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes;
  }
}
