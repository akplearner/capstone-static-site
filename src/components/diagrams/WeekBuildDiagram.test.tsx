import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CourseDocumentContext } from '@/lib/useCourse';
import { courseDocument } from '@/lib/content/docs';
import { weekVisualsOf } from '@/lib/content/read';
import { WeekBuildDiagram } from './WeekBuildDiagram';

vi.mock('next/navigation', () => ({ useParams: () => ({ courseId: 'server-plus' }), useRouter: () => ({ push: vi.fn() }) }));

/**
 * R99 — the picture is week-scoped on every course: this week's parts glow,
 * later parts are marked, and the week's process is drawn over it.
 */
function mount(courseId: string, week: number) {
  const doc = courseDocument(courseId)!;
  const v = weekVisualsOf(doc).find((x) => x.week === week)!;
  const { container } = render(
    <CourseDocumentContext.Provider value={doc}>
      <WeekBuildDiagram course={doc.course} week={week} />
    </CourseDocumentContext.Provider>
  );
  return { container, v };
}

describe('WeekBuildDiagram', () => {
  it.each([
    ['server-plus', 5],
    ['ccna', 6],
    ['mssp', 3],
    ['security-plus', 2],
    ['cysa-plus', 3],
    ['secai-plus', 1],
    ['cissp', 3],
  ])('%s week %i: this week’s parts glow, later parts are marked, the process is drawn', (courseId, week) => {
    const { container, v } = mount(courseId, week);
    expect(v.highlight.length).toBeGreaterThan(0);
    for (const id of v.highlight) expect(container.querySelector(`[data-node="${id}"][data-glow]`), `${courseId}: ${id} should glow`).not.toBeNull();
    expect(container.querySelectorAll('[data-node][data-later]').length, `${courseId} week ${week}: something arrives later`).toBeGreaterThan(0);
    if (v.process) {
      expect(container.querySelector(`[data-process="${v.process.title}"]`)).not.toBeNull();
      for (const s of v.process.steps) expect(container.textContent).toContain(s.label);
    }
    expect(container.textContent).toContain(v.caption);
  });

  it('on the last week nothing is marked as later, and the picture names its week', () => {
    const { container } = mount('ccna', 8);
    expect(container.querySelectorAll('[data-node][data-later]').length).toBe(0);
    const { container: lab } = mount('security-plus', 4);
    expect(lab.querySelector('svg[aria-label*="Lab architecture"]')?.getAttribute('aria-label')).toContain('week 4');
  });
});
