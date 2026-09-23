'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Step } from '@/lib/types';
import { TextField, TextArea, listToText, textToList } from './fields';

export function StepsEditor({
  taskId,
  steps,
  onChange,
}: {
  taskId: string;
  steps: Step[];
  onChange: (steps: Step[]) => void;
}) {
  const update = (i: number, patch: Partial<Step>) =>
    onChange(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const add = () =>
    onChange([
      ...steps,
      {
        id: `${taskId}-s${steps.length + 1}`,
        title: 'New step',
        description: '',
        whatItMeans: '',
        frameworks: [],
      },
    ]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted">Steps ({steps.length})</span>
        <Button size="sm" variant="secondary" onClick={add} className="flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Add step</Button>
      </div>
      {steps.map((s, i) => (
        <div key={i} className="space-y-2 rounded-md depth-edge bg-panel-2 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Step {i + 1}</span>
            <button type="button" aria-label={`Remove step ${i + 1}`} onClick={() => onChange(steps.filter((_, idx) => idx !== i))} className="text-muted hover:text-danger">
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <TextField label="ID" value={s.id} onChange={(v) => update(i, { id: v })} mono />
            <TextField label="Title" value={s.title} onChange={(v) => update(i, { title: v })} />
          </div>
          <TextArea label="Instruction (what to do)" value={s.instruction || ''} onChange={(v) => update(i, { instruction: v })} />
          <TextField label="Command" value={s.command || ''} onChange={(v) => update(i, { command: v })} mono />
          <TextArea label="Command explanation (what the options do)" value={s.commandExplanation || ''} onChange={(v) => update(i, { commandExplanation: v || undefined })} />
          <FlagsEditor flags={s.commandFlags || []} onChange={(f) => update(i, { commandFlags: f.length ? f : undefined })} />
          <TextField label="Expected output" value={s.expectedOutput || ''} onChange={(v) => update(i, { expectedOutput: v })} />
          <TextArea label="Output explanation (how to read it)" value={s.outputExplanation || ''} onChange={(v) => update(i, { outputExplanation: v || undefined })} />
          <TextArea label="What it means" value={s.whatItMeans} onChange={(v) => update(i, { whatItMeans: v })} />
          <div className="grid gap-2 sm:grid-cols-2">
            <TextField label="Frameworks (comma-separated)" value={listToText(s.frameworks)} onChange={(v) => update(i, { frameworks: textToList(v) })} />
            <TextField label="Produces deliverable" value={s.producesDeliverable || ''} onChange={(v) => update(i, { producesDeliverable: v || undefined })} mono />
          </div>
          <label className="flex items-center gap-2 text-sm text-body">
            <input type="checkbox" checked={!!s.isEvidenceStep} onChange={(e) => update(i, { isEvidenceStep: e.target.checked })} className="h-4 w-4 accent-accent" />
            Evidence step
          </label>
        </div>
      ))}
    </div>
  );
}

function FlagsEditor({
  flags,
  onChange,
}: {
  flags: { flag: string; meaning: string }[];
  onChange: (flags: { flag: string; meaning: string }[]) => void;
}) {
  const set = (i: number, patch: Partial<{ flag: string; meaning: string }>) =>
    onChange(flags.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  return (
    <div className="space-y-2 rounded-md border border-dashed border-line p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted">
          Flag breakdown ({flags.length})
        </span>
        <Button size="sm" variant="secondary" onClick={() => onChange([...flags, { flag: '', meaning: '' }])} className="flex items-center gap-1">
          <Plus className="h-3 w-3" /> Add flag
        </Button>
      </div>
      {flags.map((f, i) => (
        <div key={i} className="flex items-start gap-2">
          <input
            value={f.flag}
            onChange={(e) => set(i, { flag: e.target.value })}
            placeholder="-sV"
            className="w-28 shrink-0 rounded bg-panel px-2 py-1 font-mono text-xs text-ink"
          />
          <input
            value={f.meaning}
            onChange={(e) => set(i, { meaning: e.target.value })}
            placeholder="what this flag does"
            className="flex-1 rounded bg-panel px-2 py-1 text-sm text-ink"
          />
          <button type="button" aria-label={`Remove flag ${i + 1}`} onClick={() => onChange(flags.filter((_, idx) => idx !== i))} className="mt-1 text-muted hover:text-danger">
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
