'use client';

import Link from 'next/link';
import type { Course, Member } from '@/lib/types';
import { certOf, deliverablesOf, skillsOf } from '@/lib/content/read';
import { useCourseDocument } from '@/lib/useCourse';
import { skillProfile, type AbilityIndicators, type ProfileRow } from '@/lib/skillProfile';
import { docsRepo, evidenceRepo, progressRepo, reviewRepo, statusRepo, stepNotesRepo, submissionsRepo, taskReportsRepo } from '@/lib/data';
import { LevelPill } from './LevelPill';

/**
 * R107: the member's skills on the course Home, inside the role surface.
 * Exam domains as a table (practised, level, the next task that closes a
 * gap), one line per dimension, the ability indicators, and the caption that
 * names the denominator. Every word comes from the document; every number is
 * the pure projection over the repositories the page already reads in render.
 */
const ABILITY_KEYS = ['firstTry', 'persistence', 'partialProgress', 'evidenceNaming', 'activeDays', 'activeWeeks', 'dodMet', 'drafted', 'reviewed', 'issued', 'submissionsFrozen', 'rubricAllGreen', 'handoffsCompleted', 'teammateStepsTicked', 'reportsFiled', 'notesWritten'] as const;
const LINES = ['skills', 'tools', 'procedures', 'standards', 'tactics', 'practices'] as const;

export function SkillsCard({ course, member, activeWeek }: { course: Course; member: Member; activeWeek: number }) {
  const registry = skillsOf(useCourseDocument());
  const cert = certOf(useCourseDocument());
  const deliverables = deliverablesOf(useCourseDocument());
  const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
  const profile = skillProfile({
    course,
    role: member.role,
    memberId: member.memberId,
    isStepDone: (t, s) => progressRepo.isStepComplete(course.id, member.memberId, t, s, keySet),
    evidence: evidenceRepo.getSteps(course.id, member.memberId),
    artifacts: evidenceRepo.getArtifacts(course.id, member.memberId),
    registry,
    cert,
    deliverables,
    team: {
      docs: docsRepo.get(course.id, member.teamId) ?? {},
      status: statusRepo.list(course.id, member.teamId),
      submissions: submissionsRepo.list(course.id, member.teamId),
      reviews: reviewRepo.list(course.id, member.teamId),
      currentWeek: activeWeek,
    },
    own: { notes: Object.values(stepNotesRepo.getAll(course.id, member.memberId)), reports: taskReportsRepo.list(course.id) },
  });
  const { COPY, LEVEL_LABEL, DIMENSION_LABEL } = registry;
  const reached = (rows: ProfileRow[], level: 'practised' | 'verified') => rows.filter((r) => (level === 'practised' ? r.level !== 'not-started' : r.level === 'verified' || r.level === 'reviewed')).length;
  const href = (t: { taskId: string; week: number }) => `/courses/${course.id}?tab=tasks&week=${t.week}&task=${t.taskId}`;
  const gap = profile.gaps.skills[0]?.next ?? profile.gaps.domains[0]?.next;
  const indicator = (k: (typeof ABILITY_KEYS)[number]) => profile.abilities[k as keyof AbilityIndicators];
  const shown = ABILITY_KEYS.filter((k) => indicator(k).loaded);

  return (
    <section data-skills-card className="space-y-3 border-t border-line pt-5" aria-labelledby="skills-card-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 id="skills-card-title" className="text-sm font-semibold text-ink">{COPY.cardTitle}</h3>
        <p className="text-xs text-muted">{COPY.denominator}</p>
        <Link href={`/courses/${course.id}/skills`} className="text-xs font-medium text-accent hover:underline" data-skill-board-link>
          {COPY.board.title} →
        </Link>
      </div>
      {profile.rows.domains.length > 0 && (
        <div className="overflow-x-auto rounded-lg depth-edge bg-panel">
          <table className="w-full min-w-[480px] text-left text-xs" data-domains>
            <thead>
              <tr className="text-2xs uppercase tracking-wide text-muted">
                {COPY.domainColumns.map((c) => (
                  <th key={c} scope="col" className="px-3 py-2 font-semibold">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profile.rows.domains.map((r) => (
                <tr key={r.id} data-domain={r.id} data-level={r.level} className="border-t border-line align-top">
                  <td className="px-3 py-2 font-semibold text-ink">{r.label}</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-body">{r.exercisedTasks}/{r.tasks.length}</td>
                  <td className="px-3 py-2"><LevelPill level={r.level} label={LEVEL_LABEL.domains[r.level]} /></td>
                  <td className="px-3 py-2 text-body">
                    {r.next ? <Link href={href(r.next)} className="text-accent hover:underline">{r.next.title}</Link> : <span className="text-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <dl className="grid gap-2 text-xs sm:grid-cols-3">
        {LINES.map((d) => {
          const rows = profile.rows[d];
          return (
            <div key={d} data-dimension={d} className="rounded-lg bg-panel px-3 py-2">
              <dt className="font-semibold text-ink">{DIMENSION_LABEL[d]}</dt>
              <dd className="text-muted">
                {rows.length === 0
                  ? d === 'tactics' ? COPY.noTactics : COPY.emptyDimension
                  : `${reached(rows, 'verified')} ${LEVEL_LABEL[d].verified.toLowerCase()} · ${reached(rows, 'practised')} ${LEVEL_LABEL[d].practised.toLowerCase()} · ${rows.length} ${COPY.inCourse}`}
              </dd>
            </div>
          );
        })}
      </dl>
      {shown.length > 0 && (
        <div className="space-y-1">
          <p className="text-2xs text-muted">{COPY.abilityIntro}</p>
          <dl className="flex flex-wrap gap-x-4 gap-y-1 text-2xs" data-abilities>
            {shown.map((k) => {
              const v = indicator(k);
              return (
                <div key={k} className="flex items-baseline gap-1" data-ability={k}>
                  <dt className="text-muted">{COPY.abilityLabels[k]}</dt>
                  <dd className="font-semibold tabular-nums text-ink">{v.of !== undefined ? `${v.value}/${v.of}` : v.value}</dd>
                </div>
              );
            })}
          </dl>
        </div>
      )}
      <p className="text-2xs text-muted">
        {COPY.teamFact} {COPY.verifiedMeans}
        {gap && (
          <>
            {' '}
            {COPY.nextGap}: <Link href={href(gap)} className="text-accent hover:underline">{gap.title}</Link>
          </>
        )}
      </p>
    </section>
  );
}
