// cors.ts — the browser preflight every function must answer (R113).
//
// `supabase.functions.invoke` from the app sends an OPTIONS preflight before
// the POST; a function that answers it with 405 fails in the browser before
// it runs. Pure: no Deno API here, so it is unit-tested anywhere. The caller
// passes the configured app origin (`APP_ORIGIN`); without one the request's
// own origin is echoed, which is safe because every function authenticates
// by the caller's bearer token, never by a cookie.

export const CORS_ALLOW_HEADERS = 'authorization, apikey, content-type, x-client-info';

export function corsHeaders(requestOrigin: string | null, allowedOrigin?: string): Record<string, string> {
  const origin = allowedOrigin && allowedOrigin.trim() !== '' ? allowedOrigin.trim() : requestOrigin ?? '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

/** The 204 answer to a preflight, or null for any other method. */
export function preflight(req: Request, allowedOrigin?: string): Response | null {
  if (req.method !== 'OPTIONS') return null;
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('Origin'), allowedOrigin) });
}

/** A JSON response that carries the CORS headers. */
export function json(body: unknown, status: number, req: Request, allowedOrigin?: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req.headers.get('Origin'), allowedOrigin) },
  });
}
