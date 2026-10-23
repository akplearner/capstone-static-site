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
- [ ] **Exam and cost (R106):** every course's Guide has "The exam and the cost": the ladder
      with this course bold, one row per exam domain with its weight and the tasks that practise
      it (a gap says why), then the cost lines and the tasks that spend; the catalogue card and
      `content/courses/index.json` carry the certification, level, coverage and cost; on the
      cloud associate and professional courses the Tasks tab shows the hourly cost on the
      tasks that bill, and every such task ends by stopping, parking or deleting what it started;
      the Azure picture shows three subnets (app, web, database) with the balancer, the fleet,
      the database, the queue, the green pool, the slot and the dashboard arriving in Weeks 6,
      7 and 11.
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
- [ ] **Skills (R107):** joined on a course, the Home's role surface shows "Skills": the exam
  domains with a level each and the next task that closes a gap, one line per dimension, the
  indicators and the denominator caption; ticking a step moves a row to Practised, a matching
  paste to Verified from output; `/dashboard` shows a domain strip per card and "Skills by
  course"; `/portfolio` shows the six skills sections and Copy JSON on the dashboard chip gives
  `schema: "capstone-member-profile/1"` with `signature: null` (the file a member saves is the PDF, R127).
- [ ] **Skill board (R108):** joined on a course, the Home skills card, the status surface and the
  dashboard card link to `/courses/<id>/skills`; the competency map draws its edges in and lights
  the stars in course order, the sixteen tiles count up once and a sweep crosses them; Replay
  repeats both; with reduced motion nothing moves and Replay is hidden; Student, Hiring and Agent
  switch the captions, and Agent prints JSON with `"schema": "capstone-kpi-board/1"` and sixteen
  `kpis`; Measured against switches the coverage tile between the work roles and the sample
  profile, a bad imported file shows an error and a good one survives a reload; `/portfolio`
  shows a KPI table per capstone, and the dashboard's Copy JSON carries `courses[].kpis`; the credential a
  link serves has no `proof` field.
- [ ] **Cohort KPIs (R108):** `/instructor/<course>/cohort` shows a KPI bands table per cohort
  under the submissions summary, the Team, Focus and Review week selects change the counts, and
  KPI CSV downloads sixteen rows per cohort plus the whole course, naming nobody.
- [ ] **KPI pack (R109):** the course Home's skills card and every `/dashboard` card show sixteen
  sockets in four groups; hovering or focusing one prints it in the read-out, the arrow keys move
  across them, a complete ratio is lit; the chip beside the pack copies and downloads the
  `capstone-kpi-board/1` JSON; the dashboard's record grid has eight tiles and its member-profile
  chip downloads the profile and the credential (no `proof`); under reduced motion nothing breathes.
- [ ] **Candidate links and employer profiles (R114):** cloud, with 0015, `share` and
  `shared-profile` deployed (from the dashboard or the CLI): turn on "share with employers" on `/account`; Create link
  on `/portfolio` shows the URL once (`/share#…`); open it in a private window, signed out: the copy
  under the "unsigned, not proof of the machine" banner, no email anywhere; revoke it on `/account`
  and the page says the link is not available, the same as a made-up token. As an instructor, publish
  `content/profiles/sample-mssp.json` with a new id on `/instructor/profiles`; the Skill board picker
  lists it; Create link there records "measured against" it. Without the consent the dialog points to
  the account page; without the functions it says links are not set up.
- [ ] **Support codes (R129):** with the network blocked (or the `agreement_acceptances` insert policy dropped on a throwaway
  project) press Agree: the toast ends `Code E-XXXXXX · <date> <time> UTC. Tell your instructor.` and nothing technical appears in the
  toast or the browser console. As an admin open Instructor → Metrics → Support errors: the row is there with the account's email, the
  area, the reason, the database code and the page; searching the code finds it. `SUPABASE_SETUP.md` "Looking up a support code".
- [ ] **Agreements gate failures (R128):** sign in as a new account and tick the agreements: access opens and a row per
  agreement is in `agreement_acceptances`. With the session cookie removed in another tab, pressing Agree says the
  sign-in expired and signs out; with the network blocked it says it could not be saved, lets you continue and
  saves later; the console shows the error code in each case. `SUPABASE_SETUP.md` has the SQL that checks an account.
