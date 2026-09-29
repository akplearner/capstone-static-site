import type { IacResourceRange } from './model';

/**
 * Pure text helpers for the IaC bundles (R87). No parser dependency: this
 * runs in the browser bundle's module graph (via the course document build),
 * so it scans text rather than pulling a YAML library into production.
 * The parity tests re-check everything with real parsers.
 */

/** `⟦FILL:hint|value⟧` — the one authoring marker. */
const FILL = /⟦FILL:([^|⟧]+)\|([^⟧]*)⟧/g;

/** The reference solution: every marker becomes its value. */
export function fullFrom(source: string): string {
  return source.replace(FILL, (_m, _hint: string, value: string) => value);
}

/**
 * The student's starter: every marker becomes a visible blank that still
 * parses. JSON markers sit INSIDE an existing string, so the blank is bare
 * text; YAML markers are whole plain scalars, so the blank is quoted (a hint
 * containing ": " would otherwise break the document).
 */
export function starterFrom(source: string, lang: 'json' | 'yaml'): string {
  return source.replace(FILL, (_m, hint: string) =>
    lang === 'json' ? `FILL-ME: ${hint.trim()}` : `"FILL-ME: ${hint.trim()}"`
  );
}

export function fillCount(source: string): number {
  return (source.match(FILL) ?? []).length;
}

const lineOf = (text: string, index: number) => text.slice(0, index).split('\n').length;

/**
 * ARM: each resource carries `"comments": "[wN] <nodeId> — …"`. The range is
 * the enclosing JSON object, found by walking braces outward from the tag
 * while skipping string contents.
 */
export function armRanges(full: string): IacResourceRange[] {
  const out: IacResourceRange[] = [];
  const tag = /"comments":\s*"\[w(\d+)\]\s+([A-Za-z0-9-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = tag.exec(full))) {
    // Start just before the tag's opening quote: scanning FROM a quote would
    // read it as the end of a string and skip backwards through the file.
    const open = enclosingOpen(full, m.index - 1);
    const close = matchingClose(full, open);
    const block = full.slice(open, close + 1);
    const type = /"type":\s*"([^"]+)"/.exec(block)?.[1] ?? '';
    out.push({ id: m[2], type, week: Number(m[1]), start: lineOf(full, open), end: lineOf(full, close) });
  }
  return out;
}

function enclosingOpen(text: string, from: number): number {
  let depth = 0;
  for (let i = from; i >= 0; i--) {
    const ch = text[i];
    if (ch === '"') {
      // Jump back over a string: find its opening quote (not escaped).
      let j = i - 1;
      while (j >= 0 && !(text[j] === '"' && text[j - 1] !== '\\')) j--;
      i = j;
      continue;
    }
    if (ch === '}') depth++;
    else if (ch === '{') {
      if (depth === 0) return i;
      depth--;
    }
  }
  return 0;
}

function matchingClose(text: string, open: number): number {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      i++;
      while (i < text.length && !(text[i] === '"' && text[i - 1] !== '\\')) i++;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return text.length - 1;
}

/**
 * CloudFormation: a resource is a two-space-indented key under `Resources:`,
 * running until the next such key or the next top-level section. Its week is
 * the `Week:` under its `Metadata: Capstone:` block.
 */
export function cfnRanges(full: string): IacResourceRange[] {
  const lines = full.split('\n');
  const start = lines.findIndex((l) => l.trim() === 'Resources:');
  const out: IacResourceRange[] = [];
  if (start < 0) return out;
  let current: { id: string; start: number } | null = null;
  const close = (endIdx: number) => {
    if (!current) return;
    const block = lines.slice(current.start, endIdx + 1).join('\n');
    const type = /Type:\s*(\S+)/.exec(block)?.[1] ?? '';
    const week = Number(/Week:\s*(\d+)/.exec(block)?.[1] ?? 0);
    // Trim trailing blank lines from the range.
    let end = endIdx;
    while (end > current.start && lines[end].trim() === '') end--;
    out.push({ id: current.id, type, week, start: current.start + 1, end: end + 1 });
    current = null;
  };
  for (let i = start + 1; i < lines.length; i++) {
    const l = lines[i];
    if (/^\S/.test(l)) {
      close(i - 1);
      break;
    }
    const key = /^ {2}([A-Za-z0-9]+):\s*$/.exec(l);
    if (key) {
      close(i - 1);
      current = { id: key[1], start: i };
    }
    if (i === lines.length - 1) close(i);
  }
  return out;
}
