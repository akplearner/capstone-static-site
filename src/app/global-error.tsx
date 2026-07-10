'use client';

/**
 * Last-resort boundary for errors thrown in the root layout itself. It replaces
 * the whole document, so it must render its own <html>/<body>. Kept dependency-
 * free (no shared components, which live under the failed layout).
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
          background: '#fff',
          color: '#111',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center', padding: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>The app hit a problem</h1>
          <p style={{ color: '#555', marginTop: 8 }}>
            An unexpected error occurred while loading the page. Please reload.
          </p>
          <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              style={{ background: '#2563eb', color: '#fff', border: 0, borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}
            >
              Try again
            </button>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              style={{ border: '1px solid #d1d5db', background: '#fff', borderRadius: 8, padding: '8px 16px', color: '#111', cursor: 'pointer' }}
            >
              Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
