import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { A4, PdfWriter, pdfLiteral, textWidth, winAnsi, wrapText } from './pdf';
import { binary, readTexts, unliteral, type ReadText } from '@/test/pdfRead';

const META = { title: 'Capstone record', author: 'Grace', created: Date.UTC(2026, 9, 16, 9, 15, 30) };

function sample(): Uint8Array {
  const pdf = new PdfWriter(META);
  pdf.paragraph('Capstone record', { font: 'bold', size: 18, after: 6 });
  pdf.paragraph('A short line of body text.', { size: 9 });
  return pdf.finish((page, total) => ({ left: 'Capstone Quarry · Grace', right: `Page ${page} of ${total}` }));
}

describe('R127 — the PDF writer: text', () => {
  it('measures with the Core 14 advance widths', () => {
    // H 722 + e 556 + l 222 + l 222 + o 556 = 2278 thousandths of an em
    expect(textWidth('Hello', 'regular', 10)).toBeCloseTo(22.78, 5);
    // bold: H 722 + e 556 + l 278 + l 278 + o 611 = 2445
    expect(textWidth('Hello', 'bold', 10)).toBeCloseTo(24.45, 5);
    // Courier is 600 everywhere
    expect(textWidth('abc', 'mono', 10)).toBeCloseTo(18, 5);
    expect(textWidth('', 'regular', 10)).toBe(0);
    // an accented letter takes the base letter's width, and a mark outside WinAnsi the width of the "?" it prints as
    expect(textWidth('é', 'regular', 10)).toBeCloseTo(textWidth('e', 'regular', 10), 5);
    expect(textWidth('😀', 'regular', 10)).toBeCloseTo(textWidth('?', 'regular', 10), 5);
  });

  it('encodes as WinAnsi and spells or marks what it cannot', () => {
    expect(winAnsi('Grace Hopper')).toBe('Grace Hopper');
    expect(winAnsi('José')).toBe('José');
    expect(winAnsi('é')).toBe('é'); // composed first
    expect(winAnsi('’')).toBe('\u0092');
    expect(winAnsi('“quoted”')).toBe('\u0093quoted\u0094');
    expect(winAnsi('a — b – c • d …')).toBe('a \u0097 b \u0096 c \u0095 d \u0085');
    expect(winAnsi('a→b')).toBe('a->b');
    expect(winAnsi('x ≥ y')).toBe('x >= y');
    expect(winAnsi('a b')).toBe('a b'); // no-break space
    expect(winAnsi('a​b')).toBe('ab'); // zero width
    expect(winAnsi('tab\there')).toBe('tab here');
    expect(winAnsi('a\u0000b\u0007c')).toBe('abc'); // controls dropped
    expect(winAnsi('漢字')).toBe('??'); // outside WinAnsi: visible, not dropped
    expect(winAnsi('😀')).toBe('?'); // one mark, not two halves of a surrogate pair
  });

  it('writes a literal string that survives parentheses, backslashes and high bytes', () => {
    expect(pdfLiteral('a(b)c')).toBe('(a\\(b\\)c)');
    expect(pdfLiteral('a\\b')).toBe('(a\\\\b)');
    expect(pdfLiteral('\u0092é')).toBe('(\\222\\351)');
    const nasty = 'f(x) = \\ (nested (parens)) é\u0092';
    expect(unliteral(pdfLiteral(nasty))).toBe(nasty);
    // nothing outside printable ASCII is written raw
    expect(/^[\x20-\x7e]*$/.test(pdfLiteral(winAnsi('Zoë — “quoted” 漢')))).toBe(true);
  });

  it('wraps to the width, keeps hard breaks and blank lines, and breaks a word wider than a line', () => {
    const text = 'The quick brown fox jumps over the lazy dog and keeps running across the field until the evening.';
    const lines = wrapText(text, 'regular', 9, 110);
    expect(lines.length).toBeGreaterThanOrEqual(4);
    for (const l of lines) expect(textWidth(l, 'regular', 9)).toBeLessThanOrEqual(110);
    expect(lines.join(' ')).toBe(text);

    expect(wrapText('one\n\ntwo', 'regular', 9, 300)).toEqual(['one', '', 'two']);
    expect(wrapText('', 'regular', 9, 300)).toEqual(['']);
    expect(wrapText('   ', 'regular', 9, 300)).toEqual(['']);

    const digest = 'a'.repeat(64);
    const broken = wrapText(`sha256:${digest}`, 'mono', 9, 150);
    expect(broken.length).toBeGreaterThan(1);
    for (const l of broken) expect(textWidth(l, 'mono', 9)).toBeLessThanOrEqual(150);
    expect(broken.join('')).toBe(`sha256:${digest}`);
  });
});

