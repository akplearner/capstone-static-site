import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CourseDocumentContext } from '@/lib/useCourse';
import { courseDocument } from '@/lib/content/docs';
import { ArchDiagram } from './ArchDiagram';

vi.mock('next/navigation', () => ({ useParams: () => ({ courseId: 'security-plus' }), useRouter: () => ({ push: vi.fn() }) }));

/**
 * R151 — the picture lights up as the team builds it. The `built` map marks a part built (a ✓, an
 * accent fill), partial (a progress bar) or neither. With no prop the picture is exactly as it was.
 */
function mount(built?: Record<string, number>) {
  const doc = courseDocument('security-plus')!;
  return render(
    <CourseDocumentContext.Provider value={doc}>
      <ArchDiagram built={built} />
    </CourseDocumentContext.Provider>
  );
}

describe('ArchDiagram built overlay', () => {
  it('marks a fully built part, a partial part, and leaves an unstarted one unmarked', () => {
    const { container } = mount({ linhard: 1, exploits: 0.5, briefing: 0 });
    expect(container.querySelector('[data-node="linhard"]')?.getAttribute('data-built')).toBe('true');
    expect(container.querySelector('[data-node="exploits"]')?.getAttribute('data-built')).toBe('partial');
    expect(container.querySelector('[data-node="briefing"]')?.getAttribute('data-built')).toBeNull();
  });

  it('adds the built / this week / later legend only when the prop is passed', () => {
    const { container } = mount({ linhard: 1 });
    expect(container.textContent).toContain('built');
    expect(container.textContent).toContain('this week');
  });

  it('with no built prop, nothing is marked built — the picture is unchanged', () => {
    const { container } = mount();
    expect(container.querySelector('[data-built]')).toBeNull();
  });
});
