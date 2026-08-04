/**
 * Sanitise a `next=` redirect target taken from a query string.
 *
 * Both auth routes send the user to `${origin}${next}` after sign-in. `next`
 * arrives from the URL, so without this an attacker could hand someone a link
 * like `/auth/callback?next=//evil.example` — the browser reads `//host` as a
 * protocol-relative URL and leaves the site, carrying the freshly-signed-in
 * session's trust with it. `/\evil.example` is the same trick, since browsers
 * normalise the backslash.
 *
 * So: accept only a path that starts with a single `/`, and reject anything that
 * could resolve to another origin. Falls back to the site root, which is always
 * safe and merely inconvenient.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next) return fallback;

  // Must be a relative path...
  if (!next.startsWith('/')) return fallback;
  // ...and not a protocol-relative URL (`//host`) or its backslash variants,
  // which browsers treat as `//host` too.
  if (next.startsWith('//') || next.startsWith('/\\') || next.startsWith('/%2F')) return fallback;
  // Control characters (incl. CR/LF) can smuggle a second header or URL.
  if (/[\u0000-\u001F\u007F]/.test(next)) return fallback;

  // Belt and braces: resolve against a throwaway origin and confirm it stayed put.
  try {
    const probe = new URL(next, 'https://internal.invalid');
    if (probe.origin !== 'https://internal.invalid') return fallback;
    return probe.pathname + probe.search + probe.hash;
  } catch {
    return fallback;
  }
}
