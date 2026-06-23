'use client';

import { createContext, useContext } from 'react';
import { Course } from './types';

export const CourseContext = createContext<Course | null>(null);

// Resolve the current course inside a CourseProvider. Throws if used outside,
// which signals a routing/provider bug rather than a missing-course (that case
// is handled by CourseProvider rendering a not-found state).
export function useCourse(): Course {
  const course = useContext(CourseContext);
  if (!course) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return course;
}
