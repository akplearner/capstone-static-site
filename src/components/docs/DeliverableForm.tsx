'use client';

import { useState } from 'react';
import { AlertTriangle, ArrowDownToLine, ExternalLink } from 'lucide-react';
import { DeliverableData, DeliverableDef, Field, FieldGroup, emptyFormContext, type FormContext } from '@/lib/docs/types';
import { DURATION_UNITS, fitsInput, formatDuration, isIpv4OrCidr, parseDuration } from '@/lib/docs/formContext';
import { RegisterTable } from '@/components/grc/RegisterTable';
import { deliverableTitle } from '@/lib/docs/definitions';
import { validateEvidenceFileName } from '@/lib/utils';
import { EVIDENCE_NAMING_PNG } from '@/lib/evidence';

const inputClass =
  'mt-1 w-full rounded-lg border border-line bg-panel px-3 py-2 text-sm text-ink';

function SingleField({
  f,
  fields,
  ctx,
  onChange,
}: {
  f: Field;
  fields: Record<string, string>;
  ctx: FormContext;
  onChange: (value: string) => void;
}) {
  const value = f.derived ? f.derived(fields) : fields[f.field] ?? '';
  const empty = !value.trim();
  const namingBad = f.type === 'fileref' && !empty && !validateEvidenceFileName(value).valid;
  // Shape only, and only once they have left the field — same rule as required.
  const badAddress = f.type === 'ipv4' && !empty && !isIpv4OrCidr(value);
  const suggestions =
    f.type === 'hostref' ? ctx.hostnames : f.type === 'evidence' ? ctx.evidence.map((e) => e.filename) : [];
  const listId = `field-${f.field}-options`;
  // "Required" turns red only after the student has actually been IN the field.
  // On first paint, form 03 used to open with seven red error messages before a
  // single character was typed — a brand-new form scolding a brand-new student.
  // The asterisk still marks required fields; the form-level counter says how
  // many are left; red is reserved for a field someone visited and left empty.
  const [touched, setTouched] = useState(false);

  const handleSignature = (name: string) => {
    if (!name.trim()) {
      onChange('');
      return;
    }
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    onChange(`${name} — ${timestamp}`);
  };

  const extractName = (sig: string) => {
    if (!sig) return '';
    const match = sig.match(/^(.+?)\s*—/);
    return match ? match[1] : sig;
  };

  return (
    <label className="block">
      <span className="flex items-center gap-1 text-sm font-medium text-body">
        {f.label}
        {f.required && <span className="text-danger">*</span>}
      </span>
      {f.derived ? (
        <div className={`${inputClass} bg-panel-2 text-muted`}>{value || '—'}</div>
      ) : f.type === 'area' || f.type === 'paste' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={f.placeholder}
          rows={f.type === 'paste' ? 4 : 3}
          className={`${inputClass} ${f.type === 'paste' ? 'font-mono text-xs' : ''}`}
        />
      ) : f.type === 'signature' ? (
        <div className="space-y-2">
          <input
            type="text"
            value={extractName(value)}
            onChange={(e) => handleSignature(e.target.value)}
            placeholder={f.placeholder || 'Approver name'}
            className={inputClass}
          />
          {value && (
            <div className="text-xs text-muted">
              Signed on {value.match(/—\s*(.+)$/)?.[1] || 'pending'}
            </div>
          )}
        </div>
      ) : f.type === 'number' ? (
        // The unit sits in the box, not in a placeholder that vanishes on the
        // first keystroke — "40" on its own could be GB, MB or minutes, and the
        // export could not tell either.
        <span className="relative mt-1 flex items-center">
          <input
            type={fitsInput('number', value) ? 'number' : 'text'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={f.placeholder}
            className={`${inputClass} mt-0 ${f.unit ? 'pr-14' : ''}`}
          />
          {f.unit && <span className="pointer-events-none absolute right-3 text-xs text-muted">{f.unit}</span>}
        </span>
      ) : f.type === 'duration' ? (
        (() => {
          const { amount, unit } = parseDuration(value);
          return (
            <span className="mt-1 flex items-center gap-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => onChange(formatDuration(e.target.value, unit))}
                onBlur={() => setTouched(true)}
                placeholder={f.placeholder}
                className={`${inputClass} mt-0 w-24`}
              />
              <select
                value={unit}
                onChange={(e) => onChange(formatDuration(amount, e.target.value))}
                className={`${inputClass} mt-0 w-32`}
              >
                {DURATION_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </span>
          );
        })()
      ) : f.type === 'hostref' || f.type === 'evidence' ? (
        // A datalist, not a select: the list is a suggestion, not a limit. A
        // student naming a machine nobody has declared yet must not be blocked
        // by their own paperwork.
        <>
          <input
            type="text"
            list={suggestions.length > 0 ? listId : undefined}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={f.placeholder}
            className={inputClass}
          />
          {suggestions.length > 0 && (
            <datalist id={listId}>
              {suggestions.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          )}
        </>
      ) : f.type === 'select' ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} onBlur={() => setTouched(true)} className={inputClass}>
          <option value="">—</option>
          {(f.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={f.type === 'date' && fitsInput('date', value) ? 'date' : 'text'}
          inputMode={f.type === 'ipv4' ? 'numeric' : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder={f.placeholder}
          className={`${inputClass} ${badAddress && touched ? 'border-warn' : ''}`}
        />
      )}
      {badAddress && touched && (
        <span className="mt-1 block text-xs text-warn">Four numbers, 0–255, e.g. 172.16.0.10</span>
      )}
      {f.help && <span className="mt-1 block text-xs text-muted">{f.help}</span>}
      {f.required && empty && touched && (
        <span className="mt-1 block text-xs text-danger">Required for a complete deliverable.</span>
      )}
      {namingBad && (
        <span className="mt-1 block text-xs text-warn">
          Name it like {EVIDENCE_NAMING_PNG}
        </span>
      )}
    </label>
  );
}

/** Warn if any screenshot/filename cell in a group breaks the naming convention. */
function NamingWarnings({ group, rows }: { group: FieldGroup; rows: Record<string, string>[] }) {
  const nameCols = group.columns.filter((col) => col.field === 'screenshot' || col.field === 'filename');
  if (nameCols.length === 0) return null;
  const bad = rows
    .flatMap((r) => nameCols.map((c) => r[c.field]))
    .filter((v) => v && !validateEvidenceFileName(v).valid);
  if (bad.length === 0) return null;
  return (
    <p className="mt-1 flex items-start gap-1.5 text-xs text-warn">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      Screenshot names should look like <span className="font-mono">{EVIDENCE_NAMING_PNG}</span> —
      check: {bad.join(', ')}
    </p>
  );
}

export function DeliverableForm({
  def,
  data,
  ctx = emptyFormContext(),
  carried = {},
  onChange,
}: {
  def: DeliverableDef;
  data: DeliverableData;
  /** What this form can see beyond itself: the team's other documents, the
   *  hostnames they name, and the artifacts this member has hashed. Defaulted
   *  so a caller that does not care still renders. */
  ctx?: FormContext;
  /** Groups whose rows were started from an upstream form, so the form can say
   *  so. Silently knowing things the student never typed is unnerving. */
  carried?: Record<string, { from: string; rows: number }>;
  onChange: (next: DeliverableData) => void;
}) {
  const titleOf = (id: string) => deliverableTitle(id) ?? id;
  const setField = (k: string, v: string) =>
    onChange({ ...data, fields: { ...data.fields, [k]: v } });
  const setGroup = (g: string, rows: Record<string, string>[]) =>
    onChange({ ...data, groups: { ...data.groups, [g]: rows } });

  // One neutral line instead of a page of premature red: how many required
  // fields still need a value. Field-level red appears per field after a visit.
  const requiredLeft = def.sections
    .filter((s): s is Extract<typeof s, { kind: 'fields' }> => s.kind === 'fields')
    .flatMap((s) => s.fields)
    .filter((f) => f.required && !f.derived && !(data.fields[f.field] ?? '').trim()).length;

  const hasCvss = def.sections.some(
    (s) =>
      (s.kind === 'group' && s.group.columns.some((c) => c.field === 'cvss')) ||
      (s.kind === 'fields' && s.fields.some((f) => f.field === 'cvss'))
  );

  return (
    <div className="space-y-5">
      {requiredLeft > 0 && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel-2 px-3 py-1 text-xs font-medium text-muted">
          {requiredLeft} required {requiredLeft === 1 ? 'field' : 'fields'} left
        </div>
      )}
      {def.sections.map((s, i) =>
        s.kind === 'fields' ? (
          <div key={i} className="space-y-3">
            {s.title && (
              <h4 className="text-sm font-semibold text-ink">{s.title}</h4>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {s.fields.map((f) => (
                <SingleField key={f.field} f={f} fields={data.fields} ctx={ctx} onChange={(v) => setField(f.field, v)} />
              ))}
            </div>
          </div>
        ) : (
          <div key={i} className="space-y-1">
            <div className="text-sm font-semibold text-ink">{s.group.label}</div>
            {s.group.help && <p className="text-xs text-muted">{s.group.help}</p>}
            {carried[s.group.group] && (
              <p className="flex items-start gap-1.5 rounded-md border border-info-line bg-info-soft px-2.5 py-1.5 text-xs text-ink">
                <ArrowDownToLine className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info" aria-hidden />
                <span>
                  {carried[s.group.group].rows} row{carried[s.group.group].rows === 1 ? '' : 's'} started from{' '}
                  <strong>{titleOf(carried[s.group.group].from)}</strong> — edit or delete anything that has changed.
                </span>
              </p>
            )}
            <RegisterTable
              columns={s.group.columns}
              rows={data.groups[s.group.group] ?? []}
              ctx={ctx}
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
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          Score it with the FIRST CVSS calculator <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
