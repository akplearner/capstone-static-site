'use client';

import { Plus, Trash2 } from 'lucide-react';
import { InfoTip } from '@/components/InfoTip';
import { RegisterRow } from '@/lib/types';
import { Column, cellValue } from '@/lib/grc/templates';
import { emptyFormContext, type FormContext } from '@/lib/docs/types';
import { DURATION_UNITS, addressPart, fitsInput, formatDuration, inSubnet, isIpv4OrCidr, parseDuration } from '@/lib/docs/formContext';

const inputClass =
  'w-full rounded border border-line bg-panel px-2 py-1 text-sm text-ink';

// Colour the derived severity/risk-level cells so priority reads at a glance.
function badgeClass(value: string): string {
  switch (value) {
    case 'Critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    case 'High':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    case 'Low':
    case 'Proven':
      return 'bg-ok-soft text-ok';
    // A connectivity test that did not match expectation is a finding to fix.
    case 'Finding':
      return 'bg-danger-soft text-danger';
    default:
      return 'bg-panel-2 text-muted';
  }
}

/**
 * One editable cell, by column type.
 *
 * Extracted from the table body so the desktop table and the phone card layout
 * below render exactly the same control — the two used to be one branchy block
 * inside a `<td>`, which is why there was no card layout at all.
 *
 * The two layouts differ in exactly one way, and it is why `labelled` exists:
 * the card wraps each control in a `<label>`, and a `<td>` cannot. The table
 * therefore has to write the name on the control itself. Until R65 it wrote
 * nothing, and every cell of every graded form announced as "edit text, blank"
 * — on the layout that everyone not on a phone actually uses.
 */
function Cell({
  col,
  row,
  rowIndex,
  ctx,
  labelled,
  onChange,
}: {
  col: Column;
  row: RegisterRow;
  /** Which row this is. Only used to keep generated ids unique. */
  rowIndex: number;
  ctx: FormContext;
  /**
   * True when an enclosing `<label>` already names the control — the phone
   * layout. The table layout has no label to give (a `<th>` is not one, and
   * `scope` alone does not name a control the way it names a cell), so it asks
   * for the name to be written on.
   */
  labelled: boolean;
  onChange: (value: string) => void;
}) {
  const value = row[col.field] ?? '';
  // "Impact, row 3" rather than "Impact": a register is a grid, and a name that
  // does not say which row it belongs to is a name you cannot navigate by.
  const named = labelled ? {} : { 'aria-label': `${col.label}, row ${rowIndex + 1}` };

  if (col.derived) {
    return (
      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(cellValue(col, row))}`}>
        {cellValue(col, row) || '—'}
      </span>
    );
  }

  if (col.type === 'select') {
    return (
      <select {...named} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        <option value="">—</option>
        {(col.options ?? []).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  if (col.type === 'area') {
    return (
      <textarea
        {...named}
        value={value}
        placeholder={col.placeholder}
        rows={2}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} min-w-[10rem] resize-y`}
      />
    );
  }

  // A quantity keeps its unit in the box. It used to live in the placeholder,
  // which disappears the moment anything is typed — so "40" could mean GB, MB
  // or gigabits, and the export could not tell either.
  if (col.type === 'number') {
    return (
      <span className="relative inline-flex w-full items-center">
        <input
          {...named}
          type={fitsInput('number', value) ? 'number' : 'text'}
          value={value}
          placeholder={col.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} ${col.unit ? 'pr-12' : ''}`}
        />
        {col.unit && (
          <span className="pointer-events-none absolute right-2 text-xs text-muted">{col.unit}</span>
        )}
      </span>
    );
  }

  // A host the team already named. A datalist rather than a select: the list is
  // the suggestion, not the limit — a student adding a machine nobody has
  // declared yet must not be blocked by their own paperwork.
  if (col.type === 'hostref' || col.type === 'evidence') {
    const listId = `${col.type}-${col.field}-${labelled ? 'card' : 'row'}-${rowIndex}`;
    const options =
      col.type === 'hostref' ? ctx.hostnames : ctx.evidence.map((e) => e.filename);
    return (
      <>
        <input
          {...named}
          type="text"
          list={options.length > 0 ? listId : undefined}
          value={value}
          placeholder={col.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        {options.length > 0 && (
          <datalist id={listId}>
            {options.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        )}
      </>
    );
  }

  if (col.type === 'duration') {
    const { amount, unit } = parseDuration(value);
    return (
      <span className="flex items-center gap-1">
        <input
          aria-label={`${col.label}, row ${rowIndex + 1} — amount`}
          type="number"
          value={amount}
          placeholder={col.placeholder}
          onChange={(e) => onChange(formatDuration(e.target.value, unit))}
          className={`${inputClass} w-20`}
        />
        <select
          aria-label={`${col.label}, row ${rowIndex + 1} — unit`}
          value={unit}
          onChange={(e) => onChange(formatDuration(amount, e.target.value))}
          className={`${inputClass} w-24`}
        >
          {DURATION_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </span>
    );
  }

  if (col.type === 'ipv4') {
    // Shape first, then zone. Both are hints, never blocks: a half-typed
    // address is not an error, and the student is the one who knows whether
    // this machine really does belong somewhere unexpected.
    const subnet = col.subnetFrom ? row[col.subnetFrom] : undefined;
    const badShape = !!value.trim() && !isIpv4OrCidr(value);
    const wrongZone =
      !badShape && !!value.trim() && !!subnet && !inSubnet(addressPart(value), subnet);
    return (
      <>
        <input
          {...named}
          type="text"
          inputMode="numeric"
          value={value}
          placeholder={col.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} ${badShape ? 'border-warn' : ''}`}
        />
        {badShape && <span className="mt-0.5 block text-2xs text-warn">Four numbers, 0–255, e.g. 172.16.0.10</span>}
        {wrongZone && (
          <span className="mt-0.5 block text-2xs text-warn">Outside {subnet} — is that deliberate?</span>
        )}
      </>
    );
  }

  return (
    <input
      {...named}
      type={col.type === 'date' && fitsInput('date', value) ? 'date' : 'text'}
      value={value}
      placeholder={col.placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
    />
  );
}

