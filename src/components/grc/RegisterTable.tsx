'use client';

import { Plus, Trash2 } from 'lucide-react';
import { RegisterRow } from '@/lib/types';
import { Column, cellValue } from '@/lib/grc/templates';

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
      return 'bg-ok-soft text-ok';
    default:
      return 'bg-panel-2 text-muted';
  }
}

/** Generic editable register table driven by a column schema. Derived columns
 *  (e.g. severity from CVSS, risk level from likelihood×impact) are read-only. */
export function RegisterTable({
  columns,
  rows,
  onChange,
}: {
  columns: Column[];
  rows: RegisterRow[];
  onChange: (rows: RegisterRow[]) => void;
}) {
  const update = (i: number, field: string, value: string) =>
    onChange(rows.map((r, ri) => (ri === i ? { ...r, [field]: value } : r)));
  const addRow = () => onChange([...rows, {}]);
  const removeRow = (i: number) => onChange(rows.filter((_, ri) => ri !== i));

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line">
              {columns.map((c) => (
                <th
                  key={c.field}
                  className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted"
                >
                  {c.label}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-line/60">
                {columns.map((c) => (
                  <td key={c.field} className="px-2 py-1.5 align-top">
                    {c.derived ? (
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass(
                          cellValue(c, row)
                        )}`}
                      >
                        {cellValue(c, row) || '—'}
                      </span>
                    ) : c.type === 'select' ? (
                      <select
                        value={row[c.field] ?? ''}
                        onChange={(e) => update(i, c.field, e.target.value)}
                        className={inputClass}
                      >
                        <option value="">—</option>
                        {(c.options ?? []).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : c.type === 'area' ? (
                      <textarea
                        value={row[c.field] ?? ''}
                        placeholder={c.placeholder}
                        rows={2}
                        onChange={(e) => update(i, c.field, e.target.value)}
                        className={`${inputClass} min-w-[12rem] resize-y`}
                      />
                    ) : (
                      <input
                        type={c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'text'}
                        value={row[c.field] ?? ''}
                        placeholder={c.placeholder}
                        onChange={(e) => update(i, c.field, e.target.value)}
                        className={inputClass}
                      />
                    )}
                  </td>
                ))}
                <td className="px-1 py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    aria-label="Delete row"
                    className="rounded p-1 text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
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
