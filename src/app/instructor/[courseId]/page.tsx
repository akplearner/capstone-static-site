'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EditorSkeleton } from '@/components/ui/Skeletons';
import { toast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/EmptyState';
import { RolesEditor } from '@/components/instructor/RolesEditor';
import { WeeksEditor } from '@/components/instructor/WeeksEditor';
import { TasksEditor } from '@/components/instructor/TasksEditor';
import { GatesEditor } from '@/components/instructor/GatesEditor';
import { TextField, TextArea, NumberField, Toggle } from '@/components/instructor/fields';
import { courseRepo } from '@/lib/data';
import { useClientStore, useHydrated, notifyStore } from '@/lib/useClientStore';
import { Course } from '@/lib/types';

type Tab = 'details' | 'roles' | 'weeks' | 'tasks' | 'gates';
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'details', label: 'Details' },
  { id: 'roles', label: 'Roles' },
  { id: 'weeks', label: 'Weeks' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'gates', label: 'Gates' },
];

function validate(course: Course): string[] {
  const errors: string[] = [];
  if (!course.title.trim()) errors.push('Course title is required.');
  const dupe = (arr: string[], what: string) => {
    const seen = new Set<string>();
    arr.forEach((id) => {
      if (seen.has(id)) errors.push(`Duplicate ${what} id: ${id}`);
      seen.add(id);
    });
  };
  dupe(course.roles.map((r) => r.id), 'role');
  dupe(course.weeks.map((w) => String(w.number)), 'week number');
  dupe(course.tasks.map((t) => t.id), 'task');
  course.tasks.forEach((t) => dupe(t.steps.map((s) => s.id), `step (task ${t.id})`));
  const taskIds = new Set(course.tasks.map((t) => t.id));
  course.gates.forEach((g) =>
    g.requiredTasks.forEach((tid) => {
      if (!taskIds.has(tid)) errors.push(`Gate ${g.id} references missing task: ${tid}`);
    })
  );
  const roleIds = new Set(course.roles.map((r) => r.id));
  course.tasks.forEach((t) => {
    if (!roleIds.has(t.role)) errors.push(`Task ${t.id} uses unknown role: ${t.role}`);
  });
  if ((course.teamCount ?? 3) < 1) errors.push('Number of teams must be at least 1.');
  if ((course.teamCapacity ?? 0) < 0) errors.push('Max members per team cannot be negative.');
  return errors;
}

export default function CourseEditorPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const source = useClientStore<Course | null>(() => courseRepo.get(courseId) ?? null, null);
  const hydrated = useHydrated();
  const [draft, setDraft] = useState<Course | null>(null);
  const [seededId, setSeededId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('details');
  const [saved, setSaved] = useState(false);

  // Seed the editable draft from the resolved course once per courseId, using the
  // documented "reset state when a prop changes" render-time pattern (no effect).
  if (hydrated && seededId !== courseId) {
    setSeededId(courseId);
    setDraft(source ? (JSON.parse(JSON.stringify(source)) as Course) : null);
  }
  const notFound = hydrated && !source;

  const errors = useMemo(() => (draft ? validate(draft) : []), [draft]);

  if (notFound) {
    return <EmptyState title="Course not found" message="This course doesn’t exist." href="/instructor" cta="Back to studio" />;
  }
  if (!draft) return <EditorSkeleton />;

  const save = () => {
    if (errors.length > 0) return;
    courseRepo.save(draft);
    notifyStore();
    setSaved(true);
    toast({ message: 'Course saved', variant: 'success' });
    setTimeout(() => setSaved(false), 2500);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ ...draft, isSeed: false }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${draft.slug || draft.id}.course.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/instructor" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400">
            <ArrowLeft className="h-4 w-4" /> All courses
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-ink">{draft.title || 'Untitled course'}</h1>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
          <Link href={`/courses/${draft.id}`}>
            <Button variant="secondary" className="flex items-center gap-1"><Eye className="h-4 w-4" /> Preview</Button>
          </Link>
          <Button variant="secondary" onClick={exportJSON} className="flex items-center gap-1"><Download className="h-4 w-4" /> Export</Button>
          <Button onClick={save} disabled={errors.length > 0} className="flex items-center gap-1"><Save className="h-4 w-4" /> Save</Button>
        </div>
      </div>

      {draft.isSeed && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          This is a built-in course. Saving will create an editable copy that overrides the built-in version on this device.
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          <div className="flex items-center gap-1 font-semibold"><AlertTriangle className="h-4 w-4" /> Fix before saving:</div>
          <ul className="list-inside list-disc">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'details' && (
          <div className="max-w-xl space-y-4">
            <TextField label="Title" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} />
            <TextField label="Slug / ID" value={draft.slug} onChange={(v) => setDraft({ ...draft, slug: v })} mono />
            <TextArea label="Description" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} rows={3} />

            <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-ink">Enrollment</h3>
              <Toggle
                label={draft.locked ? 'Locked' : 'Open'}
                hint="Locked courses are greyed out and can't be entered by students."
                checked={!!draft.locked}
                onChange={(v) => setDraft({ ...draft, locked: v })}
              />
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  label="Number of teams"
                  value={draft.teamCount ?? 3}
                  onChange={(v) => setDraft({ ...draft, teamCount: v })}
                />
                <NumberField
                  label="Max members per team (0 = unlimited)"
                  value={draft.teamCapacity ?? 0}
                  onChange={(v) => setDraft({ ...draft, teamCapacity: v })}
                />
              </div>
            </div>
          </div>
        )}
        {tab === 'roles' && <RolesEditor course={draft} onChange={setDraft} />}
        {tab === 'weeks' && <WeeksEditor course={draft} onChange={setDraft} />}
        {tab === 'tasks' && <TasksEditor course={draft} onChange={setDraft} />}
        {tab === 'gates' && <GatesEditor course={draft} onChange={setDraft} />}
      </div>
    </div>
  );
}
