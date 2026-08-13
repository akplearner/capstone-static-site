# Setup — student accounts and saved work

Students sign in with **Google** or an **emailed magic link**, and everything they
produce is saved to a Postgres database: progress, team deliverables, GRC
registers, lab access details, and where they left off. The backend is
**Supabase** (managed Postgres + Auth + Row-Level Security), added to your Vercel
project through the marketplace so there's no second bill and no server to run.

**Until the two env vars are set, nothing changes.** The app runs entirely in the
browser's localStorage with no sign-in — which is also how CI builds it. Setting
them switches the data layer to Supabase.

Total time: about 15 minutes, most of it waiting on Google's OAuth consent screen.

---

## 1. Add Supabase to the Vercel project

Vercel dashboard → your project → **Integrations** → **Marketplace** → **Supabase**
→ *Add*. The free plan is fine.

This provisions the database **and injects the connection env vars into the
project for you**:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

> ⚠️ **Both are `NEXT_PUBLIC_*`, so they are inlined at build time.** After adding
> the integration — or ever changing the values — you must **redeploy**.
> Restarting is not enough, and until you redeploy the app keeps behaving as if
> Supabase were absent. This is the most common way this setup appears "not to
> work".

Only the **anon** key is used. It is designed to be public and is safe in the
browser *because* every table has row-level security. Never put the service-role
key in the app — it bypasses RLS entirely.

**For local development:** copy `.env.local.example` to `.env.local` and paste the
same two values (Supabase dashboard → Project Settings → API).

## 2. Create the schema

Supabase dashboard → **SQL Editor** → **New query**. Paste and run each file from
[`supabase/migrations/`](./supabase/migrations/), in order:

1. `0001_init.sql` — accounts, roster, progress, team deliverables, gates.
2. `0002_student_state.sql` — lab access, GRC registers, resume pointer.
3. `0003_evidence_ledger.sql` — the evidence ledger: per-step verification
   records, hashed evidence artifacts, and the chosen career path. All three are
   owner-only and deliberately not published to realtime.

Both are **idempotent**: safe to re-run, and safe to run against a project where
an earlier version of this schema was already applied by hand.

The SQL lives in those files rather than in this document so there is exactly one
copy of the schema, and so it can be reviewed and diffed like any other code.

### What the access rules are

| Table | Who can read it |
|---|---|
| `profiles` | you, plus teammates (display name only) |
| `memberships` | anyone on the same course |
| `step_completions` | you and your teammates |
| `deliverables`, `gate_status`, `grc_registers` | your team |
| `user_course_state` | **you only** |
| `lab_access` | **you only** — not teammates, not instructors |

`lab_access` is the strictest on purpose: its notes field is where students record
lab passwords. Instructors get read access to memberships, completions and
deliverables — never to lab credentials.

## 3. Turn on the two sign-in methods

**Authentication → Providers:**

- **Email** — enable. Magic links work out of the box, no extra credentials.
- **Google** — enable, then paste a Client ID + Secret from a Google Cloud OAuth
  client. In the Google Cloud console, set the authorised redirect URI to
  Supabase's own callback, **not** your app's:
  `https://YOUR-PROJECT.supabase.co/auth/v1/callback`

> The sign-in panel offers exactly these two. Enabling other providers in Supabase
> has no effect, because the app doesn't render a button for them.

**Authentication → URL Configuration:**

- **Site URL** — your production URL, e.g. `https://your-app.vercel.app`
- **Redirect URLs** — add both:
  - `http://localhost:3000/auth/callback`
  - `https://your-app.vercel.app/auth/callback`

## 4. Turn on realtime (optional but recommended)

Lets teammates see each other's progress update live rather than on refresh. The
migrations already add the right tables to the `supabase_realtime` publication, so
this is usually already done — confirm under **Database → Replication**.

`lab_access` and `user_course_state` are deliberately **not** published: they're
single-user, so there is no second party to notify, and streaming credentials
would be cost without benefit.

## 5. Make yourself an instructor

Instructor access is a flag on the profile, so sign in once first (which creates
the row), then run:

```sql
update public.profiles set is_instructor = true
where id = (select id from auth.users where email = 'you@example.com');
```

---

## How it behaves

| | No env vars | Env vars set |
|---|---|---|
| Sign-in | not shown | Google + magic link |
| Reading the course | open | open |
| Saving anything | localStorage | requires an account |
| Across devices | no | yes |
| Teammates see your work | no | yes |

Browsing is never gated — a prospective student can read the whole course before
deciding to hand over an email address. The gate is on **writes**, because work
that isn't attached to an account is lost the moment the browser is cleared.

On a student's first sign-in, if that device already holds local progress, they're
offered a **one-time import**. It is only marked done once the server confirms the
rows landed, so a failed import can be retried and never silently discards work.

## Checking it actually works

Being able to sign in does not prove the access rules are right. Worth ten minutes:

1. Sign in as student A, tick a step, and confirm it shows up on another device.
2. As student B **on a different team**, confirm you get **zero rows** for A's
   `lab_access` and for the other team's `grc_registers`. Use a second browser, or
   the SQL editor's "run as authenticated user".
3. Let a magic link expire, then click it — you should get a clear message rather
   than a silent bounce to the homepage.

A policy that merely exists is not evidence that it works.
