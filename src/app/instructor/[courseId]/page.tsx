'use client';

import { useParams } from 'next/navigation';
import { AdminGate } from '@/components/InstructorGate';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Download, AlertTriangle, CheckCircle2, GitFork, History } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Dialog } from '@/components/ui/Dialog';
import { EditorSkeleton } from '@/components/ui/Skeletons';
import { toast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/EmptyState';
import { RolesEditor } from '@/components/instructor/RolesEditor';
import { WeeksEditor } from '@/components/instructor/WeeksEditor';
import { TasksEditor } from '@/components/instructor/TasksEditor';
import { GatesEditor } from '@/components/instructor/GatesEditor';
import { DeliverablesEditor } from '@/components/instructor/DeliverablesEditor';
import { ReferenceEditor } from '@/components/instructor/ReferenceEditor';
import { HistoryPanel, HISTORY_COPY } from '@/components/instructor/HistoryPanel';
import { TextField, TextArea, NumberField, Toggle } from '@/components/instructor/fields';
import { courseHistoryRepo, courseRepo } from '@/lib/data';
import { contentVersion } from '@/lib/contentVersion';
import { downloadText } from '@/lib/download';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { useClientStore, useHydrated, notifyStore } from '@/lib/useClientStore';
import { Course } from '@/lib/types';
import { CohortCalendar } from '@/components/instructor/CohortCalendar';
import { SEED_IDS, courseDocument } from '@/lib/content/docs';
import { seedDeliverablesForCourse } from '@/lib/docs/definitions';
import { validateDeliverableList } from '@/lib/docs/validateDeliverable';
import type { DeliverableDef } from '@/lib/docs/types';
import type { CourseContentOverrides } from '@/lib/data/types';

type Tab = 'details' | 'roles' | 'weeks' | 'tasks' | 'gates' | 'deliverables' | 'reference' | 'history';
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'details', label: 'Details' },
  { id: 'roles', label: 'Roles' },
  { id: 'weeks', label: 'Weeks' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'gates', label: 'Gates' },
  { id: 'deliverables', label: 'Deliverables' },
  { id: 'reference', label: 'Reference' },
  { id: 'history', label: 'History' },
];

/** The document pieces the studio edits beyond the course object (R85). */
interface ContentDraft {
  deliverables: DeliverableDef[];
  glossary: Record<string, string>;
  modules: Record<string, unknown>;
  touched: { deliverables: boolean; glossary: boolean; modules: Set<string> };
}

