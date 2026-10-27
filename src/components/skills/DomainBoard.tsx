'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Surface } from '@/components/ui/Surface';
import { Chip } from '@/components/ui/Chip';
import { LevelPill } from './LevelPill';
import { localDay } from '@/lib/localDate';
import type { DomainSection } from '@/lib/skillDomainsView';
import type { SkillsContent } from '@/lib/content/read';

/**
 * R133 — the eight domains of "Skills by course", props only. Each section
 * prints its question, its KPIs and its score, then the rows with evidence
 * behind them: level, how often, how consistently, what the role expects,
 * and the evidence counted. A domain with no evidenced row says so and
 * prints how many rows are still gaps; nothing is hidden for being small.
 */
export function DomainBoard({ sections, content }: { sections: DomainSection[]; content: Pick<SkillsContent, 'COPY' | 'LEVEL_LABEL' | 'DIMENSION_LABEL'> }) {
  const { COPY, LEVEL_LABEL, DIMENSION_LABEL } = content;
  const words = COPY.domainBoard;
  const [open, setOpen] = useState<string | null>(sections[0]?.def.id ?? null);
  return (
    <section aria-labelledby="domain-board-title" data-domain-board className="space-y-3">
      <div>
        <h2 id="domain-board-title" className="text-xl font-semibold tracking-tight text-ink">{COPY.skillDomainsHeading}</h2>
        <p className="text-sm text-muted">{COPY.skillDomainsLede}</p>
      </div>
      <Surface variant="flat" padding="none" className="overflow-hidden">
        <ul className="divide-y divide-line">
          {sections.map((s) => {
            const isOpen = open === s.def.id;
            return (
              <li key={s.def.id} data-domain-section={s.def.id} data-rows={s.rows.length} data-gaps={s.gaps} className="bg-panel">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : s.def.id)}
                  aria-expanded={isOpen}
                  aria-controls={`domain-${s.def.id}`}
                  className="focusable flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left hover:bg-panel-2 sm:px-5"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold text-ink">{s.def.label}</span>
                    <span className="block text-sm text-muted">{s.def.definition}</span>
                  </span>
                  <span className="flex items-center gap-2 text-sm tabular-nums text-muted">
                    <span data-domain-count>{s.rows.length}</span>
                    {s.gaps > 0 && <span className="text-2xs">· {s.gaps} {words.gaps}</span>}
                    {s.score && (
                      <Chip tone={s.score.loaded ? 'accent' : 'muted'} data-domain-score={s.score.id}>
                        {s.score.loaded ? `${s.score.value} / 100` : '—'}
                      </Chip>
                    )}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden />
                  </span>
                </button>
                {isOpen && (
                  <div id={`domain-${s.def.id}`} className="space-y-3 border-t border-line bg-panel-2 px-4 py-3 sm:px-5">
                    <p className="text-sm text-body">
                      <span className="font-mono text-3xs uppercase tracking-wider text-muted">{words.asks}</span> {s.def.asks}
                    </p>
                    <ul className="flex flex-wrap gap-1.5" data-domain-kpis>
                      {s.kpis.map((k) => (
                        <li key={k.id}>
                          <Chip tone={k.loaded && k.of > 0 && k.pct === 100 ? 'ok' : k.loaded ? 'neutral' : 'muted'} title={k.id}>
                            {k.id.split('.').pop()?.replace(/-/g, ' ')}: {!k.loaded ? COPY.board.notLoaded : k.unit === 'minutes' ? (k.of > 0 ? `${k.value} min` : '—') : k.unit === 'count' ? `${k.value}` : `${k.value} of ${k.of}`}
                          </Chip>
                        </li>
                      ))}
                    </ul>
                    {s.rows.length === 0 ? (
                      <p className="text-sm text-muted" data-domain-empty>
                        {COPY.domainEmpty}
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="text-left font-mono text-3xs uppercase tracking-wider text-muted">
                          <tr>
                            <th className="py-1 pr-3 font-medium">{DIMENSION_LABEL.skills}</th>
                            <th className="py-1 pr-3 font-medium">{words.frequency}</th>
                            <th className="py-1 pr-3 font-medium">{words.consistency}</th>
                            <th className="py-1 pr-3 font-medium">{words.expectation}</th>
                            <th className="py-1 font-medium">{words.evidence}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                          {s.rows.map((r) => (
                            <tr key={`${r.row.dimension}:${r.row.id}`} data-domain-row={r.row.id} data-dimension={r.row.dimension} className="align-top">
                              <td className="py-1.5 pr-3">
                                <span className="font-medium text-ink">{r.row.label}</span>{' '}
                                <span className="text-2xs text-muted">{DIMENSION_LABEL[r.row.dimension].toLowerCase()}</span>
                                <div className="mt-0.5">
                                  <LevelPill level={r.row.level} label={LEVEL_LABEL[r.row.dimension][r.row.level]} />
                                </div>
                              </td>
                              <td className="py-1.5 pr-3 tabular-nums text-body" data-frequency>
                                {r.frequency}{r.frequencyOf > 0 ? ` of ${r.frequencyOf}` : ''} <span className="text-2xs text-muted">{r.row.uses !== undefined ? words.uses : words.steps}</span>
                              </td>
                              <td className="py-1.5 pr-3 text-body">
                                <span className="block text-xs">{r.repeated ? words.repeated : words.once}{r.inOrder ? ` · ${words.inOrder}` : ''}</span>
                                {r.row.lastVerifiedAt && (
                                  <span className="block text-2xs text-muted" data-last-verified={r.row.current === true ? 'current' : r.row.current === false ? 'stale' : ''}>
                                    {COPY.board.lastVerified} {localDay(r.row.lastVerifiedAt)}{r.row.current === true ? ` · ${COPY.board.current}` : r.row.current === false ? ` · ${COPY.board.stale}` : ''}
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 pr-3 text-xs text-body" data-required={r.required || undefined}>
                                {r.row.dimension === 'skills' ? (r.required ? words.requiredBy : words.notRequired) : '—'}
                              </td>
                              <td className="py-1.5 text-xs tabular-nums text-muted">
                                {[r.evidence.steps ? `${r.evidence.steps} ${words.steps}` : '', r.evidence.forms ? `${r.evidence.forms} ${words.forms}` : '', r.evidence.artifacts ? `${r.evidence.artifacts} ${words.files}` : ''].filter(Boolean).join(' · ') || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <p className="text-2xs text-muted">{s.def.evidence}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Surface>
    </section>
  );
}
