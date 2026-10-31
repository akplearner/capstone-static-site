'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCourseDocument } from '@/lib/useCourse';
import { networkOf } from '@/lib/content/read';
import { attackSentence, attackSteps, findComponent, phaseLine, type ComponentKind, type Phase } from '@/lib/docs/labNetwork';
import { LabNetworkDiagram } from './LabNetworkDiagram';

/**
 * R152/R153 — the Network view body: the Before|After toggle, the picture, the numbered attack
 * step-through, and the two details regions (R153). The step-through's attack details are always shown
 * for the current step; clicking a host, port or control fills the component details region (aria-live,
 * so a click is announced). A week with no attacks shows the phase line. Prose comes from the data
 * module (`attackSentence`, the authored descriptions), never typed here (R75-B).
 */
export function LabNetworkPanel({ week, built, compact = false }: { week: number; built?: Record<string, number>; compact?: boolean }) {
  const net = networkOf(useCourseDocument());
  const [phase, setPhase] = useState<Phase>('before');
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<{ kind: ComponentKind; id: string } | null>(null);
  if (!net.hosts.length) return null;

  const steps = attackSteps(net, week);
  const clamped = Math.min(Math.max(step, 1), Math.max(steps.length, 1));
  const current = steps.find((a) => a.n === clamped) ?? steps[0];
  const detail = selected ? findComponent(net, selected.kind, selected.id) : null;

  return (
    <div className="space-y-3" data-net-panel={week}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-[var(--radius-control)] depth-edge" role="group" aria-label="System state">
          {(['before', 'after'] as const).map((p) => (
            <button key={p} type="button" data-net-phase-pick={p} aria-pressed={phase === p} onClick={() => setPhase(p)} className={`px-3 py-1 text-sm font-medium capitalize transition-colors ${phase === p ? 'bg-accent-soft text-accent-ink' : 'bg-panel text-muted hover:text-ink'}`}>
              {p}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted" data-net-phaseline>{phaseLine(net, week, phase)}</span>
      </div>

      <LabNetworkDiagram week={week} phase={phase} step={clamped} built={built} compact={compact} selected={selected} onSelect={(kind, id) => setSelected((cur) => (cur?.kind === kind && cur?.id === id ? null : { kind, id }))} />

      {/* Component details (click-to-reveal), announced live. */}
      <div className="rounded-lg depth-edge bg-panel-2 p-3 text-sm" role="status" aria-live="polite" data-net-component-detail>
        {detail ? (
          <>
            <span className="font-semibold text-ink">{detail.label}</span>
            {detail.sub && <span className="ml-2 text-2xs text-muted">{detail.sub}</span>}
            <p className="mt-0.5 text-body">{detail.description}</p>
          </>
        ) : (
          <span className="text-muted">Select a host, port or control for a description.</span>
        )}
      </div>

      {steps.length > 0 ? (
        <div className="space-y-1.5" data-net-stepper>
          <div className="flex items-center gap-2" role="group" aria-label="Attack steps">
            <button type="button" aria-label="Previous step" disabled={clamped <= 1} onClick={() => setStep(clamped - 1)} className="rounded-md p-1 text-muted hover:bg-panel-2 hover:text-ink disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs tabular-nums text-muted">{clamped} / {steps.length}</span>
            <button type="button" aria-label="Next step" disabled={clamped >= steps.length} onClick={() => setStep(clamped + 1)} className="rounded-md p-1 text-muted hover:bg-panel-2 hover:text-ink disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {current && (
            <div data-net-attack-detail>
              <p className="text-sm font-medium text-ink" data-net-step-sentence>{attackSentence(current, net.hosts)}</p>
              <p className="mt-0.5 text-sm text-body" data-net-attack-description>{current.description}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted" data-net-no-attacks>No attacks this week — the {phase} state is shown.</p>
      )}
    </div>
  );
}
