import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CourseDocumentContext } from '@/lib/useCourse';
import { courseDocument, SEED_IDS } from '@/lib/content/docs';
import { deliverablesOf, rolesOf } from '@/lib/content/read';
import { roleFlow, roleFlowPairs } from '@/lib/docs/roleFlow';
import { splitRoleName } from '@/lib/docs/roles';
import { RoleFlowDiagram } from './RoleFlowDiagram';

/**
 * R105 — the hand-off picture: a box per role, a line per direction and
 * kind with its own dash, the viewer's role in focus with the rest dimmed,
 * focus moved by click or keyboard, and the same flow read aloud.
 */
function mount(courseId: string, highlightRole?: string) {
  const doc = courseDocument(courseId)!;
  const { container } = render(
    <CourseDocumentContext.Provider value={doc}>
      <RoleFlowDiagram course={doc.course} highlightRole={highlightRole} />
    </CourseDocumentContext.Provider>
  );
  return { container, doc };
}

describe('RoleFlowDiagram', () => {
  it('starts focused on the viewer’s role and dims only the pairs that do not touch it', () => {
    const { container } = mount('security-plus', 'red');
    const svg = container.querySelector('[data-role-flow]')!;
    expect(svg.getAttribute('data-focus')).toBe('red');
    expect(svg.getAttribute('data-motion')).toBe('on');
    const dimmed = [...container.querySelectorAll('[data-flow][data-dim="true"]')];
    expect(dimmed.length).toBeGreaterThan(0);
    for (const g of dimmed) expect(g.getAttribute('data-flow')!.split('>')).not.toContain('red');
    for (const g of container.querySelectorAll('[data-flow]:not([data-dim])')) expect(g.getAttribute('data-flow')!.split('>')).toContain('red');
    expect(container.querySelector('[data-role-box="red"]')!.getAttribute('aria-pressed')).toBe('true');
  });

  it('a click moves the focus, a second click clears it, and Enter does the same', () => {
    const { container } = mount('security-plus', 'red');
    const svg = container.querySelector('[data-role-flow]')!;
    const grc = container.querySelector('[data-role-box="grc"]')!;
    fireEvent.click(grc);
    expect(svg.getAttribute('data-focus')).toBe('grc');
    expect(grc.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(grc);
    expect(svg.getAttribute('data-focus')).toBe('none');
    expect(container.querySelectorAll('[data-dim]').length).toBe(0);
    fireEvent.keyDown(container.querySelector('[data-role-box="blue"]')!, { key: 'Enter' });
    expect(svg.getAttribute('data-focus')).toBe('blue');
  });

  it('each kind has its own line style and the legend names the three kinds', () => {
    const { container, doc } = mount('security-plus', 'red');
    const dash = (kind: string) => container.querySelector(`path[data-kind="${kind}"]`)?.getAttribute('stroke-dasharray');
    expect(dash('review')).toBeNull();
    expect(dash('approve')).toBeTruthy();
    expect(dash('feeds')).toBeTruthy();
    expect(dash('approve')).not.toBe(dash('feeds'));
    const labels = rolesOf(doc).FLOW_KIND_LABEL;
    for (const k of ['review', 'approve', 'feeds'] as const) expect(container.textContent).toContain(labels[k]);
    expect(container.textContent).toContain(rolesOf(doc).FLOW_HOW_TO_READ);
  });

  it.each(SEED_IDS)('%s: a box per role with its icon and function, a pill per pair, and the flow read aloud', (courseId) => {
    const { container, doc } = mount(courseId, doc0(courseId));
    const roles = doc.course.roles;
    const boxes = container.querySelectorAll('[data-role-box]');
    expect(boxes.length).toBe(roles.length);
    for (const r of roles) {
      const box = container.querySelector(`[data-role-box="${r.id}"]`)!;
      expect(box.querySelector('svg'), `${r.id} icon`).not.toBeNull();
      expect(box.textContent).toContain(splitRoleName(r.name).fn);
    }
    const pairs = roleFlowPairs(roleFlow(roles, deliverablesOf(doc)));
    expect(container.querySelectorAll('[data-flow]').length).toBe(pairs.length);
    expect(container.querySelectorAll('path[data-kind]').length).toBe(pairs.reduce((n, p) => n + p.edges.length, 0));
    expect(container.querySelectorAll('ul[aria-label="Hand-offs"] li').length).toBe(pairs.length);
  });
});

function doc0(courseId: string): string | undefined {
  return courseDocument(courseId)?.course.roles[0]?.id;
}
