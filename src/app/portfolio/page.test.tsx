import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import PortfolioPage from './page';
import { evidenceRepo, progressRepo, taskReportsRepo } from '@/lib/data';
import { invalidateCourseCache } from '@/lib/data/localStorageCourseRepo';
import { SEED_COURSES } from '@/lib/content/dto';
import { getTasksByRole, isGradedWeek } from '@/lib/course-helpers';
import { verifiableSteps } from '@/lib/evidenceLedger';
import { localDay } from '@/lib/localDate';
import { allText } from '@/test/pdfRead';
import type { Member } from '@/lib/types';

/**
 * R127 — the portfolio's exports: a compact PDF (skills, progress, issues) and the browser's print of the whole page. The JSON file and
 * the credential file are gone; a member who wants the data as a document copies it from the dashboard or makes a link.
 */
const saved = vi.hoisted(() => ({ files: [] as { name: string; bytes: Uint8Array }[], text: [] as string[] }));
vi.mock('@/lib/download', () => ({
  downloadBytes: (name: string, bytes: Uint8Array) => saved.files.push({ name, bytes }),
  downloadText: (name: string) => saved.text.push(name),
}));

const course = SEED_COURSES.find((c) => c.id === 'security-plus')!;
const me: Member = { memberId: 'me', courseId: course.id, teamId: 't1', role: course.roles[0].id, displayName: 'Grace', cohort: '2026-10' };

beforeEach(() => {
  saved.files.length = 0;
  saved.text.length = 0;
  localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage'));
  invalidateCourseCache();
  progressRepo.setContext(me);
  const task = getTasksByRole(course, me.role).filter((t) => isGradedWeek(course, t.week)).find((t) => verifiableSteps(t.steps.filter((s) => !s.optional)).length > 0)!;
  for (const s of task.steps.filter((x) => !x.optional)) progressRepo.setCompletion({ courseId: course.id, memberId: me.memberId, taskId: task.id, stepId: s.id, completedAt: 1 });
  for (const s of verifiableSteps(task.steps.filter((x) => !x.optional))) {
    evidenceRepo.saveStep(me.memberId, { courseId: course.id, taskId: task.id, stepId: s.id, verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 1, firstAttemptAt: Date.now(), verifiedAt: Date.now() });
  }
  taskReportsRepo.save({ id: 'mine', courseId: course.id, taskId: task.id, teamId: me.teamId, memberId: me.memberId, kind: 'outdated', note: 'The screenshot is out of date.', status: 'resolved', resolutionNote: 'Replaced the screenshot.', resolvedAt: Date.UTC(2026, 9, 14, 9), fixRevision: 2, at: Date.UTC(2026, 9, 12, 12), reporterName: 'Grace' });
});

describe('the portfolio exports a PDF, not JSON', () => {
  it('offers Download PDF and Print the full record, and neither Export JSON nor Export credential', () => {
    render(<PortfolioPage />);
    expect(screen.getByRole('button', { name: /Download PDF/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Print the full record/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Export JSON/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Export credential/ })).toBeNull();
    expect(document.querySelector('[data-export-credential]')).toBeNull();
  });

  it('saves the record as one PDF: figures, skills by name, progress by course, and the issue with what was done about it', () => {
    render(<PortfolioPage />);
    fireEvent.click(document.querySelector('[data-portfolio-pdf]')!);
    expect(saved.text).toEqual([]);
    expect(saved.files).toHaveLength(1);
    const [file] = saved.files;
    expect(file.name).toBe(`capstone-record_${localDay()}.pdf`);
    const lines = allText(file.bytes).split('\n');
    const flat = lines.join(' ').replace(/\s+/g, ' ');
    expect(lines).toContain('Grace'); // the member's name from the course, with no account
    for (const heading of ['RECORD', 'SKILLS PROVED', 'PROGRESS BY COURSE', 'ISSUES REPORTED']) expect(lines, heading).toContain(heading);
    expect(flat).toMatch(/Verified from output \([1-9]\d*\)/);
    expect(flat).toContain(course.title);
    expect(flat).toContain('The screenshot is out of date.');
    expect(flat).toContain('Resolved');
    expect(flat).toContain('fixed in revision 2');
    expect(flat).toContain('Replaced the screenshot.');
  });
});
