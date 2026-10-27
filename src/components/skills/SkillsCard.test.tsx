import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { SkillsCard } from './SkillsCard';
import { CourseContext, CourseDocumentContext } from '@/lib/useCourse';
import { courseDocument } from '@/lib/content/docs';
import { courseRepo, evidenceRepo, progressRepo, taskReportsRepo } from '@/lib/data';
import { invalidateCourseCache } from '@/lib/data/localStorageCourseRepo';
import { getTasksByRole, isGradedWeek } from '@/lib/course-helpers';
import { verifiableSteps } from '@/lib/evidenceLedger';
import { localDay } from '@/lib/localDate';
import { allText } from '@/test/pdfRead';
import type { Member } from '@/lib/types';

/**
 * R127 — the Home card's chip saves this course's record as a PDF: its skills by name, its progress and the issues this member
 * reported in it, counted at the click. The JSON is for the clipboard only.
 */
const saved = vi.hoisted(() => ({ files: [] as { name: string; bytes: Uint8Array }[], text: [] as string[] }));
vi.mock('@/lib/download', () => ({
  downloadBytes: (name: string, bytes: Uint8Array) => saved.files.push({ name, bytes }),
  downloadText: (name: string) => saved.text.push(name),
}));

const me: Member = { memberId: 'me', courseId: 'security-plus', teamId: 't1', role: 'red', displayName: 'Grace', cohort: '2026-10' };

function mount() {
  const course = courseRepo.get('security-plus')!;
  return render(
    <CourseContext.Provider value={course}>
      <CourseDocumentContext.Provider value={courseDocument(course.id)!}>
        <SkillsCard course={course} member={me} activeWeek={1} crew={{ weeksCleared: 0, weeksTotal: 4 }} />
      </CourseDocumentContext.Provider>
    </CourseContext.Provider>
  );
}

beforeEach(() => {
  saved.files.length = 0;
  saved.text.length = 0;
  localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage'));
  invalidateCourseCache();
  progressRepo.setContext(me);
});

describe('the Home card’s PDF', () => {
  it('has Download PDF beside Copy JSON, and saves no JSON file', () => {
    mount();
    const chip = document.querySelector('[data-dto-chip="capstone-kpi-board/2"]')!;
    expect(chip.querySelector('[data-dto-pdf]')!.textContent).toContain('Download PDF');
    expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Download JSON/ })).toBeNull();
    fireEvent.click(chip.querySelector('[data-dto-pdf]')!);
    expect(saved.text).toEqual([]);
    expect(saved.files).toHaveLength(1);
  });

  it('saves this course’s record: the skills reached by name, the progress, and this member’s own issues only', () => {
    const course = courseRepo.get('security-plus')!;
    const task = getTasksByRole(course, me.role).filter((t) => isGradedWeek(course, t.week)).find((t) => verifiableSteps(t.steps.filter((s) => !s.optional)).length > 0)!;
    for (const s of task.steps.filter((x) => !x.optional)) progressRepo.setCompletion({ courseId: course.id, memberId: me.memberId, taskId: task.id, stepId: s.id, completedAt: 1 });
    for (const s of verifiableSteps(task.steps.filter((x) => !x.optional))) {
      evidenceRepo.saveStep(me.memberId, { courseId: course.id, taskId: task.id, stepId: s.id, verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 1, firstAttemptAt: Date.now(), verifiedAt: Date.now() });
    }
    const filed = (id: string, memberId: string, note: string) => taskReportsRepo.save({ id, courseId: course.id, taskId: task.id, teamId: me.teamId, memberId, kind: 'unclear', note, status: 'open', at: Date.UTC(2026, 9, 12, 12), reporterName: memberId });
    filed('mine', me.memberId, 'Step 2 does not say which host.');
    filed('theirs', 'a-teammate', 'The teammate’s own question.');
    mount();
    fireEvent.click(document.querySelector('[data-dto-pdf]')!);
    const [file] = saved.files;
    expect(file.name).toBe(`capstone-record_security-plus_${localDay()}.pdf`);
    expect(new TextDecoder().decode(file.bytes.slice(0, 8))).toBe('%PDF-1.4');
    const lines = allText(file.bytes).split('\n');
    const flat = lines.join(' ').replace(/\s+/g, ' ');
    expect(lines).toContain('Grace');
    expect(flat).toContain(`· ${course.title}`);
    // progress: the steps this member ticked, over the role's required steps
    expect(flat).toMatch(new RegExp(`${task.steps.filter((s) => !s.optional).length} of \\d+`));
    // skills by name: at least one verified skill is listed, none of them as a counter
    expect(flat).toMatch(/Verified from output \([1-9]\d*\)/);
    // issues: the member's own, not a teammate's
    expect(flat).toContain('Step 2 does not say which host.');
    expect(flat).not.toContain('The teammate’s own question.');
    expect(lines).toContain('1 reported · 1 pending · 0 resolved');
  });
});
