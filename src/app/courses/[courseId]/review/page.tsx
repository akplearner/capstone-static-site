'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronLeft, Circle, ShieldQuestion, XCircle } from 'lucide-react';
import { CourseSubNav } from '@/components/CourseSubNav';
import { CourseEnrolGate } from '@/components/CourseEnrolGate';
import { PageHeader } from '@/components/ui/PageHeader';
import { Crumbs } from '@/components/SiteNav';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { submissionsRepo } from '@/lib/data';
import type { ReviewPacket, ReviewQueueItem } from '@/lib/data/types';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { RUBRIC_CATEGORIES } from '@/lib/docs/deliverableRubric';
import { REVIEW_QUESTIONS, allAnswered, confirmOf } from '@/lib/docs/reviewQuestions';
import { GuideSkeleton } from '@/components/ui/Skeletons';

/**
 * The reviewer's bench (R84): the blind queue, one packet at a time.
 *
 * Everything on this page comes through the review RPCs, which never say
 * whose work it is — no team, no name, no way to go looking. What the
 * reviewer sees is the frozen bundle: the document as submitted, the
 * automatic checks as they stood at submission, and the rubric words the
 * whole platform grades by. They answer six binary questions; "confirm" is
 * derived (all six yes), and the answer is final the moment it lands — the
 * database's primary key, not a UI rule.
 *
 * A guard in page-shape.test.ts holds the blindness: this file must never
 * read the submissions table or name its identifying columns.
 */
