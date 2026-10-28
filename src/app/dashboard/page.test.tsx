import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import DashboardPage from './page';
import { courseRepo, evidenceRepo, progressRepo, stepNotesRepo, earnedRepo, taskReportsRepo } from '@/lib/data';
import { allText } from '@/test/pdfRead';
import { localDay } from '@/lib/localDate';
import { invalidateCourseCache } from '@/lib/data/localStorageCourseRepo';
import { SEED_COURSES } from '@/lib/content/dto';
import { getTasksByRole, isGradedWeek } from '@/lib/course-helpers';
import { verifiableSteps } from '@/lib/evidenceLedger';
import { notifyStore } from '@/lib/useClientStore';
import type { Member } from '@/lib/types';

/**
 * R126 — "Your record" is live and every figure opens. The admin's complaint was that the record did not
 * update: it counted verified evidence only, so ticking steps changed nothing the record printed. These
 * tests run the real dashboard on the real repositories: a step ticked moves "Steps done" without a
 * reload, a figure opens to the steps, commands, tools and procedures behind it, and after "Reset my
 * progress" the skills still listed are the ones kept from the earlier run.
 */
// R127: what the page hands the browser to save is read back below.
const saved = vi.hoisted(() => ({ files: [] as { name: string; bytes: Uint8Array; type?: string }[], text: [] as string[] }));
vi.mock('@/lib/download', () => ({
  downloadBytes: (name: string, bytes: Uint8Array, type?: string) => saved.files.push({ name, bytes, type }),
  downloadText: (name: string) => saved.text.push(name),
}));

const course = SEED_COURSES.find((c) => c.id === 'security-plus')!;
const role = course.roles[0].id;
const me: Member = { memberId: 'me', courseId: course.id, teamId: 't1', role, displayName: 'Grace', cohort: '2026-10' };
const graded = getTasksByRole(course, role).filter((t) => isGradedWeek(course, t.week));
const requiredOf = (taskId: string) => course.tasks.find((t) => t.id === taskId)!.steps.filter((s) => !s.optional);

const tick = (taskId: string, stepId: string) => progressRepo.setCompletion({ courseId: course.id, memberId: me.memberId, taskId, stepId, completedAt: 1 });
const verify = (taskId: string, stepId: string) => evidenceRepo.saveStep(me.memberId, { courseId: course.id, taskId, stepId, verified: true, method: 'verified-output', matchedTokens: 1, totalTokens: 1, attempts: 1, firstAttemptAt: Date.now(), verifiedAt: Date.now() });
const workTask = (taskId: string) => {
  for (const s of requiredOf(taskId)) tick(taskId, s.id);
  for (const s of verifiableSteps(requiredOf(taskId))) verify(taskId, s.id);
};

const tile = (id: string) => document.querySelector<HTMLButtonElement>(`[data-record-tile="${id}"]`)!;
const figure = (id: string) => tile(id).textContent!.replace(/\s+/g, ' ');

beforeEach(() => {
  saved.files.length = 0;
  saved.text.length = 0;
  localStorage.clear();
  window.dispatchEvent(new StorageEvent('storage'));
  invalidateCourseCache();
  progressRepo.setContext(me);
});

describe('the record updates as the work is done', () => {
  it('prints twelve figures, progress first, each a button that opens', () => {
    workTask(graded[1].id);
    render(<DashboardPage />);
    expect([...document.querySelectorAll('[data-record-tile]')].map((e) => e.getAttribute('data-record-tile'))).toEqual(['steps-done', 'tasks-done', 'weeks-sealed', 'capstones', 'steps-verified', 'commands', 'evidence', 'days', 'skills', 'tools', 'procedures', 'domains']);
    for (const t of document.querySelectorAll('[data-record-tile]')) {
      expect(t.tagName).toBe('BUTTON');
      expect(t.getAttribute('aria-expanded')).toBe('false');
    }
  });

  it('a step ticked moves "Steps done" at once, without a reload, and a step verified moves "Steps verified"', () => {
    const task = graded[1];
    const [first, second] = requiredOf(task.id);
    tick(task.id, first.id);
    render(<DashboardPage />);
    expect(figure('steps-done')).toContain('Steps done1of');
    const before = figure('steps-done');
    act(() => {
      tick(task.id, second.id);
      notifyStore();
    });
    expect(figure('steps-done')).not.toBe(before);
    expect(figure('steps-done')).toContain('Steps done2of');
    expect(figure('steps-verified')).toContain('Steps verified0of');
    const checkable = verifiableSteps(requiredOf(task.id))[0];
    if (checkable) {
      act(() => {
        tick(task.id, checkable.id);
        verify(task.id, checkable.id);
        notifyStore();
      });
      expect(figure('steps-verified')).toMatch(/Steps verified.*[1-9]/);
    }
  });

  it('a task finished moves "Tasks done", and the ring says how far', () => {
    render(<DashboardPage />);
    const before = figure('tasks-done');
    act(() => {
      workTask(graded[1].id);
      notifyStore();
    });
    expect(figure('tasks-done')).not.toBe(before);
    expect(tile('tasks-done').querySelector('svg[role="img"]')?.getAttribute('aria-label')).toMatch(/^Tasks done: 1 of \d+$/);
  });
});

