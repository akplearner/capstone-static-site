/**
 * R112 — every row of a select, a page at a time. PostgREST stops a response
 * at its row cap (1000 by default), so a large course read in one request
 * would undercount every cohort aggregate. Pages until a short one; on an
 * error it returns what it has, the same as a single failed read would.
 */
export const PAGE_ROWS = 1000;

export async function selectAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<{ data: T[] }> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE_ROWS) {
    const { data, error } = await page(from, from + PAGE_ROWS - 1);
    if (error || !data) break;
    out.push(...data);
    if (data.length < PAGE_ROWS) break;
  }
  return { data: out };
}