describe('R127 — the PDF writer: the file', () => {
  it('is a well-formed PDF: header, objects at the offsets the table gives, a trailer that points at the table', () => {
    const bytes = sample();
    const file = binary(bytes);
    expect(file.startsWith('%PDF-1.4\n')).toBe(true);
    expect(file.endsWith('%%EOF\n')).toBe(true);

    const start = /startxref\n(\d+)\n%%EOF\n$/.exec(file);
    expect(start).not.toBeNull();
    const xref = Number((start as RegExpExecArray)[1]);
    expect(file.slice(xref, xref + 5)).toBe('xref\n');

    const size = Number(/trailer\n<< \/Size (\d+) /.exec(file)?.[1]);
    const table = file.slice(xref).split('\n');
    expect(table[1]).toBe(`0 ${size}`);
    expect(table[2]).toBe('0000000000 65535 f ');
    for (let id = 1; id < size; id++) {
      const entry = table[2 + id];
      expect(entry).toMatch(/^\d{10} 00000 n $/);
      const at = Number(entry.slice(0, 10));
      expect(file.slice(at, at + `${id} 0 obj\n`.length)).toBe(`${id} 0 obj\n`);
      expect(file.slice(at).includes('endobj')).toBe(true);
    }
    // every entry is exactly 20 bytes, as the format requires
    expect(file.slice(xref).split('\n').slice(2, 2 + size).every((l) => l.length === 19)).toBe(true);
  });

  it('declares each stream its true length, and one page per page of content', () => {
    const pdf = new PdfWriter(META);
    for (let i = 0; i < 120; i++) pdf.paragraph(`Line ${i} of a document long enough to run onto a second page.`, { size: 10 });
    const bytes = pdf.finish();
    const file = binary(bytes);
    const streams = [...file.matchAll(/<< \/Length (\d+) >>\nstream\n([\s\S]*?)\nendstream/g)];
    expect(streams.length).toBe(pdf.pageCount);
    expect(pdf.pageCount).toBeGreaterThan(1);
    for (const s of streams) expect(Number(s[1])).toBe(s[2].length);
    expect(file).toContain(`/Count ${pdf.pageCount} `);
    expect([...file.matchAll(/\/Type \/Page /g)].length).toBe(pdf.pageCount);
    expect(file).toContain(`/MediaBox [0 0 ${A4.width} ${A4.height}]`);
  });

  it('reads back the text it was given, in order, with the footer on every page', () => {
    const pages = readTexts(sample());
    expect(pages).toHaveLength(1);
    const texts = pages[0].map((r) => r.text);
    expect(texts).toEqual(['Capstone record', 'A short line of body text.', 'Capstone Quarry · Grace', 'Page 1 of 1']);

    const pdf = new PdfWriter(META);
    for (let i = 0; i < 150; i++) pdf.paragraph(`Row ${i}`, { size: 10 });
    const multi = readTexts(pdf.finish((page, total) => ({ right: `Page ${page} of ${total}` })));
    expect(multi.length).toBe(pdf.pageCount);
    multi.forEach((runs, i) => expect(runs.at(-1)?.text).toBe(`Page ${i + 1} of ${multi.length}`));
  });

  it('keeps every line of body text inside the margins, and carries a long block over the page break line by line', () => {
    const pdf = new PdfWriter(META);
    const long = Array.from({ length: 300 }, (_, i) => `sentence ${i} says something plain about the work`).join('. ');
    pdf.paragraph(long, { size: 10 });
    const pages = readTexts(pdf.finish());
    expect(pages.length).toBeGreaterThan(1);
    for (const runs of pages) {
      for (const r of runs) {
        expect(r.baseline).toBeGreaterThan(pdf.margin.top - 1);
        expect(r.baseline).toBeLessThan(pdf.limit);
        expect(r.x + textWidth(r.text, 'regular', r.size)).toBeLessThanOrEqual(A4.width - pdf.margin.right + 0.01);
      }
    }
    // nothing was lost or repeated across the break
    expect(pages.flat().map((r) => r.text).join(' ')).toBe(long);
  });

  it('starts a new page when a block will not fit, and not when it will', () => {
    const pdf = new PdfWriter(META);
    expect(pdf.need(100)).toBe(false);
    pdf.gap(pdf.limit - pdf.margin.top - 40);
    expect(pdf.need(30)).toBe(false);
    expect(pdf.need(60)).toBe(true);
    expect(pdf.pageCount).toBe(2);
    expect(pdf.y).toBe(pdf.margin.top);
    // a block taller than a page on a fresh page does not loop forever
    expect(pdf.need(10_000)).toBe(false);
    expect(pdf.pageCount).toBe(2);
  });

  it('carries the title, author and creation time in the information dictionary', () => {
    const file = binary(sample());
    const info = /\/Title <FEFF([0-9A-F]+)> \/Author <FEFF([0-9A-F]+)>/.exec(file) as RegExpExecArray;
    const decode = (hex: string) => (hex.match(/.{4}/g) ?? []).map((u) => String.fromCharCode(parseInt(u, 16))).join('');
    expect(decode(info[1])).toBe('Capstone record');
    expect(decode(info[2])).toBe('Grace');
    expect(file).toContain('/CreationDate (D:20261016091530Z)');
    expect(file).toContain('/Lang (en)');
    expect(file).toContain('/DisplayDocTitle true');
    // a title outside Latin-1 still reads back
    const odd = binary(new PdfWriter({ title: 'Zoë 漢', created: 0 }).finish());
    const hex = (/\/Title <FEFF([0-9A-F]+)>/.exec(odd) as RegExpExecArray)[1];
    expect(decode(hex)).toBe('Zoë 漢');
  });

  it('is the same bytes for the same input, uses only the standard fonts, and stays small', () => {
    const a = sample();
    const b = sample();
    expect(Array.from(a)).toEqual(Array.from(b));
    const file = binary(a);
    expect(file).toContain('/BaseFont /Helvetica ');
    expect(file).toContain('/BaseFont /Helvetica-Bold ');
    expect(file).toContain('/BaseFont /Courier ');
    expect(file).not.toContain('/FontFile'); // nothing embedded
    expect(a.length).toBeLessThan(3000);
    // the file is ASCII apart from the binary marker comment, which is what tells a mail gateway it is not text
    const body = file.slice(file.indexOf('\n', file.indexOf('\n') + 1));
    expect(/^[\x09\x0a\x0d\x20-\x7e]*$/.test(body)).toBe(true);
  });

  it('draws rectangles and lines in top-left coordinates, flipped for the page', () => {
    const pdf = new PdfWriter(META);
    pdf.fillRect(40, 100, 200, 10, [0, 0.5, 1]);
    pdf.line(40, 120, 240, 120, [0, 0, 0], 1);
    pdf.strokeRect(40, 130, 200, 20, [0.5, 0.5, 0.5]);
    const file = binary(pdf.finish());
    // the page is 841.89 tall: a rectangle 100 down and 10 high has its lower edge at 841.89 - 110
    expect(file).toContain(`0 0.5 1 rg 40 ${Math.round((A4.height - 110) * 100) / 100} 200 10 re f`);
    expect(file).toContain(`40 ${Math.round((A4.height - 120) * 100) / 100} m 240 ${Math.round((A4.height - 120) * 100) / 100} l S`);
    expect(file).toContain('re S');
  });

  it('puts character spacing back after a run that sets it, so it cannot leak into the text that follows', () => {
    const pdf = new PdfWriter(META);
    pdf.paragraph('SPACED', { tracking: 1.2, size: 8 });
    pdf.paragraph('plain', { size: 8 });
    const lines = binary(pdf.finish()).split('\n').filter((l) => l.startsWith('BT '));
    expect(lines[0]).toMatch(/ 1\.2 Tc .* Tj 0 Tc ET$/);
    expect(lines[1]).not.toContain('Tc');
    // a spaced run is aligned by its spaced width
    const right = new PdfWriter(META);
    right.paragraph('AB', { tracking: 2, size: 10, align: 'right', x: 100, width: 100 });
    const [run] = readTexts(right.finish())[0];
    expect(run.x + textWidth('AB', 'regular', 10) + 2 * 2).toBeCloseTo(200, 1);
  });

  it('aligns text to the right and centre of a column', () => {
    const pdf = new PdfWriter(META);
    pdf.paragraph('right', { x: 100, width: 200, align: 'right', size: 10 });
    pdf.paragraph('centre', { x: 100, width: 200, align: 'center', size: 10 });
    const [page] = readTexts(pdf.finish());
    const right = page.find((r) => r.text === 'right') as ReadText;
    const centre = page.find((r) => r.text === 'centre') as ReadText;
    expect(right.x + textWidth('right', 'regular', 10)).toBeCloseTo(300, 1);
    expect(centre.x + textWidth('centre', 'regular', 10) / 2).toBeCloseTo(200, 1);
  });
});

