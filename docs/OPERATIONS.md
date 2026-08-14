# Capstone Quarry — going live

> Everything the code can't do for itself. Work top to bottom; the order matters.
> **Audience:** whoever owns the deployment. **Assumes:** a public launch with open signups.
>
> The code side is done: accounts, gating, the evidence ledger, legal pages, security headers and
> CI all ship in the repo. What remains below is account creation, dashboard clicks and two
> decisions only you can make.

---

## 0. What is genuinely untested

Be aware before you launch. **No Supabase project existed while this was built**, so every cloud
path — sign-up, sign-in, magic link, OAuth, password reset, the ledger's cloud writes, the
delete-account function — is verified by code review and against the localStorage implementation
**only**. The route gate *is* verified end to end (see §7). Treat §7 as a real test pass, not a
formality.

---

## 1. Create the Supabase project

1. Create a project at <https://supabase.com> (free tier is fine to start).
2. Copy the **Project URL** and the **anon public** key from Project Settings → API.
   Never copy the `service_role` key into the app or `.env.local` — it bypasses row-level security.

## 2. Run the migrations, in order

SQL Editor → paste and run each file from [`supabase/migrations/`](../supabase/migrations/):

1. `0001_init.sql` — accounts, roster, progress, team deliverables, gates.
2. `0002_student_state.sql` — lab access, GRC registers, resume pointer.
3. `0003_evidence_ledger.sql` — step verification records, evidence hashes, chosen career path.

All three are idempotent, so re-running is safe. Realtime is enabled by the migrations themselves.

## 3. Enable the sign-in providers

Authentication → Providers. The app offers four; enable the ones you want:

| Provider | Extra setup | Notes |
|---|---|---|
| **Email** | none | **Turn ON "Confirm email"** — the app expects it and tells users to check their inbox. |
| **Google** | Google Cloud OAuth client (ID + secret) | |
| **GitHub** | GitHub OAuth app (ID + secret) | Suits this audience well. |
| **Magic link** | none | Part of the Email provider. |

If you *don't* enable Google or GitHub, hide its button with the env flags in §5 — otherwise it
appears and fails opaquely the moment someone clicks it.

Then Authentication → URL Configuration:
- **Site URL:** your production origin (e.g. `https://your-domain.com`).
- **Redirect URLs:** add both `https://your-domain.com/auth/callback` and
  `http://localhost:3000/auth/callback`.

## 4. Configure custom SMTP — a launch blocker

Authentication → Emails → SMTP Settings. **Do not skip this.** Supabase's built-in mailer is
rate-limited to a handful of messages an hour and is explicitly not for production. Email
confirmation, magic link *and* password reset all depend on delivery — with the default mailer,
signups silently stop working the moment you get traction.

Use Resend, Postmark, SES or similar, and verify your sending domain (SPF/DKIM) or the mail lands
in spam.

## 5. Environment variables

Set in your host (Vercel → Settings → Environment Variables, Production **and** Preview) and in
`.env.local` for local work:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
NEXT_PUBLIC_SITE_URL=https://your-domain.com      # canonical + OG URLs
# Optional — set to 'false' to hide a provider you have NOT enabled in step 3:
# NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH=false
# NEXT_PUBLIC_ENABLE_GITHUB_OAUTH=false
```

With the two Supabase values missing the app runs entirely in localStorage (demo mode) and shows a
banner saying so. That's the fallback CI builds against — it is a supported state, not a broken one.

## 6. Deploy the account-deletion function

Account deletion is a legal obligation under open signups, and the browser cannot do it: removing a
row from `auth.users` needs the service-role key. The app deletes all of a user's application rows
itself and then calls this function for the identity.

```bash
supabase functions deploy delete-account
supabase secrets set SERVICE_ROLE_KEY=<your service_role key>
```

Source: [`supabase/functions/delete-account/index.ts`](../supabase/functions/delete-account/index.ts).
**Until you deploy it**, the account page honestly tells the user their data was deleted but their
login was not — so nothing lies to anyone, but the obligation isn't met.

## 7. Smoke test on the real domain

Do all of these against production before announcing. Each has failed silently in some deployment
of some product; none takes more than a minute.

- [ ] **Register with email + password** → confirmation email arrives → link works → you land signed in.
- [ ] **Sign in** with that password. **Sign out.** Sign in again.
- [ ] **Magic link** → email arrives → link signs you in.
- [ ] **Google** and/or **GitHub** (whichever you enabled) complete and return to the app.
- [ ] **Password reset** → email → set a new password → sign in with it.
- [ ] **Gate:** while signed out, opening `/dashboard` redirects to `/login?next=/dashboard`, and
      signing in returns you to the dashboard. `/` and `/explore` load without an account.
- [ ] **Progress persists:** tick a step, reload, still ticked. Sign in on a second device and see it.
- [ ] **Ledger:** paste matching output on a verify step; reload; it still reads verified.
- [ ] **Guest migration:** in a private window do some work signed out, then register — the demo
      banner's "save to an account" carries the progress *and* the evidence ledger across.
- [ ] **Account:** export produces valid JSON; delete removes the account (needs §6).
- [ ] **Health:** `GET /api/health` returns `{"status":"ok","mode":"cloud"}`.

## 8. Point monitoring at it

- Uptime check on `/api/health` — it returns **503** when Supabase is unreachable, so it will actually
  page you instead of reporting a green light over a dead database.
- **Error tracking is not wired.** Adding Sentry needs an account and a DSN, so it's yours to set up;
  the natural hook is `src/app/global-error.tsx`, which already exists.

---

## Still open — decisions only you can make

1. **The `lab_access.notes` field.** It's stored (owner-only) and students may put credentials in it.
   The app now warns against it inline and the privacy policy covers it. Consider whether to keep the
   field at all.
2. **Legal review.** `/legal/privacy` and `/legal/terms` are accurate about what the software does,
   but they are drafts written by an engineer, not a lawyer. Have them reviewed before you take real
   registrations.
3. **A support contact.** Both legal pages tell users to contact "the address published on the site".
   Publish one.
4. **Instructor accounts.** Set `profiles.is_instructor = true` by SQL for whoever should reach the
   studio.
5. **Content roadmap.** 21 of 24 catalog entries are "coming soon". Which cert gets authored next?

## Where the rest of the roadmap lives

[`ROADMAP.md`](./ROADMAP.md) for the staged plan, [`CURRENT_STATE.md`](./CURRENT_STATE.md) for an
honest as-is map, [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the north star, and
[`adr/`](./adr/) for the load-bearing decisions.
