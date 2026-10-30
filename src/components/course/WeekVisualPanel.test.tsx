import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseDocumentContext } from '@/lib/useCourse';
import { courseDocument } from '@/lib/content/docs';
import { WeekVisualPanel } from './WeekVisualPanel';

vi.mock('next/navigation', () => ({ useParams: () => ({ courseId: 'azure-fundamentals' }), useRouter: () => ({ push: vi.fn() }) }));

/** R100 — one heading, a thumbnail by default, Expand shows the full picture. */
function mount(fill?: boolean) {
  const doc = courseDocument('azure-fundamentals')!;
  return render(
    <CourseDocumentContext.Provider value={doc}>
      <WeekVisualPanel course={doc.course} week={1} fill={fill} />
    </CourseDocumentContext.Provider>
  );
}

describe('WeekVisualPanel', () => {
  it('says "What you build this week" once, as a thumbnail with its caption, and Expand opens it', async () => {
    const { container } = mount();
    expect(screen.getAllByRole('heading', { name: 'What you build this week' })).toHaveLength(1);
    expect(container.querySelectorAll('h3')).toHaveLength(1);
    expect(container.querySelector('[data-compact="true"]')).not.toBeNull();
    expect(container.querySelector('[data-caption]')!.textContent!.length).toBeGreaterThan(0);
    const btn = screen.getByRole('button', { name: 'Expand' });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(btn);
    expect(screen.getByRole('button', { name: 'Shrink' })).toHaveAttribute('aria-expanded', 'true');
    expect(container.querySelector('[data-compact="true"]')).toBeNull();
    expect(container.querySelector('section')).toHaveAttribute('data-expanded', 'true');
  });

  it('fill draws it full size with no toggle', () => {
    const { container } = mount(true);
    expect(screen.queryByRole('button', { name: /Expand|Shrink/ })).toBeNull();
    expect(container.querySelector('[data-compact="true"]')).toBeNull();
  });
});

/**
 * R152 — a course with a lab network (Security+) gets a Build | Network switch once expanded; a course
 * without one (azure-fundamentals) never shows it, and the single heading holds either way.
 */
describe('WeekVisualPanel — R152 Build | Network switch', () => {
  const mountSec = (fill?: boolean) => {
    const doc = courseDocument('security-plus')!;
    return render(
      <CourseDocumentContext.Provider value={doc}>
        <WeekVisualPanel course={doc.course} week={3} fill={fill} />
      </CourseDocumentContext.Provider>
    );
  };

  it('azure-fundamentals shows no switch and keeps one h3', () => {
    const { container } = mount();
    expect(container.querySelector('[data-picture-pick]')).toBeNull();
    expect(container.querySelectorAll('h3')).toHaveLength(1);
  });

  it('Security+ reveals the switch when expanded, still one h3, and Network shows the network root', async () => {
    const { container } = mountSec();
    // collapsed: no switch yet
    expect(container.querySelector('[data-picture-pick]')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(container.querySelector('[data-picture-pick="network"]')).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'network' }));
    expect(container.querySelector('[data-net-root]')).not.toBeNull();
    // The network picture adds no heading of its own — only the panel's one h3 remains.
    expect(container.querySelectorAll('h3')).toHaveLength(1);
  });

  it('in the split-pane fill view the switch is available without an Expand toggle', () => {
    const { container } = mountSec(true);
    expect(container.querySelector('[data-picture-pick="network"]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /Expand|Shrink/ })).toBeNull();
  });
});
