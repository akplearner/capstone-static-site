'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Surface } from '@/components/ui/Surface';
import { ArchDiagram } from '@/components/diagrams/ArchDiagram';
import { AREA_LABEL, RECORD_AREAS } from '@/lib/docs/projectRecord';
import type { TeamRecordView } from '@/lib/teamRecord';
import { localDay } from '@/lib/localDate';

/**
 * R141 — the instructor's record console for one team, props only: the record
 * by area, the decisions with who and when, the history as a timeline, the
 * conflicts, the answers per member and checkpoint, the picture with its
 * validation overlay, and per member the competency facets and the skill
 * validation. Nothing here orders one member against another.
 */
export function ProjectRecordPanel({ view, teamLabel, onDownload }: { view: TeamRecordView; teamLabel: string; onDownload: (kind: 'architecture' | 'infrastructure') => void }) {
  const [member, setMember] = useState<string | null>(null);
  const shown = view.members.find((m) => m.memberId === member) ?? view.members[0];
  const when = (ms: number | null | undefined) => (ms ? localDay(ms) : '—');
  return (
    <div className="space-y-4" data-project-record>
      <Surface padding="sm" className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-ink">{teamLabel} · the project record</h2>
          <p className="text-xs text-muted">
            {view.record.entries.length} facts · version {view.architecture.version} · {view.conflicts.length} conflicts · {view.architecture.historicalChanges.length} replaced versions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" className="flex items-center gap-1" data-download="architecture" onClick={() => onDownload('architecture')}>
            <Download className="h-3.5 w-3.5" aria-hidden /> Architecture JSON
          </Button>
          <Button size="sm" variant="secondary" className="flex items-center gap-1" data-download="infrastructure" onClick={() => onDownload('infrastructure')}>
            <Download className="h-3.5 w-3.5" aria-hidden /> Infrastructure JSON
          </Button>
        </div>
      </Surface>

      <ArchDiagram validation={view.overlay} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface padding="sm" data-record-areas>
          <h3 className="text-sm font-semibold text-ink">What the team recorded</h3>
          {RECORD_AREAS.map((area) => (
            <div key={area} className="mt-2" data-record-area={area}>
              <p className="text-2xs font-semibold uppercase tracking-wide text-muted">{AREA_LABEL[area]} · {view.record.byArea[area].length}</p>
              {view.record.byArea[area].length === 0 ? (
                <p className="text-xs text-muted">Nothing recorded yet.</p>
              ) : (
                <ul className="mt-1 max-h-64 space-y-0.5 overflow-y-auto text-xs">
                  {view.record.byArea[area].map((e) => (
                    <li key={e.key} className="flex flex-wrap items-baseline gap-x-2" data-record-entry={e.key}>
                      <span className="text-muted">{e.label}{e.host && e.kind !== 'host' ? ` · ${e.host}` : ''}</span>
                      <span className="font-mono text-ink">{e.value}</span>
                      {area === 'decisions' && (
                        <span className="text-3xs text-muted">by {e.enteredBy ?? 'unknown'} · {when(e.enteredAt)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Surface>

        <div className="space-y-4">
          <Surface padding="sm" data-record-conflicts>
            <h3 className="text-sm font-semibold text-ink">Conflicts the record finds</h3>
            {view.conflicts.length === 0 ? (
              <p className="mt-1 text-xs text-muted">Nothing contradicts.</p>
            ) : (
              <ul className="mt-1 space-y-1 text-xs">
                {view.conflicts.map((c) => (
                  <li key={c.id} data-conflict={c.rule} className={c.severity === 'error' ? 'text-ink' : 'text-body'}>
                    <span className="mr-1 rounded-full bg-panel-2 px-1.5 py-0.5 font-mono text-3xs text-muted">{c.severity}</span>
                    {c.message}
                  </li>
                ))}
              </ul>
            )}
          </Surface>

          <Surface padding="sm" data-record-history>
            <h3 className="text-sm font-semibold text-ink">History of versions</h3>
            {view.architecture.historicalChanges.length === 0 ? (
              <p className="mt-1 text-xs text-muted">No replaced version yet (the cloud keeps one per sitting since migration 0025).</p>
            ) : (
              <ol className="mt-1 max-h-56 space-y-0.5 overflow-y-auto text-xs">
                {view.architecture.historicalChanges.map((h, i) => (
                  <li key={`${h.deliverableId}-${h.replacedAt}-${i}`} data-history-row className="flex flex-wrap gap-x-2">
                    <span className="font-mono text-muted">{when(h.replacedAt)}</span>
                    <span className="text-ink">{h.deliverableId}</span>
                    <span className="text-muted">replaced by {h.replacedBy ?? 'unknown'} (had been {h.updatedBy ?? 'unknown'}’s, {when(h.updatedAt)})</span>
                  </li>
                ))}
              </ol>
            )}
          </Surface>

          <Surface padding="sm" data-record-checkpoints>
            <h3 className="text-sm font-semibold text-ink">Validation checkpoints</h3>
            <ul className="mt-1 text-xs">
              {view.architecture.validationCheckpoints.map((c) => (
                <li key={c.week} data-checkpoint={c.week} className="flex gap-2">
                  <span className="font-mono text-muted">week {c.week}</span>
                  <span className="text-ink">{c.kind}</span>
                  <span className="text-muted">{c.offered} offered · {c.answered} answered · {c.correct} correct</span>
                </li>
              ))}
            </ul>
          </Surface>
        </div>
      </div>

      <Surface padding="sm" data-record-members>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold text-ink">Per member</h3>
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Members">
            {view.members.map((m) => (
              <button key={m.memberId} type="button" role="tab" aria-selected={shown?.memberId === m.memberId} onClick={() => setMember(m.memberId)} className={`focusable rounded-md px-2 py-1 text-xs ${shown?.memberId === m.memberId ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:bg-panel-2'}`} data-member-tab={m.memberId}>
                {m.displayName || m.memberId} · {m.role}
              </button>
            ))}
          </div>
        </div>
        {!shown ? (
          <p className="mt-2 text-xs text-muted">Nobody on this team yet.</p>
        ) : (
          <div className="mt-3 grid gap-4 lg:grid-cols-3" data-member-documents={shown.memberId}>
            <div>
              <h4 className="text-xs font-semibold text-ink">Competency facets <span className="font-mono text-3xs text-muted">capstone-competency/1</span></h4>
              <ul className="mt-1 space-y-0.5 text-xs">
                {shown.competency.facets.map((f) => (
                  <li key={f.id} data-facet={f.id} className="flex justify-between gap-2">
                    <span className="text-body">{f.label}</span>
                    <span className="font-mono text-ink">{f.loaded ? `${f.value}% (${f.counted}/${f.of})` : '—'}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-ink">Skill validation <span className="font-mono text-3xs text-muted">capstone-skill-validation/1</span></h4>
              <ul className="mt-1 max-h-56 space-y-0.5 overflow-y-auto text-xs">
                {shown.skillValidation.skills.filter((s) => s.firstDemonstratedAt || s.validationCount > 0).map((s) => (
                  <li key={s.skillId} data-skill-validation={s.skillId} className="flex flex-wrap justify-between gap-x-2">
                    <span className="text-body">{s.label}</span>
                    <span className="font-mono text-muted">
                      first {when(s.firstDemonstratedAt)} · validated {when(s.lastValidatedAt)} · {s.correctCount}/{s.validationCount}{s.retained ? ' · retained' : ''}
                    </span>
                  </li>
                ))}
                {shown.skillValidation.skills.every((s) => !s.firstDemonstratedAt && s.validationCount === 0) && <li className="text-muted">Nothing demonstrated or validated yet.</li>}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-ink">Answers</h4>
              <ul className="mt-1 max-h-56 space-y-0.5 overflow-y-auto text-xs">
                {shown.answers.length === 0 && <li className="text-muted">No answers yet.</li>}
                {[...shown.answers].sort((a, b) => b.at - a.at).map((a, i) => (
                  <li key={`${a.activityId}-${a.at}-${i}`} data-answer={a.kind} className="flex flex-wrap gap-x-2">
                    <span className="font-mono text-muted">{when(a.at)} · wk {a.checkpoint}</span>
                    <span className="text-body">{a.kind}</span>
                    <span className={a.correct === true ? 'text-ok' : a.correct === false ? 'text-warn' : 'text-muted'}>{a.correct === null ? 'for marking' : a.correct ? 'correct' : 'wrong'}</span>
                    <span className="truncate text-muted">{a.recordKey}</span>
                    {a.explanation && <p className="w-full whitespace-pre-wrap text-body">{a.explanation}</p>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Surface>
    </div>
  );
}
