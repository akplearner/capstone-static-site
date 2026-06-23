'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Course, Gate } from '@/lib/types';
import { TextField, TextArea, NumberField, listToText, textToList } from './fields';

export function GatesEditor({ course, onChange }: { course: Course; onChange: (c: Course) => void }) {
  const setGates = (gates: Gate[]) => onChange({ ...course, gates });

  const update = (i: number, patch: Partial<Gate>) =>
    setGates(course.gates.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));

  const add = () => {
    const nextId = course.gates.reduce((m, g) => Math.max(m, g.id), 0) + 1;
    setGates([
      ...course.gates,
      {
        id: nextId,
        week: course.weeks[0]?.number || 1,
        title: `Gate ${nextId}`,
        description: '',
        requiredArtifactTypes: [],
        requiredTasks: [],
      },
    ]);
  };

  const toggleTask = (i: number, taskId: string) => {
    const g = course.gates[i];
    const has = g.requiredTasks.includes(taskId);
    update(i, {
      requiredTasks: has ? g.requiredTasks.filter((t) => t !== taskId) : [...g.requiredTasks, taskId],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">Gates mark the end of a phase. A gate passes when its required tasks are complete.</p>
        <Button size="sm" onClick={add} className="flex items-center gap-1"><Plus className="h-4 w-4" /> Add gate</Button>
      </div>
      {course.gates.map((g, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900 dark:text-white">{g.title}</span>
            <button onClick={() => setGates(course.gates.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <NumberField label="ID" value={g.id} onChange={(v) => update(i, { id: v })} />
            <NumberField label="Week" value={g.week} onChange={(v) => update(i, { week: v })} />
            <div className="sm:col-span-1">
              <TextField label="Title" value={g.title} onChange={(v) => update(i, { title: v })} />
            </div>
          </div>
          <TextArea label="Description" value={g.description} onChange={(v) => update(i, { description: v })} />
          <TextField label="Required artifact types (comma-separated)" value={listToText(g.requiredArtifactTypes)} onChange={(v) => update(i, { requiredArtifactTypes: textToList(v) })} />
          <div>
            <span className="block text-xs font-medium text-gray-600 dark:text-gray-300">Required tasks</span>
            <div className="mt-1 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-700">
              {course.tasks.length === 0 && <p className="text-xs text-gray-400">No tasks yet.</p>}
              {course.tasks.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={g.requiredTasks.includes(t.id)} onChange={() => toggleTask(i, t.id)} className="h-4 w-4 accent-blue-600" />
                  <span className="font-mono text-xs">{t.id}</span>
                  <span className="text-xs text-gray-500">— {t.title}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
