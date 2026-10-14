import { describe, it, expect } from 'vitest';
import { PAGE_ROWS, selectAll } from './selectAll';

/** R112 — the pager reads past the row cap, stops on a short page, and keeps what it has on an error. */
describe('selectAll', () => {
  const pages = (total: number, failAt?: number) => {
    const calls: [number, number][] = [];
    const page = async (from: number, to: number) => {
      calls.push([from, to]);
      if (failAt !== undefined && from >= failAt) return { data: null, error: { message: 'boom' } };
      const rows = Array.from({ length: Math.max(0, Math.min(to, total - 1) - from + 1) }, (_, i) => from + i);
      return { data: rows, error: null };
    };
    return { calls, page };
  };

  it('reads every row past the cap, a page at a time', async () => {
    const { calls, page } = pages(2500);
    const { data } = await selectAll(page);
    expect(data).toHaveLength(2500);
    expect(data[2499]).toBe(2499);
    expect(calls).toEqual([[0, PAGE_ROWS - 1], [PAGE_ROWS, 2 * PAGE_ROWS - 1], [2 * PAGE_ROWS, 3 * PAGE_ROWS - 1]]);
  });

  it('asks once more after an exactly full page, and keeps the rows read before an error', async () => {
    const full = pages(PAGE_ROWS);
    expect((await selectAll(full.page)).data).toHaveLength(PAGE_ROWS);
    expect(full.calls).toHaveLength(2);
    const broken = pages(5000, PAGE_ROWS);
    expect((await selectAll(broken.page)).data).toHaveLength(PAGE_ROWS);
  });
});