/** Generic editable register table driven by a column schema. Derived columns
 *  (e.g. severity from CVSS, risk level from likelihood×impact) are read-only. */
export function RegisterTable({
  columns,
  rows,
  ctx = emptyFormContext(),
  onChange,
}: {
  columns: Column[];
  rows: RegisterRow[];
  /** What the form can see beyond itself — hostnames, hashed evidence. */
  ctx?: FormContext;
  onChange: (rows: RegisterRow[]) => void;
}) {
  const update = (i: number, field: string, value: string) =>
    onChange(rows.map((r, ri) => (ri === i ? { ...r, [field]: value } : r)));
  const addRow = () => onChange([...rows, {}]);
  const removeRow = (i: number) => onChange(rows.filter((_, ri) => ri !== i));

  return (
    <div>
      {/* ── Phone: one row per card ──
          28 of the course's groups are five columns or wider and one is nine.
          As a table those scroll sideways on a 390px screen, which hides both
          the right-hand columns and the per-column help added in R58. A card
          puts the label above the value and drops nothing. */}
      <div className="space-y-3 sm:hidden">
        {rows.map((row, i) => (
          <div key={i} className="rounded-lg border border-line bg-panel-2 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="eyebrow-muted">Row {i + 1}</span>
              <button
                type="button"
                onClick={() => removeRow(i)}
                aria-label={`Delete row ${i + 1}`}
                className="rounded p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {columns.map((c) => (
                <label key={c.field} className="block">
                  <span className="mb-0.5 flex items-center gap-1 text-xs font-medium text-muted">
                    {c.label}
                    {c.help && <InfoTip label={`${c.label}: ${c.help}`} />}
                  </span>
                  <Cell
                    col={c}
                    row={row}
                    rowIndex={i}
                    ctx={ctx}
                    labelled
                    onChange={(v) => update(i, c.field, v)}
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm text-muted">
            No rows yet — add one to start.
          </p>
        )}
      </div>

      {/* ── Everything wider: the table ── */}
      <div className="hidden overflow-x-auto sm:block">
        {/* 480px, down from 640: the column help under every heading was the
            width driver, and it moved into an InfoTip on the heading. */}
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-line">
              {columns.map((c) => (
                <th
                  key={c.field}
                  scope="col"
                  className="px-2 py-2 text-left align-bottom text-xs font-semibold uppercase tracking-wide text-muted"
                >
                  {/* The "where does this value come from" help lives in a
                      tooltip on the heading — printed under every heading it
                      was 158 visible words on one form. */}
                  <span className="inline-flex items-center gap-1">
                    {c.label}
                    {c.help && <InfoTip label={`${c.label}: ${c.help}`} />}
                  </span>
                </th>
              ))}
              <th scope="col" className="w-10">
                <span className="sr-only">Delete row</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-line/60">
                {columns.map((c) => (
                  <td key={c.field} className="px-2 py-1.5 align-top">
                    <Cell
                      col={c}
                      row={row}
                      rowIndex={i}
                      ctx={ctx}
                      labelled={false}
                      onChange={(v) => update(i, c.field, v)}
                    />
                  </td>
                ))}
                <td className="px-1 py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label="Delete row"
                    className="rounded p-1.5 text-muted hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-2 py-4 text-center text-sm text-muted"
                >
                  No rows yet — add one to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-strong"
      >
        <Plus className="h-4 w-4" /> Add row
      </button>
    </div>
  );
}
