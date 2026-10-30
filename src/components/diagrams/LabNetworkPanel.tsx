'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCourseDocument } from '@/lib/useCourse';
import { networkOf } from '@/lib/content/read';
import { attackSentence, attackSteps, phaseLine, type Phase } from '@/lib/docs/labNetwork';
import { LabNetworkDiagram } from './LabNetworkDiagram';

/**
 * R152 — the Network view body: the Before|After toggle, the picture, and the numbered attack
 * step-through. Owns `phase` and `step` so the diagram stays pure. A week with no attacks shows the
 * phase line instead of a stepper. The step sentence comes from `attackSentence` in the data module,
 * never typed here (R75-B keeps prose out of the component).
 */
export function LabNetworkPanel({ week, built }: { week: number; built?: Record<string, number> }) {
  const net = networkOf(useCourseDocument());
  const [phase, setPhase] = useState<Phase>('before');
  const [step, setStep] = useState(1);
  if (!net.hosts.length) return null;

  const steps = attackSteps(net, week);
  const clamped = Math.min(Math.max(step, 1), Math.max(steps.length, 1));
  const current = steps.find((a) => a.n === clamped) ?? steps[0];

  return (
    <div className="space-y-3" data-net-panel={week}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-[var(--radius-control)] depth-edge" role="group" aria-label="System state">
          {(['before', 'after'] as const).map((p) => (
            <button
              key={p}
              type="button"
              data-net-phase-pick={p}
              aria-pressed={phase === p}
              onClick={() => setPhase(p)}
              className={`px-3 py-1 text-sm font-medium capitalize transition-colors ${phase === p ? 'bg-accent-soft text-accent-ink' : 'bg-panel text-muted hover:text-ink'}`}
            >
              {p}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted" data-net-phaseline>{phaseLine(net, week, phase)}</span>
      </div>

      <LabNetworkDiagram week={week} phase={phase} step={clamped} built={built} />

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
          {current && <p className="text-sm text-body" data-net-step-sentence>{attackSentence(current, net.hosts)}</p>}
        </div>
      ) : (
        <p className="text-sm text-muted" data-net-no-attacks>No attacks this week — the {phase} state is shown.</p>
      )}
    </div>
  );
}
