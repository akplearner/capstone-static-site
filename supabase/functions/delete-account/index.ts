// delete-account — removes the caller's auth identity.
//
// WHY THIS EXISTS: deleting a row from `auth.users` requires the service-role
// key, and that key must never be shipped to a browser. The account page already
// deletes every application row using the user's own credentials (RLS scopes each
// delete to them); this function does the one step they cannot do themselves.
//
// It deletes ONLY the caller. The user id comes from verifying the caller's JWT
// server-side — never from the request body — so a valid token for account A can
// never be used to delete account B.
//
// DEPLOY (you, once): paste supabase/dashboard/delete-account.ts into the
// Supabase dashboard (SUPABASE_SETUP.md), or run
// `supabase functions deploy delete-account`. No secrets: Supabase gives every
// function the project's URL and keys, the service-role one included
// (_shared/env.ts), and it never leaves the server.
// The function is invoked from src/app/account/page.tsx. Until it is deployed the
// account page tells the user their data was removed but their login was not,
// which is the truth — it does not claim success it didn't achieve.

import { createClient } from 'jsr:@supabase/supabase-js@2';
// R113: answer the browser preflight, and carry the CORS headers on every reply.
import { json, preflight } from '../_shared/cors.ts';
import { projectKey } from '../_shared/env.ts';

const env = (name: string) => Deno.env.get(name);

Deno.serve(async (req: Request) => {
  const origin = env('APP_ORIGIN');
  const pre = preflight(req, origin);
  if (pre) return pre;
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, req, origin);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Missing bearer token' }, 401, req, origin);
  }

  const url = env('SUPABASE_URL');
  const serviceRole = projectKey('secret', env);
  const anonKey = projectKey('public', env);
  if (!url || !serviceRole || !anonKey) {
    return json({ error: 'not-configured' }, 503, req, origin);
  }

  // Verify the caller with their OWN token. This is the identity we delete —
  // taking a user id from the request body instead would be an account-takeover
  // primitive: any signed-in user could delete anyone.
  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: whoami,
  } = await asCaller.auth.getUser();

  if (whoami || !user) {
    return json({ error: 'Invalid session' }, 401, req, origin);
  }

  const admin = createClient(url, serviceRole);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    // R135: the detail goes to the function log; the caller gets a fixed code.
    console.error('delete-account failed', error.message);
    return json({ error: 'delete-failed' }, 500, req, origin);
  }

  return json({ deleted: user.id }, 200, req, origin);
});
