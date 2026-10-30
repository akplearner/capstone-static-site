import { KEYS } from './keys';
import { safeSetItem } from './safeStorage';
import { LabAccessData, LabAccessRepository, UserCourseState, UserStateRepository } from './types';

// localStorage implementations of the two single-user stores, used when Supabase
// isn't configured (the offline/guest path that CI builds against).
//
// The historical key layout is preserved rather than collapsed into one blob:
// `resume` is per (course, member) and `home_build_ack` is per course, and both
// already exist on students' devices. Reading them separately here means an
// existing install keeps its state instead of silently starting over.

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function readJson<T>(key: string): T | null {
  if (!hasWindow()) return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const localStorageUserStateRepo: UserStateRepository = {
  get(courseId: string, memberId: string): UserCourseState | null {
    if (!hasWindow()) return null;
    const resume = readJson<UserCourseState['resume']>(KEYS.resume(courseId, memberId));
    const homeBuildAck = localStorage.getItem(KEYS.homeBuildAck(courseId)) === '1';
    const seenRaw = localStorage.getItem(KEYS.mineSeen(courseId, memberId));
    const mineSeen = seenRaw === null ? undefined : Number(seenRaw);
    // R140: the task timers and the paused task share one blob; an unknown field must never be dropped.
    const timing = readJson<Pick<UserCourseState, 'timers' | 'paused'>>(KEYS.timers(courseId, memberId));
    if (!resume && !homeBuildAck && mineSeen === undefined && !timing) return null;
    return {
      ...(resume ? { resume } : {}),
      ...(homeBuildAck ? { homeBuildAck } : {}),
      ...(mineSeen !== undefined && !Number.isNaN(mineSeen) ? { mineSeen } : {}),
      ...(timing?.timers ? { timers: timing.timers } : {}),
      ...(timing?.paused !== undefined ? { paused: timing.paused } : {}),
    };
  },

  save(courseId: string, memberId: string, state: UserCourseState): void {
    if (!hasWindow()) return;
    if (state.resume) {
      safeSetItem(KEYS.resume(courseId, memberId), JSON.stringify(state.resume));
    } else {
      localStorage.removeItem(KEYS.resume(courseId, memberId));
    }
    if (state.homeBuildAck) safeSetItem(KEYS.homeBuildAck(courseId), '1');
    else localStorage.removeItem(KEYS.homeBuildAck(courseId));
    if (state.mineSeen !== undefined) safeSetItem(KEYS.mineSeen(courseId, memberId), String(state.mineSeen));
    else localStorage.removeItem(KEYS.mineSeen(courseId, memberId));
    if (state.timers || state.paused !== undefined) safeSetItem(KEYS.timers(courseId, memberId), JSON.stringify({ timers: state.timers ?? {}, paused: state.paused ?? null }));
    else localStorage.removeItem(KEYS.timers(courseId, memberId));
  },

  patch(courseId: string, memberId: string, partial: Partial<UserCourseState>): void {
    if (!hasWindow()) return;
    this.save(courseId, memberId, mergeUserState(this.get(courseId, memberId) ?? {}, partial));
  },
};

/** R149: the one merge rule both repos follow — a key set to `undefined` or `null` is removed. */
export function mergeUserState(existing: UserCourseState, partial: Partial<UserCourseState>): UserCourseState {
  const next: Record<string, unknown> = { ...existing };
  for (const [k, v] of Object.entries(partial)) {
    if (v === undefined || v === null) delete next[k];
    else next[k] = v;
  }
  return next as UserCourseState;
}

export const localStorageLabAccessRepo: LabAccessRepository = {
  get(courseId: string): LabAccessData | null {
    return readJson<LabAccessData>(KEYS.labAccess(courseId));
  },

  save(courseId: string, _memberId: string, data: LabAccessData): void {
    if (!hasWindow()) return;
    safeSetItem(KEYS.labAccess(courseId), JSON.stringify(data));
  },
};
