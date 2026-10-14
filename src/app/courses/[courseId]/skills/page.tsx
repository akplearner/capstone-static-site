'use client';

import { useState } from 'react';
import { CourseSubNav } from '@/components/CourseSubNav';
import { CourseEnrolGate } from '@/components/CourseEnrolGate';
import { PageHeader } from '@/components/ui/PageHeader';
import { Crumbs } from '@/components/SiteNav';
import { SkillBoardSkeleton } from '@/components/ui/Skeletons';
import { KpiBoard } from '@/components/skills/KpiBoard';
import { KpiTable } from '@/components/skills/KpiTable';
import { SkyMap } from '@/components/quarry/skymap/SkyMap';
import { tintVars } from '@/components/quarry/art/palette';
import { useCourse, useCourseDocument } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { useClientStore, EMPTY_OBJECT } from '@/lib/useClientStore';
import { certOf, deliverablesOf, skillsOf } from '@/lib/content/read';
import { sampleProfiles } from '@/lib/content/profiles';
import { docsRepo, evidenceRepo, progressRepo, reviewRepo, statusRepo, stepNotesRepo, submissionsRepo, taskReportsRepo } from '@/lib/data';
import type { DeliverableSubmission, DeliverableReview, EvidenceArtifact, StepEvidence, StepNote, TaskReport, VerificationReceipt, RehashCheck } from '@/lib/data/types';
import type { DeliverableData } from '@/lib/docs/types';
import type { DeliverableStatus } from '@/lib/docs/lifecycle';
import type { EnvironmentProfile } from '@/lib/docs/environmentProfile';
import { ONTOLOGY_VERSION } from '@/lib/docs/ontology';
import { skillProfile } from '@/lib/skillProfile';
import { defaultMeasure, kpiBoard, profileMeasure, workRoleMeasure, type MeasureAgainst } from '@/lib/kpiBoard';
import { skymapLayout } from '@/lib/skymap';
import { getImportedProfile, readProfileFile, setImportedProfile } from '@/lib/importedProfile';
import { deriveCrewProgress } from '@/lib/game';
import { isCapstoneFiled } from '@/lib/deliverableChain';
import { getTasksByRole, isSetupWeek } from '@/lib/course-helpers';
import { resolveActiveWeek } from '@/lib/resume';
import type { Course, Member } from '@/lib/types';

/**
 * The Skill board (R108): the competency map and the sixteen KPIs of one
 * member on one course. Not a fifth sub-nav tab; reached from the Home skills
 * card, the status surface, the dashboard card and the portfolio. Private,
 * like every course sub-route.
 *
 * The page reads the document (`skillsOf(useCourseDocument())`) and the
 * repositories, builds the same `SkillProfileInput` the Home card builds,
 * and hands the board, the layout and the words to props-only components.
 */
interface Facts {
  keys: string[];
  evidence: Record<string, StepEvidence>;
  artifacts: EvidenceArtifact[];
  docs: Record<string, DeliverableData>;
  status: DeliverableStatus[];
  submissions: DeliverableSubmission[];
  reviews: DeliverableReview[];
  notes: StepNote[];
  reports: TaskReport[];
  /** R113: the platform's receipts (null offline) and the re-hash checks. */
  receipts: Record<string, VerificationReceipt> | null;
  rehashes: RehashCheck[];
}

const EMPTY_FACTS = EMPTY_OBJECT as unknown as Facts;

const gather = (course: Course, member: Member): Facts => ({
  keys: [...progressRepo.getCompletionKeySet(course.id, member.memberId)],
  evidence: evidenceRepo.getSteps(course.id, member.memberId),
  artifacts: evidenceRepo.getArtifacts(course.id, member.memberId),
  docs: docsRepo.get(course.id, member.teamId) ?? {},
  status: statusRepo.list(course.id, member.teamId),
  submissions: submissionsRepo.list(course.id, member.teamId),
  reviews: reviewRepo.list(course.id, member.teamId),
  notes: Object.values(stepNotesRepo.getAll(course.id, member.memberId)),
  reports: taskReportsRepo.list(course.id),
  receipts: evidenceRepo.getReceipts(course.id, member.memberId),
  rehashes: evidenceRepo.getRehashes(course.id, member.memberId),
});

