import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

/**
 * R122 — the studio. A built-in course is forked by its first save, so that save asks first;
 * every save is a numbered version the History tab lists and restores; ids already saved are
 * shown and not editable, because progress is recorded against them.
 */
const params = vi.hoisted(() => ({ id: 'ccna' }));
vi.mock('next/navigation', () => ({ useParams: () => ({ courseId: params.id }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/components/InstructorGate', () => ({ AdminGate: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
const download = vi.hoisted(() => ({ calls: [] as { name: string; text: string }[] }));
vi.mock('@/lib/download', () => ({ downloadText: (name: string, text: string) => download.calls.push({ name, text }) }));

const { default: StudioPage } = await import('./page');
const { courseRepo } = await import('@/lib/data');
const { invalidateCourseCache } = await import('@/lib/data/localStorageCourseRepo');
const { invalidateContentFixes } = await import('@/lib/data/localStorageContentFixesRepo');
const { SEED_DOCUMENTS } = await import('@/lib/content/docs');

const SHIPPED = SEED_DOCUMENTS.ccna.course;
const shippedVersion = SHIPPED.version ?? 0;

beforeEach(() => {
  localStorage.clear();
  invalidateCourseCache();
  invalidateContentFixes();
  download.calls.length = 0;
  params.id = 'ccna';
});

const tab = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const chip = () => document.querySelector('[data-studio-version]')!.textContent;
const waitForStudio = async () => {
  await waitFor(() => expect(document.querySelector('[data-studio-save]')).not.toBeNull());
};
const retitle = (to: string) => fireEvent.change(screen.getByLabelText('Title'), { target: { value: to } });
const saveButton = () => document.querySelector('[data-studio-save]') as HTMLButtonElement;

describe('a built-in course', () => {
  it('says that saving forks it, in the place it will be saved, and points to the other ways', async () => {
    render(<StudioPage />);
    await waitForStudio();
    const banner = document.querySelector('[data-studio-fork]')!;
    expect(banner.textContent).toContain('Built-in course');
    expect(banner.textContent, 'offline, the copy is this device’s').toContain('on this device');
    expect(banner.textContent).not.toContain('for every student');
    expect(banner.textContent).toContain('Fix the text');
    expect(banner.textContent).toContain('duplicate this one');
    expect(banner.querySelector('a[href="/instructor/issues"]')).not.toBeNull();
    expect(document.querySelector('[data-studio-copy]')).toBeNull();
    expect(chip()).toBe(`v${shippedVersion}.0`);
  });

  it('asks before the first save forks it, and saves nothing until it is told to', async () => {
    render(<StudioPage />);
    await waitForStudio();
    retitle('A forked CCNA');
    fireEvent.click(saveButton());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('dialog').textContent).toContain('forks this built-in course');
    expect(courseRepo.get('ccna')!.isSeed, 'nothing is saved yet').toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(courseRepo.get('ccna')!.isSeed, 'cancel saves nothing').toBe(true);
    expect(courseRepo.get('ccna')!.title).toBe(SHIPPED.title);

    fireEvent.click(saveButton());
    fireEvent.click(document.querySelector('[data-studio-fork-confirm]')!);
    await waitFor(() => expect(courseRepo.get('ccna')!.isSeed).toBe(false));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(courseRepo.get('ccna')!.title).toBe('A forked CCNA');
    expect(courseRepo.get('ccna')!.version, 'its first edit is one past the version it shipped at').toBe(shippedVersion + 1);
    await waitFor(() => expect(chip()).toBe(`v${shippedVersion + 1}.0`));
    // It is an edited copy now: the banner says so, and the next save does not ask again.
    expect(document.querySelector('[data-studio-fork]')).toBeNull();
    expect(document.querySelector('[data-studio-copy]')!.textContent).toContain('edited copy of a built-in course');
    retitle('A forked CCNA, edited');
    fireEvent.click(saveButton());
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(courseRepo.get('ccna')!.version).toBe(shippedVersion + 2));
    expect(chip()).toBe(`v${shippedVersion + 2}.0`);
  });

  it('an edited copy that is opened later shows its own banner and saves straight away', async () => {
    courseRepo.save({ ...courseRepo.get('ccna')!, title: 'Saved earlier' });
    render(<StudioPage />);
    await waitForStudio();
    expect(document.querySelector('[data-studio-fork]')).toBeNull();
    expect(document.querySelector('[data-studio-copy]')).not.toBeNull();
    retitle('Saved now');
    fireEvent.click(saveButton());
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(courseRepo.get('ccna')!.title).toBe('Saved now'));
  });

  it('a course of the admin’s own has no banner and starts at version 1', async () => {
    courseRepo.duplicate('ccna', 'my-ccna', 'My CCNA');
    params.id = 'my-ccna';
    render(<StudioPage />);
    await waitForStudio();
    expect(document.querySelector('[data-studio-fork]')).toBeNull();
    expect(document.querySelector('[data-studio-copy]')).toBeNull();
    expect(chip()).toBe('v1.0');
    retitle('My CCNA, renamed');
    fireEvent.click(saveButton());
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(chip()).toBe('v2.0'));
  });
});