describe('every figure opens to what it counted', () => {
  it('opens one at a time, names the figure, says what it counts, and lists the steps with the task each came from and a link', async () => {
    workTask(graded[1].id);
    workTask(graded[2].id);
    render(<DashboardPage />);
    fireEvent.click(tile('steps-verified'));
    const panel = document.querySelector<HTMLElement>('[data-record-detail="steps-verified"]')!;
    expect(panel).not.toBeNull();
    expect(tile('steps-verified').getAttribute('aria-expanded')).toBe('true');
    expect(tile('steps-verified').getAttribute('aria-controls')).toBe(panel.id);
    expect(within(panel).getByRole('heading', { name: /Steps verified: what counted/ })).toBeInTheDocument();
    expect(panel.textContent).toContain('Checkable steps whose pasted output matched');
    const items = panel.querySelectorAll('[data-detail-section="primary"] [data-detail-item]');
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].textContent).toMatch(/Week \d+ · /);
    expect(items[0].querySelector('a')!.getAttribute('href')).toMatch(/^\/courses\/security-plus\?tab=tasks&week=\d+&task=/);
    // the supporting lists: commands, tools, procedures
    for (const id of ['commands', 'tools']) expect(panel.querySelector(`[data-detail-section="${id}"]`), id).not.toBeNull();
    // opening another closes the first
    fireEvent.click(tile('skills'));
    expect(document.querySelectorAll('[data-record-detail]')).toHaveLength(1);
    expect(document.querySelector('[data-record-detail="skills"]')).not.toBeNull();
    expect(tile('steps-verified').getAttribute('aria-expanded')).toBe('false');
    // and the same figure again closes it
    fireEvent.click(tile('skills'));
    expect(document.querySelector('[data-record-detail]')).toBeNull();
    // the close button does too
    fireEvent.click(tile('commands'));
    fireEvent.click(document.querySelector('[data-record-close]')!);
    expect(document.querySelector('[data-record-detail]')).toBeNull();
  });

  it('lists what counted in the commands figure as the commands themselves', () => {
    workTask(graded[1].id);
    render(<DashboardPage />);
    fireEvent.click(tile('commands'));
    const codes = [...document.querySelectorAll('[data-record-detail="commands"] [data-detail-section="primary"] code')];
    expect(codes.length).toBeGreaterThan(0);
    expect(codes.every((c) => c.textContent!.trim().length > 0)).toBe(true);
  });

  it('a long list shows the first few and "Show all" shows the rest', () => {
    for (const t of graded.slice(1, 6)) workTask(t.id);
    render(<DashboardPage />);
    fireEvent.click(tile('steps-done'));
    const list = () => document.querySelectorAll('[data-record-detail] [data-detail-section="primary"] [data-detail-item]').length;
    const more = document.querySelector<HTMLButtonElement>('[data-detail-more="primary"]')!;
    expect(more, 'more than six steps counted').not.toBeNull();
    expect(list()).toBe(6);
    fireEvent.click(more);
    expect(list()).toBeGreaterThan(6);
    expect(document.querySelector('[data-detail-more="primary"]')!.textContent).toBe('Show fewer');
  });

  it('an open list is as live as the strip: a step ticked while it is open adds to it', () => {
    const task = graded[1];
    tick(task.id, requiredOf(task.id)[0].id);
    render(<DashboardPage />);
    fireEvent.click(tile('steps-done'));
    const count = () => document.querySelectorAll('[data-record-detail] [data-detail-section="primary"] [data-detail-item]').length;
    expect(count()).toBe(1);
    act(() => {
      tick(task.id, requiredOf(task.id)[1].id);
      notifyStore();
    });
    expect(count()).toBe(2);
  });

  it('says plainly when nothing has counted', () => {
    render(<DashboardPage />);
    fireEvent.click(tile('steps-verified'));
    expect(document.querySelector('[data-record-empty]')!.textContent).toBe('Nothing has counted yet.');
  });
});

describe('after "Reset my progress" the record is kept, and its lists say so', () => {
  it('lists the skills kept from the earlier run, with the steps they were earned from, while the work figures start again', async () => {
    for (const t of graded.slice(1, 4)) workTask(t.id);
    const first = render(<DashboardPage />);
    await waitFor(() => expect(earnedRepo.list(course.id).length, 'the dashboard banked what it showed').toBeGreaterThan(0));
    const skillsBefore = figure('skills');
    first.unmount();
    // Reset my progress, as HomeTab does it.
    progressRepo.resetCourse(course.id, me.memberId);
    evidenceRepo.resetCourse(course.id, me.memberId);
    stepNotesRepo.resetCourse(course.id, me.memberId);
    courseRepo.list();
    render(<DashboardPage />);
    expect(figure('steps-done')).toContain('Steps done0of');
    // The count stands; "current" (verified lately) is about the run, and the run is empty.
    expect(figure('skills').split('·')[0], 'the skills figure stands').toBe(skillsBefore.split('·')[0]);
    fireEvent.click(tile('skills'));
    const panel = document.querySelector<HTMLElement>('[data-record-detail="skills"]')!;
    expect(panel.textContent).toContain('Kept from an earlier run');
    const steps = panel.querySelectorAll('[data-detail-section="actions"] [data-detail-item]');
    expect(steps.length, 'the steps it was earned from are named').toBeGreaterThan(0);
    fireEvent.click(tile('steps-done'));
    expect(document.querySelector('[data-record-empty]'), 'the work figures start from nothing').not.toBeNull();
  });
});

