import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { ProjectRecordPanel } from './ProjectRecordPanel';
import { CourseContext, CourseDocumentContext } from '@/lib/useCourse';
import { SEED_COURSES } from '@/lib/content/dto';
import { courseDocument } from '@/lib/content/docs';
import { certOf, deliverablesOf, skillsOf } from '@/lib/content/read';
import { ONTOLOGY_VERSION } from '@/lib/docs/ontology';
import { teamRecordView, type TeamRecordFacts } from '@/lib/teamRecord';
import type { DeliverableData } from '@/lib/docs/types';
import type { ValidationAnswer } from '@/lib/data/types';

const course = SEED_COURSES.find((c) => c.id === 'security-plus')!;
const doc = courseDocument(course.id)!;
const docs: Record<string, DeliverableData> = {
  asset_inventory: { fields: {}, groups: { assets: [{ hostname: 'dvwa-vm', ip: '10.10.10.5', service: '80/tcp HTTP' }, { hostname: 'kali', ip: '10.10.10.5', service: '22/tcp' }] } },
  hardening_baseline: { fields: { 'decision:remote-access': 'ssh-keys', 'decision:remote-access:by': 'ada', 'decision:remote-access:at': '1700000000000' }, groups: {} },
};
const answers: ValidationAnswer[] = [{ courseId: 'security-plus', memberId: 'ada', teamId: 't1', activityId: 'val:3:explain:hardening_baseline.decision:remote-access', checkpoint: 3, kind: 'explain', recordKey: 'hardening_baseline.decision:remote-access', answerSha256: 'a'.repeat(64), correct: null, explanation: 'Because keys cannot be guessed.', at: 1700000100000 }];
const facts: TeamRecordFacts = {
  course, teamId: 't1', docs, answers,
  members: [{ memberId: 'ada', teamId: 't1', role: 'blue', displayName: 'Ada', cohort: '2026-09', joinedAt: 1 }, { memberId: 'bob', teamId: 't1', role: 'red', displayName: 'Bob', cohort: '2026-09', joinedAt: 2 }],
  history: [{ deliverableId: 'asset_inventory', data: { fields: {}, groups: {} }, updatedBy: 'ada', updatedAt: 1700000000000, replacedBy: 'bob', replacedAt: 1700000500000 }],
  registry: skillsOf(doc), cert: certOf(doc), deliverables: deliverablesOf(doc), ontologyVersion: ONTOLOGY_VERSION,
  team: { status: [], submissions: [], reviews: [], currentWeek: 4, marks: [] },
  memberFacts: (id) => ({ isStepDone: () => false, evidence: {}, artifacts: [], own: { notes: [], reports: [], validation: answers.filter((a) => a.memberId === id) } }),
};

const mount = (onDownload = vi.fn()) =>
  render(
    <CourseContext.Provider value={course}>
      <CourseDocumentContext.Provider value={doc}>
        <ProjectRecordPanel view={teamRecordView(facts)} teamLabel="Team 1" onDownload={onDownload} />
      </CourseDocumentContext.Provider>
    </CourseContext.Provider>
  );

/** R141 — the console shows the layer and ranks nobody. */
describe('ProjectRecordPanel', () => {
  it('shows the record by area with the decision’s author, the conflicts, the history, the checkpoints, the overlay badges and the downloads', () => {
    const onDownload = vi.fn();
    const { container } = mount(onDownload);
    expect(container.querySelector('[data-record-area="decisions"]')?.textContent).toContain('by ada');
    expect(container.querySelector('[data-record-area="infrastructure"]')?.textContent).toContain('10.10.10.5');
    expect(container.querySelector('[data-conflict="duplicate-address"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-history-row]')).toHaveLength(1);
    expect(container.querySelector('[data-record-history]')?.textContent).toContain('replaced by bob');
    expect(container.querySelectorAll('[data-checkpoint]').length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector('[data-validation-badge="asset_inventory"]')).not.toBeNull();
    fireEvent.click(container.querySelector('[data-download="architecture"]')!);
    fireEvent.click(container.querySelector('[data-download="infrastructure"]')!);
    expect(onDownload.mock.calls.map((c) => c[0])).toEqual(['architecture', 'infrastructure']);
  });

  it('shows one member at a time in roster order with the facets, the skill validation and the answers, and never a rank', () => {
    const { container } = mount();
    expect(container.querySelector('[data-member-documents]')?.getAttribute('data-member-documents')).toBe('ada');
    expect(container.querySelectorAll('[data-facet]')).toHaveLength(8);
    expect(container.querySelector('[data-answer="explain"]')?.textContent).toContain('for marking');
    expect(container.querySelector('[data-answer="explain"]')?.textContent).toContain('Because keys cannot be guessed.');
    fireEvent.click(container.querySelector('[data-member-tab="bob"]')!);
    expect(container.querySelector('[data-member-documents]')?.getAttribute('data-member-documents')).toBe('bob');
    expect(container.querySelector('[data-record-members]')?.textContent).toContain('No answers yet.');
    expect(container.textContent).not.toMatch(/\brank(ing|ed)?\b|leaderboard/i);
  });
});
