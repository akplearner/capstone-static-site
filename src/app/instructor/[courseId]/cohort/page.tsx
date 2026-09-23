'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Surface } from '@/components/ui/Surface';
import { Alert } from '@/components/ui/Alert';
import { CohortSkeleton } from '@/components/ui/Skeletons';
import { Crumbs } from '@/components/SiteNav';
import { TeamProgressTable, type DeliverableStatus, type MemberProgress } from '@/components/TeamProgressTable';
import { ReviewCell } from '@/components/instructor/ReviewCell';
import { CohortCalendar } from '@/components/instructor/CohortCalendar';
import { courseRepo } from '@/lib/data';
import { loadCohort, isStepDoneIn, type CohortData } from '@/lib/data/cohortLoader';
import { useClientStore, subscribeStore } from '@/lib/useClientStore';
import { useAuth } from '@/lib/useAuth';
import { buildCohort, cohortCsv, stuckSummary, type CohortMember } from '@/lib/cohort';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { isDoneBy } from '@/lib/docs/dod';
import { getTaskById, isAdvancedWeek } from '@/lib/course-helpers';
import { markedWeeks } from '@/lib/rubric';
import { downloadText } from '@/lib/download';
import { localDay } from '@/lib/localDate';
import { teamLabel } from '@/lib/team';
import type { Course } from '@/lib/types';

/**
 * The cohort dashboard — the instructor's view of every team and every
 * student on a course, with the numbers the rubric marks from.
 *
 * The studio could author a course and could not see a single student. The
 * data was always there (memberships, completions, the ledger, the forms);
 * this page loads it for the whole course, derives the same per-week
 * percentages the team block shows, adds verified-vs-self-attested from the
 * ledger, who is stuck where, the rubric's 70/30 points per week, the review
 * cells for each team's forms, and a CSV that mirrors the printed sheet.
 */
