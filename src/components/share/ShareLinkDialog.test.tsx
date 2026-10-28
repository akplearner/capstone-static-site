import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// R114: the dialog asks for consent first, builds the copy at the click, and
// shows the URL once, with the token in the fragment.
// R124: a link holds 256 KB, so the dialog shows the size of the copy and of each
// course before the click, lets the member pick the courses, and will not send a copy that does not fit.
const state = vi.hoisted(() => ({ granted: false, requests: [] as Record<string, unknown>[], result: null as unknown }));
vi.mock('@/lib/legal/consents', () => ({
  useConsents: () => ({ consents: { 'share-employer': state.granted, benchmark: false, outcome: false }, loaded: true, set: async () => true }),
}));
vi.mock('@/lib/shares', async (orig) => {
  const real = await orig<typeof import('@/lib/shares')>();
  return {
    ...real,
    createShare: async (req: Record<string, unknown>) => {
      state.requests.push(req);
      return state.result;
    },
  };
});

import { ShareLinkDialog } from './ShareLinkDialog';

const TOKEN = 'c'.repeat(43);
const buildProfile = vi.fn((ids?: readonly string[]) => ({ schema: 'capstone-member-profile/3', signature: null, subject: { display: 'Grace' }, courses: ids ?? 'all' }));
const buildCredential = vi.fn(async () => ({ type: ['OpenBadgeCredential'] }));
/** Each course in the copy is 100 KB: two fit in 256 KB, three do not. */
const heavy = vi.fn((ids?: readonly string[]) => ({ schema: 'capstone-member-profile/3', signature: null, subject: { display: 'Grace' }, ids: ids ?? [], blob: 'x'.repeat((ids ?? []).length * 100 * 1024) }));
const COURSES = [
  { id: 'a', title: 'Server+' },
  { id: 'b', title: 'CCNA' },
  { id: 'c', title: 'Security+' },
];

beforeEach(() => {
  state.granted = false;
  state.requests = [];
  state.result = { ok: true, id: 'id-1', token: TOKEN, expiresAt: '2026-11-13T10:00:00Z' };
  buildProfile.mockClear();
  heavy.mockClear();
});

