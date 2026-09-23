'use client';

import { createContext, useContext } from 'react';
import { Course } from './types';
import type { CourseDto } from './content/dto';

export const CourseContext = createContext<Course | null>(null);

// R78-D: the whole document beside the course, so a component that renders
// reference content — a diagram's table, the manual's sections, the forms —
// reads it from the document rather than importing the content module.
export const CourseDocumentContext = createContext<CourseDto | null>(null);

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

/** The current course's document. Same rule as `useCourse`. */
export function useCourseDocument(): CourseDto {
  const doc = useContext(CourseDocumentContext);
  if (!doc) {
    throw new Error('useCourseDocument must be used within a CourseProvider');
  }
  return doc;
}
