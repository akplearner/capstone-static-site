'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronDown, X, type LucideIcon } from 'lucide-react';
import { Chip, type ChipTone } from '@/components/ui/Chip';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Surface } from '@/components/ui/Surface';
import { Button } from '@/components/ui/Button';
import { localDay } from '@/lib/localDate';
import { DETAIL_COPY, type DetailItem, type DetailSection, type MetricDetail, type RecordMetric } from '@/lib/recordDetail';

/**
 * R126 — "Your record" as a strip of figures that open. Each figure is a button: it opens a panel under
 * the strip listing what the figure counted, as the steps (actions), commands, tools and procedures behind
 * it, each with the task it came from and a link to it. Props only: the page counts the figures and builds
 * the lists (`lib/recordDetail.ts`), this draws them.
 */
export interface RecordTile {
  id: RecordMetric;
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  /** Present when the figure is a ratio with a known denominator: drawn as a ring with the value inside. */
  ring?: { value: number; max: number };
}

/** The words of the strip and its panel, in one place. Impersonal, plain. */
export const RECORD_UI = {
  open: 'Show what counted',
  closeLabel: 'Close the list',
  counted: 'What counted',
  showAll: (n: number) => `Show all ${n}`,
  showFewer: 'Show fewer',
  openTask: 'Open the task',
  mark: {
    verified: 'Verified',
    ticked: 'Done',
    done: 'Done',
    receipted: 'Receipted',
    kept: 'Kept from an earlier run',
    practised: 'Practised',
    reviewed: 'Reviewed',
    filed: 'Filed',
    open: 'Not filed',
    sealed: 'Sealed',
    named: 'Named to convention',
    'name off convention': 'Name off convention',
    'followed to standard': 'Followed to standard',
    'not yet to standard': 'Not yet to standard',
  } as Record<string, string>,
} as const;

const MARK_TONE: Record<string, ChipTone> = { verified: 'ok', reviewed: 'ok', filed: 'ok', sealed: 'ok', receipted: 'ok', 'followed to standard': 'ok', kept: 'accent', 'name off convention': 'warn', open: 'muted', 'not yet to standard': 'muted' };

/** How many entries a list shows before "Show all". */
export const SHOWN = 6;

export function RecordStrip({ tiles, open, onToggle, panelId }: { tiles: RecordTile[]; open: RecordMetric | null; onToggle: (id: RecordMetric) => void; panelId: string }) {
  return (
    <Surface variant="flat" padding="none" className="overflow-hidden">
      <ul className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-4" data-record-strip>
        {tiles.map((t) => {
          const isOpen = open === t.id;
          const Icon = t.icon;
          return (
            <li key={t.id} className="bg-panel">
              <button
                type="button"
                onClick={() => onToggle(t.id)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                data-record-tile={t.id}
                data-record-open={isOpen || undefined}
                title={RECORD_UI.open}
                className={`focusable flex h-full w-full flex-col items-start px-4 py-3 text-left transition-colors hover:bg-panel-2 sm:px-5 ${isOpen ? 'bg-panel-2' : ''}`}
              >
                <span className="flex w-full items-center gap-2 text-sm text-muted">
                  <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <span className="min-w-0 flex-1">{t.label}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                </span>
                {t.ring ? (
                  <span className="mt-2 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <ProgressRing value={t.ring.value} max={t.ring.max} label={t.label} />
                    <span className="text-sm text-muted">{t.sub}</span>
                  </span>
                ) : (
                  <span className="mt-1 block">
                    <span className="block text-2xl font-semibold tabular-nums text-ink">{t.value}</span>
                    <span className="text-sm text-muted">{t.sub}</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Surface>
  );
}

function ItemRow({ item }: { item: DetailItem }) {
  return (
    <li className="flex flex-col gap-0.5 py-2 text-sm" data-detail-item={item.key}>
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="min-w-0 font-medium text-ink">{item.label}</span>
        {(item.marks ?? []).map((m) => (
          <Chip key={m} tone={MARK_TONE[m] ?? 'neutral'}>
            {RECORD_UI.mark[m] ?? m}
          </Chip>
        ))}
        {item.at ? <span className="text-2xs text-muted">{localDay(item.at)}</span> : null}
      </span>
      {item.sub && <span className="text-xs text-muted">{item.sub}</span>}
      {item.code && <code className="block max-w-full whitespace-pre-wrap break-all rounded-md bg-panel-2 px-2 py-1 font-mono text-xs text-ink">{item.code}</code>}
      {item.href && (
        <Link href={item.href} aria-label={`${RECORD_UI.openTask}: ${item.label}`} className="w-fit text-xs font-medium text-accent hover:underline">
          {RECORD_UI.openTask}
        </Link>
      )}
    </li>
  );
}

function SectionList({ section, expanded, onExpand }: { section: DetailSection; expanded: boolean; onExpand: () => void }) {
  const shown = expanded ? section.items : section.items.slice(0, SHOWN);
  return (
    <section data-detail-section={section.id} aria-label={section.title}>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
        {section.title} <span className="tabular-nums">· {section.items.length}</span>
      </h4>
      <ul className="divide-y divide-line">
        {shown.map((item) => (
          <ItemRow key={item.key} item={item} />
        ))}
      </ul>
      {section.items.length > SHOWN && (
        <Button variant="ghost" size="sm" onClick={onExpand} data-detail-more={section.id} className="mt-1">
          {expanded ? RECORD_UI.showFewer : RECORD_UI.showAll(section.items.length)}
        </Button>
      )}
    </section>
  );
}

/**
 * The panel under the strip. It scrolls itself into view when it opens: on a phone the strip is several
 * rows tall, and a list that opens below the last of them would look like a tap that did nothing. The
 * scroll margin keeps its title clear of the sticky header: a list taller than the screen is aligned to the
 * top edge, which is where the header sits.
 */
export function RecordDetailPanel({ id, title, detail, expanded, onExpand, onClose }: { id: string; title: string; detail: MetricDetail; expanded: ReadonlySet<string>; onExpand: (section: string) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [detail.metric]);
  return (
    <div ref={ref} className="scroll-mt-20">
      <Surface as="section" variant="inset" id={id} aria-labelledby={`${id}-title`} data-record-detail={detail.metric} className="space-y-4">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 id={`${id}-title`} className="text-base font-semibold text-ink">
              {title}: {RECORD_UI.counted.toLowerCase()}
            </h3>
            <p className="mt-0.5 text-sm text-muted">{detail.rule}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={RECORD_UI.closeLabel} data-record-close className="focusable rounded-[var(--radius-sm)] p-1 text-muted transition-colors hover:bg-panel-2 hover:text-ink">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>
        {detail.sections.length === 0 ? (
          <p className="text-sm text-muted" data-record-empty>
            {DETAIL_COPY.empty}
          </p>
        ) : (
          <div className="space-y-5">
            {detail.sections.map((s) => (
              <SectionList key={s.id} section={s} expanded={expanded.has(s.id)} onExpand={() => onExpand(s.id)} />
            ))}
          </div>
        )}
      </Surface>
    </div>
  );
}
