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
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Steps ({steps.length})</span>
        <Button size="sm" variant="secondary" onClick={add} className="flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Add step</Button>
      </div>
      {steps.map((s, i) => (
        <div key={i} className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Step {i + 1}</span>
            <button onClick={() => onChange(steps.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <TextField label="ID" value={s.id} onChange={(v) => update(i, { id: v })} mono />
            <TextField label="Title" value={s.title} onChange={(v) => update(i, { title: v })} />
          </div>
          <TextArea label="Instruction (what to do)" value={s.instruction || ''} onChange={(v) => update(i, { instruction: v })} />
          <TextField label="Command" value={s.command || ''} onChange={(v) => update(i, { command: v })} mono />
          <TextArea label="Command explanation (what the options do)" value={s.commandExplanation || ''} onChange={(v) => update(i, { commandExplanation: v || undefined })} />
          <TextField label="Expected output" value={s.expectedOutput || ''} onChange={(v) => update(i, { expectedOutput: v })} />
          <TextArea label="Output explanation (how to read it)" value={s.outputExplanation || ''} onChange={(v) => update(i, { outputExplanation: v || undefined })} />
          <TextArea label="What it means" value={s.whatItMeans} onChange={(v) => update(i, { whatItMeans: v })} />
          <div className="grid gap-2 sm:grid-cols-2">
            <TextField label="Frameworks (comma-separated)" value={listToText(s.frameworks)} onChange={(v) => update(i, { frameworks: textToList(v) })} />
            <TextField label="Produces deliverable" value={s.producesDeliverable || ''} onChange={(v) => update(i, { producesDeliverable: v || undefined })} mono />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={!!s.isEvidenceStep} onChange={(e) => update(i, { isEvidenceStep: e.target.checked })} className="h-4 w-4 accent-blue-600" />
            Evidence step
          </label>
        </div>
      ))}
    </div>
  );
}
