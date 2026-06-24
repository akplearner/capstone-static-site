'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Upload, Copy, Download, Trash2, Pencil, Layers, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { courseRepo } from '@/lib/data';
import { Course } from '@/lib/types';

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Module-level so the unique suffix isn't computed in component render scope.
function uniqueSuffix(): string {
  return Date.now().toString(36);
}

export default function InstructorHomePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [dup, setDup] = useState<{ course: Course; title: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => setCourses(courseRepo.list());
  useEffect(refresh, []);

  const handleCreate = () => {
    const title = newTitle.trim();
    if (!title) {
      setError('Enter a course title.');
      return;
    }
    let id = slugify(title);
    if (!id) id = `course-${uniqueSuffix()}`;
    if (courseRepo.get(id)) id = `${id}-${uniqueSuffix()}`;
    const course: Course = {
      id,
      slug: id,
      title,
      description: '',
      roles: [],
      weeks: [],
      gates: [],
      tasks: [],
      isSeed: false,
      version: 1,
    };
    courseRepo.save(course);
    router.push(`/instructor/${id}`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = courseRepo.importJSON(String(reader.result));
      if (!res.ok) setError(res.error || 'Import failed.');
      else {
        setError(null);
        refresh();
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExport = (course: Course) => {
    const json = courseRepo.exportJSON(course.id);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${course.slug || course.id}.course.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const startDuplicate = (course: Course) => {
    setError(null);
    setDup({ course, title: `${course.title} (copy)` });
  };

  const confirmDuplicate = () => {
    if (!dup) return;
    const title = dup.title.trim();
    if (!title) {
      setError('Enter a course title.');
      return;
    }
    let id = slugify(title);
    if (!id) id = `course-${uniqueSuffix()}`;
    if (courseRepo.get(id)) id = `${id}-${uniqueSuffix()}`;
    const created = courseRepo.duplicate(dup.course.id, id, title);
    if (created) router.push(`/instructor/${created.id}`);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    courseRepo.delete(pendingDelete.id);
    setPendingDelete(null);
    refresh();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Instructor Studio</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Create and maintain courses and lab content.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreating((v) => !v)} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> New course
          </Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()} className="flex items-center gap-1">
            <Upload className="h-4 w-4" /> Import
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {creating && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course title</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Cloud Security Range"
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <Button onClick={handleCreate}>Create &amp; edit</Button>
        </div>
      )}

      {dup && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New course title</label>
            <input
              autoFocus
              value={dup.title}
              onChange={(e) => setDup({ ...dup, title: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && confirmDuplicate()}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Duplicating “{dup.course.title}” into an editable copy.
            </p>
          </div>
          <Button onClick={confirmDuplicate}>Create copy</Button>
          <Button variant="secondary" onClick={() => setDup(null)}>Cancel</Button>
        </div>
      )}

      {pendingDelete && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-300">
            Delete “{pendingDelete.title}”? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={confirmDelete}>Delete</Button>
            <Button variant="secondary" size="sm" onClick={() => setPendingDelete(null)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {courses.map((course) => (
          <div key={course.id} className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">{course.title}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">{course.id}</p>
              </div>
              {course.isSeed && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  Built-in
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {course.weeks.length} weeks</span>
              <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {course.roles.length} roles</span>
              <span>{course.tasks.length} tasks</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {course.isSeed ? (
                <Button size="sm" onClick={() => startDuplicate(course)} className="flex items-center gap-1">
                  <Copy className="h-3.5 w-3.5" /> Duplicate to edit
                </Button>
              ) : (
                <Link href={`/instructor/${course.id}`}>
                  <Button size="sm" className="flex items-center gap-1">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </Link>
              )}
              <Button size="sm" variant="secondary" onClick={() => handleExport(course)} className="flex items-center gap-1">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              {!course.isSeed && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => startDuplicate(course)} className="flex items-center gap-1">
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setPendingDelete(course)} className="flex items-center gap-1">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </>
              )}
              <Link href={`/courses/${course.id}`}>
                <Button size="sm" variant="ghost">Preview as student</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
