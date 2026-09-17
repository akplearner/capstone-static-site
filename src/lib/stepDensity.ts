'use client';

import { useClientStore, notifyStore } from './useClientStore';
import { userStateRepo } from './data';
import type { Course } from './types';

/**
 * How much of a step a student sees.
 *
 * 'simple' is the smallest reading surface that still gets the work done: the
 * title, where you are, the one-line instruction, the commands, and the check.
 * Every explanation is one click away, none is deleted. 'full' is the whole
 * step. The course sets the default; a student can flip it per course and the
 * choice is saved with their other course state.
 */
export type StepDensity = 'simple' | 'full';

export function courseDensity(course: Pick<Course, 'stepDensity'>): StepDensity {
  return course.stepDensity ?? 'full';
}

export function useStepDensity(course: Pick<Course, 'id' | 'stepDensity'>, memberId: string | undefined): StepDensity {
  return useClientStore<StepDensity>(
    () => (memberId ? userStateRepo.get(course.id, memberId)?.stepDensity : undefined) ?? courseDensity(course),
    courseDensity(course)
  );
}

export function saveStepDensity(courseId: string, memberId: string, density: StepDensity): void {
  const cur = userStateRepo.get(courseId, memberId) ?? {};
  userStateRepo.save(courseId, memberId, { ...cur, stepDensity: density });
  notifyStore();
}
