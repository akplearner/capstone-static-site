'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  Inbox,
  Lightbulb,
  Lock,
  RotateCcw,
  Search,
  Sparkles,
  Tag,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Collapsible } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { toast } from '@/components/ui/Toast';
import { StepDetail } from '@/components/TaskComponents';
import { GuidedTaskRunner } from '@/components/GuidedTaskRunner';
import { TaskThisWeek } from '@/components/TaskThisWeek';
import { CourseSubNav } from '@/components/CourseSubNav';
import { WeekTaskFlow } from '@/components/diagrams/WeekTaskFlow';
import { socTopology } from '@/lib/labTopology';
import { WeekGatePanel } from '@/components/WeekGatePanel';
import { WeekMilestoneHeader } from '@/components/WeekMilestoneHeader';
import { RoleIcon } from '@/components/RoleIcon';
import { EmptyState } from '@/components/EmptyState';
import { CourseEnrolGate } from '@/components/CourseEnrolGate';
import { SignInPanel } from '@/components/auth/SignInPanel';
import { ImportPrompt } from '@/components/auth/ImportPrompt';
import { LabAccessPanel } from '@/components/LabAccessPanel';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { useAuth } from '@/lib/useAuth';
import { useInstructorAuth } from '@/lib/useInstructorAuth';
import { useSupabaseSync } from '@/lib/useSupabaseSync';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { progressRepo, userStateRepo, docsRepo } from '@/lib/data';
import { useClientStore, EMPTY_OBJECT, notifyStore } from '@/lib/useClientStore';
import { getRoleDef, getTaskById, getTasksByRole, getWeekTasks, isEngagement, isSetupWeek, phaseTag, taskCard, unitWord } from '@/lib/course-helpers';
import { readResume, resolveActiveWeek, type ResumePoint } from '@/lib/resume';
import { deriveCrewProgress } from '@/lib/game';
import { StepTally, PixelBadge } from '@/components/ui/Pixel';
import { CapstoneStonePanel } from '@/components/quarry/CapstoneStone';
import { phaseForWeek, stageForWeek } from '@/lib/quarry';
import { WeekVerbIcon, verbForStage } from '@/components/quarry/items';
import { isCapstoneFiled, isDeliverableFiled } from '@/lib/deliverableChain';
import { courseIdentityLabel } from '@/lib/courseTheme';
import { EngagementBanner } from '@/components/EngagementBanner';
import { EngagementStatus } from '@/components/EngagementStatus';
import { deliverablesForCourse } from '@/lib/docs/definitions';
import { ServerTopologyDiagram } from '@/components/diagrams/ServerTopologyDiagram';
import { emptyData, type DeliverableData } from '@/lib/docs/types';
import { LifecycleFlow } from '@/components/diagrams/LifecycleFlow';
import { roleGuide, worksLabel } from '@/lib/roleGuide';
import { getFrameworkColor, getFrameworkLabel, getMonthlyCohorts } from '@/lib/utils';
import { composeTeamId, parseTeamId, teamLabel } from '@/lib/team';
import { Course, GateStatus, Member, RoleDef, Task } from '@/lib/types';
import { SOC_LOGIN_LABEL, SOC_URL } from '@/lib/labTopology';

// Monthly cohorts (YYYY-MM), generated for the next 12 months.
const COHORTS = getMonthlyCohorts(12);

type CourseStats = {
  weekStats: Record<number, number>;
  taskStats: Record<string, number>;
  gateStats: Record<number, GateStatus>;
  /** The week to open on load — where the student stopped, else the first
   *  incomplete non-setup week. See src/lib/resume.ts. */
  activeWeek: number;
  /** The exact checkbox the student last ticked, if we still have it. */
  resume: ResumePoint | null;
};
const EMPTY_STATS: CourseStats = {
  weekStats: {},
  taskStats: {},
  gateStats: {},
  activeWeek: 1,
  resume: null,
};

