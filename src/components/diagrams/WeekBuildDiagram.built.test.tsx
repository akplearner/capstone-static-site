import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CourseDocumentContext } from '@/lib/useCourse';
import { courseDocument } from '@/lib/content/docs';
import { weekVisualsOf } from '@/lib/content/read';
import { WeekBuildDiagram } from './WeekBuildDiagram';

vi.mock('next/navigation', () => ({ useParams: () => ({ courseId: 'security-plus' }), useRouter: () => ({ push: vi.fn() }) }));

/** R151 — the controls status counts the week's built parts when the team's build is passed. */
function mount(week: number, built?: Record<string, number>) {
  const doc = courseDocument('security-plus')!;
  const v = weekVisualsOf(doc).find((x) => x.week === week)!;
  const { container } = render(
    <CourseDocumentContext.Provider value={doc}>
      <WeekBuildDiagram course={doc.course} week={week} controls built={built} />
    </CourseDocumentContext.Provider>
  );
  return { container, v };
}

describe('WeekBuildDiagram status with a team build', () => {
  it('reads "N of M parts built this week"', () => {
    const { container, v } = mount(1, {});
    const m = v.highlight.length;
    expect(container.textContent).toContain(`0 of ${m} parts built this week`);
  });

  it('counts a part the team has finished', () => {
    const doc = courseDocument('security-plus')!;
    const highlight = weekVisualsOf(doc).find((x) => x.week === 1)!.highlight;
    const { container } = mount(1, Object.fromEntries(highlight.map((id, i) => [id, i === 0 ? 1 : 0])));
    expect(container.textContent).toContain(`1 of ${highlight.length} parts built this week`);
  });
});
