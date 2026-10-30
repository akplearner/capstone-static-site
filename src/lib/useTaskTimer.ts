'use client';

import { useCallback, useEffect, useState } from 'react';
import { userStateRepo } from './data';
import { notifyStore, useClientStore } from './useClientStore';
import { elapsedOf, startTimer, stopAll, stopTimer, type Timers } from './taskTimer';
import type { UserCourseState } from './data/types';

/**
 * R140 — the task timer, for the course page.
 *
 * The timer of the open task runs while the tab is visible and the member has
 * not paused; the state lives in `user_course_state.data.timers` (both
 * repositories carry it), so a reload or another device picks it up. Every
 * transition goes through the pure reducer (`taskTimer.ts`) and one write.
 */
export function useTaskTimer(courseId: string, memberId: string | null, openTaskId: string | null) {
  const state = useClientStore<UserCourseState | null>(() => (memberId ? userStateRepo.get(courseId, memberId) : null), null);
  const timers: Timers = state?.timers ?? {};
  const paused = state?.paused ?? null;
  const [now, setNow] = useState(() => Date.now());

  const write = useCallback(
    (next: Partial<UserCourseState>) => {
      if (!memberId) return;
      // R149: the timers and the paused task are this hook's keys; nothing else in the blob is touched.
      userStateRepo.patch(courseId, memberId, next);
      notifyStore();
    },
    [courseId, memberId]
  );

  // The open task's timer starts; the others stop. Nothing runs while paused.
  useEffect(() => {
    if (!memberId) return;
    const current = userStateRepo.get(courseId, memberId) ?? {};
    const t = Date.now();
    let next = stopAll(current.timers, t);
    if (openTaskId && !current.paused && document.visibilityState === 'visible') next = startTimer(next, openTaskId, t);
    if (JSON.stringify(next) !== JSON.stringify(current.timers ?? {})) write({ timers: next });
    return () => {
      if (!openTaskId) return;
      const latest = userStateRepo.get(courseId, memberId) ?? {};
      const stopped = stopTimer(latest.timers, openTaskId, Date.now());
      if (stopped !== latest.timers) write({ timers: stopped });
    };
  }, [courseId, memberId, openTaskId, paused, write]);

  // A hidden tab does not count; a visible one resumes the open task unless paused.
  useEffect(() => {
    if (!memberId) return;
    const onVisibility = () => {
      const current = userStateRepo.get(courseId, memberId) ?? {};
      const t = Date.now();
      if (document.visibilityState === 'hidden') write({ timers: stopAll(current.timers, t) });
      else if (openTaskId && !current.paused) write({ timers: startTimer(current.timers, openTaskId, t) });
    };
    const onLeave = () => {
      const current = userStateRepo.get(courseId, memberId) ?? {};
      write({ timers: stopAll(current.timers, Date.now()) });
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onLeave);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onLeave);
    };
  }, [courseId, memberId, openTaskId, write]);

  // The displayed minutes tick once a second while something runs.
  const running = Object.values(timers).some((t) => t.runningSince !== null);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const pause = useCallback(() => {
    if (!memberId || !openTaskId) return;
    const current = userStateRepo.get(courseId, memberId) ?? {};
    write({ timers: stopAll(current.timers, Date.now()), paused: openTaskId });
  }, [courseId, memberId, openTaskId, write]);

  const resume = useCallback(() => {
    if (!memberId) return;
    const current = userStateRepo.get(courseId, memberId) ?? {};
    const t = Date.now();
    write({ timers: openTaskId && document.visibilityState === 'visible' ? startTimer(current.timers, openTaskId, t) : current.timers ?? {}, paused: null });
  }, [courseId, memberId, openTaskId, write]);

  return {
    /** The open task's elapsed time, ticking. */
    elapsedMs: openTaskId ? elapsedOf(timers[openTaskId], now) : 0,
    /** The paused task's elapsed time, for the cover. */
    pausedElapsedMs: paused ? elapsedOf(timers[paused], now) : 0,
    paused,
    pause,
    resume,
  };
}
