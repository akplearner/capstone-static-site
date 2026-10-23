import { getBrowserClient } from '../supabase/client';
import { isSupabaseConfigured } from '../supabase/config';
import { isMissingSchema } from './schemaErrors';

/**
 * R129 — the support log, read by an admin (RLS lets nobody else see a row). Newest first; the code a
 * student quotes is looked up in the page by filtering these. A project without 0020 says so rather than
 * showing an empty list as if nothing had failed.
 */
export interface ErrorLogRow {
  id: string;
  code: string;
  at: number;
  clientAt: number | null;
  email: string | null;
  area: string;
  reason: string | null;
  dbCode: string | null;
  status: number | null;
  message: string | null;
  details: string | null;
  path: string | null;
  userAgent: string | null;
}

export interface ErrorLogData {
  rows: ErrorLogRow[];
  needsUpdate: boolean;
}

export async function loadErrorLog(limit = 300): Promise<ErrorLogData> {
  if (!isSupabaseConfigured()) return { rows: [], needsUpdate: false };
  const supabase = getBrowserClient();
  if (!supabase) return { rows: [], needsUpdate: false };
  const { data, error } = await supabase.from('client_errors').select('*').order('occurred_at', { ascending: false }).limit(limit);
  if (error) return { rows: [], needsUpdate: isMissingSchema(error) };
  const ms = (v: unknown) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? Date.parse(v) : null);
  const text = (v: unknown) => (typeof v === 'string' && v !== '' ? v : null);
  return {
    needsUpdate: false,
    rows: (data ?? []).map((r: Record<string, unknown>) => ({
      id: String(r.id),
      code: String(r.support_code),
      at: ms(r.occurred_at) ?? 0,
      clientAt: ms(r.client_at),
      email: text(r.user_email),
      area: String(r.area ?? ''),
      reason: text(r.reason),
      dbCode: text(r.db_code),
      status: typeof r.http_status === 'number' ? r.http_status : null,
      message: text(r.message),
      details: text(r.details),
      path: text(r.path),
      userAgent: text(r.user_agent),
    })),
  };
}
