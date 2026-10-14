import { describe, it, expect, vi, beforeEach } from 'vitest';
import sample from '../../content/profiles/sample-mssp.json';

// R114: a published profile is validated on publish and again on read; a
// row that no longer fits the schema, or whose id disagrees with its file,
// never reaches the picker. Without the table there is nothing to list.
const db = vi.hoisted(() => ({
  rows: [] as unknown[] | null,
  error: null as null | { code: string; message: string },
  inserted: [] as unknown[],
  insertError: null as null | { code: string; message: string },
}));
vi.mock('./supabase/client', () => ({
  getBrowserClient: () => ({
    from: () => ({
      select: () => ({ order: async () => ({ data: db.rows, error: db.error }) }),
      insert: async (row: unknown) => {
        db.inserted.push(row);
        return { error: db.insertError };
      },
    }),
  }),
}));

import { listPublishedProfiles, publishProfile } from './employerProfiles';

const acme = { ...sample, id: 'profile.acme-soc', name: 'Acme SOC' };

beforeEach(() => {
  db.rows = [];
  db.error = null;
  db.inserted = [];
  db.insertError = null;
});

describe('employer profiles (R114)', () => {
  it('lists the rows that still validate, and skips the rest', async () => {
    db.rows = [
      { id: 'profile.acme-soc', publisher_user_id: 'ivy', profile: acme, published_at: '2026-10-14T10:00:00Z' },
      { id: 'profile.broken', publisher_user_id: 'ivy', profile: { id: 'profile.broken' }, published_at: '2026-10-14T10:00:00Z' },
      { id: 'profile.mismatch', publisher_user_id: 'ivy', profile: acme, published_at: '2026-10-14T10:00:00Z' },
    ];
    const listed = await listPublishedProfiles();
    expect(listed?.map((p) => p.profile.id)).toEqual(['profile.acme-soc']);
    expect(listed?.[0].publisherId).toBe('ivy');
  });

  it('reads nothing where the table does not exist yet', async () => {
    db.rows = null;
    db.error = { code: 'PGRST205', message: "Could not find the table 'public.environment_profiles' in the schema cache" };
    expect(await listPublishedProfiles()).toBeNull();
  });

  it('validates before publishing, and names a duplicate id', async () => {
    const bad = await publishProfile('ivy', '{"id":"profile.x"}');
    expect(bad.ok).toBe(false);
    expect(db.inserted).toHaveLength(0);
    const good = await publishProfile('ivy', JSON.stringify(acme));
    expect(good).toMatchObject({ ok: true });
    expect(db.inserted[0]).toMatchObject({ id: 'profile.acme-soc', publisher_user_id: 'ivy' });
    db.insertError = { code: '23505', message: 'duplicate key' };
    const dup = await publishProfile('ivy', JSON.stringify(acme));
    expect(dup.ok === false && dup.error).toContain('already published');
  });
});
