// cors.ts — the browser preflight every function must answer (R113), and the
// origin check that answers it (R135).
//
// `supabase.functions.invoke` from the app sends an OPTIONS preflight before
// the POST; a function that answers it with 405 fails in the browser before
// it runs. Pure: no Deno API here, so it is unit-tested anywhere.
//
// R135: the configured app origin (`APP_ORIGIN`) is the ONLY origin a browser
// may call from. Until R135 an unset APP_ORIGIN echoed the request's own
// origin, which let any site a signed-in member visited call the functions
// with that member's token (a page cannot read the token, but it can be
// handed one by a careless integration). Now an unset APP_ORIGIN, or an
// origin that is not it, is refused with 403 and one log line — fail closed.
// A request with no Origin header (a server, curl, the Supabase CLI) is not a
// browser; the bearer token alone decides it, as before.

export const CORS_ALLOW_HEADERS = 'authorization, apikey, content-type, x-client-info';

function allowed(allowedOrigin?: string): string {
  return (allowedOrigin ?? '').trim();
}

/** The CORS headers. `Access-Control-Allow-Origin` is present only for the configured origin; nothing is echoed. */
export function corsHeaders(requestOrigin: string | null, allowedOrigin?: string): Record<string, string> {
  const origin = allowed(allowedOrigin);
  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
  if (origin && requestOrigin === origin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

/** Why a browser request is refused, or null when it may proceed. */
export function originProblem(requestOrigin: string | null, allowedOrigin?: string): 'app-origin-unset' | 'origin-not-allowed' | null {
  if (!requestOrigin) return null;
  const origin = allowed(allowedOrigin);
  if (!origin) return 'app-origin-unset';
  return requestOrigin === origin ? null : 'origin-not-allowed';
}

/**
 * The answer a request gets before the function runs: 403 for a browser origin
 * that is not the configured one (or when none is configured), 204 for an
 * allowed preflight, null for any request that may proceed.
 */
export function preflight(req: Request, allowedOrigin?: string): Response | null {
  const requestOrigin = req.headers.get('Origin');
  const problem = originProblem(requestOrigin, allowedOrigin);
  if (problem) {
    console.warn(problem === 'app-origin-unset' ? 'APP_ORIGIN is not set: browser calls are refused' : `origin refused: ${requestOrigin}`);
    return json({ error: problem }, 403, req, allowedOrigin);
  }
  if (req.method !== 'OPTIONS') return null;
  return new Response(null, { status: 204, headers: corsHeaders(requestOrigin, allowedOrigin) });
}

/** A JSON response that carries the CORS headers (and any extra headers, such as Cache-Control). */
export function json(body: unknown, status: number, req: Request, allowedOrigin?: string, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req.headers.get('Origin'), allowedOrigin), ...extra },
  });
}
