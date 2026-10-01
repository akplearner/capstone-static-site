'use client';

import { useContext } from 'react';
import { courseDocument } from '@/lib/content/docs';
import { CourseDocumentContext } from '@/lib/useCourse';
import { WeekBuildDiagram } from './WeekBuildDiagram';

/**
 * R99: a deliverable form's picture (`visual.kit === 'week'`): the course's
 * own build as it stands in the form's week. The instructor's editor renders
 * forms outside a course page, so the document comes from context when there
 * is one and by id when there is not — the same rule `CloudWeekVisual` uses.
 */
export function WeekFormVisual({ week, courseId }: { week: number; courseId?: string }) {
  const inPage = useContext(CourseDocumentContext);
  const doc = inPage ?? (courseId ? courseDocument(courseId) : undefined);
  if (!doc) return null;
  return (
    <CourseDocumentContext.Provider value={doc}>
      <WeekBuildDiagram course={doc.course} week={week} />
    </CourseDocumentContext.Provider>
  );
}
