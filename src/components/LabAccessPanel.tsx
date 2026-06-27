'use client';

import { CheckCircle2, Circle, Server } from 'lucide-react';
import { Collapsible } from './ui/Button';
import { LAB_CHECKS, LAB_FIELDS, getLabAccess, saveLabAccess, useLabAccess } from '@/lib/labAccess';

// Week-0 "Lab access" card: the student stores the target IPs/credentials their
// instructor gave them and ticks a reachability checklist. The IPs are substituted
// into command placeholders elsewhere (CommandBlock), so copied commands target the
// student's own machines instead of <YOUR_TARGET_IP>.
export function LabAccessPanel({ courseId }: { courseId: string }) {
  const lab = useLabAccess(courseId);

  const setValue = (key: string, value: string) => {
    const cur = getLabAccess(courseId);
    saveLabAccess(courseId, { ...cur, values: { ...cur.values, [key]: value } });
  };
  const toggleCheck = (key: string) => {
    const cur = getLabAccess(courseId);
    saveLabAccess(courseId, { ...cur, checks: { ...cur.checks, [key]: !cur.checks[key] } });
  };
  const setNotes = (notes: string) => {
    const cur = getLabAccess(courseId);
    saveLabAccess(courseId, { ...cur, notes });
  };

  const filledCount = LAB_FIELDS.filter((f) => lab.values[f.key]?.trim()).length;
  const checkCount = LAB_CHECKS.filter((c) => lab.checks[c.key]).length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
      <Collapsible
        title={`Lab access — your targets & reachability  (${filledCount}/${LAB_FIELDS.length} set · ${checkCount}/${LAB_CHECKS.length} checked)`}
        defaultOpen={filledCount === 0}
      >
        <div className="space-y-4 pb-2">
          <p className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Server className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            Enter the IPs your instructor gave you. They&apos;re filled into the commands below
            automatically (e.g. <span className="font-mono text-xs">&lt;YOUR_TARGET_IP&gt;</span> becomes your
            value), and saved on this device only.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {LAB_FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="block text-xs font-medium text-gray-700 dark:text-gray-300">{f.label}</span>
                <input
                  type="text"
                  value={lab.values[f.key] ?? ''}
                  onChange={(e) => setValue(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 font-mono text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </label>
            ))}
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Reachability check
            </div>
            <ul className="mt-2 space-y-1.5">
              {LAB_CHECKS.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => toggleCheck(c.key)}
                    className="flex items-center gap-2 text-left text-sm text-gray-700 dark:text-gray-300"
                  >
                    {lab.checks[c.key] ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
                    )}
                    <span className={lab.checks[c.key] ? 'text-gray-400 line-through dark:text-gray-500' : ''}>
                      {c.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <label className="block">
            <span className="block text-xs font-medium text-gray-700 dark:text-gray-300">Notes (credentials, hostnames…)</span>
            <textarea
              value={lab.notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. ubuntu user: student / pass: ••• ; RDP admin: ••• — kept on this device only"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </label>
        </div>
      </Collapsible>
    </div>
  );
}
