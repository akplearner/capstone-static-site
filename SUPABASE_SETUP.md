# Setup — turning on accounts and saved work

Students sign in with **Google**, and everything they produce is saved to Postgres:
progress, team deliverables, GRC registers, lab access details, the evidence
ledger, and where they left off. The backend is **Supabase** (managed Postgres +
Auth + Row-Level Security).

**No email anywhere.** Google authenticates the user and hands back a verified
address, so there is no SMTP to configure, no confirmation step, no mail rate
limit and no password reset. That is the whole reason the setup is five steps.

**Until the env vars are set, nothing changes.** The app runs entirely in the
browser's localStorage with no sign-in — which is also how CI builds it. Setting
them switches the data layer to Supabase and makes the sign-in button appear.

**Time:** about 25 minutes, most of it in Google Cloud.
For day-two running (monitoring, incidents, open decisions) see
[`docs/OPERATIONS.md`](./docs/OPERATIONS.md); this file is the one-time setup.

---

## 1 · Project + schema — 5 min

1. supabase.com → **New project**. Save the database password somewhere safe.
2. **Project Settings → API** → copy the **Project URL** and the **anon public** key.
   Only the anon key goes in the app. It is designed to be public and is safe in
   the browser *because* every table has row-level security. The **`service_role`**
   key bypasses RLS entirely — it is used only in the optional Edge Function below.
3. **SQL Editor → New query** → paste and run each file from
   [`supabase/migrations/`](./supabase/migrations/), **in order**:

   | File | What it creates |
   |---|---|
   | `0001_init.sql` | profiles, memberships, step_completions, deliverables, gate_status |
   | `0002_student_state.sql` | user_course_state, grc_registers, lab_access |
   | `0003_evidence_ledger.sql` | step_evidence, evidence_artifacts, user_paths |

   All three are idempotent — safe to re-run.

> **Run these before anyone signs in.** `0001` installs an `on_auth_user_created`
> trigger that creates each user's `profiles` row automatically. An account created
> before the migrations ran will have no profile; delete it and sign in again.

## 2 · URL configuration — 2 min ⚠️ the most common failure

**Authentication → URL Configuration:**

- **Site URL:** `https://yourdomain.com`
- **Redirect URLs** — add both, **including the `/**` wildcard**:
  - `https://yourdomain.com/**`
  - `http://localhost:3000/**`

> The wildcard is not optional. The app redirects to
> `<origin>/auth/callback?next=<url-encoded path>` (see `redirectTo()` in
> `src/components/auth/AuthForm.tsx`). A bare `.../auth/callback` entry will not
> match it, and every Google sign-in will bounce to the homepage instead of
> signing the user in.

## 3 · Google — 15 min

