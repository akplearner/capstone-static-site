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
**only**. The route gate *is* verified end to end (see §2). Treat §2 — and the smoke test in
[`SUPABASE_SETUP.md`](../SUPABASE_SETUP.md) — as a real test pass, not a
formality.

---

## 1. Set up Supabase and sign-in

**→ [`SUPABASE_SETUP.md`](../SUPABASE_SETUP.md)** is the single, step-by-step setup path: project and
migrations, URL configuration, the four sign-in providers, custom SMTP, env vars, the
account-deletion function, and the instructor flag.

That file used to be duplicated here, and the two copies drifted — both ended up telling you to
register the redirect URL as a bare `.../auth/callback`, which does not match the
`?next=`-carrying URLs the app actually builds and silently breaks every confirmation link. One copy
now, so it can't happen again. Setup lives there; everything below is what comes *after* it works.

## 2. Smoke test on the real domain

Setup's own checklist covers the six auth flows. These are the ones that go **beyond** sign-in — each
has failed silently in some deployment of some product; none takes more than a minute.

- [ ] **Gate:** while signed out, opening `/dashboard` redirects to `/login?next=/dashboard`, and
      signing in returns you to the dashboard. `/` and `/explore` load without an account.
- [ ] **Progress persists:** tick a step, reload, still ticked. Sign in on a second device and see it.
- [ ] **Ledger:** paste matching output on a verify step; reload; it still reads verified.
- [ ] **Guest migration:** in a private window do some work signed out, then register — the demo
      banner's "save to an account" carries the progress *and* the evidence ledger across.
- [ ] **Account:** export produces valid JSON; delete removes the account (needs setup step 8).
- [ ] **Health:** `GET /api/health` returns `{"status":"ok","mode":"cloud"}`.

## 3. Point monitoring at it

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
