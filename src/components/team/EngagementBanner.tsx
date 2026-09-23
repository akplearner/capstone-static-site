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
      <div className="rounded-xl border border-dashed border-info-line bg-info-soft p-4">
        <div className="flex items-start gap-3">
          <FileSignature className="mt-0.5 h-5 w-5 shrink-0 text-info" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              No client engagement defined yet
            </p>
            <p className="mt-0.5 text-sm text-body">
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
    <div className="overflow-hidden rounded-xl border border-info-line bg-gradient-to-r from-info-soft to-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-info-line px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="h-5 w-5 shrink-0 text-info" />
          <span className="truncate text-sm font-semibold text-ink">{client}</span>
          {type && (
            <span className="rounded-full bg-info-soft px-2 py-0.5 text-2xs font-medium text-info">
              {type}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-ink px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-panel">
            {phase}
          </span>
          <span className="text-2xs font-semibold uppercase tracking-wide text-warn">
            Confidential
          </span>
        </div>
      </div>
      <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
        {trust && (
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-muted">Attestation scope</div>
              <div className="text-sm text-body">{trust}</div>
            </div>
          </div>
        )}
        {scope && (
          <div className="flex items-start gap-2">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-info" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-muted">System boundary</div>
              <div className="line-clamp-2 text-sm text-body">{scope}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
