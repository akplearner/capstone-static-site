/**
 * "The database has not been updated yet" (R120).
 *
 * The admin applies SQL by pasting it into the dashboard, and the app can reach
 * production before the SQL does. A write that names a column which does not exist
 * yet, or a read of a table which does not exist yet, must degrade — fall back to
 * what the old schema holds, say so on the admin pages — and never break what a
 * student was doing. Postgres says it with 42703 (undefined column) and 42P01
 * (undefined table); PostgREST says it with PGRST204 and PGRST205 when its schema
 * cache has not seen the change.
 */
// 42883 / PGRST202: a function the app calls is not in the project yet (R149: `merge_user_course_state`, 0027).
const MISSING = new Set(['42703', 'PGRST204', '42P01', 'PGRST205', '42883', 'PGRST202']);

export function isMissingSchema(error: { code?: string | null; message?: string | null } | null | undefined): boolean {
  if (!error) return false;
  if (error.code && MISSING.has(error.code)) return true;
  return /(column|relation|table|function).*(does not exist|schema cache)|could not find the .* (column|table|function)/i.test(error.message ?? '');
}
