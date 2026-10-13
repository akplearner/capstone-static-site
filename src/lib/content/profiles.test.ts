import { describe, it, expect } from 'vitest';
import { sampleProfiles } from './profiles';
import { ENVIRONMENT_PROFILE_SCHEMA, SAMPLE_PROFILE_ID } from '@/lib/docs/environmentProfile';

/** R108 — the reader hands back the published file, not the builder. */
describe('content/profiles — read back', () => {
  it('returns the sample profile from the committed JSON', () => {
    const list = sampleProfiles();
    expect(list.length).toBe(1);
    expect(list[0].schema).toBe(ENVIRONMENT_PROFILE_SCHEMA);
    expect(list[0].id).toBe(SAMPLE_PROFILE_ID);
    expect(list[0].workRoles.length).toBeGreaterThan(0);
  });
});
