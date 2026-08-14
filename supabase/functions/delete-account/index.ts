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
// DEPLOY (you, once):
//   supabase functions deploy delete-account
//   supabase secrets set SERVICE_ROLE_KEY=<your service_role key>
// The function is invoked from src/app/account/page.tsx. Until it is deployed the
// account page tells the user their data was removed but their login was not,
// which is the truth — it does not claim success it didn't achieve.

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing bearer token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceRole = Deno.env.get('SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

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
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const admin = createClient(url, serviceRole);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ deleted: user.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
