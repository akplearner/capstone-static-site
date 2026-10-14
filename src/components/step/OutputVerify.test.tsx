import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// R113: a full match under a server-issued stamp asks for a receipt, the
// request carries the stamp, the step, the hash and the counts and never the
// paste, and the box says what happened in words that claim no more.
const stamps = vi.hoisted(() => ({
  server: null as null | { stamp: string; expiresAt: number; expired: boolean },
  outcome: 'receipted' as 'receipted' | 'stamp-expired' | 'stamp-unknown' | 'offline',
  requests: [] as Record<string, unknown>[],
  refreshed: 0,
}));

vi.mock('@/lib/stamps', () => ({
  useServerStamp: () => stamps.server,
  requestReceipt: async (r: Record<string, unknown>) => {
    stamps.requests.push(r);
    return stamps.outcome;
  },
  refreshStamp: async () => {
    stamps.refreshed += 1;
    return null;
  },
}));

import { OutputVerify } from './OutputVerify';

const STAMP = 'CQ-ABC234';
const ledger = { courseId: 'security-plus', taskId: 't1', stepId: 's1', memberId: 'm1' };
const PASTE = `Status: active\n${STAMP}`;

beforeEach(() => {
  localStorage.clear();
  stamps.server = { stamp: STAMP, expiresAt: Date.now() + 15 * 60_000, expired: false };
  stamps.outcome = 'receipted';
  stamps.requests = [];
  stamps.refreshed = 0;
});

const paste = (text: string) => fireEvent.change(screen.getByRole('textbox'), { target: { value: text } });

describe('OutputVerify — receipts (R113)', () => {
  it('asks for a receipt with the seven fields and the member id, never the paste, and says it was receipted', async () => {
    render(<OutputVerify verify={['Status: active', STAMP]} stamp={STAMP} ledger={ledger} />);
    paste(PASTE);
    await waitFor(() => expect(screen.getByText(/receipted \(the server issued this stamp/)).toBeInTheDocument(), { timeout: 3000 });
    expect(stamps.requests).toHaveLength(1);
    const r = stamps.requests[0];
    expect(Object.keys(r).sort()).toEqual(['courseId', 'matchedTokens', 'outputSha256', 'stamp', 'stepId', 'taskId', 'totalTokens', 'userId']);
    expect(r).toMatchObject({ userId: 'm1', courseId: 'security-plus', taskId: 't1', stepId: 's1', stamp: STAMP, matchedTokens: 2, totalTokens: 2 });
    expect(r.outputSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.values(r), 'the paste stays in the browser').not.toContain(PASTE);
  });

  it('a match the server would not receipt still counts as verified, says why, and offers a fresh stamp', async () => {
    stamps.outcome = 'stamp-expired';
    const { container } = render(<OutputVerify verify={['Status: active', STAMP]} stamp={STAMP} ledger={ledger} />);
    paste(PASTE);
    await waitFor(() => expect(container.querySelector('[data-receipt="not-receipted"]')).not.toBeNull(), { timeout: 3000 });
    expect(screen.getByText('Verified — recorded and hashed.')).toBeInTheDocument();
    expect(container.textContent).toContain('Not receipted: the stamp had expired or was not recognised.');
    fireEvent.click(screen.getByRole('button', { name: /Get a fresh stamp/ }));
    await waitFor(() => expect(stamps.refreshed).toBe(1));
  });

  it('offline (the client stamp) asks nothing and reads as before', async () => {
    stamps.server = null;
    render(<OutputVerify verify={['Status: active', STAMP]} stamp={STAMP} ledger={ledger} />);
    paste(PASTE);
    expect(screen.getByText('Verified — your output matches. Recorded and hashed.')).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 1200));
    expect(stamps.requests).toHaveLength(0);
  });

  it('names the stamp when it is the only token missing', () => {
    render(<OutputVerify verify={['Status: active', STAMP]} stamp={STAMP} ledger={ledger} />);
    paste('Status: active');
    expect(screen.getByText(/Only your stamp is missing \(1\/2\)/)).toBeInTheDocument();
    paste('nothing useful');
    expect(screen.getByText(/Not matching yet \(0\/2\)/)).toBeInTheDocument();
  });
});
