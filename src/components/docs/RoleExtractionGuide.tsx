'use client';

import { ArrowRight, Terminal, ClipboardList } from 'lucide-react';
import { deliverablesForRole } from '@/lib/docs/definitions';
import { DeliverableDef } from '@/lib/docs/types';

/** The field/column labels a deliverable collects — what your extraction feeds. */
function captureLabels(def: DeliverableDef): string[] {
  const labels: string[] = [];
  def.sections.forEach((s) => {
    if (s.kind === 'fields') s.fields.forEach((f) => labels.push(f.label));
    else s.group.columns.forEach((c) => labels.push(c.label));
  });
  return labels;
}

/**
 * A role-specific "how to extract content into your forms" guide: for each
 * deliverable this role owns, what it's built from, how to do it, and the
 * fields your extraction feeds. Complements the universal WorkflowFlow by
 * making the per-role path concrete (spec §9 clarity).
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
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        How {label} extracts content into the forms
      </h2>
      <p className="mt-1 text-sm text-muted">
        For every output, pull the <strong>3 things</strong> (what you found · the proof · why it
        matters), then type them into the matching deliverable below.
      </p>

      <div className="mt-4 space-y-3">
        {defs.map((def) => {
          const fields = captureLabels(def);
          const shown = fields.slice(0, 6);
          const more = fields.length - shown.length;
          return (
            <div
              key={def.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40"
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <span className="font-semibold text-ink">
                  {def.num}. {def.title}
                </span>
                <span className="font-mono text-xs text-muted">{def.file}</span>
              </div>

              <div className="mt-2 grid gap-2 text-sm sm:grid-cols-[auto_1fr] sm:items-start">
                <span className="flex items-center gap-1.5 eyebrow-muted">
                  <Terminal className="h-3.5 w-3.5" /> Built from
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {def.source ?? 'Your own work for this role.'}
                </span>

                <span className="eyebrow-muted">
                  How
                </span>
                <span className="text-gray-700 dark:text-gray-300">{def.howTo}</span>

                <span className="flex items-center gap-1.5 eyebrow-muted">
                  <ArrowRight className="h-3.5 w-3.5" /> Feeds
                </span>
                <span className="text-gray-700 dark:text-gray-300">
                  {shown.join(' · ')}
                  {more > 0 && <span className="text-gray-400"> · +{more} more</span>}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
