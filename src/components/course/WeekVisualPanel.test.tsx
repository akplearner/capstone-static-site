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
describe('WeekVisualPanel — R153 network primary', () => {
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

  it('Security+ opens on the network without expanding, with Build as the secondary option, one h3', () => {
    const { container } = mountSec();
    // the switch shows immediately (not gated on Expand) and the network is the default view
    expect(container.querySelector('[data-picture-pick="network"]')).not.toBeNull();
    expect(container.querySelector('[data-picture-pick="build"]')).not.toBeNull();
    expect(container.querySelector('[data-net-root]')).not.toBeNull();
    // the network picture adds no heading of its own — only the panel's one h3 remains
    expect(container.querySelectorAll('h3')).toHaveLength(1);
  });

  it('switching to Build shows the task-flow picture instead of the network', async () => {
    const { container } = mountSec();
    await userEvent.click(screen.getByRole('button', { name: 'build' }));
    expect(container.querySelector('[data-net-root]')).toBeNull();
    expect(container.querySelector('[data-week-visual]')).not.toBeNull();
  });

  it('in the split-pane fill view the switch is available without an Expand toggle', () => {
    const { container } = mountSec(true);
    expect(container.querySelector('[data-picture-pick="network"]')).not.toBeNull();
    expect(screen.queryByRole('button', { name: /Expand|Shrink/ })).toBeNull();
  });
});

describe('WeekVisualPanel — R156 the Full network link', () => {
  it('Security+ links to the Network tab at this week; a course without a network does not', () => {
    const sp = courseDocument('security-plus')!;
    const { container, unmount } = render(
      <CourseDocumentContext.Provider value={sp}>
        <WeekVisualPanel course={sp.course} week={3} />
      </CourseDocumentContext.Provider>
    );
    expect(container.querySelector('[data-net-full-link]')!.getAttribute('href')).toBe('/courses/security-plus/network?week=3');
    unmount();
    const { container: az } = mount();
    expect(az.querySelector('[data-net-full-link]')).toBeNull();
  });
});
