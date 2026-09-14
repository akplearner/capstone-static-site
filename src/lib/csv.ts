/** CSV escaping, once. `report.ts` and every exporter that followed it each
 *  had a private copy; a cell with a comma, a quote or a newline must be quoted
 *  and its quotes doubled, and that rule does not vary by file. */
export function csvEscape(v: string | number | boolean | null | undefined): string {
  const s = v == null ? '' : String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Rows → CSV text with a header, CRLF line endings, UTF-8 BOM-free. */
export function toCsv(header: string[], rows: (string | number | boolean | null | undefined)[][]): string {
  return [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n') + '\r\n';
}