- [ ] **PDF exports (R127):** as a member with a course started and one issue reported (Report an issue on a task),
  open `/dashboard` and press **Download PDF** on the record chip: a file `capstone-record_<date>.pdf` is saved
  (not JSON). Open it: the name and date, the twelve figures as the strip printed them, the skills by name,
  progress by course with a bar, and the issue with where it is and its status; one page. The same button on a
  course card gives that course alone (`capstone-record_<course>_<date>.pdf`); `/portfolio` has **Download PDF**
  and **Print the full record**; the Home card's chip has it for the course. **Copy JSON** still copies JSON and
  there is no **Download JSON** or **Export credential** anywhere. As an instructor, `/instructor/issues` has a
  **PDF** beside **CSV**: it lists the tab and filters on screen, grouped by course, with the reporter and the version
  seen. A candidate link's page has **Download PDF** (a credential link prints what it is aligned to; a profile link
  has no issues section). The account page's **Export my data (JSON)** and the Deliverables page's
  **Export my work (.json)** (a handoff file with **Restore from file**) are still JSON on purpose.
  `docs/FIX_LIST.md` item F6.
- [ ] **The record moves, and opens (R126):** as a member, open `/dashboard` with a course started and note the twelve
  figures. In another tab tick a step on the course's Tasks tab and return: **Steps done** has moved without a reload
  (verified figures move once output is pasted). Open **Steps verified**: a panel lists each verified step with the course,
  week and task, a link ("Open the task: ..."), then the **Commands**, **Tools** and **Procedures** behind them, six entries
  each with "Show all". Open **Commands verified**: the commands themselves, in code. Opening another figure closes the first;
  the figure again, or the close button, closes it. After **Reset my progress**, **Skills verified** still lists the skills,
  marked "Kept from an earlier run", with the steps they were earned from; **Steps done** is 0 again. On a phone, opening a
  figure scrolls to its list. `docs/FIX_LIST.md` items F3 and F4.
- [ ] **Skills kept across a retake (R125):** as a member, finish a few tasks of a course (tick and verify steps) and open
  `/dashboard`: the record shows skills practised and verified. On the course's Home tab choose **Reset my progress**
  (the dialog says earned skills stay on the record): the course reads 0% again, and `/dashboard` and `/portfolio` still
  show every skill, tool, procedure and exam domain reached before the reset, at the level reached. Redo only the first task:
  nothing changes. Redo more than the first time: only the skills not yet earned (or only practised) are added or raised, and
  the ones earned first keep their level. In the Supabase SQL Editor, `select dimension, skill_id, level, first_at, level_at
  from earned_skills where user_id = '<id>'` lists them; try `update earned_skills set level = 'practised' where level =
  'verified'` as that member and see no row change. Without 0019 the ledger is kept on the device.
- [ ] **Link size (R124):** cloud, signed in, with the share-employer consent: on `/portfolio` (or the dashboard) open
  **Create link**. With two or more courses started, the dialog lists each course with its size, all ticked, and says
  "The copy is N KB of the 256 KB a link can hold." Untick a course: the number drops; tick every course of a record big
  enough to pass 256 KB (or watch the number in a record of many courses): the line turns to a warning with the size and
  "Untick a course to make it smaller", and **Create link** is disabled until it fits. Create one: the link opens in a
  private window with the courses that were ticked and no others. `docs/FIX_LIST.md` item F2 has the measured sizes.
- [ ] **Typing (R123):** open "Report an issue" on a task and type a whole sentence, spaces included, into
  "What happened?": every character lands, the cursor stays in the box and the dialog does not close. Do the
  same in "Create a link" (the label), "Return for changes" on a form and the fold note on a fix: the first
  text field is ready as the dialog opens. Escape still closes, Tab stays inside, and focus goes back to the
  button that opened it. `docs/FIX_LIST.md` lists what is still open from the admin's list.
- [ ] **Course versions (R122):** as an admin, open a built-in course in the studio (`/instructor/<id>`): the
  banner says saving forks it (for every student in the cloud, on this device offline), that wording is better
  corrected from a report, and that a course of one's own is a duplicate; the title carries `v1.0`. Change the
  title and Save: a dialog asks first; Cancel saves nothing; "Save an edited copy" saves, the toast says
  "Course saved as version 2" and the chip reads `v2.0`. The banner now says it is an edited copy, and the next
  Save does not ask. Open the **History** tab: each save is listed newest first with its number, title, who, when
  and size, the latest marked Current. **Download** a version; **Restore** an older one: it asks, saves it as a
  NEW version (`v4.0`), and the Details tab shows its words again. Open Tasks, Roles and Gates: ids already saved
  are greyed with "Progress is recorded against this id"; **Add task** gives an id that can still be edited
  until it is saved. In the Supabase SQL Editor, `select version, saved_by_name, title from
  course_document_versions order by saved_at desc limit 5` lists the same saves. If History says "Database
  update needed", paste `supabase/setup.sql` and Run.
