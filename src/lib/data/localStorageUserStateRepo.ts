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
    if (!resume && !homeBuildAck) return null;
    return { ...(resume ? { resume } : {}), ...(homeBuildAck ? { homeBuildAck } : {}) };
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
  },
};

export const localStorageLabAccessRepo: LabAccessRepository = {
  get(courseId: string): LabAccessData | null {
    return readJson<LabAccessData>(KEYS.labAccess(courseId));
  },

  save(courseId: string, _memberId: string, data: LabAccessData): void {
    if (!hasWindow()) return;
    safeSetItem(KEYS.labAccess(courseId), JSON.stringify(data));
  },
};