function seedContentDraft(courseId: string): ContentDraft {
  const doc = courseDocument(courseId);
  const rawDefs = (doc?.deliverables as DeliverableDef[] | undefined) ?? seedDeliverablesForCourse(courseId);
  return {
    deliverables: JSON.parse(JSON.stringify(rawDefs)) as DeliverableDef[],
    glossary: { ...(doc?.glossary ?? {}) },
    modules: JSON.parse(JSON.stringify((doc?.content as Record<string, unknown> | undefined) ?? {})) as Record<string, unknown>,
    touched: { deliverables: false, glossary: false, modules: new Set() },
  };
}

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
  const [content, setContent] = useState<ContentDraft | null>(null);
  const [seededId, setSeededId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('details');
  const [saved, setSaved] = useState(false);
  // R122: a built-in course is forked by its first save, so that save asks first.
  const [forking, setForking] = useState(false);
  const [history, setHistory] = useState<Awaited<ReturnType<typeof courseHistoryRepo.list>> | null>(null);
  const loadHistory = useCallback(() => {
    void courseHistoryRepo.list(courseId).then(setHistory);
  }, [courseId]);
  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);
  // The ids already saved: progress, team state and the gates are recorded against them, so the editors show them and do not change them.
  const lockedIds = useMemo(
    () => ({
      roles: new Set(source?.roles.map((r) => r.id) ?? []),
      tasks: new Set(source?.tasks.map((t) => t.id) ?? []),
      steps: new Set(source?.tasks.flatMap((t) => t.steps.map((s) => `${t.id}/${s.id}`)) ?? []),
      gates: new Set(source?.gates.map((g) => g.id) ?? []),
    }),
    [source]
  );

  // Seed the editable draft from the resolved course once per courseId, using the
  // documented "reset state when a prop changes" render-time pattern (no effect).
  if (hydrated && seededId !== courseId) {
    setSeededId(courseId);
    setDraft(source ? (JSON.parse(JSON.stringify(source)) as Course) : null);
    setContent(source ? seedContentDraft(courseId) : null);
  }
  const notFound = hydrated && !source;
  // What the course IS now (saved), not what the draft says: after the first save the built-in has become an edited copy.
  const builtIn = source?.isSeed === true;
  const editedCopy = source?.isSeed === false && SEED_IDS.includes(courseId);

  const errors = useMemo(() => (draft ? validate(draft) : []), [draft]);

  if (notFound) {
    return <EmptyState title="Course not found" message="This course doesn’t exist." href="/instructor" cta="Back to studio" />;
  }
  if (!draft) return <EditorSkeleton />;

  const save = () => {
    if (errors.length > 0) return;
    const t = content?.touched;
    if (content && t && (t.deliverables || t.glossary || t.modules.size > 0)) {
      // Content edits ride the same save. Deliverables get one last whole-list
      // check — the per-edit validators make this unreachable, but a refused
      // save beats a broken student page if they ever miss.
      if (t.deliverables) {
        const v = validateDeliverableList(content.deliverables);
        if (!v.ok) {
          toast({ message: `Deliverables: ${v.error}`, variant: 'warning', duration: 6000 });
          return;
        }
      }
      const overrides: CourseContentOverrides = {
        ...(t.deliverables ? { deliverables: content.deliverables } : {}),
        ...(t.glossary ? { glossary: content.glossary } : {}),
        ...(t.modules.size > 0
          ? { content: Object.fromEntries([...t.modules].map((k) => [k, content.modules[k]])) }
          : {}),
      };
      courseRepo.saveWithContent(draft, overrides);
    } else {
      courseRepo.save(draft);
    }
    notifyStore();
    setSaved(true);
    const v = courseRepo.get(draft.id)?.version;
    toast({ message: v ? `Course saved as version ${v}` : 'Course saved', variant: 'success' });
    setTimeout(() => setSaved(false), 2500);
    if (tab === 'history') loadHistory();
  };

  // A built-in course is forked by its first save: say so and ask. An edited copy or a course of the admin's own saves straight away.
  const saveClicked = () => {
    if (errors.length > 0) return;
    if (builtIn) setForking(true);
    else save();
  };

  const restore = async (version: number): Promise<boolean> => {
    const now = await courseHistoryRepo.restore(courseId, version);
    if (now === null) return false;
    // The draft was seeded from the course as it was: seed it again from what was restored.
    setSeededId(null);
    toast({ message: `Restored version ${version} as version ${now}`, variant: 'success' });
    loadHistory();
    return true;
  };

  const downloadVersion = async (version: number) => {
    const doc = await courseHistoryRepo.get(courseId, version);
    if (!doc) {
      toast({ message: 'That version could not be read.', variant: 'warning' });
      return;
    }
    downloadText(`${courseId}_v${version}.json`, JSON.stringify(doc, null, 2) + '\n', 'application/json');
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
    <AdminGate>
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/instructor" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
            <ArrowLeft className="h-4 w-4" /> All courses
          </Link>
          <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-bold text-ink">
            {draft.title || 'Untitled course'}
            <Chip tone="neutral" title="The course’s content version: the document’s version, then the number of corrections made from reports" data-studio-version>
              v{contentVersion(source?.version, source?.revision)}
            </Chip>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-ok">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
          <Link href={`/courses/${draft.id}`}>
            <Button variant="secondary" className="flex items-center gap-1"><Eye className="h-4 w-4" /> Preview</Button>
          </Link>
          <Button variant="secondary" onClick={exportJSON} className="flex items-center gap-1"><Download className="h-4 w-4" /> Export</Button>
          <Button onClick={saveClicked} disabled={errors.length > 0} className="flex items-center gap-1" data-studio-save><Save className="h-4 w-4" /> Save</Button>
        </div>
      </div>

      {builtIn && (
        <div className="space-y-1 rounded-lg border border-warn-line bg-warn-soft p-3 text-sm text-ink" data-studio-fork>
          <div className="flex items-center gap-1 font-semibold">
            <GitFork className="h-4 w-4" aria-hidden /> Built-in course
          </div>
          <p>{isSupabaseConfigured() ? HISTORY_COPY.forkCloud : HISTORY_COPY.forkLocal}</p>
          <p>
            {HISTORY_COPY.forkHow}{' '}
            <Link href="/instructor/issues" className="font-medium text-accent hover:underline">
              Open reported issues
            </Link>
          </p>
        </div>
      )}
      {editedCopy && (
        <div className="rounded-lg border border-warn-line bg-warn-soft p-3 text-sm text-ink" data-studio-copy>
          {HISTORY_COPY.copy}
        </div>
      )}

      {errors.length > 0 && (
        <div className="space-y-1 rounded-lg border border-danger-line bg-danger-soft p-3 text-sm text-ink">
          <div className="flex items-center gap-1 font-semibold"><AlertTriangle className="h-4 w-4" /> Fix before saving:</div>
          <ul className="list-inside list-disc">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted hover:text-ink'
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

            <div className="space-y-4 rounded-lg depth-edge p-4">
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

            {/* R68: the cohort's start date is runtime data, not course
                content — it is saved on its own, not with the draft. */}
            <CohortCalendar course={draft} />
          </div>
        )}
        {tab === 'roles' && <RolesEditor course={draft} onChange={setDraft} locked={lockedIds.roles} />}
        {tab === 'weeks' && <WeeksEditor course={draft} onChange={setDraft} />}
        {tab === 'tasks' && <TasksEditor course={draft} onChange={setDraft} locked={{ tasks: lockedIds.tasks, steps: lockedIds.steps }} />}
        {tab === 'gates' && <GatesEditor course={draft} onChange={setDraft} locked={lockedIds.gates} />}
        {tab === 'deliverables' && content && (
          <DeliverablesEditor
            course={draft}
            defs={content.deliverables}
            onChange={(defs) =>
              setContent({ ...content, deliverables: defs, touched: { ...content.touched, deliverables: true } })
            }
          />
        )}
        {tab === 'reference' && content && (
          <ReferenceEditor
            glossary={content.glossary}
            onGlossary={(g) => setContent({ ...content, glossary: g, touched: { ...content.touched, glossary: true } })}
            modules={content.modules}
            onModule={(key, value) => {
              const touched = new Set(content.touched.modules);
              touched.add(key);
              setContent({ ...content, modules: { ...content.modules, [key]: value }, touched: { ...content.touched, modules: touched } });
            }}
          />
        )}
        {tab === 'history' && (
          <HistoryPanel
            versions={history?.versions ?? []}
            loaded={history !== null}
            current={source?.version ?? null}
            builtIn={builtIn}
            needsUpdate={!!history?.needsUpdate}
            local={!isSupabaseConfigured()}
            onRestore={restore}
            onDownload={(v) => void downloadVersion(v)}
          />
        )}
      </div>

      <Dialog open={forking} onClose={() => setForking(false)} title={HISTORY_COPY.confirmTitle}>
        <div className="space-y-3 text-sm text-body">
          <p>{isSupabaseConfigured() ? HISTORY_COPY.forkCloud : HISTORY_COPY.forkLocal}</p>
          <p>{HISTORY_COPY.forkHow}</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setForking(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setForking(false);
                save();
              }}
              data-studio-fork-confirm
            >
              <History className="mr-1 h-4 w-4" aria-hidden /> {HISTORY_COPY.confirmButton}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
    </AdminGate>
  );
}
