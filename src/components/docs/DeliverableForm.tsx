'use client';

import { AlertTriangle, ExternalLink } from 'lucide-react';
import { DeliverableData, DeliverableDef, Field, FieldGroup } from '@/lib/docs/types';
import { RegisterTable } from '@/components/grc/RegisterTable';
import { validateEvidenceFileName } from '@/lib/utils';

const inputClass =
  'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white';

function SingleField({
  f,
  fields,
  onChange,
}: {
  f: Field;
  fields: Record<string, string>;
  onChange: (value: string) => void;
}) {
  const value = f.derived ? f.derived(fields) : fields[f.field] ?? '';
  const empty = !value.trim();
  const namingBad = f.type === 'fileref' && !empty && !validateEvidenceFileName(value).valid;

  return (
    <label className="block">
      <span className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        {f.label}
        {f.required && <span className="text-red-500">*</span>}
      </span>
      {f.derived ? (
        <div className={`${inputClass} bg-gray-50 text-gray-600 dark:bg-gray-800`}>{value || '—'}</div>
      ) : f.type === 'area' || f.type === 'paste' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={f.placeholder}
          rows={f.type === 'paste' ? 4 : 3}
          className={`${inputClass} ${f.type === 'paste' ? 'font-mono text-xs' : ''}`}
        />
      ) : f.type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">—</option>
          {(f.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={f.type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={f.placeholder}
          className={inputClass}
        />
      )}
      {f.help && <span className="mt-1 block text-xs text-gray-400">{f.help}</span>}
      {f.required && empty && (
        <span className="mt-1 block text-xs text-red-500">Required for a complete deliverable.</span>
      )}
      {namingBad && (
        <span className="mt-1 block text-xs text-amber-600 dark:text-amber-400">
          Name it like YYYYMMDD_TeamXX_Tool_Action.png
        </span>
      )}
    </label>
  );
}

/** Warn if any screenshot cell in a group breaks the naming convention. */
function NamingWarnings({ group, rows }: { group: FieldGroup; rows: Record<string, string>[] }) {
  const hasScreenshot = group.columns.some((col) => col.field === 'screenshot');
  if (!hasScreenshot) return null;
  const bad = rows
    .map((r) => r.screenshot)
    .filter((v) => v && !validateEvidenceFileName(v).valid);
  if (bad.length === 0) return null;
  return (
    <p className="mt-1 flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      Screenshot names should look like <span className="font-mono">YYYYMMDD_TeamXX_Tool_Action.png</span> —
      check: {bad.join(', ')}
    </p>
  );
}

export function DeliverableForm({
  def,
  data,
  onChange,
}: {
  def: DeliverableDef;
  data: DeliverableData;
  onChange: (next: DeliverableData) => void;
}) {
  const setField = (k: string, v: string) =>
    onChange({ ...data, fields: { ...data.fields, [k]: v } });
  const setGroup = (g: string, rows: Record<string, string>[]) =>
    onChange({ ...data, groups: { ...data.groups, [g]: rows } });

  const hasCvss = def.sections.some(
    (s) =>
      (s.kind === 'group' && s.group.columns.some((c) => c.field === 'cvss')) ||
      (s.kind === 'fields' && s.fields.some((f) => f.field === 'cvss'))
  );

  return (
    <div className="space-y-5">
      {def.sections.map((s, i) =>
        s.kind === 'fields' ? (
          <div key={i} className="space-y-3">
            {s.title && (
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{s.title}</h4>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {s.fields.map((f) => (
                <SingleField key={f.field} f={f} fields={data.fields} onChange={(v) => setField(f.field, v)} />
              ))}
            </div>
          </div>
        ) : (
          <div key={i} className="space-y-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{s.group.label}</div>
            {s.group.help && <p className="text-xs text-gray-500 dark:text-gray-400">{s.group.help}</p>}
            <RegisterTable
              columns={s.group.columns}
              rows={data.groups[s.group.group] ?? []}
              onChange={(rows) => setGroup(s.group.group, rows)}
            />
            <NamingWarnings group={s.group} rows={data.groups[s.group.group] ?? []} />
          </div>
        )
      )}
      {hasCvss && (
        <a
          href="https://www.first.org/cvss/calculator/3.1"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Score it with the FIRST CVSS calculator <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
