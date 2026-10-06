import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CourseDocumentContext } from '@/lib/useCourse';
import { courseDocument } from '@/lib/content/docs';
import { RoleFlowDiagram } from './RoleFlowDiagram';

/** R105 — with reduced motion on, the picture is still, and focus still works. */
vi.mock('@/lib/useReducedMotionSafe', () => ({ useReducedMotionSafe: () => true }));

describe('RoleFlowDiagram under reduced motion', () => {
  it('declares itself still and draws every line fully from the first frame', () => {
    const doc = courseDocument('cissp')!;
    const { container } = render(
      <CourseDocumentContext.Provider value={doc}>
        <RoleFlowDiagram course={doc.course} highlightRole="govrisk" />
      </CourseDocumentContext.Provider>
    );
    expect(container.querySelector('[data-role-flow]')!.getAttribute('data-motion')).toBe('off');
    expect(container.querySelectorAll('mask').length, 'no draw-in masks at all').toBe(0);
    expect(container.querySelectorAll('path[data-kind]:not([mask])').length).toBeGreaterThan(0);
    expect(container.querySelector('[data-role-flow]')!.getAttribute('data-focus')).toBe('govrisk');
  });
});
