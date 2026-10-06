import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { CourseDocumentContext } from '@/lib/useCourse';
import { courseDocument } from '@/lib/content/docs';
import { rolesOf } from '@/lib/content/read';
import { profileOf, splitRoleName } from '@/lib/docs/roles';
import { RoleTable } from './RoleTable';

/** R105 — the role table: one row per role, the viewer's row marked, focus by click. */
function mount(courseId: string, highlightRole?: string) {
  const doc = courseDocument(courseId)!;
  const { container } = render(
    <CourseDocumentContext.Provider value={doc}>
      <RoleTable course={doc.course} highlightRole={highlightRole} />
    </CourseDocumentContext.Provider>
  );
  return { container, doc };
}

describe('RoleTable', () => {
  it('one row per role, the function bold and the title under it, the works column from the profile', () => {
    const { container, doc } = mount('server-plus', 'win');
    const rows = container.querySelectorAll('[data-role-row]');
    expect(rows.length).toBe(doc.course.roles.length);
    expect(container.querySelectorAll('[aria-current="true"]').length).toBe(1);
    expect(container.querySelector('[data-role-row="win"]')!.getAttribute('aria-current')).toBe('true');
    const content = rolesOf(doc);
    for (const r of doc.course.roles) {
      const row = container.querySelector(`[data-role-row="${r.id}"]`)!;
      const { fn, tag } = splitRoleName(r.name);
      expect(row.textContent).toContain(fn);
      expect(row.textContent).toContain(tag!);
      expect(row.textContent).toContain(content.WORKS_SHORT[profileOf(content.PROFILES, r.id)!.works]);
      expect(row.textContent).toContain(r.mission);
    }
  });

  it('a click moves the focus and dims the other rows; clicking the focused row clears it', () => {
    const { container } = mount('security-plus', 'red');
    const table = container.querySelector('[data-role-table]')!;
    expect(table.getAttribute('data-focus')).toBe('red');
    expect(container.querySelectorAll('[data-role-row][data-dim="true"]').length).toBe(2);
    fireEvent.click(container.querySelector('[data-role-row="grc"] button')!);
    expect(table.getAttribute('data-focus')).toBe('grc');
    expect(container.querySelector('[data-role-row="grc"] button')!.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('[data-role-row="red"]')!.getAttribute('data-dim')).toBe('true');
    fireEvent.click(container.querySelector('[data-role-row="grc"]')!);
    expect(table.getAttribute('data-focus')).toBe('none');
    expect(container.querySelectorAll('[data-dim]').length).toBe(0);
  });
});
