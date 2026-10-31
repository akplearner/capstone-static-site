// Single source of truth for every localStorage key. All per-student data is
// course-scoped so multiple courses never collide.

export const STORAGE_PREFIX = 'capstone_';

export const KEYS = {
  // Global (not course-scoped)
  courses: `${STORAGE_PREFIX}courses`, // authored courses (JSON array of Course)
  // Offline acknowledgement log (R86): {agreementId: {version, at}} per device —
  // with no accounts, the device is the identity the acceptance belongs to.
  legalAcceptances: `${STORAGE_PREFIX}legal_acceptances`,
  // R110: consent grants {grantId: {granted, at}} and the learner outcome answers, per device offline.
  consents: `${STORAGE_PREFIX}consents`,
  outcomes: `${STORAGE_PREFIX}outcomes`,
  // R125: the earned-skills ledger, per device offline; `earnedSkillsFor` is the per-account copy kept when the database has no table for it yet.
  earnedSkills: `${STORAGE_PREFIX}earned_skills`,
  earnedSkillsFor: (userId: string) => `${STORAGE_PREFIX}earned_skills_${userId}`,
  instructorUnlocked: `${STORAGE_PREFIX}instructor_unlocked`,
  migratedV2: `${STORAGE_PREFIX}migrated_v2`,

  // Course-scoped
  context: (courseId: string) => `${STORAGE_PREFIX}${courseId}_context`,
  roster: (courseId: string) => `${STORAGE_PREFIX}${courseId}_roster`,
  completion: (courseId: string, memberId: string, taskId: string, stepId: string) =>
    `${STORAGE_PREFIX}${courseId}_completion_${memberId}_${taskId}_${stepId}`,
  completionPrefix: (courseId: string, memberId: string) =>
    `${STORAGE_PREFIX}${courseId}_completion_${memberId}_`,
  gate: (courseId: string, teamId: string, gateId: number) =>
    `${STORAGE_PREFIX}${courseId}_gate_${teamId}_${gateId}`,
  // Deliverable forms (Master Package), team-scoped: all 8 deliverables for a team.
  docs: (courseId: string, teamId: string) => `${STORAGE_PREFIX}${courseId}_docs_${teamId}`,
  // R139: the versions a team's forms held before, newest last (the offline half of 0025).
  docsHistory: (courseId: string, teamId: string) => `${STORAGE_PREFIX}${courseId}_docs_history_${teamId}`,
  // Personal lab access (target IPs/credentials + reachability checklist), per device.
  labAccess: (courseId: string) => `${STORAGE_PREFIX}${courseId}_lab_access`,
  // Per-device ack: "I'm building my own lab from home" — unlocks the Week-0 build task.
  homeBuildAck: (courseId: string) => `${STORAGE_PREFIX}${courseId}_home_build_ack`,
  // Where this student last ticked a checkbox, so the page reopens there instead
  // of expanding everything. Purely a UI convenience: it is derived from actions
  // the student already took, is safe to lose (we fall back to the first
  // incomplete week), and is written identically whichever progress backend is
  // active — the Supabase cache only keeps completion *keys*, not the
  // `completedAt` values, so this pointer cannot be derived there.
  resume: (courseId: string, memberId: string) =>
    `${STORAGE_PREFIX}${courseId}_resume_${memberId}`,
  // How many of the mine's weeks have played their strike for this student —
  // the same kind of pointer as `resume`, and stored beside it (R81).
  mineSeen: (courseId: string, memberId: string) =>
    `${STORAGE_PREFIX}${courseId}_mine_seen_${memberId}`,
  // The evidence ledger: what the student actually proved, not just what they
  // ticked. Stored as one blob per (course, member) rather than a key per step —
  // unlike completions, these are always read as a whole set by the metrics
  // projections, so a single parse beats scanning hundreds of keys.
  stepEvidence: (courseId: string, memberId: string) =>
    `${STORAGE_PREFIX}${courseId}_evidence_${memberId}`,
  evidenceArtifacts: (courseId: string, memberId: string) =>
    `${STORAGE_PREFIX}${courseId}_artifacts_${memberId}`,
  // R113: re-hash checks on hashed files, one append-only blob per (course, member).
  rehashChecks: (courseId: string, memberId: string) =>
    `${STORAGE_PREFIX}${courseId}_rehash_${memberId}`,
  // Global (not course-scoped): the career track spans courses.
  path: (memberId: string) => `${STORAGE_PREFIX}path_${memberId}`,
  // R68. Instructor reviews are team-scoped like the forms they judge; the
  // cohort calendar is one date per (course, cohort); step notes are one blob
  // per (course, member) — read whole, like the evidence ledger.
  reviews: (courseId: string, teamId: string) => `${STORAGE_PREFIX}${courseId}_reviews_${teamId}`,
  // R132: the per-category marks beside the verdicts, and the stuck-flag history per member.
  reviewMarks: (courseId: string, teamId: string) => `${STORAGE_PREFIX}${courseId}_review_marks_${teamId}`,
  flagEvents: (courseId: string, memberId: string) => `${STORAGE_PREFIX}${courseId}_flag_events_${memberId}`,
  // R140: the member's validation answers, append-only, and the task timers with the paused task.
  validation: (courseId: string, memberId: string) => `${STORAGE_PREFIX}${courseId}_validation_${memberId}`,
  timers: (courseId: string, memberId: string) => `${STORAGE_PREFIX}${courseId}_timers_${memberId}`,
  // R103: the team's document lifecycle rows, one blob per (course, team).
  docStatus: (courseId: string, teamId: string) => `${STORAGE_PREFIX}${courseId}_doc_status_${teamId}`,
  cohortCalendar: (courseId: string, cohort: string) => `${STORAGE_PREFIX}${courseId}_cohort_${cohort}`,
  stepNotes: (courseId: string, memberId: string) => `${STORAGE_PREFIX}${courseId}_notes_${memberId}`,
  // Task issue reports (R83): one blob per course — on a shared offline device
  // the reports are as shared as the problem they describe.
  taskReports: (courseId: string) => `${STORAGE_PREFIX}${courseId}_task_reports`,
  // Content fixes (R121): the course's ledger, one blob per course, oldest first. Content, not a
  // student's state: on a shared offline device it is as shared as the course it corrects.
  contentFixes: (courseId: string) => `${STORAGE_PREFIX}${courseId}_content_fixes`,
  // Admin content overrides for a course document (R85, offline mode): the
  // deliverables/glossary/content the studio replaced, merged over the base
  // document by localDocumentSource.
  courseContent: (courseId: string) => `${STORAGE_PREFIX}${courseId}_content_overrides`,
  // The last few studio saves of a course, offline (R122): what the History tab lists and restores.
  courseVersions: (courseId: string) => `${STORAGE_PREFIX}${courseId}_course_versions`,
  // Frozen deliverable submissions (R84): team-scoped like the forms they freeze.
  submissions: (courseId: string, teamId: string) =>
    `${STORAGE_PREFIX}${courseId}_submissions_${teamId}`,
  // R71. The student's step view — simple (commands and checks) or full.
  // R100. Focus mode on the Tasks tab — a per-device preference, like the theme.
  focusMode: `${STORAGE_PREFIX}focus_mode`,
  // R108: an environment profile imported on this device for the Skill board's
  // "measured against" picker; a UI preference, never synced.
  importedProfile: `${STORAGE_PREFIX}imported_profile`,
  // R149: acceptances the cloud log could not take yet (network fault), kept per account until the next
  // load records them — so "you can continue" is a promise the platform keeps, not a one-shot retry.
  pendingAcceptances: (userId: string) => `${STORAGE_PREFIX}pending_acceptances_${userId}`,
  // R150: the latest class session this device's student has belonged to on a course — kept after they
  // leave, so a rejoin can only go to that session or a later one (the cloud keeps it in
  // `membership_cohort_floor`). And the id they left under, so an offline rejoin keeps their progress.
  cohortFloor: (courseId: string) => `${STORAGE_PREFIX}${courseId}_cohort_floor`,
  leftMemberId: (courseId: string) => `${STORAGE_PREFIX}${courseId}_left_member`,
  rolePeering: (courseId: string) => `${STORAGE_PREFIX}${courseId}_role_peering`,
};