export default function CohortPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;
  const course = useClientStore<Course | null>(() => courseRepo.get(courseId) ?? null, null);
  const { user } = useAuth();
  const [data, setData] = useState<CohortData | null>(null);
  const [team, setTeam] = useState<string>('all');
  const [role, setRole] = useState<string>('all');
  const [reviewWeek, setReviewWeek] = useState<number | null>(null);

  const reload = useCallback(() => {
    if (!course) return;
    void loadCohort(course).then(setData);
  }, [course]);
  useEffect(() => {
    reload();
  }, [reload]);
  // localStorage mode: any write on this device (a review saved below, a
  // cohort date set) re-reads. Cloud mode: the button.
  useEffect(() => subscribeStore(reload), [reload]);

  const rows = useMemo<CohortMember[]>(() => {
    if (!course || !data) return [];
    return buildCohort({
      course,
      roster: data.roster,
      isStepDone: (m, t, s) => isStepDoneIn(data, course.id, m, t, s),
      evidenceFor: (m) => data.evidence[m] ?? {},
      docsFor: (t) => data.docs[t] ?? {},
      stuckFor: (m) => data.stuck.filter((f) => f.memberId === m),
    });
  }, [course, data]);

  if (!course) return <CohortSkeleton />;
  if (!data) return <CohortSkeleton />;

  const teams = [...new Set(rows.map((r) => r.teamId))].sort();
  const shown = rows.filter((r) => (team === 'all' || r.teamId === team) && (role === 'all' || r.role === role));
  const weeks = markedWeeks(course);
  const rWeek = reviewWeek ?? weeks[0]?.week ?? 1;
  const stuck = stuckSummary(shown);
  const reviewer = user?.email ?? 'instructor';

  const exportCsv = () => downloadText(`${course.id}_cohort_${localDay()}.csv`, cohortCsv(shown, course, data.reviews), 'text/csv;charset=utf-8');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={<Crumbs items={[{ label: 'Home', href: '/' }, { label: 'Instructor', href: '/instructor' }, { label: course.title }, { label: 'Cohort' }]} />}
        title="Cohort"
        lede={
          data.mode === 'cloud'
            ? `Live from the platform: ${rows.length} student${rows.length === 1 ? '' : 's'} across ${teams.length} team${teams.length === 1 ? '' : 's'}.`
            : `This device only — the roster and progress stored in this browser (${rows.length} member${rows.length === 1 ? '' : 's'}). Connect the platform to its backend to see the whole class.`
        }
        trailing={
          <>
            <Button variant="secondary" size="sm" onClick={reload} className="flex items-center gap-1.5">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button size="sm" onClick={exportCsv} className="flex items-center gap-1.5" disabled={shown.length === 0}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block font-medium text-body">Team</span>
          <select value={team} onChange={(e) => setTeam(e.target.value)} className="mt-1 text-sm">
            <option value="all">All teams</option>
            {teams.map((t) => (
              <option key={t} value={t}>
                {teamLabel(t)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium text-body">Focus</span>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 text-sm">
            <option value="all">All</option>
            {course.roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="block font-medium text-body">Review week</span>
          <select value={rWeek} onChange={(e) => setReviewWeek(Number(e.target.value))} className="mt-1 text-sm">
            {weeks.map((w) => (
              <option key={w.week} value={w.week}>
                Week {w.week}
                {w.bonus ? ' (bonus)' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>

      <CohortCalendar course={course} />

      {stuck.length > 0 && (
        <Surface as="section" variant="inset" className="space-y-2" aria-labelledby="cohort-stuck">
          <h2 id="cohort-stuck" className="text-base font-semibold text-ink">
            Stuck right now
          </h2>
          <ul className="space-y-1 text-sm">
            {stuck.map((s) => {
              const task = getTaskById(course, s.taskId);
              const step = task?.steps.find((x) => x.id === s.stepId);
              return (
                <li key={`${s.taskId}::${s.stepId}`} className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium text-warn">{s.members.length}</span>
                  <span className="text-muted">{s.members.join(', ')} on</span>
                  <Link href={`/courses/${course.id}?tab=tasks&week=${task?.week ?? 1}&task=${s.taskId}&step=${s.stepId}`} className="font-medium text-accent hover:underline">
                    {task?.title ?? s.taskId} · {step?.title ?? s.stepId}
                  </Link>
                </li>
              );
            })}
          </ul>
        </Surface>
      )}

      {rows.length === 0 && <Alert variant="info">Nobody has joined this course yet{data.mode === 'local' ? ' on this device' : ''}.</Alert>}

      {teams
        .filter((t) => team === 'all' || t === team)
        .map((t) => {
          const members = shown.filter((r) => r.teamId === t);
          if (members.length === 0) return null;
          const tableRows: MemberProgress[] = members.map((m) => ({
            memberId: m.memberId,
            displayName: m.displayName,
            role: m.role,
            overall: m.overall,
            weeks: Object.entries(m.weeks).map(([w, pct]) => ({ week: Number(w), pct })),
            isYou: false,
            stuck: m.stuck.length,
          }));
          const docs = data.docs[t] ?? {};
          const dueForms = deliverablesForCourse(course.id).filter((d) => d.weeks.includes(rWeek));
          const deliverables: DeliverableStatus[] = deliverablesForCourse(course.id).map((d) => ({
            id: d.id,
            title: d.title,
            owner: d.owner,
            complete: isDoneBy(d, docs[d.id], Math.max(...d.weeks.filter((w) => !isAdvancedWeek(course, w)), d.weeks[0] ?? 1)),
            review: data.reviews.filter((r) => r.teamId === t && r.deliverableId === d.id).sort((a, b) => b.at - a.at)[0]?.status,
          }));
          return (
            <Surface as="section" key={t} className="space-y-5" aria-labelledby={`team-${t}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id={`team-${t}`} className="text-xl font-semibold tracking-tight text-ink">
                  {teamLabel(t)} <span className="text-base font-normal text-muted">· {members[0].cohort}</span>
                </h2>
                <span className="text-sm text-muted">
                  Week {rWeek} points:{' '}
                  {members.map((m) => {
                    const p = m.points.find((x) => x.week === rWeek);
                    return (
                      <span key={m.memberId} className="mr-3 tabular-nums">
                        {m.displayName} {p ? `${p.total}` : '—'}
                        {p?.focusMirrorsTeam ? '*' : ''}
                      </span>
                    );
                  })}
                </span>
              </div>
              <TeamProgressTable course={course} rows={tableRows} deliverables={deliverables} />
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-ink">Review · Week {rWeek}</h3>
                {dueForms.length === 0 ? (
                  <p className="text-sm text-muted">No form is due this week.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {dueForms.map((d) => (
                      <div key={d.id} className="rounded-lg depth-edge bg-panel-2 p-3">
                        <div className="mb-2 text-sm font-medium text-ink">
                          {d.num}. {d.title}
                          <span className="ml-2 text-xs text-muted">{isDoneBy(d, docs[d.id], rWeek) ? 'DoD met' : 'DoD not met'}</span>
                        </div>
                        <ReviewCell
                          courseId={course.id}
                          teamId={t}
                          deliverableId={d.id}
                          week={rWeek}
                          reviewer={reviewer}
                          current={data.reviews.find((r) => r.teamId === t && r.deliverableId === d.id && r.week === rWeek)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Surface>
          );
        })}
      <p className="text-xs text-muted">* FOCUS mirrors the TEAM share in a week with no deep-dive for that focus. Points are the platform&apos;s share of the 70 TEAM + 30 FOCUS split; quality is still marked by hand on the printed sheet.</p>
    </div>
  );
}
