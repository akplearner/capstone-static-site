import { Column, cellValue } from '../grc/templates';
import { DeliverableData, DeliverableDef, Field } from './types';

export interface DocMeta {
  team?: string;
  cohort?: string;
  date?: string;
  /** Course this package belongs to; scopes which deliverables the ZIP/README
   *  include. Defaults to 'security-plus' when absent. */
  courseId?: string;
}

function fieldValue(f: Field, fields: Record<string, string>): string {
  return f.derived ? f.derived(fields) : fields[f.field] ?? '';
}

function csvEscape(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Keep multi-line / pipe-containing cell content from breaking an MD table. */
function mdCell(v: string): string {
  return (v || ' ').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function mdTable(cols: Column[], rows: Record<string, string>[]): string {
  const header = `| ${cols.map((c) => c.label).join(' | ')} |`;
  const divider = `| ${cols.map(() => '---').join(' | ')} |`;
  const body = (rows.length ? rows : [{}])
    .map((r) => `| ${cols.map((c) => mdCell(cellValue(c, r))).join(' | ')} |`)
    .join('\n');
  return `${header}\n${divider}\n${body}`;
}

/** Industry-formatted Markdown with front-matter, headings and tables. */
export function toDeliverableMarkdown(def: DeliverableDef, data: DeliverableData, meta: DocMeta = {}): string {
  const fm = [
    '---',
    `title: ${def.title}`,
    `file: ${def.file}`,
    `standard: ${def.standard}`,
    meta.team ? `team: ${meta.team}` : '',
    meta.cohort ? `cohort: ${meta.cohort}` : '',
    meta.date ? `date: ${meta.date}` : '',
    '---',
  ]
    .filter(Boolean)
    .join('\n');

  const parts: string[] = [fm, '', `# ${def.title}`, '', `> ${def.purpose}`, `>`, `> _Standard: ${def.standard}_`, ''];
  def.sections.forEach((s) => {
    if (s.kind === 'fields') {
      if (s.title) parts.push(`## ${s.title}`, '');
      s.fields.forEach((f) => parts.push(`**${f.label}:** ${fieldValue(f, data.fields) || '_—_'}`, ''));
    } else {
      parts.push(`## ${s.group.label}`, '', mdTable(s.group.columns, data.groups[s.group.group] ?? []), '');
    }
  });
  return parts.join('\n') + '\n';
}

/** CSV of the primary register (asset/risk) or a key/value sheet for templates. */
export function toDeliverableCSV(def: DeliverableDef, data: DeliverableData): string {
  const group = def.sections.find((s) => s.kind === 'group');
  if (group && group.kind === 'group') {
    const cols = group.group.columns;
    const rows = data.groups[group.group.group] ?? [];
    const header = cols.map((c) => csvEscape(c.label)).join(',');
    const body = rows.map((r) => cols.map((c) => csvEscape(cellValue(c, r))).join(',')).join('\n');
    return `${header}\n${body}\n`;
  }
  const fieldsSec = def.sections.find((s) => s.kind === 'fields');
  const fields = fieldsSec && fieldsSec.kind === 'fields' ? fieldsSec.fields : [];
  const body = fields.map((f) => `${csvEscape(f.label)},${csvEscape(fieldValue(f, data.fields))}`).join('\n');
  return `Field,Value\n${body}\n`;
}

function esc(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** Escape for HTML and preserve line breaks inside table/field cells. */
function escMultiline(v: string): string {
  return esc(v).replace(/\r?\n/g, '<br>');
}

function htmlTable(cols: Column[], rows: Record<string, string>[]): string {
  const head = `<tr>${cols.map((c) => `<th>${esc(c.label)}</th>`).join('')}</tr>`;
  const body = (rows.length ? rows : [])
    .map((r) => `<tr>${cols.map((c) => `<td>${escMultiline(cellValue(c, r))}</td>`).join('')}</tr>`)
    .join('');
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

/** The body sections (field key/values + group tables) of one deliverable. */
function renderDeliverableSectionsHTML(def: DeliverableDef, data: DeliverableData): string {
  return def.sections
    .map((s) => {
      if (s.kind === 'fields') {
        const rows = s.fields
          .map((f) => `<div class="kv"><div class="k">${esc(f.label)}</div><div class="v">${escMultiline(fieldValue(f, data.fields)) || '—'}</div></div>`)
          .join('');
        return `${s.title ? `<h2>${esc(s.title)}</h2>` : ''}<div class="fields">${rows}</div>`;
      }
      return `<h2>${esc(s.group.label)}</h2>${htmlTable(s.group.columns, data.groups[s.group.group] ?? [])}`;
    })
    .join('\n');
}

/** Shared print stylesheet for both single-deliverable and role-report docs. */
const PRINT_CSS = `
  :root { color-scheme: light; }
  body { font: 14px/1.5 -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111; margin: 40px; }
  .cover { border-bottom: 3px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
  .cover h1 { margin: 0 0 4px; font-size: 24px; }
  .cover .std { color: #555; font-size: 12px; }
  .cover .meta { color: #555; font-size: 12px; margin-top: 4px; }
  .purpose { color: #444; font-style: italic; margin: 0 0 18px; }
  h2 { font-size: 16px; margin: 22px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  h3 { font-size: 18px; margin: 26px 0 2px; }
  .fields { display: grid; gap: 6px; }
  .kv { display: grid; grid-template-columns: 220px 1fr; gap: 10px; }
  .kv .k { font-weight: 600; color: #333; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 4px; font-size: 12.5px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; }
  .toc { color: #333; font-size: 13px; }
  .toc li { margin: 2px 0; }
  .deliverable + .deliverable { border-top: 1px dashed #ccc; padding-top: 6px; }
  .sub { color: #666; font-size: 12px; margin: 0 0 12px; }
  .metrics { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin: 0 0 18px; background: #fafafa; }
  .metrics-h { font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: #374151; margin-bottom: 8px; }
  .sevrow { display: flex; flex-wrap: wrap; gap: 6px; }
  .sev { font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 999px; border: 1px solid #d1d5db; color: #374151; }
  .sev-critical { background: #fee2e2; border-color: #fecaca; color: #991b1b; }
  .sev-high { background: #ffedd5; border-color: #fed7aa; color: #9a3412; }
  .sev-medium { background: #fef9c3; border-color: #fde68a; color: #854d0e; }
  .sev-low { background: #dcfce7; border-color: #bbf7d0; color: #166534; }
  .sev-info { background: #e0f2fe; border-color: #bae6fd; color: #075985; }
  .metrics-sub { margin-top: 8px; font-size: 12px; color: #555; }
  @media print {
    body { margin: 0.6in; }
    a { color: #111; }
    .deliverable { break-before: page; }
    .deliverable:first-of-type { break-before: auto; }
  }`;

const SEVERITY_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info'];

/** Collect rows from any group that has a 'severity' column (i.e. findings). */
function collectFindings(defs: DeliverableDef[], dataById: Record<string, DeliverableData>): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  for (const d of defs) {
    const data = dataById[d.id];
    if (!data) continue;
    for (const s of d.sections) {
      if (s.kind === 'group' && s.group.columns.some((col) => col.field === 'severity')) {
        rows.push(...(data.groups[s.group.group] ?? []));
      }
    }
  }
  return rows;
}

/** "Findings at a glance" — industry-report metrics: counts by severity + CVSS. */
function findingsSummaryHTML(defs: DeliverableDef[], dataById: Record<string, DeliverableData>): string {
  const rows = collectFindings(defs, dataById);
  if (rows.length === 0) return '';
  const counts: Record<string, number> = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]));
  rows.forEach((r) => {
    const s = (r.severity ?? '').trim();
    if (s in counts) counts[s] += 1;
  });
  const cvss = rows.map((r) => parseFloat(r.cvss ?? '')).filter((n) => !Number.isNaN(n));
  const maxC = cvss.length ? Math.max(...cvss).toFixed(1) : '—';
  const avgC = cvss.length ? (cvss.reduce((a, b) => a + b, 0) / cvss.length).toFixed(1) : '—';
  const chips = SEVERITY_ORDER.map((s) => `<span class="sev sev-${s.toLowerCase()}">${s}: ${counts[s]}</span>`).join('');
  return `<div class="metrics">
    <div class="metrics-h">Findings at a glance</div>
    <div class="sevrow">${chips}</div>
    <div class="metrics-sub">Total findings: ${rows.length} · Highest CVSS: ${maxC} · Average CVSS: ${avgC}</div>
  </div>`;
}

