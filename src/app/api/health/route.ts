import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

// Readiness probe for uptime monitoring and deploy checks.
//
// Deliberately more than `return 200`: a health check that answers OK while the
// database is unreachable is worse than none, because it converts a visible
// outage into a silent one. This reports whether the backend is actually
// reachable and returns 503 when it isn't, so a monitor can page on it.
//
// It exposes no secrets and no user data — just a reachability verdict.

export const dynamic = 'force-dynamic';

export async function GET() {
  const configured = isSupabaseConfigured();

  // Not configured is a legitimate state (localStorage/demo deploys), so it is
  // reported as healthy-but-degraded rather than a failure.
  if (!configured) {
    return NextResponse.json(
      { status: 'ok', mode: 'local', supabase: 'not-configured' },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const started = Date.now();
  try {
    // Unauthenticated GET against the REST root: cheap, needs no table, and
    // proves the project answers. A 5s cap stops the probe hanging longer than
    // most monitors will wait.
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '' },
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    });
    const latencyMs = Date.now() - started;
    if (!res.ok) {
      return NextResponse.json(
        { status: 'degraded', mode: 'cloud', supabase: `http-${res.status}`, latencyMs },
        { status: 503, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    return NextResponse.json(
      { status: 'ok', mode: 'cloud', supabase: 'reachable', latencyMs },
      { status: 200, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return NextResponse.json(
      { status: 'degraded', mode: 'cloud', supabase: 'unreachable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