/**
 * Not an assertion: with PDF_DUMP_DIR set, the writer's output is written there so an independent reader
 * (PDFium, pypdf) can open and render it. `PDF_DUMP_DIR=/tmp/pdfs npx vitest run src/lib/pdf.test.ts`.
 */
describe('R127 — the PDF writer: for an external reader', () => {
  it.skipIf(!process.env.PDF_DUMP_DIR)('writes a document that uses every part of the writer', () => {
    const pdf = new PdfWriter({ title: 'Writer check', author: 'Grace', subject: 'every font, mark and break', created: Date.UTC(2026, 9, 16, 9, 15, 30) });
    pdf.paragraph('CAPSTONE QUARRY', { font: 'bold', size: 8, tracking: 1.2, color: [0.055, 0.455, 0.565], after: 2 });
    pdf.paragraph('Writer check', { font: 'bold', size: 20, after: 4 });
    pdf.paragraph('José — “quoted” • 100% (ok) \\ back-slash → arrow ≥ … Zoë 漢字 😀', { size: 10, after: 6 });
    pdf.paragraph(`sha256:${'0123456789abcdef'.repeat(4)}`, { font: 'mono', size: 8, after: 6 });
    pdf.fillRect(pdf.margin.left, pdf.y, 200, 10, [0.055, 0.455, 0.565]);
    pdf.fillRect(pdf.margin.left + 200, pdf.y, 311, 10, [0.88, 0.9, 0.92]);
    pdf.gap(18);
    pdf.strokeRect(pdf.margin.left, pdf.y, 120, 30, [0.5, 0.5, 0.5]);
    pdf.textAt(pdf.margin.left + 60, pdf.y + 19, 'centred', { align: 'center', size: 9 });
    pdf.textAt(pdf.width - pdf.margin.right, pdf.y + 19, 'right aligned', { align: 'right', size: 9 });
    pdf.gap(40);
    for (let i = 0; i < 70; i++) pdf.paragraph(`Row ${i}: a line of body text that is long enough to wrap onto a second line when it reaches the right margin of the page.`, { size: 9 });
    const dir = process.env.PDF_DUMP_DIR as string;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/pdf-writer-check.pdf`, pdf.finish((page, total) => ({ left: 'Capstone Quarry · writer check', right: `Page ${page} of ${total}` })));
  });
});