describe('ShareLinkDialog (R114)', () => {
  it('without the share-employer consent it points to the account page and builds nothing', () => {
    render(<ShareLinkDialog open onClose={() => {}} buildProfile={buildProfile} buildCredential={buildCredential} />);
    expect(screen.getByRole('link', { name: /Open the account page/ })).toHaveAttribute('href', '/account');
    expect(buildProfile).not.toHaveBeenCalled();
  });

  it('builds nothing while it is closed', () => {
    state.granted = true;
    render(<ShareLinkDialog open={false} onClose={() => {}} buildProfile={buildProfile} buildCredential={buildCredential} courses={COURSES} />);
    expect(buildProfile).not.toHaveBeenCalled();
  });

  it('with consent it builds the copy that is sent at the click and shows the link once', async () => {
    state.granted = true;
    render(<ShareLinkDialog open onClose={() => {}} buildProfile={buildProfile} buildCredential={buildCredential} />);
    fireEvent.change(screen.getByPlaceholderText(/For Example Ltd/), { target: { value: 'For Acme' } });
    buildProfile.mockClear();
    fireEvent.click(screen.getByRole('button', { name: /Create link/ }));
    await waitFor(() => expect(screen.getByLabelText('The link')).toBeInTheDocument());
    expect((screen.getByLabelText('The link') as HTMLInputElement).value).toBe(`${window.location.origin}/share#${TOKEN}`);
    expect(state.requests[0]).toMatchObject({ kind: 'profile', days: 30, label: 'For Acme' });
    expect(buildProfile, 'the copy sent is built at the click').toHaveBeenCalledTimes(1);
    expect(state.requests[0].snapshot).toMatchObject({ subject: { display: 'Grace' } });
  });

  it('takes the whole label when it is typed a key at a time (R123: it used to take one character)', async () => {
    state.granted = true;
    const user = userEvent.setup();
    render(<ShareLinkDialog open onClose={() => {}} buildProfile={buildProfile} buildCredential={buildCredential} />);
    const field = screen.getByPlaceholderText(/For Example Ltd/);
    await waitFor(() => expect(field, 'opens with the label field ready to type in').toHaveFocus());
    await user.type(field, 'For Acme Ltd, SOC role');
    expect(field).toHaveValue('For Acme Ltd, SOC role');
    expect(field).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: /Create link/ }));
    await waitFor(() => expect(state.requests[0]).toMatchObject({ label: 'For Acme Ltd, SOC role' }));
  });

  it('says why a link was refused', async () => {
    state.granted = true;
    state.result = { ok: false, error: 'unavailable' };
    render(<ShareLinkDialog open onClose={() => {}} buildProfile={buildProfile} buildCredential={buildCredential} />);
    fireEvent.click(screen.getByRole('button', { name: /Create link/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('not set up on this deployment'));
  });

  it('says what to do when the server finds the copy too large', async () => {
    state.granted = true;
    state.result = { ok: false, error: 'too-large' };
    render(<ShareLinkDialog open onClose={() => {}} buildProfile={buildProfile} buildCredential={buildCredential} courses={COURSES} />);
    fireEvent.click(screen.getByRole('button', { name: /Create link/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('larger than 256 KB, the most a link can hold. Untick a course'));
  });
});

describe('ShareLinkDialog (R124): the copy fits, by choosing', () => {
  const open = () => {
    state.granted = true;
    render(<ShareLinkDialog open onClose={() => {}} buildProfile={heavy} buildCredential={buildCredential} courses={COURSES} />);
  };
  const size = () => document.querySelector<HTMLElement>('[data-share-size]')!;
  const create = () => screen.getByRole('button', { name: /Create link/ });

  it('lists the courses, each with its size, all ticked, and shows the size of the copy against the limit', () => {
    open();
    const group = document.querySelector<HTMLElement>('[data-share-courses]')!;
    expect(within(group).getAllByRole('checkbox')).toHaveLength(3);
    for (const box of within(group).getAllByRole('checkbox')) expect(box).toBeChecked();
    expect(group.textContent).toContain('Server+');
    expect(group.textContent).toMatch(/100 KB/);
    expect(size().textContent).toContain('300 KB');
    expect(size().textContent).toContain('256 KB a link can hold');
  });

  it('three courses of 100 KB are over the limit: it says so, with the size, and will not send', () => {
    open();
    expect(size()).toHaveAttribute('data-share-over');
    expect(size().textContent).toMatch(/The copy is 300 KB, over the 256 KB a link can hold\. Untick a course to make it smaller\./);
    expect(size()).toHaveAttribute('role', 'alert');
    expect(create()).toBeDisabled();
  });

  it('unticking a course measures again and lets the link be made, with the courses left in the copy', async () => {
    open();
    fireEvent.click(document.querySelector('[data-share-course="b"]')!);
    expect(size().textContent).toContain('200 KB');
    expect(size()).not.toHaveAttribute('data-share-over');
    expect(create()).toBeEnabled();
    fireEvent.click(create());
    await waitFor(() => expect(screen.getByLabelText('The link')).toBeInTheDocument());
    expect((state.requests[0].snapshot as { ids: string[] }).ids, 'the copy sent holds the courses still ticked, in order').toEqual(['a', 'c']);
  });

  it('will not send a copy of no course', () => {
    open();
    for (const id of ['a', 'b', 'c']) fireEvent.click(document.querySelector(`[data-share-course="${id}"]`)!);
    expect(size().textContent).toContain('Choose at least one course.');
    expect(create()).toBeDisabled();
    fireEvent.click(document.querySelector('[data-share-course="b"]')!);
    expect(create()).toBeEnabled();
  });

  it('has nothing to choose with one course, still shows the size, and hides both for the credential', () => {
    state.granted = true;
    render(<ShareLinkDialog open onClose={() => {}} buildProfile={buildProfile} buildCredential={buildCredential} courses={[COURSES[0]]} />);
    expect(document.querySelector('[data-share-courses]')).toBeNull();
    expect(size().textContent).toMatch(/The copy is \d+ KB of the 256 KB a link can hold\./);
    fireEvent.click(screen.getByLabelText(/The credential/));
    expect(document.querySelector('[data-share-size]'), 'the credential is small: no meter').toBeNull();
    expect(create()).toBeEnabled();
  });
});
