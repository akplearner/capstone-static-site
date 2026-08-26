'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { deliverablesForRole } from '@/lib/docs/definitions';

/**
 * The index of the forms you fill — one compact row each, linking to the form.
 *
 * This used to print a card per deliverable with three labelled rows (built
 * from / how / feeds) and the first six field labels of every form. On a
 * nine-form course that was the single longest block on the Reference page, and
 * every word of it is already rendered beside the form itself on the
 * Deliverables page — where you are actually filling it in. What a manual owes
 * you here is the map: what exists, what each one records, and a way in.
 *
 * `deliverablesForRole` is shared-track aware, so on Server+ this lists all nine
 * forms for every focus; on a role-split course it lists the ones you own.
 */
export function RoleExtractionGuide({
  role,
  roleLabel,
  courseId = 'security-plus',
}: {
  role: string;
  roleLabel?: string;
  courseId?: string;
}) {
  const defs = deliverablesForRole(role, courseId);
  if (defs.length === 0) return null;
  const label = roleLabel ?? role.toUpperCase();

  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-panel p-5">
      <h3 className="text-sm font-semibold text-ink">The forms {label} fills</h3>
      <p className="mt-1 text-sm text-muted">
        Each one opens on the Deliverables page, where its guidance and worked examples sit beside
        the fields.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left uppercase tracking-wide text-muted">
              <th className="py-1.5 pr-3 text-xs font-medium">Form</th>
              <th className="py-1.5 pr-3 text-xs font-medium">What it records</th>
              <th className="py-1.5 pr-3 text-xs font-medium">Week</th>
              <th className="py-1.5 text-xs font-medium" />
            </tr>
          </thead>
          <tbody>
            {defs.map((def) => (
              <tr key={def.id} className="border-b border-line/60 last:border-0 align-top">
                <td className="py-2 pr-3">
                  <span className="font-medium text-ink">
                    {def.num}. {def.title}
                  </span>
                  <span className="block font-mono text-[11px] text-muted">{def.file}</span>
                </td>
                <td className="py-2 pr-3 text-muted">{def.standard}</td>
                <td className="py-2 pr-3 font-mono text-[11px] text-muted">
                  {def.weeks.join(', ')}
                </td>
                <td className="py-2">
                  <Link
                    href={`/courses/${courseId}/docs?form=${def.id}`}
                    className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-medium text-accent hover:underline"
                  >
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