export default function SkillBoardPage() {
  const course = useCourse();
  const registry = skillsOf(useCourseDocument());
  const cert = certOf(useCourseDocument());
  const deliverables = deliverablesOf(useCourseDocument());
  const { member, loading } = useMember(course.id);
  const facts = useClientStore<Facts>(() => (member ? gather(course, member) : EMPTY_FACTS), EMPTY_FACTS);
  const imported = useClientStore<EnvironmentProfile | null>(() => getImportedProfile(), null);
  const [measureId, setMeasureId] = useState<string>('');
  const [importError, setImportError] = useState<string | null>(null);
  // R111: the page's clock for the currency flag; the projection reads none.
  const [asOf] = useState(() => Date.now());

  if (loading) return <SkillBoardSkeleton />;
  if (!member || facts === EMPTY_FACTS) return <CourseEnrolGate courseId={course.id} what="the skill board" />;

  const { COPY, LEVEL_LABEL } = registry;
  const copy = COPY.board;
  const keySet = new Set(facts.keys);
  const weekStats: Record<number, number> = {};
  const taskStats: Record<string, number> = {};
  for (const w of [...course.weeks].sort((a, b) => a.number - b.number)) {
    weekStats[w.number] = progressRepo.getWeekCompletion(course, member.memberId, member.role, w.number, keySet);
    for (const t of getTasksByRole(course, member.role, w.number)) taskStats[t.id] = progressRepo.getTaskPercent(course.id, member.memberId, t, keySet);
  }
  const activeWeek = resolveActiveWeek(course, member.role, weekStats, null);
  const capstoneFiled = isCapstoneFiled(course.id, facts.docs);
  const crew = deriveCrewProgress(course, member.role, weekStats, taskStats, capstoneFiled);
  const profile = skillProfile({
    course,
    role: member.role,
    memberId: member.memberId,
    isStepDone: (t, s) => progressRepo.isStepComplete(course.id, member.memberId, t, s, keySet),
    evidence: facts.evidence,
    artifacts: facts.artifacts,
    registry,
    cert,
    deliverables,
    team: { docs: facts.docs, status: facts.status, submissions: facts.submissions, reviews: facts.reviews, currentWeek: activeWeek },
    own: { notes: facts.notes, reports: facts.reports },
    asOf,
    receipts: facts.receipts,
    rehashes: facts.rehashes,
  });

  const workRoleIds = registry.WORK_ROLE_OF[member.role] ?? [];
  const workRoles = workRoleIds.map((id) => registry.WORK_ROLES.find((w) => w.id === id)).filter((w): w is NonNullable<typeof w> => !!w);
  // The imported profile wins over a published one with the same id, so a company's newer file replaces the sample.
  const options: MeasureAgainst[] = [
    ...workRoles.map(workRoleMeasure),
    ...(imported ? [profileMeasure(imported, workRoleIds)] : []),
    ...sampleProfiles().filter((p) => p.id !== imported?.id).map((p) => profileMeasure(p, workRoleIds)),
  ];
  const measure = options.find((o) => o.id === measureId) ?? options[0] ?? defaultMeasure(registry, member.role);
  const board = kpiBoard({ profile, registry, cert, measure, outcome: { capstoneFiled, weeksCleared: crew.weeksCleared, weeksTotal: crew.weeksTotal }, ontologyVersion: ONTOLOGY_VERSION });
  const layout = skymapLayout(profile.rows.skills, registry.AREAS, getTasksByRole(course, member.role).filter((t) => !isSetupWeek(course, t.week)).map((t) => t.id));
  const hero = { value: board.kpis[0].value, of: board.kpis[0].of };
  const perTool = profile.rows.tools.filter((r) => r.verifiableSteps > 0).map((r) => ({ label: r.label, value: r.verifiedSteps, of: r.verifiableSteps }));
  const href = (next: { taskId: string; week: number }) => `/courses/${course.id}?tab=tasks&week=${next.week}&task=${next.taskId}`;

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    const read = readProfileFile(await file.text());
    if ('profile' in read) {
      setImportedProfile(read.profile);
      setMeasureId(read.profile.id);
      setImportError(null);
    } else {
      setImportError(`${copy.importFailed}: ${read.errors[0]}`);
    }
  };

  return (
    <div className="space-y-8">
      <CourseSubNav courseId={course.id} active="home" teamId={member.teamId} />

      <PageHeader
        eyebrow={<Crumbs items={[{ label: 'Home', href: '/' }, { label: course.title, href: `/courses/${course.id}` }, { label: copy.title }]} />}
        title={copy.title}
        lede={copy.lede}
        trailing={
          <div className="flex flex-wrap items-end gap-3 text-sm" data-measure-picker>
            <label>
              <span className="block font-medium text-body">{copy.measuredAgainst}</span>
              <select value={measure.id} onChange={(e) => setMeasureId(e.target.value)} className="mt-1 max-w-full text-sm" aria-label={copy.measuredAgainst}>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="cursor-pointer font-medium text-accent hover:underline">
              {copy.importProfile}
              <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void onImport(e.target.files?.[0])} />
            </label>
            {importError && (
              <p role="alert" className="basis-full text-xs text-danger" data-import-error>
                {importError}
              </p>
            )}
          </div>
        }
      />

      <div style={tintVars(course.id)}>
        <SkyMap layout={layout} levelLabel={LEVEL_LABEL.skills} copy={copy} hero={hero} href={href} />
      </div>

      <KpiBoard board={board} defs={registry.KPIS} families={registry.KPI_FAMILIES} workRoles={workRoles} copy={copy} persistenceLabel={COPY.abilityLabels.persistence} weeks={{ value: crew.weeksCleared, of: crew.weeksTotal }} />

      <KpiTable board={board} defs={registry.KPIS} families={registry.KPI_FAMILIES} copy={copy} perTool={perTool} />

      <p className="text-xs text-muted">
        {COPY.denominator} {COPY.teamFact} {COPY.verifiedMeans} {COPY.noSpeed}
      </p>
    </div>
  );
}
