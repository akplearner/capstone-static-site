import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// R114: the dialog asks for consent first, builds the copy at the click, and
// shows the URL once, with the token in the fragment.
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
const buildProfile = vi.fn(() => ({ schema: 'capstone-member-profile/1', signature: null, subject: { display: 'Grace' } }));
const buildCredential = vi.fn(async () => ({ type: ['OpenBadgeCredential'] }));

beforeEach(() => {
  state.granted = false;
  state.requests = [];
  state.result = { ok: true, id: 'id-1', token: TOKEN, expiresAt: '2026-11-13T10:00:00Z' };
  buildProfile.mockClear();
});

describe('ShareLinkDialog (R114)', () => {
  it('without the share-employer consent it points to the account page and builds nothing', () => {
    render(<ShareLinkDialog open onClose={() => {}} buildProfile={buildProfile} buildCredential={buildCredential} />);
    expect(screen.getByRole('link', { name: /Open the account page/ })).toHaveAttribute('href', '/account');
    expect(buildProfile).not.toHaveBeenCalled();
  });

  it('with consent it builds the copy at the click and shows the link once', async () => {
    state.granted = true;
    render(<ShareLinkDialog open onClose={() => {}} buildProfile={buildProfile} buildCredential={buildCredential} />);
    expect(buildProfile, 'never at render').not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText(/For Example Ltd/), { target: { value: 'For Acme' } });
    fireEvent.click(screen.getByRole('button', { name: /Create link/ }));
    await waitFor(() => expect(screen.getByLabelText('The link')).toBeInTheDocument());
    expect((screen.getByLabelText('The link') as HTMLInputElement).value).toBe(`${window.location.origin}/share#${TOKEN}`);
    expect(state.requests[0]).toMatchObject({ kind: 'profile', days: 30, label: 'For Acme' });
    expect(buildProfile).toHaveBeenCalledTimes(1);
  });

  it('says why a link was refused', async () => {
    state.granted = true;
    state.result = { ok: false, error: 'unavailable' };
    render(<ShareLinkDialog open onClose={() => {}} buildProfile={buildProfile} buildCredential={buildCredential} />);
    fireEvent.click(screen.getByRole('button', { name: /Create link/ }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('not set up on this deployment'));
  });
});
