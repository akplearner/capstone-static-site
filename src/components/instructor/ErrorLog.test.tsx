import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ErrorLog, ERROR_LOG_COPY } from './ErrorLog';
import type { ErrorLogRow } from '@/lib/data/errorLogLoader';

/** R129 — the admin finds a student's code and sees who, where and why; nobody else is shown any of it. */
const row = (over: Partial<ErrorLogRow>): ErrorLogRow => ({ id: 'a', code: 'E-ABC234', at: Date.UTC(2026, 9, 23, 14, 5), clientAt: null, email: 'ada@example.com', area: 'agreements', reason: 'permission', dbCode: '42501', status: 403, message: 'new row violates row-level security policy', details: null, path: '/dashboard', userAgent: null, ...over });
const rows = [row({}), row({ id: 'b', code: 'E-XYZ789', email: 'bob@example.com', reason: 'network', dbCode: null, status: null, message: 'Failed to fetch' })];

describe('ErrorLog', () => {
  it('lists each failure with its code, time, account, area, reason, database code and page', () => {
    const { container } = render(<ErrorLog data={{ rows, needsUpdate: false }} onRefresh={() => {}} />);
    const first = container.querySelector('[data-error-row="E-ABC234"]')!.textContent!;
    for (const part of ['E-ABC234', '2026-10-23 14:05 UTC', 'ada@example.com', 'agreements', 'permission', '42501', '403', 'row-level security', '/dashboard']) expect(first, part).toContain(part);
  });

  it('finds a code, an email or a reason, and says plainly when nothing matches', () => {
    const { container } = render(<ErrorLog data={{ rows, needsUpdate: false }} onRefresh={() => {}} />);
    const find = (v: string) => fireEvent.change(screen.getByLabelText(/Find an error/), { target: { value: v } });
    find('xyz789');
    expect([...container.querySelectorAll('[data-error-row]')].map((e) => e.getAttribute('data-error-row'))).toEqual(['E-XYZ789']);
    find('ada@');
    expect(container.querySelectorAll('[data-error-row]')).toHaveLength(1);
    find('no such thing');
    expect(container.querySelector('[data-error-log-empty]')!.textContent).toBe(ERROR_LOG_COPY.noMatch);
  });

  it('says nothing has failed, and says when the database needs its update instead', () => {
    const empty = render(<ErrorLog data={{ rows: [], needsUpdate: false }} onRefresh={() => {}} />);
    expect(empty.container.querySelector('[data-error-log-empty]')!.textContent).toBe(ERROR_LOG_COPY.none);
    empty.unmount();
    const needs = render(<ErrorLog data={{ rows: [], needsUpdate: true }} onRefresh={() => {}} />);
    expect(needs.container.querySelector('[data-error-log-update]')!.textContent).toBe(ERROR_LOG_COPY.update);
  });

  it('refreshes on request', () => {
    const onRefresh = vi.fn();
    render(<ErrorLog data={{ rows, needsUpdate: false }} onRefresh={onRefresh} />);
    fireEvent.click(screen.getByRole('button', { name: /Refresh/ }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