1. Google Cloud Console → **APIs & Services → OAuth consent screen** → *External*.
   Fill app name, support email, developer email. Scopes `email` and `profile` are
   enough and are **not** sensitive, so Google requires no review. **Publish** the
   consent screen, or users see an "unverified app" warning.
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. **Authorised redirect URI** — Supabase's callback, **not** your own domain:

   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```

4. Copy the Client ID + Secret → Supabase → **Authentication → Providers → Google**
   → enable, paste, save.

> Pointing Google at your app's URL is the single most common OAuth mistake.
> Supabase receives the code, then forwards to your `/auth/callback`.

## 4 · Close the door on email sign-in — 1 min

Supabase → **Authentication → Providers → Email** → **disable**.

The app doesn't offer password or magic-link sign-in, but that is a UI decision.
Until you turn the Email provider off, someone can still create a password account
by calling your Supabase API directly. This step is what makes Google-only real
rather than cosmetic.

## 5 · Env vars, then redeploy — 5 min

In your host (Vercel → Settings → Environment Variables), for **Production and Preview**:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

There is no auth flag to set — the app defaults to Google-only.

> ⚠️ **`NEXT_PUBLIC_*` values are inlined at build time, so you must redeploy.**
> Restarting is not enough, and until you redeploy the app keeps behaving exactly
> as if Supabase were absent. This is the most common way this setup appears "not
> to work".

Locally: `cp .env.local.example .env.local` and paste the same values.

**Confirm the vars actually took** — one request tells you:

```bash
curl https://yourdomain.com/api/health
```

- `{"status":"ok","mode":"cloud","supabase":"reachable",...}` → connected, carry on.
- `{"status":"ok","mode":"local","supabase":"not-configured"}` → still in demo
  mode: the vars are missing or you haven't redeployed since setting them.
- `"status":"degraded"` (HTTP 503) → vars are set but Supabase is unreachable;
  check the URL.

---

## Smoke test — on the real domain

1. Click **Continue with Google** → you land signed in on `/dashboard`.
2. Sign out, then back in — second time through, no new account is created.
3. Signed out, visit `/dashboard` → redirected to `/login?next=/dashboard`.
4. Tick a step in a course, then hard-refresh → the tick survives. This is the one
   that proves writes and RLS work, not just sign-in.
5. `curl /api/health` → `mode:"cloud"`.

## Checking the access rules, not just the login

Being able to sign in does not prove the rules are right. Worth ten minutes:

1. Sign in as student A, tick a step, confirm it appears on another device.
2. As student B **on a different team**, confirm you get **zero rows** for A's
   `lab_access` and for the other team's `grc_registers`. Use a second browser or
   the SQL editor's "run as authenticated user".

A policy that merely exists is not evidence that it works.

### Who can read what

| Table | Who can read it |
|---|---|
| `profiles` | you, plus teammates (display name only) |
| `memberships` | anyone on the same course |
| `step_completions` | you and your teammates |
| `deliverables`, `gate_status`, `grc_registers` | your team |
| `user_course_state`, `step_evidence`, `evidence_artifacts`, `user_paths` | **you only** |
| `lab_access` | **you only** — not teammates, not instructors |

`lab_access` is the strictest on purpose: its notes field is where students record
lab details. Instructors get read access to memberships, completions and
deliverables — never to lab credentials.

---

## Optional

### Account deletion

The privacy policy promises users can delete their account. Deleting the auth
identity needs the service-role key, which must never reach the browser, so it
lives in an Edge Function:

```bash
supabase functions deploy delete-account
supabase secrets set SERVICE_ROLE_KEY=<service_role key>
```

Until this is deployed, `/account` still deletes all of the user's application
data and then honestly reports that their login could not be removed.

### Make yourself an instructor

Sign in first (the trigger creates the row), then:

```sql
update public.profiles set is_instructor = true
where id = (select id from auth.users where email = 'you@example.com');
```

### Realtime

Lets teammates see each other's progress update live rather than on refresh. The
migrations already add the right tables to the `supabase_realtime` publication —
confirm under **Database → Replication**. `lab_access` and `user_course_state` are
deliberately **not** published: they are single-user, so there is no second party
to notify.

---

## Adding more sign-in methods later

All four methods are implemented and tested — Google-only is a default, not a
limitation. To widen, set one env var and redeploy:

```
NEXT_PUBLIC_AUTH_METHODS=google,magic            # + emailed sign-in links
NEXT_PUBLIC_AUTH_METHODS=google,github,magic,password
```

Then, in Supabase: re-enable the **Email** provider for `magic`/`password`, turn on
**Confirm email** if you use `password`, and register a **GitHub** OAuth app for
`github` (same Supabase callback URL as step 3).

⚠️ **`magic` and `password` need working email delivery.** Supabase's built-in
mailer is capped at a few messages an hour and is labelled test-only, so before
real users you also need **custom SMTP**: Project Settings → Authentication → SMTP
Settings, with a provider like Resend (verify your sending domain's SPF/DKIM
records, or the mail lands in spam) and the per-hour rate limit raised.

That email dependency is exactly what Google-only avoids.

---

## How it behaves

| | No env vars | Env vars set |
|---|---|---|
| Sign-in | not shown (demo banner instead) | Continue with Google |
| Reading the course | open | open |
| Saving anything | localStorage | requires an account |
| Across devices | no | yes |
| Teammates see your work | no | yes |

Browsing is never gated — a prospective student can read a whole course before
signing in. The gate is on **writes**, because work that isn't attached to an
account is lost the moment the browser is cleared.

On a student's first sign-in, if that device already holds local progress, they're
offered a **one-time import**. It is only marked done once the server confirms the
rows landed, so a failed import can be retried and never silently discards work.
