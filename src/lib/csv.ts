/** CSV escaping, once. `report.ts` and every exporter that followed it each
 *  had a private copy; a cell with a comma, a quote or a newline must be quoted
 *  and its quotes doubled, and that rule does not vary by file.
 *
 *  R135: a cell that starts with `=`, `+`, `-`, `@`, a tab or a carriage return
 *  is a formula to a spreadsheet, and the instructor opens these exports in
 *  one. A student's free-text field that began `=HYPERLINK(...)` or
 *  `=cmd|...` would run on the instructor's machine. Such a cell is prefixed
 *  with an apostrophe, which Excel, Sheets and LibreOffice all read as "text",
 *  and then quoted like any other. */
export function csvEscape(v: string | number | boolean | null | undefined): string {
  const raw = v == null ? '' : String(v);
  const s = FORMULA_START.test(raw) ? `'${raw}` : raw;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** The first characters a spreadsheet treats as the start of a formula. */
export const FORMULA_START = /^[=+\-@\t\r]/;

/** Rows → CSV text with a header, CRLF line endings, UTF-8 BOM-free. */
export function toCsv(header: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n') + '\r\n';
}
