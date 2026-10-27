'use client';

import { ChevronDown } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { Chip } from '@/components/ui/Chip';
import { localDay } from '@/lib/localDate';
import type { RecordCategoryCard } from '@/lib/recordCard';
import type { RecordCategoryDef, RecordCategory } from '@/lib/docs/recordCategories';
import type { SkillsCopy } from '@/lib/docs/skillsCopy';

/**
 * R133 — "Your record" as fourteen category subcards, props only. Each card
 * prints the same seven figures and its tier: PROFESSIONAL at the threshold
 * of verified uses, BUILDING below it with the count as `n/10`. A card is a
 * button that opens the list of what counted under the grid, as the twelve
 * progress figures do. The six-month trend is a plain SVG, one bar per month.
 */

/** Six bars, oldest first; the tallest fills the height. Decorative: the figures beside it carry the numbers. */
export function Sparkline({ values, label }: { values: number[]; label: string }) {
  const max = Math.max(1, ...values);
  const w = 6;
  const gap = 2;
  const h = 18;
  return (
    <svg width={values.length * (w + gap)} height={h} viewBox={`0 0 ${values.length * (w + gap)} ${h}`} role="img" aria-label={`${label}: ${values.join(', ')}`} className="shrink-0" data-sparkline>
      {values.map((v, i) => {
        const bh = Math.max(1, Math.round((h * v) / max));
        return <rect key={i} x={i * (w + gap)} y={h - bh} width={w} height={bh} rx={1} className={v > 0 ? 'fill-accent' : 'fill-line'} />;
      })}
    </svg>
  );
}

export function RecordCategories({ cards, defs, copy, open, onToggle, panelId }: { cards: RecordCategoryCard[]; defs: RecordCategoryDef[]; copy: SkillsCopy; open: RecordCategory | null; onToggle: (id: RecordCategory) => void; panelId: string }) {
  const labelOf = new Map(defs.map((d) => [d.id, d]));
  const f = copy.categoryFigures;
  return (
    <Surface variant="flat" padding="none" className="overflow-hidden">
      <ul className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-record-categories>
        {cards.map((c) => {
          const def = labelOf.get(c.id);
          const isOpen = open === c.id;
          const professional = c.tier === 'professional';
          return (
            <li key={c.id} className="bg-panel">
              <button
                type="button"
                onClick={() => onToggle(c.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                data-record-category={c.id}
                data-tier={c.tier}
                data-record-open={isOpen || undefined}
                title={copy.categoryOpen}
                className={`focusable flex h-full w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-panel-2 ${isOpen ? 'bg-panel-2' : ''}`}
              >
                <span className="flex w-full items-center gap-2">
                  <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{def?.label ?? c.id}</span>
                  <Chip tone={professional ? 'ok' : 'info'} data-tier-pill>
                    {professional ? copy.board.tierProfessional : `${copy.board.tierBuilding} ${c.verifiedUses}/${c.threshold}`}
                  </Chip>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                </span>
                <span className="flex items-end justify-between gap-2">
                  <span>
                    <span className="block text-2xl font-semibold tabular-nums text-ink" data-verified-uses>{c.verifiedUses}</span>
                    <span className="text-xs text-muted">{f.verifiedUses} · {c.utilization} {f.utilization.toLowerCase()}</span>
                  </span>
                  <Sparkline values={c.trend} label={f.trend} />
                </span>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-2xs text-muted">
                  <dt>{f.successRate}</dt>
                  <dd className="tabular-nums text-body" data-success-rate>{c.successRate.of > 0 ? `${Math.round((100 * c.successRate.value) / c.successRate.of)}%` : '—'}</dd>
                  <dt>{f.lastActivity}</dt>
                  <dd className="tabular-nums text-body">{c.lastActivityAt ? localDay(c.lastActivityAt) : '—'}</dd>
                  <dt>{f.evidence}</dt>
                  <dd className="tabular-nums text-body" data-evidence-count>{c.evidenceCount}</dd>
                  <dt>{f.relevance}</dt>
                  <dd className="tabular-nums text-body" data-relevance>{c.relevance}%</dd>
                  <dt>{f.courses}</dt>
                  <dd className="truncate text-body" title={c.courses.join(' · ')}>{c.courses.length ? c.courses.length : '—'}{c.projects.length ? ` · ${c.projects.length} ${f.projects.toLowerCase()}` : ''}</dd>
                </dl>
              </button>
            </li>
          );
        })}
      </ul>
    </Surface>
  );
}