describe('R127 — the record leaves as a PDF, never a JSON file', () => {
  const memberPdf = () => document.querySelector<HTMLButtonElement>('[data-dto-chip="capstone-member-profile/3"] [data-dto-pdf]')!;
  const report = (id: string, memberId: string, note: string, over: Record<string, unknown> = {}) =>
    taskReportsRepo.save({ id, courseId: course.id, taskId: graded[1].id, teamId: me.teamId, memberId, kind: 'broken', note, status: 'open', at: Date.UTC(2026, 9, 12, 12), reporterName: memberId, ...over });

  it('offers Download PDF beside Copy JSON, and no JSON file and no credential file', () => {
    workTask(graded[1].id);
    render(<DashboardPage />);
    expect(memberPdf().textContent).toContain('Download PDF');
    expect(screen.getAllByRole('button', { name: 'Copy JSON' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Download JSON/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Export credential/ })).toBeNull();
    expect(document.querySelector('[data-export-credential]')).toBeNull();
    expect(document.querySelector('[data-dto-download]')).toBeNull();
  });

  it('the PDF prints the figures the strip printed, the skills by name, progress by course and this member’s issues', () => {
    workTask(graded[1].id);
    report('mine', me.memberId, 'The command in step 2 fails on my VM.', { stepId: requiredOf(graded[1].id)[1].id });
    report('theirs', 'a-teammate', 'A teammate’s own question, not for this PDF.');
    render(<DashboardPage />);
    fireEvent.click(memberPdf());
    expect(saved.text, 'no text file is saved').toEqual([]);
    expect(saved.files).toHaveLength(1);
    const [file] = saved.files;
    expect(file.name).toBe(`capstone-record_${localDay()}.pdf`);
    expect(new TextDecoder().decode(file.bytes.slice(0, 8))).toBe('%PDF-1.4');
    const lines = allText(file.bytes).split('\n');
    const flat = lines.join(' ');
    expect(lines).toContain('Grace');
    // the strip's twelve figures, label and number, as the page printed them
    for (const id of ['steps-done', 'tasks-done', 'weeks-sealed', 'capstones', 'steps-verified', 'commands', 'evidence', 'days', 'skills', 'tools', 'procedures', 'domains']) {
      const t = tile(id);
      const label = t.querySelector('span.flex span.min-w-0')!.textContent!.trim();
      expect(lines, `${id} label`).toContain(label);
      const value = t.querySelector('svg[role="img"]') ? t.querySelector('svg[role="img"]')!.getAttribute('aria-label')!.match(/: (\d+) of/)![1] : t.querySelector('span.text-2xl')!.textContent!;
      const at = lines.indexOf(label);
      expect(lines[at + 1], `${id} value`).toBe(value);
    }
    // skills and progress
    expect(lines).toContain('SKILLS PROVED');
    expect(lines).toContain('PROGRESS BY COURSE');
    expect(flat).toContain(course.title);
    // issues: this member's, with where it is and what was said; a teammate's is not printed
    expect(lines).toContain('ISSUES REPORTED');
    expect(flat).toContain('The command in step 2 fails on my VM.');
    expect(flat).toContain('Something is broken · Open');
    expect(flat).not.toContain('A teammate’s own question');
    expect(lines).toContain('1 reported · 1 pending · 0 resolved');
  });

  it('a card’s own chip makes a PDF of that course alone, named for it', () => {
    workTask(graded[1].id);
    report('mine', me.memberId, 'Step 1 is unclear.');
    render(<DashboardPage />);
    const card = document.querySelector<HTMLButtonElement>('[data-dto-chip="capstone-kpi-board/3"] [data-dto-pdf]')!;
    expect(card.textContent).toContain('Download PDF');
    fireEvent.click(card);
    const [file] = saved.files;
    expect(file.name).toBe(`capstone-record_security-plus_${localDay()}.pdf`);
    const flat = allText(file.bytes).replace(/\s+/g, ' ');
    expect(flat).toContain(`· ${course.title}`); // the line under the name says which course
    expect(flat).toContain('Step 1 is unclear.');
    // a course alone prints the card's figures, not the strip's twelve
    expect(flat).not.toContain('Weeks sealed');
  });

  it('says there are no issues when none were reported', () => {
    workTask(graded[1].id);
    render(<DashboardPage />);
    fireEvent.click(memberPdf());
    const flat = allText(saved.files[0].bytes).replace(/\s+/g, ' ');
    expect(flat).toContain('No issues reported.');
  });
});
