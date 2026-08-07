'use client';

import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/Button';
import { Course, Step, Task } from '@/lib/types';
import { StepsEditor } from './StepsEditor';
import { TextField, TextArea, SelectField, listToText, textToList } from './fields';

export function TasksEditor({ course, onChange }: { course: Course; onChange: (c: Course) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const setTasks = (tasks: Task[]) => onChange({ ...course, tasks });

  const update = (i: number, patch: Partial<Task>) =>
    setTasks(course.tasks.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));

  const add = () => {
    const role = course.roles[0]?.id || 'role';
    const week = course.weeks[0]?.number || 1;
    const id = `${role}-w${week}-t${course.tasks.length + 1}`;
    const task: Task = {
      id,
      role,
      week,
      title: 'New task',
      objective: '',
      steps: [],
      frameworks: [],
      deliverables: [],
    };
    setTasks([...course.tasks, task]);
    setOpen(id);
  };

  const roleOptions = course.roles.map((r) => ({ value: r.id, label: r.name }));
  const weekOptions = [...course.weeks]
    .sort((a, b) => a.number - b.number)
    .map((w) => ({ value: String(w.number), label: `Week ${w.number}` }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Define tasks and their step-by-step instructions.</p>
        <Button size="sm" onClick={add} className="flex items-center gap-1" disabled={course.roles.length === 0 || course.weeks.length === 0}>
          <Plus className="h-4 w-4" /> Add task
        </Button>
      </div>
      {(course.roles.length === 0 || course.weeks.length === 0) && (
        <p className="text-sm text-amber-600 dark:text-amber-400">Add at least one role and one week before creating tasks.</p>
      )}

      {course.tasks.map((t, i) => {
        const isOpen = open === t.id;
        return (
          <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-2 p-4">
              <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : t.id)} className="flex flex-1 items-center gap-2 text-left">
                {isOpen ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}
                <span className="font-medium text-ink">{t.title}</span>
                <span className="text-xs text-gray-500">({t.role} · week {t.week} · {t.steps.length} steps)</span>
              </button>
              <button type="button" aria-label={`Remove task ${t.title}`} onClick={() => setTasks(course.tasks.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-600">
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {isOpen && (
              <div className="space-y-3 border-t border-gray-200 p-4 dark:border-gray-700">
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="ID" value={t.id} onChange={(v) => update(i, { id: v })} mono />
                  <TextField label="Title" value={t.title} onChange={(v) => update(i, { title: v })} />
                  <SelectField label="Role" value={t.role} options={roleOptions} onChange={(v) => update(i, { role: v })} />
                  <SelectField label="Week" value={String(t.week)} options={weekOptions} onChange={(v) => update(i, { week: parseInt(v) })} />
                </div>
                <TextArea label="Objective" value={t.objective} onChange={(v) => update(i, { objective: v })} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label="Deliverables (comma-separated)" value={listToText(t.deliverables)} onChange={(v) => update(i, { deliverables: textToList(v) })} />
                  <TextField label="Frameworks (comma-separated)" value={listToText(t.frameworks)} onChange={(v) => update(i, { frameworks: textToList(v) })} />
                </div>
                <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                  <StepsEditor taskId={t.id} steps={t.steps} onChange={(steps: Step[]) => update(i, { steps })} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
