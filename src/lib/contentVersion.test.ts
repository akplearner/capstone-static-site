import { describe, it, expect } from 'vitest';
import { contentVersion, parseContentVersion } from './contentVersion';

/** R120 — a version is "{document}.{revision}", and an invalid part never leaks into a stamp. */
describe('contentVersion', () => {
  it('joins the document version and the ledger revision', () => {
    expect(contentVersion(1, 7)).toBe('1.7');
    expect(contentVersion(2)).toBe('2.0');
  });

  it('reads a missing or invalid document version as 1 and an invalid revision as 0', () => {
    expect(contentVersion(undefined, 3)).toBe('1.3');
    expect(contentVersion(0, 0)).toBe('1.0');
    expect(contentVersion(-4, -2)).toBe('1.0');
    expect(contentVersion(1.5, 2.5)).toBe('1.0');
    expect(contentVersion(Number.NaN, Number.NaN)).toBe('1.0');
  });

  it('parses what it writes, and refuses everything else', () => {
    expect(parseContentVersion('1.7')).toEqual({ doc: 1, revision: 7 });
    expect(parseContentVersion(contentVersion(12, 340))).toEqual({ doc: 12, revision: 340 });
    for (const bad of ['', '1', '1.', '.7', '1.7.2', 'v1.7', 'a.b', undefined, null]) expect(parseContentVersion(bad), String(bad)).toBeNull();
  });
});