/** Standalone, print-ready HTML document (opened in a new window → Save as PDF). */
export function toDeliverableHTML(def: DeliverableDef, data: DeliverableData, meta: DocMeta = {}): string {
  const sections = renderDeliverableSectionsHTML(def, data);
  const metaLine = [meta.team && `Team ${meta.team}`, meta.cohort, meta.date].filter(Boolean).join(' · ');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(def.file)}</title>
<style>${PRINT_CSS}</style></head>
<body>
  <div class="cover">
    <h1>${esc(def.title)}</h1>
    <div class="std">${esc(def.file)} · ${esc(def.standard)}</div>
    ${metaLine ? `<div class="meta">${esc(metaLine)}</div>` : ''}
  </div>
  <p class="purpose">${esc(def.purpose)}</p>
  ${findingsSummaryHTML([def], { [def.id]: data })}
  ${sections}
</body></html>`;
}

/**
 * One audit-grade, print-ready report compiling every deliverable a role owns
 * (cover → contents → each deliverable as a page-broken section). Red gets a
 * full pentest report; Blue gets Hardening + Change Log + Incident in one doc.
 */
export function toRoleReportHTML(
  defs: DeliverableDef[],
  dataById: Record<string, DeliverableData>,
  meta: DocMeta = {},
  roleLabel = 'Team Report'
): string {
  const metaLine = [meta.team && `Team ${meta.team}`, meta.cohort, meta.date].filter(Boolean).join(' · ');
  const standards = Array.from(new Set(defs.map((d) => d.standard))).join(' · ');

  const toc = `<ol class="toc">${defs.map((d) => `<li>${esc(d.title)} <span style="color:#888">— ${esc(d.file)}</span></li>`).join('')}</ol>`;

  const body = defs
    .map((d) => {
      const data = dataById[d.id] ?? { fields: {}, groups: {} };
      return `<section class="deliverable">
    <h3>${esc(d.title)}</h3>
    <p class="sub">${esc(d.file)} · ${esc(d.standard)}</p>
    <p class="purpose">${esc(d.purpose)}</p>
    ${renderDeliverableSectionsHTML(d, data)}
  </section>`;
    })
    .join('\n');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(roleLabel)}</title>
<style>${PRINT_CSS}</style></head>
<body>
  <div class="cover">
    <h1>${esc(roleLabel)}</h1>
    <div class="std">${defs.length} deliverable${defs.length === 1 ? '' : 's'}${standards ? ` · ${esc(standards)}` : ''}</div>
    ${metaLine ? `<div class="meta">${esc(metaLine)}</div>` : ''}
  </div>
  ${findingsSummaryHTML(defs, dataById)}
  <h2>Contents</h2>
  ${toc}
  ${body}
</body></html>`;
}
