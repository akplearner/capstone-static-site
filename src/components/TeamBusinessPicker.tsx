'use client';

import { useEffect } from 'react';
import { docsRepo } from '@/lib/data';
import { useClientStore, EMPTY_OBJECT, notifyStore } from '@/lib/useClientStore';
import { emptyData, type DeliverableData } from '@/lib/docs/types';

/**
 * "Your team's business" — the dropdown that makes the topology yours.
 *
 * Writes the SAME team-scoped record the Week-1 Business Requirements form
 * fills (`srv_business_reqs` via docsRepo), so there is one source of truth:
 * pick the industry here and the form on the Deliverables page is already
 * started; fill the form there and this card shows it. Team selection itself
 * lives on the Home tab ("Change team or role").
 *
 * Renders on the Guide's lab section, directly above the topology diagram it
 * labels — the one place the build is drawn.
 */
const BUSINESS_INDUSTRIES = ['Manufacturing', 'Healthcare', 'Retail', 'MSP / IT services', 'Logistics', 'Professional services', 'Other'];

export function TeamBusinessPicker({
  courseId,
  teamId,
  onBusiness,
}: {
  courseId: string;
  teamId: string;
  onBusiness: (b: { name?: string; industry?: string }) => void;
}) {
  const saved = useClientStore<Record<string, DeliverableData>>(
    () => docsRepo.get(courseId, teamId) ?? EMPTY_OBJECT,
    EMPTY_OBJECT
  );
  const data = saved['srv_business_reqs'] ?? emptyData();
  const name = data.fields.client ?? '';
  const industry = data.fields.industry ?? '';
  const other = data.fields.industry_other ?? '';

  // Lift the current choice so the topology diagram can label itself. An
  // effect, not a render-time call — setState during a sibling's render is a
  // React error.
  const industryLabel = industry === 'Other' && other ? other : industry;
  useEffect(() => {
    onBusiness({ name: name || undefined, industry: industryLabel || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, industryLabel]);

  const setField = (field: string, value: string) => {
    const current = docsRepo.get(courseId, teamId) ?? {};
    const doc = current['srv_business_reqs'] ?? emptyData();
    docsRepo.save(courseId, teamId, {
      ...current,
      srv_business_reqs: { ...doc, fields: { ...doc.fields, [field]: value } },
    });
    notifyStore();
  };

  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink">Your team&apos;s business</div>
          <p className="mt-0.5 text-xs text-muted">
            The base build is the same for every team — this decides what the extra VMs are for.
            Saved into your Architecture Brief.
          </p>
        </div>
        <label className="block">
          <span className="block text-xs font-medium text-body">Business name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setField('client', e.target.value)}
            placeholder="e.g. Granite Peak Aggregates"
            className="mt-1 w-48 rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-body">Type of business</span>
          <select
            value={industry}
            onChange={(e) => setField('industry', e.target.value)}
            className="mt-1 w-48 rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
          >
            <option value="">Choose…</option>
            {BUSINESS_INDUSTRIES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
        {industry === 'Other' && (
          <label className="block">
            <span className="block text-xs font-medium text-body">Describe it</span>
            <input
              type="text"
              value={other}
              onChange={(e) => setField('industry_other', e.target.value)}
              placeholder="e.g. A veterinary clinic chain"
              className="mt-1 w-56 rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"
            />
          </label>
        )}
      </div>
    </div>
  );
}