- [ ] **Content fixes (R121):** as an admin, open a pending report on `/instructor/issues`: under it,
  **Fix the text** opens the words of the step it names. Change one field (the box is marked "Changed"),
  clear the "what changed and why" line to see Save refuse, put it back, tick "Also resolve the other pending
  reports here" if there are others, and Save: a toast says "Saved as revision 1 (v1.1)", the report moves to
  **Complete** with "fixed in revision 1", and the course page (open it as a student) reads the new words.
  Try to remove a self-check token from the expected output, or make an instruction far longer: the field
  says why it will not save. Open **Fixes**: the revision is Live with who, when, the reporter it answers and
  the change as Was and Now. **Fix bundle** downloads the file to fold it from and **Live course document**
  the course as students read it. **Revert** (asked first) saves a new revision and the old words are back;
  a fix whose text was changed again says which revision to revert first. Tick a live fix and **Mark in
  code**, naming the deploy: it leaves the "not in the code yet" banner. A student's new report now says
  "saw v1.N". If the page says "Database update needed", paste `supabase/setup.sql` into the SQL Editor and Run.
- [ ] **The issues inbox (R120):** as a student, open any task → **Report an issue**: pick a step (or "The whole
  task"), a kind and a note; the dialog says it is sent with your name, your role and the course version.
  As an instructor (or admin), open `/instructor/issues` (the **Reported issues** button on the instructor
  home, or ⌘K): the report is on the **Pending** tab with who, when, `Course › Week › Task › Step`, the
  reporter's role, "saw v1.0" and its kind. Filter by course, week, either role, kind and reporter; search a
  word from the note; tick **Group by task** off and on. Set the status to **In progress**, then **Resolved**
  with a note for the reporter, and Save: the card moves to **Complete** and shows who closed it and when.
  **Won't fix** closes it without a change. Download the CSV and the JSON. The instructor home shows the course's
  "n pending issues"; the cohort page's panel links "Open in the inbox →". If the page says "Database update
  needed", paste `supabase/setup.sql` into the SQL Editor and Run, then Refresh.
- [ ] **The team's roles board (R119):** on Home, below the role section, "Your team's roles this week"
  lists every role: yours first with a "You" chip, the others with "Held by {names}" from your own
  team only. Each task shows whose it is (Your task, Everyone, or {Role} · open to anyone) and where it
  stands, and its title opens it in Tasks. On a team where nobody holds a role, that card says "Open
  role" and "Any teammate can cover its documents"; Take this role asks first, then your role strip,
  the board and the Tasks tab all change, and what you ticked is still ticked. The strip's link lands
  on the board. As an instructor, the cohort page's Registrations panel lists each team that has a role
  nobody holds ("Team 2 · 2 members · Open roles: …").
- [ ] **One word for done (R118):** on Tasks every row says Not started, In progress · n of m steps,
  Done, or Done by {name}; a task a teammate finished also shows "You: 0 of n steps" until the member
  does it; the opened task repeats the state with "Checks verified n of m"; the week header's bar says
  "team" and shows "You n%" when that differs; hovering the rail's tick says what it means. On a team
  where every task is done and the member joined late, Home says "Done for the team" with the member's
  own record and a button to their first open step. A form sent for review shows on Home as waiting on
  the reviewing role. The instructor's verdict reads "Instructor: …" on the form and the cohort table.
- [ ] **Empty roles and failed loads (R117):** on a team where nobody holds a document's reviewing role,
  submit the form as its drafter: another member sees "Approve (covering for {Role})", the submitter does
  not, the status strip says "any member may cover", approving writes "Covering for {Role}." into the
  history, and the review queue on Home lists it as "yours to review (covering for …)". With the role
  held, a non-holder has no button. Cloud: with the network off, reload a course page: it says "Couldn't
  load your team" with Try again (never the Join panel), and Try again loads it once back online. Remove
  a role id from a course the member joined: Home asks "Pick a role" with the picker open and Tasks says
  the same. With every local team full the Join panel says "Every team is full" and offers the online lobby.
- [ ] **The role on top and whose task is whose (R116):** on a role-split course, join as one role;
  the first thing in the sticky bar on Home, Tasks, Guide, Deliverables, Ledger, Review and Skills is
  "Your role", the icon, the name and the team, and it is still there after a long scroll, with Focus
  on, and on the Tasks tab where the site header hides; at 390px it is its own short row with no
  sideways scroll. Signed out, the bar says "No role yet. Join". On Tasks every row says Your task,
  Everyone or "{Role} · open to anyone"; "Your tasks this week" lists the member's own with how many
  are done; opening another role's task shows that it is open to the whole team, and it can be ticked.
  On Security+ or MSSP, a week behind an uncleared gate opens normally under a note listing the open
  tasks as links (MSSP Gate 1 lists `mg-w0`); the week rail shows a flag, never a padlock; the pentest
  report opens under the amber scope note. Nothing on a task, a week or a form is a padlock.
- [ ] **Functions from the browser (R115):** for each of `stamp`, `receipt`, `share` and
  `shared-profile`: Supabase → Edge Functions → Deploy a new function → Via Editor, paste
  `supabase/dashboard/<name>.ts` over the example, name it exactly `<name>` before Deploy function;
  no secret set, JWT verification left on. The Edge Functions page's URL column ends with
  `/functions/v1/<name>` for each (a made-up name there means it was renamed after deploying: delete
  and deploy again). Test → POST: the first three answer 401 `invalid-session`, `shared-profile` 404
  `not-available`. Then the R113 and R114 rows below pass, including a link
  opened signed out in a private window.
- [ ] **Stamps, receipts, re-hash and the first validator (R113):** cloud, with `stamp` and `receipt`
  deployed: a task's stamp chip says it was issued by the server; paste output with every token and
  the stamp, and the box says "receipted"; leave the task open past twenty minutes and the chip says
  expired, a click copies a fresh stamp; the ledger marks the step receipted and the dashboard prints
  "n receipted" under Steps verified. Without the functions (or offline) the chip is the device stamp
  and no wording mentions receipts. On the ledger, Re-check a hashed file with the same file (badge
  "Re-hashed") and with another (badge "Digest differs"); the hash time does not change. On Server+
  week 4, "Restrict the DMZ host with ufw", paste `sudo ufw status numbered`: the state check lists
  observed against expected, and an extra rule open to everyone is named.
- [ ] **Funnel and step friction (R112):** `/instructor/<course>/effectiveness` (from Effectiveness
  on the instructor home) shows five stage tiles whose counts never rise, the active-weeks bands, and
  a friction table led by the steps with the most signals, a rewrite candidate marked with an icon
  and a word; Funnel CSV and Friction CSV download with fixed headers and name nobody.
- [ ] **Attribution and currency (R111):** on the Skill board the KPI table has a "Drafted by this
  role" column (n of m on the seven team KPIs, "—" elsewhere); a tile whose role share differs prints
  it; `/portfolio` lists "Last verified <day> · current" beside a verified skill; the dashboard's
  Skills verified tile counts current skills; the credential's results carry the share.
- [ ] **Acceptance gate, consent and outcomes (R110):** sign in → the gate lists the agreements
  that changed (terms, acceptable use, lab, data notice at v2) and "Full text" opens `/legal/aup`
  readable → accept → `/account` shows the Consent switches (off by default) and, once the outcome
  grant is on, the Outcomes form; save an answer → `/instructor/<course>/cohort` prints the Outcomes
  line ("fewer than 5 members" until five have answered); the account export carries `agreements`.

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
4. **Staff accounts.** Sign in once, then set `profiles.is_instructor = true` (cohort dashboard, reported
   issues, roster fixes) or `profiles.is_admin = true` (also the course editor and metrics; counts as an
   instructor) by SQL for whoever should reach `/instructor`. End the statement with `returning id;`: zero
   rows back means the email did not match (GitHub's primary email can differ) or the account signed in
   before `setup.sql` ran. `SUPABASE_SETUP.md` step 4 has the statements.
5. **Content roadmap.** 21 of 24 catalog entries are "coming soon". Which cert gets authored next?

## Where the rest of the roadmap lives

[`ROADMAP.md`](./ROADMAP.md) for the staged plan, [`CURRENT_STATE.md`](./CURRENT_STATE.md) for an
honest as-is map, [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the north star, and
[`adr/`](./adr/) for the load-bearing decisions.
