'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import { CatalogCard } from '@/components/catalog/CatalogCard';
import { VENDORS, LEVELS, catalogByVendor, catalogSummary } from '@/lib/catalog/helpers';
import { pathById } from '@/lib/catalog/paths';
import { courseRepo, progressRepo, evidenceRepo, pathRepo } from '@/lib/data';
import { getTasksByRole } from '@/lib/course-helpers';
import { courseMetrics } from '@/lib/metrics';
import { useClientStore, EMPTY_OBJECT } from '@/lib/useClientStore';
import { useUserSync } from '@/lib/useUserSync';
import type { Level } from '@/lib/types';

// Sections theme themselves from `vendor.region` (a `[data-region=…]` key), so the
// stone in each card inherits that vendor's rock + mineral with no per-card logic.

type VendorFilter = 'all' | string;
type LevelFilter = 'all' | Level;

export default function ExplorePage() {
  const [vendor, setVendor] = useState<VendorFilter>('all');
  const [level, setLevel] = useState<LevelFilter>('all');
  useUserSync();

  // Which capstones this student has started, and how much of each they've
  // actually verified — so the map doubles as a progress view instead of looking
  // identical whether you've done nothing or finished three courses.
  const enrolled = useClientStore<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const course of courseRepo.list()) {
      const member = progressRepo.getContext(course.id);
      if (!member) continue;
      const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
      const taskPercent: Record<string, number> = {};
      course.weeks.forEach((w) => {
        getTasksByRole(course, member.role, w.number).forEach((t) => {
          taskPercent[t.id] = progressRepo.getTaskPercent(course.id, member.memberId, t, keySet);
        });
      });
      out[course.id] = courseMetrics({
        course,
        role: member.role,
        taskPercent,
        evidence: evidenceRepo.getSteps(course.id, member.memberId),
        artifacts: evidenceRepo.getArtifacts(course.id, member.memberId),
      }).verificationRate;
    }
    return out;
  }, EMPTY_OBJECT);

  const memberId = useClientStore<string>(
    () => courseRepo.list().map((c) => progressRepo.getContext(c.id)?.memberId).find(Boolean) ?? 'local',
    'local'
  );
  const chosen = useClientStore<{ pathId: string; chosenAt: number } | null>(
    () => pathRepo.get(memberId),
    null
  );
  const pathEntryIds = useMemo(
    () => new Set(chosen ? pathById(chosen.pathId)?.entryIds ?? [] : []),
    [chosen]
  );

  const groups = useMemo(
    () =>
      catalogByVendor({
        vendorId: vendor === 'all' ? undefined : vendor,
        level: level === 'all' ? undefined : level,
      }),
    [vendor, level]
  );
  const summary = catalogSummary();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="inline-flex rounded-2xl bg-accent-soft p-3 text-accent">
          <Compass className="h-7 w-7" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-ink">Explore certs</h1>
        <p className="max-w-2xl text-muted">
          Every vendor is a region of the quarry, and every credential is a stone to cut. Lit
          stones are live capstones you can start now; the rough rock is on the map and coming.
        </p>
        <p className="font-mono text-xs text-muted">
          {summary.available} live · {summary.total} on the map · {summary.vendors} regions
        </p>
      </header>

      {/* Filters. Sticky, because the grid is long enough that re-filtering
          otherwise means scrolling back to the top every time. */}
      <div className="sticky top-0 z-10 -mx-4 space-y-2 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur">
        <FilterRow
          label="Region"
          options={[{ id: 'all', name: 'All' }, ...VENDORS.map((v) => ({ id: v.id, name: v.name }))]}
          active={vendor}
          onSelect={setVendor}
        />
        <FilterRow
          label="Level"
          options={[{ id: 'all', name: 'All' }, ...LEVELS.map((l) => ({ id: l.id, name: l.name }))]}
          active={level}
          onSelect={(id) => setLevel(id as LevelFilter)}
        />
      </div>

      {groups.length === 0 ? (
        <p className="rounded-[var(--radius-card)] border border-dashed border-line bg-panel-2/40 p-8 text-center text-muted">
          Nothing on the map for that filter yet.
        </p>
      ) : (
        <div className="space-y-10">
          {groups.map((group) => (
            <section
              key={group.vendor.id}
              data-region={group.vendor.region}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
                <div>
                  <h2 className="text-xl font-bold text-ink">{group.vendor.name}</h2>
                  <p className="text-sm text-muted">{group.vendor.blurb}</p>
                </div>
                <span className="font-mono text-xs text-muted">
                  {group.availableCount} of {group.totalCount} live
                </span>
              </div>

              {group.cells.map((cell) => (
                <div key={cell.level.id} className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="eyebrow">{cell.level.name}</span>
                    <span className="text-xs text-muted">{cell.level.blurb}</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {cell.entries.map((entry, i) => (
                      <CatalogCard
                        key={entry.id}
                        entry={entry}
                        index={i}
                        onPath={pathEntryIds.has(entry.id)}
                        enrolled={!!entry.courseId && enrolled[entry.courseId] !== undefined}
                        verificationRate={entry.courseId ? enrolled[entry.courseId] : undefined}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterRow({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: { id: string; name: string }[];
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-14 shrink-0 font-mono text-xs uppercase tracking-wide text-muted">
        {label}
      </span>
      {options.map((o) => {
        const selected = active === o.id;
        return (
          <motion.button
            key={o.id}
            whileTap={{ scale: 0.96 }}
            onClick={() => onSelect(o.id)}
            aria-pressed={selected}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              selected
                ? 'bg-accent text-accent-contrast'
                : 'bg-panel-2 text-muted hover:text-ink'
            }`}
          >
            {o.name}
          </motion.button>
        );
      })}
    </div>
  );
}
