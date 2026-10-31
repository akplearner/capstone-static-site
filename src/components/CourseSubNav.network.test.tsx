import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CourseDocumentContext } from '@/lib/useCourse';
import { courseDocument } from '@/lib/content/docs';
import { CourseSubNav } from './CourseSubNav';

vi.mock('next/navigation', () => ({ useParams: () => ({ courseId: 'security-plus' }), useRouter: () => ({ push: vi.fn() }), usePathname: () => '/' }));
vi.mock('@/components/course/RoleStrip', () => ({ RoleStrip: () => <div data-role-strip /> }));

/** R156 — the Network tab appears only on a course whose document carries a lab network. */
function mount(courseId: string) {
  const doc = courseDocument(courseId)!;
  return render(
    <CourseDocumentContext.Provider value={doc}>
      <CourseSubNav courseId={courseId} active="guide" teamId="2026-01-T01" />
    </CourseDocumentContext.Provider>
  );
}

describe('CourseSubNav — the Network tab', () => {
  it('Security+ has it, after Guide, linking to the network route', () => {
    const { container } = mount('security-plus');
    const tab = container.querySelector('[data-tab-network]')!;
    expect(tab).not.toBeNull();
    expect(tab.getAttribute('href')).toBe('/courses/security-plus/network');
    expect(tab.textContent).toContain('Network');
    const labels = [...container.querySelectorAll('nav a, nav button')].map((e) => e.textContent?.trim());
    expect(labels.indexOf('Network')).toBeGreaterThan(labels.indexOf('Guide'));
  });

  it('a course without a lab network has no Network tab', () => {
    const { container } = mount('azure-fundamentals');
    expect(container.querySelector('[data-tab-network]')).toBeNull();
  });

  it('renders without a course document at all (no tab, no crash)', () => {
    const { container } = render(<CourseSubNav courseId="security-plus" active="home" />);
    expect(container.querySelector('nav[aria-label="Course sections"]')).not.toBeNull();
    expect(container.querySelector('[data-tab-network]')).toBeNull();
  });
});