export default function ReviewPage() {
  const course = useCourse();
  const { member, loading } = useMember(course.id);
  const [queue, setQueue] = useState<ReviewQueueItem[] | null>(null);
  const [open, setOpen] = useState<ReviewPacket | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!member) return;
    let on = true;
    void submissionsRepo.queue().then((q) => on && setQueue(q.filter((i) => i.courseId === course.id)));
    return () => {
      on = false;
    };
  }, [course.id, member, open]);

  if (loading) return <GuideSkeleton />;
  if (!member) return <CourseEnrolGate courseId={course.id} what="the review bench" />;

  const defs = deliverablesForCourse(course.id);
  const titleOf = (id: string) => defs.find((d) => d.id === id)?.title ?? id;
  const pending = (queue ?? []).filter((i) => !i.done);
  const finished = (queue ?? []).filter((i) => i.done);

  const openPacket = (item: ReviewQueueItem) => {
    setAnswers({});
    void submissionsRepo.packet(item.assignmentId).then((p) => {
      if (p) setOpen(p);
      else toast({ message: 'Couldn’t load the packet — try again.', variant: 'warning' });
    });
  };

  const send = () => {
    if (!open || !allAnswered(answers) || busy) return;
    setBusy(true);
    void submissionsRepo.submitReview(open.assignmentId, answers, confirmOf(answers)).then((ok) => {
      setBusy(false);
      if (!ok) return;
      toast({
        message: confirmOf(answers) ? 'Recorded: confirmed. Thank you — review is what makes the pass mean something.' : 'Recorded: not confirmed. Your answers tell the team exactly where to look.',
        variant: 'success',
        duration: 6000,
      });
      setOpen(null);
    });
  };

  return (
    <div className="space-y-8">
      <CourseSubNav courseId={course.id} active="home" teamId={member.teamId} />

      <PageHeader
        eyebrow={<Crumbs items={[{ label: 'Home', href: '/' }, { label: course.title, href: `/courses/${course.id}` }, { label: 'Peer review' }]} />}
        title="Peer review"
        lede="Documents from other teams, with every name removed. You see the work, the frozen automatic checks, and six questions — never whose it is. Their team sees your answers, never your name."
      />

      {open ? (
        <PacketView
          packet={open}
          title={titleOf(open.deliverableId)}
          answers={answers}
          setAnswers={setAnswers}
          onBack={() => setOpen(null)}
          onSend={send}
          busy={busy}
        />
      ) : (
        <>
          {queue === null ? (
            <p className="text-sm text-muted">Loading your queue…</p>
          ) : pending.length === 0 ? (
            <div className="flex items-start gap-3 rounded-lg depth-edge bg-panel p-5">
              <ShieldQuestion className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden />
              <div className="text-sm text-body">
                <p className="font-semibold text-ink">Nothing waiting for you.</p>
                <p className="mt-1 text-muted">
                  Assignments arrive automatically when another team in your cohort submits a deliverable.
                  {finished.length > 0 ? ` You have completed ${finished.length} review${finished.length === 1 ? '' : 's'} — each one is final.` : ''}
                </p>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {pending.map((item) => (
                <li key={item.assignmentId}>
                  <button
                    type="button"
                    onClick={() => openPacket(item)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg depth-edge bg-panel px-4 py-3 text-left hover:bg-panel-2"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium text-ink">{titleOf(item.deliverableId)}</span>
                      <span className="block text-xs text-muted">
                        Week {item.week} · assigned {new Date(item.assignedAt).toLocaleDateString()} · anonymous
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-2xs font-semibold text-accent-ink">Review →</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {finished.length > 0 && pending.length > 0 && (
            <p className="text-xs text-muted">{finished.length} already reviewed — reviews are final.</p>
          )}
        </>
      )}
    </div>
  );
}

function PacketView({
  packet,
  title,
  answers,
  setAnswers,
  onBack,
  onSend,
  busy,
}: {
  packet: ReviewPacket;
  title: string;
  answers: Record<string, boolean>;
  setAnswers: (a: Record<string, boolean>) => void;
  onBack: () => void;
  onSend: () => void;
  busy: boolean;
}) {
  const snap = packet.snapshot;
  const fields = Object.entries(snap.data?.fields ?? {}).filter(([, v]) => String(v).trim() !== '');
  const groups = Object.entries(snap.data?.groups ?? {}).filter(([, rows]) => (rows?.length ?? 0) > 0);
  const ready = allAnswered(answers);

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
        <ChevronLeft className="h-4 w-4" /> Back to the queue
      </button>

      <section className="rounded-lg depth-edge bg-panel p-4">
        <h2 className="text-lg font-bold text-ink">{title}</h2>
        <p className="mt-0.5 text-xs text-muted">
          Week {packet.week} · version {packet.version} · frozen{' '}
          <span className="font-mono">{packet.contentSha256.slice(0, 12)}…</span> ·{' '}
          {new Date(packet.submittedAt).toLocaleString()} · submitter withheld
        </p>

        {/* What the platform said at submission time, frozen with the content. */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {RUBRIC_CATEGORIES.map((c) => {
            const ok = snap.categories?.[c.id];
            return (
              <span key={c.id} title={c.generic} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold ${ok ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'}`}>
                {ok ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} {c.label}
              </span>
            );
          })}
        </div>
        {(snap.checks?.length ?? 0) > 0 && (
          <ul className="mt-2 grid gap-x-4 gap-y-0.5 text-2xs text-muted sm:grid-cols-2">
            {snap.checks.map((c) => (
              <li key={c.id} className="flex items-start gap-1">
                {c.ok ? <CheckCircle2 className="mt-px h-3 w-3 shrink-0 text-ok" /> : <Circle className="mt-px h-3 w-3 shrink-0 text-warn" />}
                <span className="min-w-0">{c.label ?? c.id}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* The document itself, exactly as frozen. */}
      <section className="rounded-lg depth-edge bg-panel p-4">
        <h3 className="text-sm font-semibold text-ink">The document, as submitted</h3>
        {fields.length === 0 && groups.length === 0 && (
          <p className="mt-2 text-sm text-muted">The frozen form holds no entries — that alone answers most of the questions below.</p>
        )}
        {fields.length > 0 && (
          <dl className="mt-2 space-y-1.5">
            {fields.map(([k, v]) => (
              <div key={k} className="text-sm">
                <dt className="font-mono text-2xs text-muted">{k}</dt>
                <dd className="whitespace-pre-wrap text-body">{String(v)}</dd>
              </div>
            ))}
          </dl>
        )}
        {groups.map(([g, rows]) => (
          <div key={g} className="mt-3 overflow-x-auto">
            <div className="font-mono text-2xs text-muted">{g}</div>
            <table className="mt-1 w-full text-left text-xs">
              <thead>
                <tr>
                  {Object.keys(rows[0] ?? {}).map((col) => (
                    <th key={col} className="border-b border-line px-2 py-1 font-mono text-2xs font-medium text-muted">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {Object.keys(rows[0] ?? {}).map((col) => (
                      <td key={col} className="border-b border-line px-2 py-1 align-top text-body">{String(row[col] ?? '')}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {/* The six questions. Confirm is derived: all six yes. */}
      <section className="rounded-lg depth-edge bg-panel p-4">
        <h3 className="text-sm font-semibold text-ink">Your judgement — six questions, yes or no</h3>
        <ul className="mt-2 space-y-2">
          {REVIEW_QUESTIONS.map((q) => (
            <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md depth-edge bg-panel-2 px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink">{q.label}</div>
                <div className="text-2xs text-muted">{q.hint}</div>
              </div>
              <div className="flex shrink-0 overflow-hidden rounded-[var(--radius-control)] depth-edge" role="group" aria-label={q.label}>
                {([true, false] as const).map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    aria-pressed={answers[q.id] === val}
                    onClick={() => setAnswers({ ...answers, [q.id]: val })}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      answers[q.id] === val
                        ? val
                          ? 'bg-ok text-accent-contrast'
                          : 'bg-warn text-accent-contrast'
                        : 'bg-panel text-muted hover:bg-panel-2'
                    }`}
                  >
                    {val ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-2xs text-muted">
            {ready
              ? confirmOf(answers)
                ? 'All six yes → this review CONFIRMS the submission.'
                : 'At least one no → this review does not confirm. Your answers point at what to fix.'
              : 'Answer all six to send. A sent review is final.'}
          </p>
          <Button size="sm" disabled={!ready || busy} onClick={onSend}>
            {busy ? 'Sending…' : 'Send review — final'}
          </Button>
        </div>
      </section>
    </div>
  );
}
