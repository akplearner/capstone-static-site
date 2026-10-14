import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// R114: the public page reads the token from the fragment, shows the frozen
// copy under a banner that says what it is and is not, and treats unknown,
// revoked and expired alike.
const shared = vi.hoisted(() => ({ copy: null as null | Record<string, unknown>, asked: [] as string[] }));
vi.mock('@/lib/shares', async (orig) => {
  const real = await orig<typeof import('@/lib/shares')>();
  return {
    ...real,
    fetchShared: async (token: string) => {
      shared.asked.push(token);
      return shared.copy;
    },
  };
});

import { SharedProfile } from './SharedProfile';

const TOKEN = 'b'.repeat(43);
const profileCopy = {
  kind: 'profile',
  measuredAgainst: 'Sample MSSP',
  createdAt: '2026-10-14T10:00:00Z',
  expiresAt: '2026-11-13T10:00:00Z',
  snapshot: {
    schema: 'capstone-member-profile/1',
    signature: null,
    subject: { display: 'Grace Hopper' },
    summary: { verified: 4, verifiable: 9, receipted: 2, artifacts: 3, skillsVerified: [], skillsPractised: [] },
    courses: [],
  },
};

beforeEach(() => {
  shared.copy = null;
  shared.asked = [];
  window.location.hash = '';
});

describe('SharedProfile (R114)', () => {
  it('shows the frozen copy under the banner, with the figures it carries', async () => {
    window.location.hash = `#${TOKEN}`;
    shared.copy = profileCopy;
    const { container } = render(<SharedProfile />);
    await waitFor(() => expect(screen.getByText('Grace Hopper')).toBeInTheDocument());
    expect(shared.asked).toEqual([TOKEN]);
    const banner = container.querySelector('[data-share-banner]')!.textContent!;
    for (const phrase of ['frozen copy', 'unsigned', 'not proof of the machine', 'revoke', 'Sample MSSP']) expect(banner, phrase).toContain(phrase);
    expect(container.querySelector('[data-share-figures]')!.textContent).toContain('2 receipted');
    expect(screen.getByRole('button', { name: /Download JSON/ })).toBeInTheDocument();
  });

  it('a credential shows its achievement and alignment', async () => {
    window.location.hash = `#${TOKEN}`;
    shared.copy = {
      ...profileCopy,
      kind: 'credential',
      snapshot: { type: ['VerifiableCredential', 'OpenBadgeCredential'], credentialSubject: { achievement: { name: 'Capstone member profile', description: 'Unsigned.', alignment: [{ targetName: 'Network scanning', targetCode: 'comp.recon.scan' }] } } },
    };
    render(<SharedProfile />);
    await waitFor(() => expect(screen.getByText('Network scanning')).toBeInTheDocument());
    expect(screen.getByText('comp.recon.scan')).toBeInTheDocument();
  });

  it('an unknown, revoked or expired link, or none at all, reads the same', async () => {
    window.location.hash = `#${TOKEN}`;
    const { container, unmount } = render(<SharedProfile />);
    await waitFor(() => expect(container.querySelector('[data-share-missing]')).not.toBeNull());
    unmount();
    window.location.hash = '';
    const second = render(<SharedProfile />);
    expect(second.container.querySelector('[data-share-missing]')).not.toBeNull();
    expect(shared.asked, 'nothing asked without a token').toEqual([TOKEN]);
  });
});
