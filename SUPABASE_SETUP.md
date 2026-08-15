# Setup — turning on accounts and saved work

Students sign in four ways — **email + password**, an **emailed magic link**,
**Google**, or **GitHub** — and everything they produce is saved to Postgres:
progress, team deliverables, GRC registers, lab access details, the evidence
ledger, and where they left off. The backend is **Supabase** (managed Postgres +
Auth + Row-Level Security).

**Until the env vars are set, nothing changes.** The app runs entirely in the
browser's localStorage with no sign-in — which is also how CI builds it. Setting
them switches the data layer to Supabase and makes the sign-in UI appear.

**Time:** ~35 minutes of work, plus waiting on DNS for email.
For day-two running (backups, incidents, releases) see [`docs/OPERATIONS.md`](./docs/OPERATIONS.md);
this file is the one-time setup path.

---

## 1 · Project + schema — 5 min

1. supabase.com → **New project**. Save the database password somewhere safe.
2. **Project Settings → API** → copy the **Project URL** and the **anon public** key.
   Only the anon key ever goes in the app. It is designed to be public and is safe
   in the browser *because* every table has row-level security. The
   **`service_role`** key bypasses RLS entirely — it is used in step 7 and nowhere else.
3. **SQL Editor → New query** → paste and run each file from
   [`supabase/migrations/`](./supabase/migrations/), **in order**:

   | File | What it creates |
   |---|---|
   | `0001_init.sql` | profiles, memberships, step_completions, deliverables, gate_status |
   | `0002_student_state.sql` | user_course_state, grc_registers, lab_access |
   | `0003_evidence_ledger.sql` | step_evidence, evidence_artifacts, user_paths |

   All three are idempotent — safe to re-run.

> **Run these before anyone signs up.** `0001` installs an `on_auth_user_created`
> trigger that creates each user's `profiles` row automatically. An account created
> before the migrations ran will have no profile; delete it and sign up again.

## 2 · URL configuration — 2 min ⚠️ the most common failure

**Authentication → URL Configuration:**

- **Site URL:** `https://yourdomain.com`
- **Redirect URLs** — add both, **including the `/**` wildcard**:
  - `https://yourdomain.com/**`
  - `http://localhost:3000/**`

> The wildcard is not optional. Every redirect the app builds carries a query
> string — `<origin>/auth/callback?next=<url-encoded path>` (see `redirectTo()` in
> `src/components/auth/AuthForm.tsx`). A bare `.../auth/callback` entry will not
> match it, and every confirmation email and OAuth return will bounce to the
> homepage instead of signing the user in.

## 3 · Email sign-in + confirmation — 1 min

**Authentication → Providers → Email** → enable, and turn **Confirm email ON**.

Leave the default email templates. Supabase's `{{ .ConfirmationURL }}` routes
through `/auth/callback` (the PKCE `?code=` flow). If you ever customise the
templates to the `?token_hash=` style instead, that also works — `/auth/confirm`
handles it.

With confirmation on, `signUp` returns a user but no session; the app already
detects this and says *"Account created. Check <email> for a confirmation link
before signing in"* rather than appearing to do nothing.

## 4 · Custom SMTP — 20 min ⚠️ required before real users

Supabase's built-in mailer is capped at a few messages an hour and is explicitly
not for production. With confirmation on, **every signup depends on delivery** —
without SMTP, signups stall silently and you will look broken.

1. Create a sending account. **Resend** is the least friction; SendGrid, Postmark
   or SES are equivalent.
2. Add the provider's **SPF and DKIM DNS records** to `yourdomain.com` and wait
   for the provider to show the domain as verified.
3. **Project Settings → Authentication → SMTP Settings** → enable, then set host,
   port `587`, username, password, **sender email** (e.g. `noreply@yourdomain.com`)
   and sender name.
4. Same page → **Rate limits** → raise "emails per hour" above the default.

## 5 · Google — 15 min