/** Inline enrollment: pick a team (capacity-aware) and role without leaving the page. */
function JoinPanel({
  course,
  member,
  userId,
  requireAuth,
  onJoined,
}: {
  course: Course;
  member: Member | null;
  /** Supabase auth user id (null when signed out). Becomes the member id. */
  userId: string | null;
  /** When true (Supabase configured), joining requires sign-in first. */
  requireAuth: boolean;
  onJoined: (m: Member) => void;
}) {
  const teamCount = course.teamCount ?? 3;
  const cap = course.teamCapacity ?? 0; // 0 = unlimited
  const teamIds = Array.from({ length: Math.max(1, teamCount) }, (_, i) => String(i + 1));

  const [editing, setEditing] = useState(!member);
  const counts = useClientStore<Record<string, number>>(
    () => progressRepo.getTeamCounts(course.id),
    EMPTY_OBJECT
  );
  const [name, setName] = useState(member?.displayName ?? '');
  const [cohort, setCohort] = useState(member?.cohort ?? COHORTS[0]);
  // The picker holds the bare team NUMBER; the cohort-scoped id is composed on
  // submit (see src/lib/team.ts — Team 1 of one class session must never share
  // stores with Team 1 of another).
  const [team, setTeam] = useState(member ? parseTeamId(member.teamId).num : teamIds[0]);
  const [role, setRole] = useState(member?.role ?? course.roles[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);

  // Counts are keyed by the scoped id, so capacity fills per class session.
  const usedOf = (t: string) => counts[composeTeamId(cohort, t)] ?? 0;
  // A team is full only for students not already on it.
  const isFull = (t: string) =>
    cap > 0 && usedOf(t) >= cap && !(member && member.teamId === composeTeamId(cohort, t));

  const submit = () => {
    if (!name.trim()) {
      setError('Please enter your name to continue.');
      return;
    }
    // When auth is on, the Supabase user id IS the member id (stable across devices);
    // otherwise fall back to the local synthesized id.
    const newMember: Member = {
      memberId:
        userId ?? member?.memberId ?? `${course.id}-${cohort}-${team}-${role}-${Date.now()}`,
      courseId: course.id,
      teamId: composeTeamId(cohort, team),
      role,
      displayName: name.trim(),
      cohort,
    };
    const res = progressRepo.joinTeam(course, newMember);
    if (!res.ok) {
      setError(
        res.reason === 'team-full'
          ? 'That team is full — pick another team.'
          : 'Could not join this team. Try again.'
      );
      notifyStore();
      return;
    }
    setError(null);
    setEditing(false);
    onJoined(newMember);
  };

  // Auth gate: when Supabase is on, you must sign in before joining a team so your
  // progress is tied to your account and visible to teammates.
  if (requireAuth && !userId) {
    return (
      <SignInPanel
        title="Sign in to join a team"
        subtitle="Joining a team saves your progress to your account and lets your teammates see your work. Sign in to continue — you can keep browsing the course either way."
      />
    );
  }

  // Compact summary once enrolled.
  if (member && !editing) {
    const rd = getRoleDef(course, member.role);
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-panel p-5">
        <div className="flex items-center gap-3">
          <RoleIcon iconName={rd?.icon} className="h-7 w-7" color={rd?.color} />
          <div>
            <div className="font-semibold text-ink">{member.displayName}</div>
            <div className="text-sm text-muted">
              {teamLabel(member.teamId)} · {rd?.name ?? member.role} · {member.cohort}
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Change team or role
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-lg border-2 border-accent/30 bg-accent-soft/50 p-6">
      <div>
        <h2 className="text-xl font-bold text-ink">Join this course</h2>
        <p className="mt-1 text-sm text-muted">
          Pick a team and a role to unlock the weekly tasks below.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="block text-sm font-medium text-body">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Your name"
            className="mt-2 w-full rounded-lg border border-line bg-panel px-4 py-2 text-ink"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-body">Cohort</span>
          <select
            value={cohort}
            onChange={(e) => setCohort(e.target.value)}
            className="mt-2 w-full rounded-lg border border-line bg-panel px-4 py-2 text-ink"
          >
            {COHORTS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <span className="block text-sm font-medium text-body">Team</span>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {teamIds.map((t) => {
            const full = isFull(t);
            const selected = team === t;
            return (
              <button
                key={t}
                type="button"
                disabled={full}
                onClick={() => setTeam(t)}
                className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                  selected
                    ? 'border-accent bg-accent-soft text-accent-ink'
                    : full
                      ? 'cursor-not-allowed border-line bg-panel-2 text-muted opacity-60'
                      : 'border-line bg-panel text-body hover:border-accent'
                }`}
              >
                <span>Team {t}</span>
                <span className="mt-0.5 block text-[11px] font-normal">
                  {cap > 0 ? `${usedOf(t)}/${cap}${full ? ' · Full' : ''}` : `${usedOf(t)} joined`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {course.roles.length > 0 && (
        <div>
          <span className="block text-sm font-medium text-body">Role</span>
          <div className="mt-2 space-y-2">
            {course.roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors ${
                  role === r.id
                    ? 'border-accent bg-accent-soft'
                    : 'border-line bg-panel hover:border-accent'
                }`}
              >
                <RoleIcon iconName={r.icon} className="mt-0.5 h-5 w-5 shrink-0" color={r.color} />
                <span>
                  <span className="block font-medium text-ink">{r.name}</span>
                  <span className="block text-xs text-muted">{roleGuide(r.id, course.id).blurb}</span>
                  <span className="mt-0.5 block text-[11px] text-muted">
                    {worksLabel(roleGuide(r.id, course.id).works)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={submit} size="lg">
          {member ? 'Save changes' : 'Join course'}
        </Button>
        {member && (
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

/** Read-only view of a task's steps (used for other roles' reference content). */
function TaskReference({ task }: { task: Task }) {
  return (
    <div className="space-y-3">
      {task.steps.map((s, i) => (
        <div key={s.id} className="rounded-lg border border-line bg-panel-2 p-4">
          <div className="eyebrow-muted">
            Step {i + 1}
          </div>
          <h4 className="mt-0.5 font-semibold text-ink">{s.title}</h4>
          <div className="mt-3">
            <StepDetail
              instruction={s.instruction}
              description={s.description}
              command={s.command}
              commands={s.commands}
              commandExplanation={s.commandExplanation}
              commandFlags={s.commandFlags}
              expectedOutput={s.expectedOutput}
              outputExplanation={s.outputExplanation}
              whatItMeans={s.whatItMeans}
              frameworks={s.frameworks}
              deliverable={s.producesDeliverable}
              usesForm={s.usesForm}
              danger={s.danger}
              troubleshooting={s.troubleshooting}
              verify={s.verify}
              optional={s.optional}
              where={s.where}
              path={s.path}
              files={s.files}
              tree={s.tree}
              walkthrough={s.walkthrough}
              images={s.images}
              outputHighlights={s.outputHighlights}
              outputKind={s.outputKind}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** One row of the card: a label and its content, omitted entirely when there is
 *  nothing to show. Keeping the omission here is what lets a course that never
 *  authored `learn` or `consumes` render a shorter card rather than a card full
 *  of empty headings. */
function CardRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
      <div className="min-w-0 flex-1">
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted">{label}</span>
        <div className="mt-0.5 text-sm text-ink">{children}</div>
      </div>
    </div>
  );
}

/**
 * A single collapsible task, stating everything it is.
 *
 * The header stays scannable — title, status, size, time — and the detail rows
 * underneath answer the questions a student actually has before starting: what
 * do I need first and from whom, what will I produce, and who is waiting on it.
 * Those three were all authored in the seed data and none of them were rendered:
 * deliverables appeared only as a count, `handoff[].note` was dropped, and
 * nothing showed inputs at all.
 */
function TaskRow({
  course,
  task,
  isOwn,
  joined,
  open,
  percent,
  onToggle,
  isNext,
  children,
}: {
  course: Course;
  task: Task;
  isOwn: boolean;
  joined: boolean;
  open: boolean;
  percent: number;
  onToggle: () => void;
  isNext?: boolean;
  children: React.ReactNode;
}) {
  const canOpen = joined;
  const card = taskCard(course, task, percent);
  const steps = card.steps.total;
  const doneSteps = card.steps.done;
  const showProgress = isOwn && joined;
  const roleName = (id: string) => getRoleDef(course, id)?.name ?? id;

  return (
    <div
      id={`task-${task.id}`}
      // Stratum 2: a task is cut *into* the week, so it sits inset and a shade
      // darker rather than repeating the week's card treatment.
      className="stratum-task scroll-mt-24 overflow-hidden"
    >
      <button
        type="button"
        disabled={!canOpen}
        onClick={() => canOpen && onToggle()}
        className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${
          canOpen ? 'hover:bg-panel-2' : 'cursor-not-allowed opacity-70'
        }`}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="font-medium text-ink">{task.title}</span>
            {showProgress && percent === 100 && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" />
            )}
            {isNext && percent < 100 && (
              <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-ink">
                Next
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-sm text-muted">
            {task.objective}
          </span>

          {/* Scannable meta row — only what's specific to this closed task:
              progress and time. Difficulty lives on the week glance card (a
              task's difficulty is the week's); the optional-step count is on
              the runner toolbar once open ("N of M · x optional"); hand-offs
              render in full on the open task's identity strip. The collapsed
              row restating those was 11 elements before a student had read a
              single instruction. */}
          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            {showProgress ? (
              <span className="flex items-center gap-1.5" title={`${percent}% done`}>
                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-line">
                  <span
                    className="block h-full rounded-full bg-accent"
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="text-muted">
                  {doneSteps}/{steps} steps
                </span>
              </span>
            ) : (
              <span className="text-muted">{steps} steps</span>
            )}
            {task.estimatedTime && (
              <span className="flex items-center gap-1 text-muted">
                <Clock className="h-3.5 w-3.5" /> {task.estimatedTime}
              </span>
            )}
          </span>
        </span>

        <span className="flex shrink-0 items-center gap-3 pt-0.5">
          {!canOpen ? (
            <Lock className="h-4 w-4 text-muted" />
          ) : open ? (
            <ChevronDown className="h-5 w-5 text-muted" />
          ) : (
            <ChevronRight className="h-5 w-5 text-muted" />
          )}
        </span>
      </button>

      {open && canOpen && (
        <div className="border-t border-line p-4">
          {/* The task's identity card: what it needs, what it makes, where it
              goes. Rendered above the steps because these are the questions you
              have *before* you start, not after. */}
          {(card.inputs.length > 0 || card.produces.length > 0 || card.handoff.length > 0) && (
            <div className="mb-4 grid gap-3 rounded-lg border border-line bg-panel px-3.5 py-3 sm:grid-cols-3">
              {card.inputs.length > 0 && (
                <CardRow icon={Inbox} label="You need first">
                  <ul className="space-y-0.5">
                    {card.inputs.map((i, n) => (
                      <li key={`${i.label}-${n}`}>
                        {i.from && (
                          <span
                            className="font-semibold"
                            style={{ color: getRoleDef(course, i.from)?.color }}
                          >
                            {roleName(i.from)}:{' '}
                          </span>
                        )}
                        {i.label}
                      </li>
                    ))}
                  </ul>
                </CardRow>
              )}
              {card.produces.length > 0 && (
                <CardRow icon={FileText} label="You produce">
                  <ul className="space-y-0.5">
                    {/* The filenames, not a count — this is what the student
                        actually has to create and hand in. */}
                    {card.produces.map((d) => (
                      <li key={d} className="break-all font-mono text-[11px]">
                        {d}
                      </li>
                    ))}
                  </ul>
                </CardRow>
              )}
              {card.handoff.length > 0 && (
                <CardRow icon={ArrowRight} label="Hand off to">
                  <ul className="space-y-0.5">
                    {card.handoff.map((h, n) => (
                      <li key={`${h.to}-${n}`}>
                        <span
                          className="font-semibold"
                          style={{ color: getRoleDef(course, h.to)?.color }}
                        >
                          {roleName(h.to)}
                        </span>
                        {h.artifact ? ` — ${h.artifact}` : ''}
                        {/* h.note was authored on every handoff and rendered
                            nowhere; it is the sentence that says *why*. */}
                        <span className="text-muted"> · {h.note}</span>
                      </li>
                    ))}
                  </ul>
                </CardRow>
              )}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

/** Header strip for a role group within a week. */
/**
 * "Your team's business" — the dropdown that makes the topology yours.
 *
 * Writes the SAME team-scoped record the Week-1 Business Requirements form
 * fills (`srv_business_reqs` via docsRepo), so there is one source of truth:
 * pick the industry here and the form on the Deliverables page is already
 * started; fill the form there and this card shows it. Team selection itself
 * lives in the JoinPanel below ("Change team or role").
 */
const BUSINESS_INDUSTRIES = ['Manufacturing', 'Healthcare', 'Retail', 'MSP / IT services', 'Logistics', 'Professional services', 'Other'];

function TeamBusinessPicker({
  courseId,
  teamId,
  onBusiness,
}: {
  courseId: string;
  teamId: string;
  onBusiness: (b: { name?: string; industry?: string }) => void;
}) {
  const saved = useClientStore<Record<string, DeliverableData>>(
    () => docsRepo.get(courseId, teamId) ?? EMPTY_OBJECT,
    EMPTY_OBJECT
  );
  const data = saved['srv_business_reqs'] ?? emptyData();
  const name = data.fields.client ?? '';
  const industry = data.fields.industry ?? '';
  const other = data.fields.industry_other ?? '';

  // Lift the current choice so the topology diagram can label itself. An
  // effect, not a render-time call — setState during a sibling's render is a
  // React error.
  const industryLabel = industry === 'Other' && other ? other : industry;
  useEffect(() => {
    onBusiness({ name: name || undefined, industry: industryLabel || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, industryLabel]);

  const setField = (field: string, value: string) => {
    const current = docsRepo.get(courseId, teamId) ?? {};
    const doc = current['srv_business_reqs'] ?? emptyData();
    docsRepo.save(courseId, teamId, {
      ...current,
      srv_business_reqs: { ...doc, fields: { ...doc.fields, [field]: value } },
    });
    notifyStore();
  };

  return (
    <div className="rounded-lg border border-line bg-panel p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-ink">Your team&apos;s business</div>
          <p className="mt-0.5 text-xs text-muted">
            The base build is the same for every team — this decides what the extra VMs are for.
            Saved into your Architecture Brief.
          </p>
        </div>
        <label className="block">
          <span className="block text-xs font-medium text-body">Business name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setField('client', e.target.value)}
            placeholder="e.g. Granite Peak Aggregates"
            className="mt-1 w-48 rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-body">Type of business</span>
          <select
            value={industry}
            onChange={(e) => setField('industry', e.target.value)}
            className="mt-1 w-48 rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none"
          >
            <option value="">Choose…</option>
            {BUSINESS_INDUSTRIES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </label>
        {industry === 'Other' && (
          <label className="block">
            <span className="block text-xs font-medium text-body">Describe it</span>
            <input
              type="text"
              value={other}
              onChange={(e) => setField('industry_other', e.target.value)}
              placeholder="e.g. A veterinary clinic chain"
              className="mt-1 w-56 rounded-lg border border-line bg-panel px-3 py-1.5 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"
            />
          </label>
        )}
      </div>
    </div>
  );
}

function RoleGroupHeader({ role, tag }: { role: RoleDef; tag?: string }) {
  return (
    <div className="flex items-center gap-2">
      <RoleIcon iconName={role.icon} className="h-5 w-5" color={role.color} />
      <span className="font-semibold text-ink">{role.name}</span>
      {tag === 'own' && (
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-ink">
          Your role
        </span>
      )}
      {/* On a shared-track course the role is a documentation focus, not a lane
          of work, and calling it "your role" beside a shared build reads as if
          the build belonged to someone else. */}
      {tag === 'focus' && (
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-ink">
          Your focus
        </span>
      )}
      {tag === 'reference' && (
        <span className="text-xs text-muted">reference</span>
      )}
    </div>
  );
}

export default function CoursePage() {
  const course = useCourse();
  const { member, loading, setMember } = useMember(course.id);
  const { user } = useAuth();
  const { unlocked: instructorOverride } = useInstructorAuth();
  useSupabaseSync(course.id);
  const requireAuth = isSupabaseConfigured();
  const [teamBusiness, setTeamBusiness] = useState<{ name?: string; industry?: string }>({});
  const [confirmingReset, setConfirmingReset] = useState(false);
  // The Week-0 build task is only for students setting up their own lab from home;
  // the classroom SOC is already built. Gate its expansion behind a confirmation
  // (persisted per device) so students don't do the build work they don't need.
  const [homeBuildDialog, setHomeBuildDialog] = useState(false);
  const [pendingHomeBuild, setPendingHomeBuild] = useState<Task | null>(null);
  const homeBuildAck = useClientStore<boolean>(
    () => (member ? userStateRepo.get(course.id, member.memberId)?.homeBuildAck === true : false),
    false
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  // null = the student hasn't toggled weeks yet, so the active week shows open by
  // default; once they interact we track their explicit set.
  const [openWeeks, setOpenWeeks] = useState<Set<number> | null>(null);
  const [openRefs, setOpenRefs] = useState<Set<number>>(new Set());
  const [tab, setTab] = useState<'overview' | 'weeks'>('overview');
  // Honor a ?tab=weeks deep-link (used by the shared nav on sub-pages). Done in an
  // effect (not a lazy initializer) so server and client first render match — avoids
  // a hydration mismatch; the one-shot sync on mount is intentional.
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'weeks') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab('weeks');
    }
  }, []);
  const [query, setQuery] = useState('');

  // Progress writes broadcast through the store; useClientStore re-reads below.
  const onProgressChange = useCallback(() => notifyStore(), []);

  // Derived from one batched localStorage scan (week %, task %, gate status, and
  // the first-incomplete "active" week), kept live via the store subscription.
  const { weekStats, taskStats, gateStats, activeWeek, resume } = useClientStore<CourseStats>(() => {
    const weeks: Record<number, number> = {};
    const tasks: Record<string, number> = {};
    const gates: Record<number, GateStatus> = {};
    let resumePoint: ResumePoint | null = null;
    if (member) {
      const keySet = progressRepo.getCompletionKeySet(course.id, member.memberId);
      [...course.weeks]
        .sort((a, b) => a.number - b.number)
        .forEach((w) => {
          weeks[w.number] = progressRepo.getWeekCompletion(
            course, member.memberId, member.role, w.number, keySet
          );
          getTasksByRole(course, member.role, w.number).forEach((t) => {
            tasks[t.id] = progressRepo.getTaskPercent(course.id, member.memberId, t, keySet);
          });
        });
      course.gates.forEach((g) => {
        gates[g.id] = progressRepo.deriveGateStatus(course, member.memberId, member.role, g, keySet);
      });
      resumePoint = readResume(course, member.memberId);
    }
    return {
      weekStats: weeks,
      taskStats: tasks,
      gateStats: gates,
      activeWeek: resolveActiveWeek(course, member?.role ?? '', weeks, resumePoint),
      resume: resumePoint,
    };
  }, EMPTY_STATS);

  // Exactly one week opens by default: the one the student stopped in. Everything
  // else stays collapsed until they click it, which is why `openWeeks` starts
  // null (untouched) rather than pre-populated. The setup week is never opened
  // automatically — in class the lab already exists, so leading with the build
  // steps sends students to work they don't need to do.
  const defaultOpenWeeks = useMemo(() => new Set<number>([activeWeek]), [activeWeek]);
  const effectiveOpenWeeks = openWeeks ?? defaultOpenWeeks;

  // Open the task the student stopped in, exactly once, after progress has been
  // read on the client. Progress is client-only, so this can't be a lazy state
  // initializer without a hydration mismatch — the server would render a
  // different set of open panels than the client. The ref makes it one-shot so
  // it never fights a manual collapse later in the session. Must sit above the
  // early returns below to keep hook order stable.
  const resumeApplied = useRef(false);
  useEffect(() => {
    if (resumeApplied.current || !resume) return;
    resumeApplied.current = true;
    const taskId = resume.taskId;
    setExpanded((prev) => new Set(prev).add(taskId));
    if (
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('tab') === 'weeks'
    ) {
      setTimeout(
        () =>
          document
            .getElementById(`task-${taskId}`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        60
      );
    }
  }, [resume]);

  if (loading) return <LoadingBlock />;

  if (course.locked) {
    return (
      <EmptyState
        title="Course locked"
        message="This course is locked by the instructor and isn’t open yet. Check back later."
        href="/"
        cta="Browse courses"
      />
    );
  }

  const joined = !!member;
  const sortedWeeks = [...course.weeks].sort((a, b) => a.number - b.number);

  // Gate sequencing: a week stays locked until the previous week's gate is passed,
  // so students work in order. Instructors (or local dev passcode) bypass it.
  const priorGateForWeek = (weekNum: number) => course.gates.find((g) => g.week === weekNum - 1);
  const weekLocked = (weekNum: number): boolean => {
    if (!joined || instructorOverride || course.noGatekeeping) return false;
    const pg = priorGateForWeek(weekNum);
    return !!pg && (gateStats[pg.id] || 'locked') !== 'passed';
  };
  // Whole-course completion. With gatekeeping, every gate must be passed. With
  // no gatekeeping (CySA), it's simply every week at 100% for your role.
  const allWeeksComplete =
    joined && course.weeks.length > 0 && course.weeks.every((w) => (weekStats[w.number] ?? 0) >= 100);
  const allGatesPassed = course.noGatekeeping
    ? allWeeksComplete
    : joined && course.gates.length > 0 && course.gates.every((g) => (gateStats[g.id] || 'locked') === 'passed');

  const scrollTo = (elementId: string, block: ScrollLogicalPosition = 'start') => {
    if (typeof document !== 'undefined') {
      setTimeout(
        () => document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth', block }),
        60
      );
    }
  };

  const openWeek = (n: number) =>
    setOpenWeeks((prev) => new Set(prev ?? [activeWeek]).add(n));

  const openAndScrollWeek = (n: number) => {
    setTab('weeks');
    openWeek(n);
    scrollTo(`week-${n}`);
  };

  const goToTask = (task: Task) => {
    setTab('weeks');
    openWeek(task.week);
    setExpanded((prev) => new Set(prev).add(task.id));
    scrollTo(`task-${task.id}`, 'center');
  };

  const toggleSet =
    <T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>) =>
    (value: T) =>
      setter((prev) => {
        const next = new Set(prev);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        return next;
      });

  const toggle = toggleSet(setExpanded);
  const toggleRef = toggleSet(setOpenRefs);

  // Expanding a task pins its week open, so finishing the task (which advances
  // activeWeek) doesn't auto-collapse the week and hide the "Next task →" CTA.
  const toggleTask = (task: Task) => {
    // Home-lab-only build tasks confirm before revealing (once per device).
    if (task.homeLabOnly && !homeBuildAck && !expanded.has(task.id)) {
      setPendingHomeBuild(task);
      setHomeBuildDialog(true);
      return;
    }
    openWeek(task.week);
    toggle(task.id);
  };

  const confirmHomeBuild = () => {
    if (member) {
      const existing = userStateRepo.get(course.id, member.memberId) ?? {};
      userStateRepo.save(course.id, member.memberId, { ...existing, homeBuildAck: true });
    }
    notifyStore();
    setHomeBuildDialog(false);
    if (pendingHomeBuild) {
      openWeek(pendingHomeBuild.week);
      toggle(pendingHomeBuild.id);
      setPendingHomeBuild(null);
    }
  };

  const toggleWeek = (n: number) =>
    setOpenWeeks((prev) => {
      const next = new Set(prev ?? [activeWeek]);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  const confirmReset = () => {
    if (!member) return;
    progressRepo.resetCourse(course.id, member.memberId);
    setExpanded(new Set());
    setConfirmingReset(false);
    notifyStore();
    toast({ message: 'Your progress was reset.', variant: 'success' });
  };

  const ownRole = member ? getRoleDef(course, member.role) : undefined;
  const otherRoles = member ? course.roles.filter((r) => r.id !== member.role) : course.roles;

  // "Your next step" across the student's own tasks. The course-level step
  // total that used to live here is gone with the duplicate percentage it fed —
  // `crew.stepsDone / stepsTotal` is the single source for that now.
  const ownTasksAll = member ? getTasksByRole(course, member.role) : [];
  const tasksComplete = ownTasksAll.filter((t) => (taskStats[t.id] ?? 0) === 100).length;
  // Crew progress: the Capstone Stone's stage plus professional milestones, all
  // derived from the percentages computed above — no points, no stored score.
  // The final stage additionally needs the capstone document filed, because
  // "defended" has to mean handed over rather than merely finished.
  const savedDocs = member ? docsRepo.get(course.id, member.teamId) : null;
  const crew = deriveCrewProgress(
    course,
    member?.role ?? '',
    weekStats,
    taskStats,
    isCapstoneFiled(course.id, savedDocs)
  );

  // "Continue" points at real coursework. Setup weeks and home-lab-only build
  // tasks are opt-in, so an untouched Week 0 must not hold the CTA hostage —
  // that was the old behaviour and it never advanced.
  let nextTask: Task | undefined;
  if (member) {
    for (const w of sortedWeeks) {
      if (isSetupWeek(course, w.number)) continue;
      const t = getTasksByRole(course, member.role, w.number).find(
        (tk) => !tk.homeLabOnly && (taskStats[tk.id] ?? 0) < 100
      );
      if (t) {
        nextTask = t;
        break;
      }
    }
  }

  // "This week" context for the role hero.
  const contentWeeks = sortedWeeks.filter((w) => w.number >= 1);
  const tasksLeftThisWeek = member
    ? getTasksByRole(course, member.role, activeWeek).filter((t) => (taskStats[t.id] ?? 0) < 100).length
    : 0;
  // Task search (Weekly Tasks tab). Matches title, objective, or framework; an
  // active query force-opens every week so matches are visible without clicking.
  const q = query.trim().toLowerCase();
  const matchesQuery = (task: Task) =>
    !q ||
    task.title.toLowerCase().includes(q) ||
    task.objective.toLowerCase().includes(q) ||
    task.frameworks.some(
      (fw) => fw.toLowerCase().includes(q) || getFrameworkLabel(fw).toLowerCase().includes(q)
    );
  const anyMatches = sortedWeeks.some((w) => getWeekTasks(course, w.number).some(matchesQuery));

  // Expanded content for a task row (deliverables + the runner or read-only steps).
  const renderTaskBody = (task: Task, isOwn: boolean) => {
    // Prerequisites, produced files and hand-offs are shown once — in the
    // 3-column identity strip at the top of the open task (TaskRow, above). The
    // brief holds only orientation: what you'll learn, the frameworks it maps to,
    // and the done-criteria. An earlier amber strip repeated the prereq/hand-off
    // pair here; it was a strict subset of the identity strip, so it's gone.
    // The concrete plan (the ordered steps) and the done-criteria are always
    // visible above the brief now — a student shouldn't have to open anything to
    // learn what they're doing this week or what "finished" means.
    const hasBrief = !!(task.learn?.length || task.frameworks?.length || task.tools?.length);
    return (
    <>
      <TaskThisWeek task={task} />
      {hasBrief && (
        <div className="mb-4 rounded-lg border border-line px-4">
          <Collapsible title="Task brief — tools, what you'll learn & frameworks" defaultOpen={false}>
            <div className="space-y-3 py-2">
        <div className="space-y-3 rounded-lg border border-line bg-panel-2 p-3">
          {/* The tools for THIS task. They used to be aggregated into a
              single week-wide chip strip above every task — a dozen chips a
              student had to map back onto the right task themselves. Two or
              three, beside the work they belong to, is the useful form. */}
          {task.tools && task.tools.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 eyebrow-muted">
                <Wrench className="h-3.5 w-3.5" /> Tools
              </span>
              {task.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded border border-line bg-panel-2 px-1.5 py-0.5 font-mono text-[11px] text-ink"
                >
                  {tool}
                </span>
              ))}
            </div>
          )}
          {task.learn && task.learn.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 eyebrow-muted">
                <GraduationCap className="h-3.5 w-3.5" /> What you&apos;ll learn
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-body">
                {task.learn.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          )}
          {/* Framework mappings live here, not on the card: they matter for cert
              alignment but aren't something a beginner acts on step to step, and a
              row of rainbow tags was a big share of the card's on-screen colour. */}
          {task.frameworks.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="flex items-center gap-1 eyebrow-muted">
                <Tag className="h-3.5 w-3.5" /> Frameworks
              </span>
              {task.frameworks.map((fw) => (
                <span
                  key={fw}
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getFrameworkColor(fw)}`}
                >
                  {getFrameworkLabel(fw)}
                </span>
              ))}
            </div>
          )}
        </div>
            </div>
          </Collapsible>
        </div>
      )}
      {isOwn && member ? (
        (() => {
          // The next incomplete task for this role, ordered by week, excluding this one.
          let following: Task | undefined;
          for (const w of sortedWeeks) {
            const t = getTasksByRole(course, member.role, w.number).find(
              (tk) => tk.id !== task.id && (taskStats[tk.id] ?? 0) < 100
            );
            if (t) { following = t; break; }
          }
          return (
            <GuidedTaskRunner
              task={task}
              courseId={course.id}
              memberId={member.memberId}
              onProgressChange={onProgressChange}
              nextLabel={following ? 'Next task →' : 'Review & finish →'}
              onNext={() => {
                setExpanded((prev) => {
                  const n = new Set(prev);
                  n.delete(task.id);
                  return n;
                });
                if (following) {
                  goToTask(following);
                } else {
                  setTab('overview');
                  if (typeof window !== 'undefined') {
                    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 60);
                  }
                }
              }}
            />
          );
        })()
      ) : (
        <TaskReference task={task} />
      )}
    </>
    );
  };

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header — title, credential, one sentence.
          This block sits above the sub-nav, so whatever is here renders on
          every tab. It used to carry the audience line, the description, the
          region's terrain paragraph, the Capstone Stone and the milestone rail:
          114 words of identity repeated above Weekly Tasks, Team, Deliverables
          and the Guide, where none of it is what the student came for. The
          identity now lives once, on Overview. */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-ink">{course.title}</h1>
          {/* Vendor + credential, in the course's own accent — the fastest way
              to tell which product you're looking at. Also the only place the
              certification code belongs; it used to appear three times. */}
          {courseIdentityLabel(course) && (
            <PixelBadge tone="accent">{courseIdentityLabel(course)}</PixelBadge>
          )}
        </div>
        <p className="text-lg text-muted">{course.description}</p>
      </div>

      {/* Sticky course sub-nav — shared component, persists on every in-course page */}
      <CourseSubNav
        courseId={course.id}
        active={tab === 'weeks' ? 'weeks' : 'overview'}
        teamId={joined && member ? member.teamId : null}
        onSelectTab={setTab}
        trailing={
          joined && member ? (
            <>
              {/* The game layer, derived from the same progress scan as the
                  percentages beside it — no separate source of truth. */}
              {/* One course-level readout, not two. `StepTally` already shows a
                  filled bar plus the real count, so the percentage beside it was
                  the same fact rounded differently. */}
              <StepTally done={crew.stepsDone} total={crew.stepsTotal} className="hidden md:flex" />
              <span className="hidden text-sm text-muted sm:inline">
                {phaseTag(course, activeWeek)}
              </span>
              {nextTask ? (
                <Button
                  onClick={() => nextTask && goToTask(nextTask)}
                  size="sm"
                  data-tour="continue-btn"
                  className="flex items-center gap-1.5"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTab('overview');
                    if (typeof window !== 'undefined') {
                      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 60);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-ok-soft px-3 py-1.5 text-sm font-medium text-ok hover:opacity-80"
                >
                  <Sparkles className="h-4 w-4" /> All done — review
                </button>
              )}
            </>
          ) : undefined
        }
      />

      {/* ───────── Overview tab ───────── */}
      {tab === 'overview' && (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
      {/* Where you are, before anything that describes the course. The sections
          below answer "what is this?", which a student needs once; this answers
          "where am I and what next?", which they come back for every week. */}
      {joined && member && (
        <EngagementStatus
          course={course}
          weekNumber={activeWeek}
          phase={phaseForWeek(course, activeWeek) ?? undefined}
          percent={crew.stepsTotal > 0 ? Math.round((crew.stepsDone / crew.stepsTotal) * 100) : 0}
          weeks={sortedWeeks.map((w) => w.number)}
          weekPercent={(w) => weekStats[w] ?? 0}
          docsFiled={
            deliverablesForCourse(course.id).filter((d) => isDeliverableFiled(savedDocs?.[d.id])).length
          }
          docsTotal={deliverablesForCourse(course.id).length}
          nextTask={nextTask}
          onGoToWeek={(w) => {
            setTab('weeks');
            openAndScrollWeek(w);
          }}
          onContinue={() => nextTask && goToTask(nextTask)}
        />
      )}

      {/* The capstone's overall progress — where the whole project stands, on the
          overview only, not repeated above every tab. */}
      {joined && member && (
        <div className="rounded-[var(--radius-card)] border border-line bg-panel p-4">
          <CapstoneStonePanel stage={crew.stage} nextPhase={phaseForWeek(course, activeWeek)} />
        </div>
      )}
      {allGatesPassed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-ok-line bg-ok-soft p-6"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-ok-soft p-2 text-ok">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-ink">
                {course.noGatekeeping
                  ? 'Course complete — every week finished 🎉'
                  : `Engagement complete — all ${course.gates.length} gates passed 🎉`}
              </h2>
              <p className="mt-1 text-sm text-muted">
                You&apos;ve finished {tasksComplete} of {ownTasksAll.length} tasks across every week as{' '}
                {ownRole?.name ?? member?.role}. Compile your deliverables into the final package and
                hand it in.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {member && (
                  <Link
                    href={`/courses/${course.id}/docs`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-ok px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    <FileText className="h-4 w-4" /> Build your final package
                  </Link>
                )}
                {member && (
                  <Link
                    href={`/courses/${course.id}/team/${member.teamId}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-ok-line px-3 py-2 text-sm font-medium text-ok hover:bg-ok-soft"
                  >
                    <Users className="h-4 w-4" /> Review team progress
                  </Link>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Engagement banner — client + scope + phase for engagement-framed courses */}
      {joined && member && isEngagement(course) && (
        <EngagementBanner courseId={course.id} teamId={member.teamId} phase={phaseTag(course, activeWeek)} />
      )}

      {/* Role "this week" hero — connects your role to what's left right now */}
      {joined && member && ownRole && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileHover={{ y: -2 }}
          className="rounded-[var(--radius-card)] border border-l-4 border-line bg-panel p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-md"
          style={{ borderLeftColor: ownRole.color }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <RoleIcon iconName={ownRole.icon} className="h-9 w-9 shrink-0" color={ownRole.color} />
              <div>
                <div className="text-lg font-bold text-ink">
                  You&apos;re {ownRole.name}
                </div>
                <div className="text-sm text-muted">
                  {phaseTag(course, activeWeek)} of {contentWeeks.length} ·{' '}
                  {tasksLeftThisWeek} task{tasksLeftThisWeek === 1 ? '' : 's'} left this {unitWord(course).toLowerCase()}
                </div>
              </div>
            </div>
            {/* Next-action lives in the always-visible sticky bar; the hero only
                confirms the done state to avoid a second competing Continue. */}
            {!nextTask && (
              <span className="inline-flex items-center gap-2 rounded-lg bg-ok-soft px-4 py-2 text-sm font-medium text-ok">
                <Sparkles className="h-4 w-4" /> All your tasks complete!
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Join front-and-center for newcomers — the first action, above everything else. */}
      {!joined && (
        <div id="join-panel">
          <JoinPanel
            course={course}
            member={member}
            userId={user?.id ?? null}
            requireAuth={requireAuth}
            onJoined={(m) => setMember(m)}
          />
        </div>
      )}

      {/* ── Your team: who's in the crew and what each one owns ──
          The "how a case moves" (lifecycle) and "how the paperwork moves"
          (deliverable chain) diagrams that used to sit here duplicated the
          Guide's role diagram and the Team page's hand-off checklist, so they
          now live once, there. This tab just introduces the roles. */}
      {course.roles.length > 0 && (
        <section className="space-y-4">
          <div className="shead">
            <span className="num">01</span>
            <h2 className="text-2xl font-bold tracking-tight text-ink">Your team</h2>
          </div>
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {course.roles.map((r) => (
              <div key={r.id} className="rounded-[var(--radius-card)] border border-line bg-panel p-4 shadow-[var(--shadow-card)]">
                <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
                  <RoleIcon iconName={r.icon} className="h-4.5 w-4.5" color={r.color} />
                  {r.name}
                </h3>
                <p className="mt-1.5 text-sm text-muted">{r.mission}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── The lab in one picture ──
          The full SOC topology diagram lives on the Guide (its lab-architecture
          section); here we keep the plain-language description and point to it,
          rather than render the same diagram on two tabs. */}
      {socTopology(course.id) && (
        <section className="space-y-4">
          <div className="shead">
            <span className="num">02</span>
            <h2 className="text-2xl font-bold tracking-tight text-ink">The lab — one picture</h2>
          </div>
          <p className="max-w-3xl text-sm text-muted">
            Every machine is a VM on one host, all on the same flat network. Each team gets a{' '}
            <b className="text-ink">pod</b> — one Ubuntu web server and one Windows PC — and both report to the single{' '}
            <b className="text-ink">Wazuh SOC</b> you open in a browser.
          </p>
          <Link
            href={`/courses/${course.id}/guide/reference#lab`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            See the full lab diagram &amp; setup <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}


      {/* ── The build in one picture — Server+ ──
          The SOC courses describe their lab and link to the diagram; a build
          course is ABOUT the physical thing, so the rack topology earns a place
          on the Overview itself, with the phase arc under it. Both components
          also render on the Reference page — this is the orientation copy of
          the same pictures, not a second source of truth. */}
      {course.id === 'server-plus' && (
        <section className="space-y-4">
          <div className="shead">
            <span className="num">02</span>
            <h2 className="text-2xl font-bold tracking-tight text-ink">The build — one picture</h2>
          </div>
          <p className="max-w-3xl text-sm text-muted">
            One rack-mount server in a <b className="text-ink">24U rack</b> on the 10.10.0.0/16 campus
            LAN (your host is 10.10.30.<b className="text-ink">T</b>, T = your team number), running a
            hypervisor with two zones: a <b className="text-ink">DMZ</b> for the website and a{' '}
            <b className="text-ink">private network</b> for the Windows server and the Linux database.
            You plan it, build it, connect it, then secure and hand it over.
          </p>
          {joined && member && (
            <TeamBusinessPicker
              courseId={course.id}
              teamId={member.teamId}
              onBusiness={setTeamBusiness}
            />
          )}
          <div className="rounded-[var(--radius-card)] border border-line bg-panel p-5">
            <ServerTopologyDiagram business={teamBusiness} />
          </div>
          <div className="rounded-[var(--radius-card)] border border-line bg-panel p-5">
            <LifecycleFlow weeks={course.weeks} gates={course.gates} noGatekeeping={course.noGatekeeping} />
          </div>
          <Link
            href={`/courses/${course.id}/guide/reference#lab`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            See the full reference &amp; forms <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {/* One-time migration of this device's local progress into the account */}
      <ImportPrompt course={course} />

      {/* Enrollment summary once joined (edit team/role here). No id: the
          newcomer render above owns `join-panel` — the same id declared twice,
          even on mutually exclusive branches, is a refactor away from being a
          real duplicate. */}
      {joined && (
        <div>
          <JoinPanel
            course={course}
            member={member}
            userId={user?.id ?? null}
            requireAuth={requireAuth}
            onJoined={(m) => setMember(m)}
          />
        </div>
      )}

      {/* Reset (once joined) */}
      {joined && member && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setConfirmingReset(true)}
            className="ml-auto inline-flex items-center gap-1 text-sm text-muted hover:text-danger"
          >
            <RotateCcw className="h-4 w-4" /> Reset my progress
          </button>
          <ConfirmDialog
            open={confirmingReset}
            onClose={() => setConfirmingReset(false)}
            onConfirm={confirmReset}
            title="Reset your progress?"
            message="This clears all your completed steps for this course on this device. This cannot be undone."
            confirmLabel="Reset progress"
          />
        </div>
      )}

      </motion.div>
      )}

      {/* ───────── Weekly Tasks tab ───────── */}
      {tab === 'weeks' && (
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
      {/* Weekly breakdown.
          The "Weekly tasks" heading that used to be here repeated the tab label
          two rows above it. In its place: the one line that answers "what am I
          meant to be doing", built from values this page already computes. */}
      <div className="space-y-3">
        {joined && member && ownRole && (
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-2xl font-bold text-ink">
              {phaseTag(course, activeWeek)}
            </h2>
            <span className="text-sm text-muted">
              {ownRole.name} ·{' '}
              {tasksLeftThisWeek === 0
                ? 'nothing left this week'
                : `${tasksLeftThisWeek} task${tasksLeftThisWeek === 1 ? '' : 's'} left`}
            </span>
          </div>
        )}
        {/* Not enrolled: the tasks ARE the course material, so this is where the
            page stops. It used to render an amber "join to unlock and track these
            tasks" note and then print every role's full task list underneath it —
            so only the progress tracking was ever gated, never the material. The
            course dashboard above still sells the course; this is the line. */}
        {!joined && <CourseEnrolGate courseId={course.id} what="the weekly tasks" />}
        {joined && (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks by name, objective, or framework…"
                aria-label="Search tasks"
                className="w-full pl-9 pr-9"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {q && !anyMatches && (
              <p className="text-sm text-muted">No tasks match “{query}”.</p>
            )}
          </>
        )}
      </div>

      {joined && <LabAccessPanel courseId={course.id} />}

      {joined && (
      <div className="space-y-4">
        {sortedWeeks.map((w) => {
          const weekTasks = getWeekTasks(course, w.number);
          const shownTasks = q ? weekTasks.filter(matchesQuery) : weekTasks;
          if (q && shownTasks.length === 0) return null;
          const isWeekOpen = q ? true : effectiveOpenWeeks.has(w.number);
          const weekPct = weekStats[w.number] ?? 0;
          const gateForWeek = course.gates.find((g) => g.week === w.number);
          // Three lanes, not two. On a shared-track course (Server+) the build
          // itself belongs to everyone and only the small deep-dive differs by
          // focus, so a `shared` task must never fall into "other roles" — that
          // would hide the actual week's work behind a collapsed reference panel
          // for three of four students.
          const sharedWeekTasks = member ? shownTasks.filter((t) => t.shared) : [];
          const ownTasks = member
            ? shownTasks.filter((t) => !t.shared && t.role === member.role)
            : [];
          const otherTasks = member
            ? shownTasks.filter((t) => !t.shared && t.role !== member.role)
            : shownTasks;
          const refOpen = q ? true : openRefs.has(w.number);
          // On a role-split course the week's task count is the crew's — useful,
          // because your teammates' lanes are real work happening beside yours.
          // On a shared track the other focuses' deep-dives are copies of the
          // same slot, so counting all four told a student "6 tasks" for a week
          // in which they work three.
          const memberWeekCount = sharedWeekTasks.length + ownTasks.length;
          const displayCount = q
            ? shownTasks.length
            : course.sharedTrack && member
              ? memberWeekCount
              : weekTasks.length;
          const locked = weekLocked(w.number);
          const lockGate = priorGateForWeek(w.number);
          return (
            <section
              key={w.number}
              id={`week-${w.number}`}
              // Stratum 1: the week is the bedrock band. The accent-weighted
              // left edge is what makes one week visibly end and the next begin.
              className="stratum-week scroll-mt-24 overflow-hidden"
              data-open={isWeekOpen ? 'true' : 'false'}
            >
              <button
                type="button"
                onClick={() => toggleWeek(w.number)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-panel-2"
              >
                <div className="min-w-0">
                  {/* One phase line, not two. This used to be an eyebrow with the
                      phase name AND a PixelBadge with the week tag directly under
                      it — the same information split across two chips (13 header
                      elements in all). Merged: `[icon] Week N · Detect & Baseline`,
                      tinted with the per-week phase token so the four weeks still
                      read as one arc. */}
                  <div
                    className="mb-1 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase leading-none tracking-wider"
                    style={{ color: `var(--color-w${Math.min(4, Math.max(1, w.number))})` }}
                  >
                    {(() => {
                      const verb = verbForStage(stageForWeek(course, w.number));
                      return verb ? <WeekVerbIcon verb={verb} size={20} className="shrink-0" /> : null;
                    })()}
                    {phaseTag(course, w.number)}
                    {phaseForWeek(course, w.number) && <span aria-hidden> · {phaseForWeek(course, w.number)}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-ink">
                      {w.title}
                    </h3>
                    {weekPct >= 100 && joined && (
                      <PixelBadge tone="accent" title="Every required step in this week is done">
                        Cleared
                      </PixelBadge>
                    )}
                    {w.number === activeWeek && joined && weekPct < 100 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-ink">
                        {/* A slow pulse on the dot only — the eye finds the week
                            you are on without reading five headers. `.qi-pulse`
                            is the existing ambient keyframe and the global
                            prefers-reduced-motion block stills it. */}
                        <span className="qi-pulse h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                        Current
                      </span>
                    )}
                  </div>
                  {/* The theme only earns its line when there is no phase. With
                      both, week 0 read "ARRIVE & EQUIP / SETUP / SETUP" — the
                      phase already says what kind of work this is. */}
                  {!phaseForWeek(course, w.number) && (
                    <p className="truncate text-sm text-muted">{w.theme}</p>
                  )}
                </div>
                {/* The right rail carried six independent items (bar, bold %,
                    gate, lock pill, task count, chevron). Two now: one labelled
                    meter, and one status chip showing the single most relevant
                    state — locked beats gate beats task count. */}
                <div className="flex shrink-0 items-center gap-3">
                  {joined && (
                    <span className="hidden items-center gap-1.5 sm:flex" title={`${weekPct}% of this week's steps done`}>
                      <span className="relative h-2 w-16 overflow-hidden rounded-full bg-panel-2">
                        <span
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{ width: `${weekPct}%`, background: 'var(--color-accent)' }}
                        />
                      </span>
                      <span className="text-xs font-medium text-muted">{weekPct}%</span>
                    </span>
                  )}
                  {locked ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-panel-2 px-2 py-0.5 text-xs font-medium text-muted">
                      <Lock className="h-3 w-3" /> Locked
                    </span>
                  ) : gateForWeek && joined && !course.noGatekeeping ? (
                    <span className="hidden rounded-full bg-panel-2 px-2 py-0.5 text-xs font-medium text-muted md:inline">
                      Gate {gateForWeek.id} · {displayCount} task{displayCount === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">
                      {displayCount} task{displayCount === 1 ? '' : 's'}
                    </span>
                  )}
                  {isWeekOpen ? (
                    <ChevronDown className="h-5 w-5 text-muted" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted" />
                  )}
                </div>
              </button>

              {isWeekOpen && locked && (
                <div className="border-t border-line p-5">
                  <div className="flex items-start gap-3 rounded-lg border border-line bg-panel-2 p-4">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
                    <div>
                      <p className="text-sm font-medium text-ink">
                        Locked until you clear Gate {lockGate?.id}.
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Finish Week {(lockGate?.week ?? w.number - 1)} required tasks to pass Gate{' '}
                        {lockGate?.id} and unlock this week — the engagement runs in order.
                      </p>
                      {lockGate && (
                        <button
                          type="button"
                          onClick={() => openAndScrollWeek(lockGate.week)}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                        >
                          Go to Week {lockGate.week} <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isWeekOpen && !locked && (
                <div className="space-y-4 border-t border-line p-5">
                  {weekTasks.length === 0 && (
                    <p className="text-sm text-muted">
                      No tasks for this week yet.
                    </p>
                  )}

                  {/* Setup week: the classroom lab is already built — the build task
                      is home-build-only and confirms before it expands. */}
                  {/* SOC-course banner only: this names the shared Wazuh SOC and
                      its login, which is meaningless (and confusing) on a course
                      whose Week 0 is required prep rather than an optional
                      home-lab build — Server+ hit exactly that. */}
                  {w.number === 0 && !!socTopology(course.id) && (
                    <div className="mb-3 rounded-lg border border-accent/30 bg-accent-soft p-3 text-sm">
                      <p className="text-ink">
                        <span className="font-semibold">The classroom SOC is already set up.</span> Sign in at{' '}
                        <span className="font-mono text-xs">{SOC_URL}</span> ({SOC_LOGIN_LABEL}) and
                        start at <span className="font-semibold">Week 1</span>. The build steps here are only for
                        students setting up their own lab at home — opening them asks you to confirm first.
                      </p>
                    </div>
                  )}

                  {/* ONE week-glance card, then ONE diagram, then the lanes.
                      This region used to be five stacked blocks — a floating
                      plain-English line, WeekMilestoneHeader (itself four rows,
                      one of them a flow-chip strip), a gate pill, and a
                      Collapsible hiding the flow diagram AND the gate
                      checklist. The plain sentence and milestone facts are now
                      one card; the clickable WeekTaskFlow diagram renders open
                      (disclosure is for tools, and a map you can click is the
                      thing a student orients by); only the gate checklist —
                      a checklist tool — stays behind a toggle, with the gate
                      status readable on the toggle row itself. */}
                  {joined && member && (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-line bg-panel p-4">
                        {/* One description of the week, not three: `plain` is
                            the sentence written for these students; `objective`
                            is instructor phrasing and still renders on the
                            Guide. */}
                        {w.plain && (
                          <p className="text-sm text-ink">
                            <Lightbulb
                              className="mr-1.5 inline h-4 w-4 -translate-y-px text-accent"
                              aria-hidden
                            />
                            {w.plain}
                          </p>
                        )}
                        <WeekMilestoneHeader
                          course={course}
                          role={member.role}
                          week={w.number}
                          percent={weekPct}
                        />
                      </div>

                      {/* The week's map, always visible: every task as a card,
                          in order, clickable straight into the task below. */}
                      {ownTasks.length + sharedWeekTasks.length > 0 && (
                        <WeekTaskFlow
                          course={course}
                          role={member.role}
                          week={w.number}
                          taskStats={taskStats}
                          onTaskClick={(id) => {
                            const t = getTaskById(course, id);
                            if (t) goToTask(t);
                          }}
                        />
                      )}

                      {gateForWeek && !course.noGatekeeping && (
                        <div className="rounded-lg border border-line bg-panel px-3">
                          <Collapsible
                            title={(() => {
                              const s = gateStats[gateForWeek.id] || 'locked';
                              const label =
                                s === 'passed' ? 'passed' : s === 'ready' ? 'ready' : 'in progress';
                              return `Gate ${gateForWeek.id} checklist · ${label}`;
                            })()}
                            defaultOpen={false}
                          >
                            <div className="pb-1">
                              <WeekGatePanel
                                course={course}
                                week={w.number}
                                status={gateStats[gateForWeek.id] || 'locked'}
                                ownRole={member?.role}
                                taskStats={taskStats}
                              />
                            </div>
                          </Collapsible>
                        </div>
                      )}
                    </div>
                  )}

                  {/* The shared build — everyone works this, whatever focus
                      they picked. Neutral lane, not a role colour: colouring it
                      would imply it belonged to one of the four. */}
                  {joined && sharedWeekTasks.length > 0 && (
                    <div className="lane space-y-3 py-3 pr-3" data-own="true">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-muted" />
                        <span className="font-semibold text-ink">This week — everyone</span>
                        <span className="text-xs text-muted">same build, whatever your focus</span>
                      </div>
                      {sharedWeekTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          course={course}
                          task={task}
                          isOwn
                          joined={joined}
                          open={expanded.has(task.id)}
                          isNext={task.id === nextTask?.id}
                          percent={taskStats[task.id] ?? 0}
                          onToggle={() => toggleTask(task)}
                        >
                          {renderTaskBody(task, true)}
                        </TaskRow>
                      ))}
                    </div>
                  )}

                  {/* Your role's tasks (interactive) */}
                  {joined && ownRole && ownTasks.length > 0 && (
                    <div
                      className="lane space-y-3 py-3 pr-3"
                      data-own="true"
                      style={{ '--lane-color': ownRole.color } as React.CSSProperties}
                    >
                      <RoleGroupHeader role={ownRole} tag={course.sharedTrack ? 'focus' : 'own'} />
                      {ownTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          course={course}
                          task={task}
                          isOwn
                          joined={joined}
                          open={expanded.has(task.id)}
                          isNext={task.id === nextTask?.id}
                          percent={taskStats[task.id] ?? 0}
                          onToggle={() => toggleTask(task)}
                        >
                          {renderTaskBody(task, true)}
                        </TaskRow>
                      ))}
                    </div>
                  )}

                  {/* Other roles — tucked into a reference panel */}
                  {joined && otherTasks.length > 0 && (
                    <div className="rounded-lg border border-dashed border-line p-3">
                      <button
                        type="button"
                        onClick={() => toggleRef(w.number)}
                        className="flex w-full items-center gap-2 text-sm font-medium text-muted"
                      >
                        <Users className="h-4 w-4" />
                        {course.sharedTrack
                          ? `What the other focuses document · ${otherTasks.length}`
                          : `Other roles this week (reference) · ${otherTasks.length}`}
                        {refOpen ? (
                          <ChevronDown className="ml-auto h-4 w-4 text-muted" />
                        ) : (
                          <ChevronRight className="ml-auto h-4 w-4 text-muted" />
                        )}
                      </button>
                      {refOpen && (
                        <div className="mt-3 space-y-4">
                          {otherRoles.map((r) => {
                            const roleTasks = otherTasks.filter((t) => t.role === r.id);
                            if (roleTasks.length === 0) return null;
                            return (
                              <div
                                key={r.id}
                                className="lane space-y-3 py-3 pr-3"
                                style={{ '--lane-color': r.color } as React.CSSProperties}
                              >
                                <RoleGroupHeader role={r} tag="reference" />
                                {roleTasks.map((task) => (
                                  <TaskRow
                                    key={task.id}
                                    course={course}
                                    task={task}
                                    isOwn={false}
                                    joined={joined}
                                    open={expanded.has(task.id)}
                                    percent={taskStats[task.id] ?? 0}
                                    onToggle={() => toggleTask(task)}
                                  >
                                    {renderTaskBody(task, false)}
                                  </TaskRow>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* The `!joined` branch that used to sit here — every role's
                      tasks, rendered read-only to anyone who hadn't enrolled —
                      is gone. Nothing in this subtree renders to a non-member
                      any more; the gate is above, once. */}
                </div>
              )}
            </section>
          );
        })}
      </div>
      )}
      </motion.div>
      )}

      {/* Home-build gate for the Week-0 build task — mounted regardless of tab so it
          opens when a student tries to expand the build steps on the Weekly tab. */}
      <ConfirmDialog
        open={homeBuildDialog}
        onClose={() => setHomeBuildDialog(false)}
        onConfirm={confirmHomeBuild}
        destructive={false}
        title="Only if you're building your own lab at home"
        message={`The classroom SOC is already built and running at ${SOC_URL} (sign in: ${SOC_LOGIN_LABEL}). You don't need these build steps — start at Week 1. Open them only if you're setting up your own lab at home.`}
        confirmLabel="Yes, I'm building from home"
        cancelLabel="Back"
      />
    </motion.div>
  );
}
