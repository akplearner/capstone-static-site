import { describe, expect, it } from 'vitest';
import { decisionByKey, rewriteDecisionAuthors } from './importRewrite';

describe('R136 — the first-sign-in import keeps a decision as its maker’s', () => {
  const data = { fields: { 'decision:raid': 'raid10', 'decision:raid:by': 'guest-1', 'decision:raid:at': '1700000000000', why: 'speed' }, groups: {} };

  it('rewrites the guest id under :by to the account id and nothing else', () => {
    const out = rewriteDecisionAuthors(data, 'guest-1', 'user-9');
    expect(out.fields['decision:raid:by']).toBe('user-9');
    expect(out.fields['decision:raid']).toBe('raid10');
    expect(out.fields['decision:raid:at']).toBe('1700000000000');
    expect(out.fields.why).toBe('speed');
    expect(out.groups).toBe(data.groups);
  });

  it('leaves a teammate’s decision alone and returns the same object when nothing changes', () => {
    const theirs = { ...data, fields: { ...data.fields, 'decision:raid:by': 'guest-2' } };
    expect(rewriteDecisionAuthors(theirs, 'guest-1', 'user-9')).toBe(theirs);
  });

  it('names the key it writes', () => {
    expect(decisionByKey('raid')).toBe('decision:raid:by');
  });
});
