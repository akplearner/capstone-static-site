'use client';

import Link from 'next/link';
import { Building2, ShieldCheck, Target, FileSignature } from 'lucide-react';
import { docsRepo } from '@/lib/data';
import { useClientStore, EMPTY_OBJECT } from '@/lib/useClientStore';
import type { DeliverableData } from '@/lib/docs/types';

type DocsMap = Record<string, DeliverableData>;

/**
 * The engagement header for a real-engagement-framed course (MSSP). Reads the
 * team's saved Engagement Agreement (`mssp_engagement`) and shows the client, the
 * attestation scope, the system boundary and the current phase — so the course
 * hub reads like a live client engagement instead of "your week / your role".
 * When the agreement isn't filled yet it prompts the team to define scope.
 */
export function EngagementBanner({
  courseId,
  teamId,
  phase,
}: {
  courseId: string;
  teamId: string;
  phase: string;
}) {
  const saved = useClientStore<DocsMap>(
    () => docsRepo.get(courseId, teamId) ?? EMPTY_OBJECT,
    EMPTY_OBJECT
  );
  const eng = saved['mssp_engagement']?.fields ?? {};
  const client = eng.client?.trim();
  const type = eng.engagement_type?.trim();
  const trust = eng.trust_categories?.trim();
  const scope = eng.system_boundary?.trim();

  const defineHref = `/courses/${courseId}/docs?form=mssp_engagement`;

  if (!client) {
    return (
      <div className="rounded-xl border border-dashed border-indigo-300 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/40">
        <div className="flex items-start gap-3">
          <FileSignature className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
              No client engagement defined yet
            </p>
            <p className="mt-0.5 text-sm text-indigo-800 dark:text-indigo-200">
              Every engagement starts by signing the agreement and drawing the system boundary.{' '}
              <Link href={defineHref} className="font-medium underline underline-offset-2">
                Define your engagement scope →
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white dark:border-indigo-900 dark:from-indigo-950/50 dark:to-gray-900">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100 px-4 py-2.5 dark:border-indigo-900/60">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-300" />
          <span className="truncate text-sm font-semibold text-gray-900 dark:text-white">{client}</span>
          {type && (
            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              {type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-gray-900 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white dark:bg-white dark:text-gray-900">
            {phase}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Confidential
          </span>
        </div>
      </div>
      <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
        {trust && (
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Attestation scope</div>
              <div className="text-sm text-gray-700 dark:text-gray-300">{trust}</div>
            </div>
          </div>
        )}
        {scope && (
          <div className="flex items-start gap-2">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">System boundary</div>
              <div className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">{scope}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
