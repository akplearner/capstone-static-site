import { describe, it, expect } from 'vitest';
import { safeNextPath } from './safeRedirect';

// These guard a real open-redirect: both auth routes send the user to
// `${origin}${next}` after sign-in, with `next` taken from the query string.

describe('safeNextPath', () => {
  it('keeps ordinary in-app paths', () => {
    expect(safeNextPath('/courses/cysa-plus')).toBe('/courses/cysa-plus');
    expect(safeNextPath('/courses/cysa-plus?tab=weeks')).toBe('/courses/cysa-plus?tab=weeks');
    expect(safeNextPath('/courses/cysa-plus#week-1')).toBe('/courses/cysa-plus#week-1');
  });

  it('rejects protocol-relative URLs that would leave the site', () => {
    // The important case: browsers read `//host` as "same scheme, other origin",
    // so `${origin}//evil.example` navigates off-site with a fresh session.
    expect(safeNextPath('//evil.example')).toBe('/');
    expect(safeNextPath('//evil.example/path')).toBe('/');
  });

  it('rejects backslash and encoded variants of the same trick', () => {
    expect(safeNextPath('/\\evil.example')).toBe('/');
    expect(safeNextPath('/%2Fevil.example')).toBe('/');
  });

  it('rejects absolute URLs and non-path values', () => {
    expect(safeNextPath('https://evil.example')).toBe('/');
    expect(safeNextPath('http://evil.example')).toBe('/');
    expect(safeNextPath('javascript:alert(1)')).toBe('/');
    expect(safeNextPath('courses/cysa-plus')).toBe('/'); // no leading slash
  });

  it('rejects control characters used to smuggle a second URL', () => {
    expect(safeNextPath('/courses\nLocation: https://evil.example')).toBe('/');
    expect(safeNextPath('/courses\r\nSet-Cookie: x=1')).toBe('/');
  });

  it('falls back for empty input, and honours a custom fallback', () => {
    expect(safeNextPath(null)).toBe('/');
    expect(safeNextPath(undefined)).toBe('/');
    expect(safeNextPath('')).toBe('/');
    expect(safeNextPath('//evil.example', '/home')).toBe('/home');
  });

  it('never returns a value that resolves to another origin', () => {
    const hostile = [
      '//evil.example',
      '/\\evil.example',
      '/%2Fevil.example',
      'https://evil.example',
      '////evil.example',
      '/\t/evil.example',
    ];
    for (const input of hostile) {
      const out = safeNextPath(input);
      const resolved = new URL(out, 'https://app.example');
      expect(resolved.origin, `input: ${JSON.stringify(input)}`).toBe('https://app.example');
    }
  });
});
