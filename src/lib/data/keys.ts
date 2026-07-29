// Single source of truth for every localStorage key. All per-student data is
// course-scoped so multiple courses never collide.

export const STORAGE_PREFIX = 'capstone_';

export const KEYS = {
  // Global (not course-scoped)
  courses: `${STORAGE_PREFIX}courses`, // authored courses (JSON array of Course)
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
  // GRC Workspace registers, team-scoped (one company's documentation).
  grc: (courseId: string, teamId: string) => `${STORAGE_PREFIX}${courseId}_grc_${teamId}`,
  // Deliverable forms (Master Package), team-scoped: all 8 deliverables for a team.
  docs: (courseId: string, teamId: string) => `${STORAGE_PREFIX}${courseId}_docs_${teamId}`,
  // Personal lab access (target IPs/credentials + reachability checklist), per device.
  labAccess: (courseId: string) => `${STORAGE_PREFIX}${courseId}_lab_access`,
  // Per-device ack: "I'm building my own lab from home" — unlocks the Week-0 build task.
  homeBuildAck: (courseId: string) => `${STORAGE_PREFIX}${courseId}_home_build_ack`,
};