describe('ids that progress is recorded against', () => {
  const readOnlyIds = () => [...document.querySelectorAll('input[aria-readonly="true"]')].map((i) => (i as HTMLInputElement).value);

  it('are shown and not editable once saved, for tasks, steps, roles and gates', async () => {
    render(<StudioPage />);
    await waitForStudio();
    const firstTask = SHIPPED.tasks[0];

    tab('Roles');
    expect(readOnlyIds()).toEqual(SHIPPED.roles.map((r) => r.id));
    expect(document.body.textContent).toContain('Progress is recorded against this id');

    tab('Tasks');
    fireEvent.click(document.querySelector('button[aria-expanded]')!);
    expect(readOnlyIds()).toContain(firstTask.id);
    expect(readOnlyIds(), 'its steps too').toContain(firstTask.steps[0].id);
    for (const i of document.querySelectorAll<HTMLInputElement>('input[aria-readonly="true"]')) expect(i.readOnly).toBe(true);

    tab('Gates');
    expect(readOnlyIds()).toEqual(SHIPPED.gates.map((g) => String(g.id)));
  });

  it('stay editable for a task and a step added in this session, until they are saved', async () => {
    courseRepo.duplicate('ccna', 'my-ccna', 'My CCNA');
    params.id = 'my-ccna';
    render(<StudioPage />);
    await waitForStudio();
    tab('Tasks');
    fireEvent.click(screen.getByRole('button', { name: /Add task/ }));
    // The new task opens: its id is editable, and says nothing about being locked.
    const newTask = [...document.querySelectorAll<HTMLInputElement>('input')].find((i) => i.value.includes('-t') && i.getAttribute('aria-readonly') !== 'true');
    expect(newTask, 'the new task’s id').toBeTruthy();
    expect(newTask!.readOnly).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /Add step/ }));
    const newStep = [...document.querySelectorAll<HTMLInputElement>('input')].find((i) => /-s\d+$/.test(i.value));
    expect(newStep!.readOnly).toBe(false);

    // Saved, they lock: the course saves, the ids are now on record.
    fireEvent.click(saveButton());
    await waitFor(() => expect(readOnlyIds()).toContain(newTask!.value));
    expect(readOnlyIds()).toContain(newStep!.value);
  });
});

describe('the History tab', () => {
  async function saveTwice() {
    render(<StudioPage />);
    await waitForStudio();
    retitle('Edit one');
    fireEvent.click(saveButton());
    fireEvent.click(document.querySelector('[data-studio-fork-confirm]')!);
    await waitFor(() => expect(courseRepo.get('ccna')!.title).toBe('Edit one'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    retitle('Edit two');
    fireEvent.click(saveButton());
    await waitFor(() => expect(courseRepo.get('ccna')!.title).toBe('Edit two'));
  }

  it('lists every save, newest first, marks the current one, and downloads any', async () => {
    await saveTwice();
    tab('History');
    await waitFor(() => expect(document.querySelectorAll('[data-history-row]')).toHaveLength(2));
    const rows = [...document.querySelectorAll('[data-history-row]')];
    expect(rows.map((r) => Number(r.getAttribute('data-history-row')))).toEqual([shippedVersion + 2, shippedVersion + 1]);
    expect(rows[0].textContent).toContain('Edit two');
    expect(rows[0].textContent).toContain('Current');
    expect(rows[1].textContent).toContain('Edit one');
    expect(rows[1].textContent).toContain('by Instructor');
    fireEvent.click(rows[1].querySelector('[data-history-download]')!);
    await waitFor(() => expect(download.calls).toHaveLength(1));
    expect(download.calls[0].name).toBe(`ccna_v${shippedVersion + 1}.json`);
    expect(JSON.parse(download.calls[0].text).course.title).toBe('Edit one');
  });

  it('restores an old version as a new one, and the editor shows the restored words', async () => {
    await saveTwice();
    tab('History');
    await waitFor(() => expect(document.querySelectorAll('[data-history-row]')).toHaveLength(2));
    const old = document.querySelector(`[data-history-row="${shippedVersion + 1}"]`)!;
    fireEvent.click(old.querySelector('[data-history-restore]')!);
    expect(within(screen.getByRole('dialog')).getByText(/saved as a new version/)).toBeInTheDocument();
    fireEvent.click(document.querySelector('[data-history-restore-confirm]')!);

    await waitFor(() => expect(courseRepo.get('ccna')!.title).toBe('Edit one'));
    expect(courseRepo.get('ccna')!.version, 'a restore is the next version').toBe(shippedVersion + 3);
    await waitFor(() => expect(document.querySelectorAll('[data-history-row]')).toHaveLength(3));
    expect(document.querySelector(`[data-history-row="${shippedVersion + 3}"]`)!.getAttribute('data-history-current')).toBe('true');
    expect(chip()).toBe(`v${shippedVersion + 3}.0`);
    // The draft was seeded again from what was restored.
    tab('Details');
    await waitFor(() => expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Edit one'));
  });

  it('says what to expect for a built-in course that has never been edited', async () => {
    render(<StudioPage />);
    await waitForStudio();
    tab('History');
    await waitFor(() => expect(document.querySelector('[data-history]')).not.toBeNull());
    expect(document.querySelector('[data-history]')!.textContent).toContain('it is the built-in version');
    expect(document.querySelectorAll('[data-history-row]')).toHaveLength(0);
  });
});
