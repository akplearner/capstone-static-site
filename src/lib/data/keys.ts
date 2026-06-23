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
};
