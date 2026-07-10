/**
 * Split a single command string into its top-level statements, breaking on `&&`,
 * `;`, and newlines but NOT on pipes (`|` is one pipeline), never inside quotes,
 * and never inside braces (`;` inside a PowerShell `@{...}` hashtable is not a
 * statement separator). Used as a visual fallback for un-migrated multi-statement
 * `command` strings. Pure + framework-free so it can be unit-tested directly.
 */
export function splitCommand(cmd: string): string[] {
  const parts: string[] = [];
  let buf = '';
  let quote: string | null = null;
  let depth = 0;
  for (let i = 0; i < cmd.length; i++) {
    const ch = cmd[i];
    if (quote) {
      buf += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === '{' || ch === '(') depth++;
    if (ch === '}' || ch === ')') depth = Math.max(0, depth - 1);
    if (ch === '\n') {
      if (buf.trim()) parts.push(buf.trim());
      buf = '';
      continue;
    }
    if (depth === 0 && ch === '&' && cmd[i + 1] === '&') {
      if (buf.trim()) parts.push(buf.trim());
      buf = '';
      i++;
      continue;
    }
    if (depth === 0 && ch === ';') {
      if (buf.trim()) parts.push(buf.trim());
      buf = '';
      continue;
    }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  return parts.length ? parts : [cmd];
}
