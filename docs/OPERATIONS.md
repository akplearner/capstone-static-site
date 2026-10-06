# Capstone Quarry — going live

> Everything the code can't do for itself. Work top to bottom; the order matters.
> **Audience:** whoever owns the deployment. **Assumes:** a public launch with open signups.
>
> The code side is done: accounts, gating, the evidence ledger, legal pages, security headers and
> CI all ship in the repo. What remains below is account creation, dashboard clicks and two
> decisions only you can make.

---

## 0. What is genuinely untested

Be aware before you launch. **No Supabase project existed while this was built.** What IS
exercised: the database schema and every row-level-security rule run on a real Postgres in CI
(`npm run db:check`, `supabase/tests/rls.sql`) — the first such run found and fixed three
schema bugs (R81). The route gate is verified end to end (see §2). What is NOT: the hosted
OAuth hop itself (Google and GitHub handing a student to Supabase and back), realtime, and the
delete-account function — those are verified by code review only until the smoke test in
[`SUPABASE_SETUP.md`](../SUPABASE_SETUP.md) runs on the live project. Treat §2 as a real test
pass, not a formality.

---

## 1. Set up Supabase and sign-in

**→ [`SUPABASE_SETUP.md`](../SUPABASE_SETUP.md)** is the single, step-by-step setup path: the two
values to copy, the one-paste schema (`supabase/setup.sql`), URL configuration, Google SSO, env
vars and the redeploy. Six steps, no email infrastructure — Google needs none. Anything optional
(GitHub, magic links, the account-deletion function, the instructor flag) sits below a divider at
the end of that file, so the path to a working sign-in is the whole first half.

That file used to be duplicated here, and the two copies drifted — both ended up telling you to
register the redirect URL as a bare `.../auth/callback`, which does not match the
`?next=`-carrying URLs the app actually builds and silently breaks every confirmation link. One copy
now, so it can't happen again. Setup lives there; everything below is what comes *after* it works.

## 2. Smoke test on the real domain

Setup's own checklist covers the six auth flows. These are the ones that go **beyond** sign-in — each
has failed silently in some deployment of some product; none takes more than a minute.

- [ ] **Gate:** while signed out, opening `/dashboard` redirects to `/login?next=/dashboard`, and
      signing in returns you to the dashboard. `/` and `/explore` load without an account.
- [ ] **Both providers:** sign in with Google, sign out, sign in with GitHub. The name and
      picture on `/account` come from the provider.
- [ ] **Team:** a teammate's row on Home shows their progress and gems; a student on another
      team sees neither. Every task of the week is a row for every member (R98): a teammate's
      task opens in the runner, its row names the role, yours says "Yours"; a step the teammate
      ticked reads "done by <name>" and cannot be unticked by you; the week % and the gate are
      the team's.
- [ ] **The two Ridgeline capstones (R101):** SecAI+ (four releases) and CISSP (six releases) each join, show a role-marked task per week, draw their architecture picture with its process and caption, and file their forms. Both are open (no gate locks a week).
- [ ] **Real architectures (R103):** every course's week picture shows components, not chips —
      a firewall, identity, logs into a SIEM, backups, the records lane — and under it "This
      week adds" lists each arriving part with its purpose and a "Recorded in" link that opens
      the form. The cloud Guide's architecture slider shows the same list for the week it is on.
      `docs/courses/build-sheets/` holds the same tables, one file per course.
- [ ] **Document lifecycle (R103):** on a form, the status strip reads Draft and names who
      drafts, reviews and approves; the drafting role sees "Submit from the Expectations panel"
      and every other role sees who submits; after a submit the reviewer's Home shows the team
      queue card and the form offers Approve / Return (Return asks for a reason); the approver
      can Issue; a downstream form shows "Waiting on" until its inputs are approved; the `.md`
      export of an approved form carries the Document control block.
- [ ] **Compact overview (R104):** the Guide's "The roles" is one table (mission, works in,
      drafts / reviews / approves counts, hands to, waits on) with your own row marked; "What
      you owe" is one line; the manual's "How the roles hand off" is a row of role boxes with
      weighted arrows and the same hand-offs as sentences under it. No role cards anywhere.
- [ ] **Professional roles (R105):** every course's role reads "Function (Role)" with no emoji;
      the join picker shows each role's summary, how it works and three or four
      responsibilities; the Guide's role table and the manual's hand-off picture start with
      your role in focus and a click on another role dims the rest; the picture has a legend
      (solid review, dashed approve, dotted feeds), boxes and lines draw in once, and with the
      OS reduced-motion setting on nothing moves; the team package's Team_Roles.md lists the
      course's own roles and what each drafts.
- [ ] **Week picture (R99):** every week of every course shows "What you build this week" on the
      Tasks tab: the build at the end of that week, this week's parts glowing, and on a week that
      builds nothing the week's process drawn over it. The Guide's lab picture has week pills; a
      form shows its own week's picture.
- [ ] **One screen (R100):** at 1280 wide the Tasks tab shows the first task row without
      scrolling; a row opens in the pane beside the list and the heading takes focus; scrolling
      down hides the site header and the first scroll up brings it back; ←/→ walk the steps and
      Esc closes one; Focus in the sub-nav hides the week around the task and survives a reload.
      At 390 wide nothing scrolls sideways and the week picture is a thumbnail with Expand.
- [ ] **Progress persists:** tick a step, reload, still ticked. Sign in on a second device and see it.
- [ ] **Ledger:** paste matching output on a verify step; reload; it still reads verified.
- [ ] **Guest migration:** in a private window do some work signed out, then register — the demo
      banner's "save to an account" carries the progress *and* the evidence ledger across.
- [ ] **Account:** export produces valid JSON; delete removes the account (needs setup step 8).
- [ ] **Health:** `GET /api/health` returns `{"status":"ok","mode":"cloud"}`.

## 3. Point monitoring at it

- Uptime check on `/api/health` — it returns **503** when Supabase is unreachable, so it will actually
  page you instead of reporting a green light over a dead database.
- Failed sign-ins now log server-side (`[auth] …` in Vercel's function logs), so a wave of
  provider errors is visible without error tracking.
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