1. Google Cloud Console → **APIs & Services → OAuth consent screen** → *External*.
   Fill app name, support email, developer email. Scopes `email` and `profile` are
   enough and are **not** sensitive, so no Google review is needed. Publish the
   consent screen, or testers will see an "unverified app" interstitial.
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. **Authorised redirect URI** — Supabase's callback, **not** your own domain:

   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```

4. Copy the Client ID + Secret → Supabase → **Providers → Google** → enable, paste, save.

> Pointing Google at your app's URL is the single most common OAuth mistake.
> Supabase receives the code, then forwards to your `/auth/callback`.

## 6 · GitHub — 5 min

GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
Homepage `https://yourdomain.com`; **Authorization callback URL** is the same
Supabase callback as above. Generate a client secret → Supabase → **Providers →
GitHub** → enable, paste, save.

## 7 · Env vars, then redeploy — 5 min

In your host (Vercel → Settings → Environment Variables), for **Production and Preview**:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

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
- `{"status":"ok","mode":"local","supabase":"not-configured"}` → the app is still in demo
  mode: the vars are missing or you haven't redeployed since setting them.
- `"status":"degraded"` (HTTP 503) → vars are set but Supabase is unreachable; check the URL.

Leave `NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH` / `NEXT_PUBLIC_ENABLE_GITHUB_OAUTH` unset —
they default to *shown*, which is right once steps 5–6 are done. Set one to `false`
if you skip that provider, so the app doesn't offer a button that fails on click.

## 8 · Account deletion — 5 min

The privacy policy promises users can delete their account. Deleting the auth
identity needs the service-role key, which must never reach the browser, so it
lives in an Edge Function:

```bash
supabase functions deploy delete-account
supabase secrets set SERVICE_ROLE_KEY=<service_role key>
```

Until this is deployed, `/account` still deletes all of the user's application
data and then honestly reports that their login could not be removed.

## 9 · Make yourself an instructor — 1 min

Instructor access is a flag on the profile. Sign up first (the trigger creates the
row), then:

```sql
update public.profiles set is_instructor = true
where id = (select id from auth.users where email = 'you@example.com');
```

## 10 · Realtime — optional

Lets teammates see each other's progress update live rather than on refresh. The
migrations already add the right tables to the `supabase_realtime` publication, so
this is usually done — confirm under **Database → Replication**.

`lab_access` and `user_course_state` are deliberately **not** published: they are
single-user, so there is no second party to notify, and streaming credentials
would be cost without benefit.

---

## Smoke test — do this on the real domain

Use an inbox you actually control.

1. Register with email + password → you see *"Check <email> for a confirmation link"*.
2. The email arrives (check spam) → click it → you land signed in on `/dashboard`.
3. Sign out → sign back in with that password.
4. Magic link → email → signed in.
5. Google → signed in. GitHub → signed in.
6. `/auth/reset` → email → set a new password → sign in with it.
7. Signed out, visit `/dashboard` → redirected to `/login?next=/dashboard`.
8. Tick a step in a course, then hard-refresh → the tick survives. This is the one
   that proves writes and RLS actually work, not just auth.

## Checking the access rules, not just the login

Being able to sign in does not prove the rules are right. Worth ten minutes:

1. Sign in as student A, tick a step, confirm it appears on another device.
2. As student B **on a different team**, confirm you get **zero rows** for A's
   `lab_access` and for the other team's `grc_registers`. Use a second browser or
   the SQL editor's "run as authenticated user".
3. Let a magic link expire, then click it — you should get a clear message, not a
   silent bounce to the homepage.

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

## How it behaves

| | No env vars | Env vars set |
|---|---|---|
| Sign-in | not shown (demo banner instead) | email+password, magic link, Google, GitHub |
| Reading the course | open | open |
| Saving anything | localStorage | requires an account |
| Across devices | no | yes |
| Teammates see your work | no | yes |

Browsing is never gated — a prospective student can read a whole course before
handing over an email address. The gate is on **writes**, because work that isn't
attached to an account is lost the moment the browser is cleared.

On a student's first sign-in, if that device already holds local progress, they're
offered a **one-time import**. It is only marked done once the server confirms the
rows landed, so a failed import can be retried and never silently discards work.
