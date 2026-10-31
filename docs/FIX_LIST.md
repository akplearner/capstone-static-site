# Fix list

What the admin asked to have fixed, kept in one place so that nothing on it is overlooked. Each item has an
id, the symptom in the admin's words, the cause once it is known, the round that fixes it, what counts as
fixed, and how that is verified. An item stays here after it ships (status **Done**), so the list is also
the record. `src/lib/page-shape.test.ts` fails if an id is removed from the table.

| Id | Symptom | Round | Status |
|----|---------|-------|--------|
| F1 | A text field takes one character at a time (creating a link, reporting an issue) | R123 | Done |
| F2 | Create link fails: "The copy is larger than 256 KB, the most a link can hold." | R124 | Done |
| F3 | The dashboard's "Your record" does not update | R126 | Done |
| F4 | Each record metric expands to the tools, commands, procedures and actions behind it | R126 | Done |
| F5 | A skill is earned the first time a course is completed; a retake only adds what is missing and never overwrites an earned skill | R125 | Done |
| F6 | An export is a compact PDF of skills, progress and issues, not a JSON file | R127 | Done |
| F7 | Some students cannot record the agreements: "Couldn't record the acceptance" repeats | R128 | Done |
| F8 | A failure shows the student only a support code and a time; the detail is kept on our side for the admin | R129 | Done |
| F9 | The A+ capstone is built: a real desktop on a bench, image first, the six-step method, tickets, a timed restore and a handover with custody | R130 | Done |
| F10 | The Network+ capstone is built: a branch network designed and proved in Packet Tracer, operated, then researched, priced and planned toward real equipment | R131 | Done |
| F11 | The record reads as workforce readiness: eight evidence-backed domains on the Skill board and fourteen professional categories with a tier at ten verified uses on the dashboard | R133 | Done |
| F12 | The scores, the timing and the record by category reach every surface: the KPI board, table and pack, the cohort report, the export, the credential, the PDF, the shared page, and the instructor's marks per rubric category | R134 | Done |
| F13 | Ownership and hardening: a proprietary licence and ownership files; the database closes self-promotion, clamps an unreviewed `reviewed`, caps volume and size, allows https avatars only; the functions fail closed on origin and cap links, stamps and emails; CSV cells cannot be formulas; sign-out clears the outbox; CI is read-only, pinned, audited and secret-scanned; the lab passwords leave the source | R135 | Done |
| F14 | Every fact reaches the projection: the marks, the flag history, the review queue and the calendar are handed in by one loader on every surface; the cross-course hydrate reads the team's forms and the history; the history tables are published; a tick is not an attempt; the import re-signs what travels | R136 | Done |
| F15 | Measured as documented: a KPI is measured, not measured for the role, or nothing to count yet, never 0 of 0; graded weeks only; skills verified bounded; exam weight reads verified steps; coverage over what is taught; velocity needs a prior window; decisions are the drafter's; the cohort bands per unit and lays the ledger over; every course and role runs through the pipeline in a test | R137 | Done |
| F16 | The content debt is paid: hand-offs name their form in every course, a change table with rollback and a fault table per role everywhere, document control on every form, a control code on every standard, the cloud roles each draft a document, the cloud competencies on the administrator and defender work roles, and proof steps in CCNA, MSSP, the GRC lanes and the cloud Architect | R138 | Done |
| F17 | The project record: a registry of the facts every form records, a pure extractor over the team's own rows, nine conflict rules shown on the form as Consistency hints, two typed columns (prefix, port), a Server+ sizing table, and the database's append-only history of every replaced version (0025) | R139 | Done |
| F18 | Longitudinal validation: checkpoints per course, activities generated from the team's own record (recall, explain, apply, consistency), answers kept append-only (0026), a pausable timer on every task that hides the content while paused, the validation KPI family and the Understanding score, with every count pin, schema and copy moved to thirty-two and seven | R140 | Done |
| F19 | The hidden layer made visible to the instructor: the record console (record, history, conflicts, answers, per-member documents, the picture with its validation overlay) and four published documents (project architecture, project infrastructure, skill validation, competency facets), the member export carrying the last two | R141 | Done |
| F20 | The acknowledgement gate never shows a returning account the first-time welcome: the reads filter by the account (an instructor no longer passes on other people's acceptances), a failed or session-less read is a Retry screen, a session fault refreshes instead of signing out, a network fault queues the acceptance for the next load, and the Week-0 acknowledgement and every other personal-state key are merged on the server (0027) so one device cannot erase another's | R149 | Done |
| F21 | A student may leave a team (what they earned stays on the account, the course work starts over, the team's documents stay with the team) and may join this month's or next month's class session — never an earlier one, and never one behind a session they have already been in; the rule is the database's (0028: a floor table only triggers write, a guard on every join; instructors exempt) as well as the browser's | R150 | Done |
| F22 | The Security+ lab picture draws what the tasks actually build (DVWA in Docker, ufw/fail2ban/Lynis, Defender/SMBv1, tcpdump/Wireshark, Windows 4625, the web-log watch and the ufw-deny containment, the snapshot and the hypervisor) with the correct arrival weeks, and it lights up as the team completes the work; the CySA+, MSSP and SecAI+ pictures name only real tools; Security+ task text no longer cites files nothing produces | R151 | Done |
| F23 | Students asked for a network picture they can reference: Security+ now draws a lab network (hosts, addresses, open ports, Blue's controls) behind a Build | Network switch, with a Before | After toggle and a numbered attack step-through in exam vocabulary; DVWA is on :8080 everywhere, Blue's Week-3 log watch reads the DVWA container's log, and the Windows 4625 case is shown honestly as Blue's own test logons | R152 | Done |
| F24 | The Security+ lab-network picture is now the primary week picture (the task-flow build picture is the secondary option on an always-visible switch), and every attack, host, open port and Blue control carries a one-line description — the attack's shown in the step-through, a component's revealed on click | R153 | Done |
| F25 | Joining a team no longer lets duplicate roles pile up: each role is led by one member, a second may join it as a co-work peer only if the first member allows it, and never a third; the join panel shows each role's state (open, peer welcome, taken, full) and the leader gets an allow-a-peer control; enforced in the browser and the database (0029: role_peering + a membership guard trigger) | R154 | Done |
| F26 | A student who has not yet joined saw every team as 0/6, every role open and every lobby empty, with no live change: the roster and the peer flags were readable only by someone already on the course. Both are now readable by any signed-in user (never anonymous), `role_peering` is published for Realtime and the browser listens to it, so the join panel shows the real seats and role states before you join and updates live (0030) | R155 | Done |

Order of the rounds: the field bug first (it blocks reporting and links), then the link size (the link
fails today), then the earned-skills ledger (the record and the PDF both read it), then the live and
expandable record, then the PDF.

## F1 — text fields take one character at a time (R123, done)

**Cause.** `ui/Dialog` ran its focus effect with `[open, onClose]` as dependencies. Every caller passes an
inline arrow (`onClose={() => setOpen(false)}`), a new function on each render, and a dialog that holds its
field's text re-renders on each keystroke. The effect therefore re-ran after every character: it handed
focus back to the button that opened the dialog, then moved it to the first control, which is the close
button. The field kept one character, and the next space pressed the close button and closed the dialog.
Sixteen dialogs share it (report an issue, create a link, return a form for changes, the fix ledger's fold
note, restore, the studio's fork, the docs tools and others). The command palette's `useFocusTrap` had the
same dependency list.

**Fix.** `useFocusTrap` is the one copy of the behaviour and `Dialog` uses it. The effect depends on `open`
alone and reads `onClose` through a ref, so a caller's closure cannot move focus. Focus lands in the first
text field on open (an element marked `data-autofocus` wins; a read-only field is skipped; a confirmation
lands on its first choice rather than on the close button), Escape closes through the latest `onClose`, Tab
wraps, and focus returns to the opener.

**Verified.** `Dialog.test.tsx`, and typing tests in `ReportIssueDialog.test.tsx` and
`ShareLinkDialog.test.tsx`, type a sentence a key at a time with `user-event`; nine of them fail against the
old dialog. The earlier sweeps set a field's value in one step (`fill`), which cannot see this; the sweeps
now type (`pressSequentially`) into the dialogs and the other fields.

## F2 — the link copy is larger than 256 KB (R124, done)

**Known limit.** A candidate link serves a frozen copy of the member's portfolio export or credential. The
`share` function refuses a copy over `SHARE_MAX_BYTES` (256 KB, `supabase/functions/_shared/shareGuard.ts`),
and the app runs the same check before asking (`src/lib/shares.ts`). The limit stays: a link is public for as
long as it lives. Changing it means redeploying `share`.

**Cause (measured).** The copy was the full export: every row of every course, reached or not, each with about
twenty counters, plus the member's own gaps and raw indicators. So its size followed the courses, not the
member's work. With every course finished and twelve hashed files in each: one large course (Server+) came to
100 KB, CISSP 66 KB, CCNA 53 KB, and all thirteen to 525 KB. A member with four of the larger courses (260 KB)
could not make a link, and neither could one who had only started them.

**Fix.** `shareProfileCopy` (`src/lib/shareCopy.ts`) builds the copy a link serves: a row keeps its id, label and
level and the seven counters a reader uses that are not zero; a row not reached stays as id, label and level, so
the denominator survives; gaps, raw indicators, mapped task and form ids and the "next task" hint stay out (they
are the member's own). The same record came to 231 KB for all thirteen courses and 114 KB for the four
largest; R130 (a fourteenth course) took the row's dimension, label and references out of the copy too, since the
reader restores them from the ontology by id, so fourteen finished courses came to about 201 KB and, with Network+ (R131), fifteen to about 220 KB; the four largest to 97 KB. The member also chooses which courses go in the copy: the dialog lists each course with its size, shows
the size of the copy against the limit before the click, will not send a copy over it, and says what to do. The
published schema allows the smaller shape, and says so.

**Verified.** `shareCopy.test.ts` builds the largest record there can be and holds the copy under the cap (and
the full export over it, which is why the copy is compact), runs the share function's own guard on it, and
validates it against the schema; `ShareLinkDialog.test.tsx` covers the sizes, the ticking, the over-limit state
and the copy that is sent; `SharedProfile.test.tsx` renders the compact copy.

## F3 and F4 — the record updates, and each figure opens (R126, done)

**Cause of F3 (found by reproducing it in a browser).** The record did update, but its figures counted only
verified evidence: after three ticked steps "Steps verified" read 0 and "Skills verified" read "0 of practised 3".
Steps done were not in the record at all (only in a card further down), "Capstones delivered" needed a filed
capstone, and "Days worked" needed evidence. So finishing work changed nothing a member could see. Besides, a page left
open was never refreshed (no refresh on focus, nothing from another tab or device until a reload), a signed-in
member saw "No capstones yet" while the first load was still running, and the page serialised every course on every
broadcast.

**Fix.** The record is twelve figures: progress (steps done, tasks done, weeks sealed, capstones delivered), proof
(steps verified, commands verified, evidence hashed, days worked) and what the course taught (skills verified, tools
used, procedures to standard, exam domains verified), so a tick moves a figure at once. The page loads the account
again when it is looked at (at most every ten seconds), shows a skeleton until the first load lands, and compares a
course by id, update time and revision instead of by body.

**F4.** Each figure is a button that opens a panel listing what it counted: the steps (actions), commands, tools and
procedures behind it, each with the course, week and task it came from and a link to the task; six entries with
"Show all". The lists are built from the step set the figure itself counts, so each is held to the number printed.
A row kept from an earlier run (F5) is listed as such with the steps it was earned from.

**Verified.** `recordDetail.test.ts` (each list against its figure on a real course, one course and two, empty, and
after a reset), `dashboard/page.test.tsx` (the real page: a tick moves the record, a figure opens, the list is live,
the kept rows), `RecordStrip.test.tsx`, `useUserSync.test.tsx`.

## F5 — first completion earns a skill (R125, done)

**Cause.** The profile is a projection over the progress a member has now, so "Reset my progress" (the way to
retake a course) emptied the record with it. Ten skills earned on the first run were gone as the second began.

**Fix.** The earned-skills ledger (`src/lib/earnedSkills.ts`, `earned_skills` in 0019). A skill is earned the
first time it is reached; a row holds the highest level reached, the course it was first reached in, when it was
first reached and when it got to its level, and the steps behind it. It is only ever added to and raised: a reset
or a retake cannot lower, rewrite or re-date a row, a retake adds only what is missing (or raises a skill that was
only practised), and the database holds the same rule for every client. The record, the board, the exports and a
link's copy read the profile with the ledger laid over it. It covers skills, tools, procedures, tactics, practices,
standards and exam domains, per course. Until 0019 is applied the ledger is kept on the device.

**Interpretation to confirm.** The skill counts from the first time it is reached, not only at the moment a
whole course is completed, so the record stays live as the work goes on. If credit should wait for a completed
course, only the moment a row is banked changes.

**Not covered.** The instructor's cohort figures are built from live cohort data and do not yet include the ledger.

**Verified.** `earnedSkills.test.ts` (the rule and a real course through a first run, a reset and three kinds of
retake), `earnedBank.test.tsx` (the same through the real repositories, with "Reset my progress" as HomeTab does
it, and the hook), `earnedRepos.test.ts` (the device and the database, including the table missing), and
`supabase/tests/rls.sql` with eight mutation checks that each fail it.

## F6 — exports are a compact PDF (R127, done)

**What was wrong.** Every file a learner could save from the app was JSON: the member profile, the credential, the
KPI board (dashboard, portfolio, Home card), a shared copy, and the issues inbox. Nobody a member would hand one to
can open it.

**Fix.** One PDF writer (`src/lib/pdf.ts`: A4, the standard fonts, no dependency) and one builder
(`src/lib/recordPdf.ts`). The document holds the figures the page printed (the dashboard's twelve, for the whole
record), the skills by name (verified, practised, tools, procedures, standards, tactics and practices, exam domains,
the roles the courses prepare for), progress by course with a bar, and the issues the member reported (kind, where
it is, what was said, what was done): one page for a normal record, a few for a very large one. "Download PDF" is on
the dashboard (the whole record, and each course's card), the portfolio, the Home card (that course), the shared-copy
page (a profile copy, or a credential copy as a one-page statement of what it is aligned to) and the issues inbox (the
list on screen, with the tab and filters said on the first page). A shared copy holds no issues, so its PDF has no
issues section rather than a claim that there are none. "Copy JSON" stays on the clipboard for an agent; the
"Download JSON" and "Export credential" files are gone, and the portfolio's browser print is now "Print the full record".

**Still machine-readable (decisions to confirm).** These are files that move data between systems, not records for a
reader, and a PDF cannot be imported back:
- the account page's "Export my data", the complete dump (the privacy policy promises it as JSON, so converting it
  needs a new policy version and a fresh acceptance);
- the Deliverables page's "Export my work" and "Restore from file": a handoff file a teammate merges back in;
- the Studio's course document and the course export (imported again), the fix bundle and the live document (for
  folding fixes into the code), and the IaC template files a lab step asks for;
- the CSV files (issues, cohort, funnel and friction, the evidence ledger) and the calendar file.

If the admin wants any of these converted too, it is the same builder and one call site each; the page-shape guard
lists the files that still save JSON, so a new one has to be added on purpose.

**Verified.** `pdf.test.ts` (structure and offsets, escaping, wrapping, margins, page breaks, determinism),
`recordPdf.test.ts` (content and order, limits, shared copies of any shape, the credential, the issues inbox),
`dashboard/page.test.tsx` (the real page: the PDF mirrors the twelve figures and carries only this member's issues),
`DtoChip`, `SharedProfile` and `IssuesBoard` tests, and the page-shape R127 block. The files were opened with PDFium
(the engine Chrome uses) and pypdf, rendered and read, in the browser sweep.

## F7 — the agreements checkbox error (R128, done)

**Cause.** The only thing that shows that message is the acceptance write failing for that account, and the app hid why:
the error code was never logged and every fault read as "check your connection". The likely causes are a session
that had expired while the page stayed open, a browser without `crypto.subtle` (the text hash threw and the button
stuck), and the `ON CONFLICT` upsert shape under row-level security.

**Fix.** `acceptInCloudDetailed` (src/lib/legal/acceptances.ts): a plain insert (a duplicate counts as recorded), the
hash optional, one session refresh and retry, and a typed result (session, permission, network, unknown); the detail goes
to the support log (F8). The gate says what to do in plain words, signs out an expired session, and lets a
network or lag fault continue and retry, because the log is a record, not a lock. `SUPABASE_SETUP.md` has the SQL that checks one account.

**Still to learn.** If an account keeps failing, the support code (Metrics → Support errors) or the SQL result says which of the above it is.

## F8 — support codes and a log on our side (R129, done)

**Why.** The admin does not want technical detail shown to students or left in the browser console, but does want to see what
failed and for whom. **Fix.** A failure shows `Code E-XXXXXX · time`; `reportError` writes the database's code, message and status,
the account, the page and the browser to `client_errors` (0020; admin read only, append only); Instructor → Metrics → Support
errors finds a row by code. The browser console carries nothing from the acceptance module. The first caller is the agreements
gate; any later failure uses the same helper. **Admin step.** Paste `supabase/setup.sql` into the SQL Editor and Run (0020).

## F9 — the A+ Capstone Bench (R130, done)

**What.** The first of the two entry CompTIA stones, built on the same pattern as Server+ (real hardware) and CCNA
(one shared track, four focus roles, no gates): `src/lib/data/seed/aPlus.ts` (week 0 plus four graded weeks, fifteen
tasks, every graded command with a sample, an explanation and verify tokens) and `src/lib/docs/aPlusDeliverables.ts`
(eight forms, the handover as the capstone with a custody log). One used desktop per team; a spare drive, two sticks and an
external drive for the images (`costs.ts`). The rule the course teaches is image first: Week 2 images the disk before the
installer runs and proves the image by a timed restore; Week 4 writes a recovery target, takes the handover image, breaks the
machine on purpose and restores it inside the target. The Troubleshooting Log is the six-step method as data (one theory and
one change per row, the wrong theories kept, a DoD that requires one). Week 3 is a help desk: the standard user, a printer
and a second display, remote help with Quick Assist, and three faults another team injects, worked as tickets.

**Wired.** The catalog card (`comptia-a-plus`) is live; `certs.ts` carries A+ 220-1201/1202 as one registry row (the two
cores at half weight, two gaps noted: mobile devices and virtualization); eleven competency nodes, five tools and three
standard exceptions were added (ontology 1.5.0); the picture is an `ArchPicture` (`aPlusContent.ts`); the lab panel
collects the bench PC's name and address. Every id list a test pins now carries `a-plus`.

**Verified.** The content-integrity, R84, R103, R106 and R107 suites for `a-plus`; the archPicture, weekVisuals and
weekAdds suites; the exported `content/courses/a-plus.json` and its sheets; the share-link cap (see F2) with fourteen courses.

## F10 — the Network+ Capstone Branch (R131, done)

**What.** The second entry CompTIA stone, in the CCNA shape with Packet Tracer as the lab: `src/lib/data/seed/networkPlus.ts`
(week 0, four graded weeks and one optional advanced week on the CCNA kit; sixteen tasks; every graded command a `show`
line pasted from the simulator with a sample and verify tokens) and `src/lib/docs/networkPlusDeliverables.ts` (eight forms,
the Migration Plan & Handover as the capstone). The branch itself is data, `src/lib/networkPlusTopology.ts`: one site, four
VLANs on the CCNA rule (the third octet is the VLAN id) in its own second octet, nine devices, seven links, an RFC 5737 ISP
link and the policy table; the seed, the forms and the picture read every name and address from it. Week 1 designs and
cables, Week 2 configures VLANs, trunks, router-on-a-stick, NAT, DHCP and DNS and fills a test matrix with the rows that
MUST FAIL, Week 3 adds syslog and backups, the access list that makes those rows fail, port security, one change under a
record and three injected faults worked by layer, and Week 4 moves toward real equipment the way a team does: capabilities
from the design, two real candidates per class with the datasheet line, a priced and dated bill of materials, and the
migration plan with the simulator's gaps listed honestly. No hardware is needed to pass.

**Wired.** The catalog card is live and the CompTIA ladder reads A+ → Network+ → Security+ (`certs.ts` prerequisites);
nine competency nodes, a `NETWORK_PLUS` exam standard and the branch picture (`networkPlusContent.ts`) were added (ontology
1.6.0); the lab panel records the simulator and the first management address; the Blue Team career path now starts at
Network+. Every id list a test pins carries `network-plus`.

**Verified.** The content-integrity, R84, R103, R106 and R107 suites for `network-plus`; `networkPlusTopology.test.ts`;
the archPicture, weekVisuals and weekAdds suites; the exported `content/courses/network-plus.json` and its sheets; the
share-link cap with fifteen courses; a browser sweep that joins, pastes a VLAN table and sees it verified.

## F21 — leave a team, join forward only (R150, done)

**What.** The owner's report: a student who joined on the 30th sat alone in October's team while November's arrivals could
not join them, and nobody could leave. `src/lib/cohortWindow.ts` is the window (this month and next, never below the
floor); the join panel offers those sessions as chips, the student's own first when they are already enrolled;
**Leave team** sits beside **Change team or role**. A later session is a *leave then a join* (`src/lib/leaveTeam.ts`),
never an in-place edit: the member's live profile is **banked** first (`courseProfileFor`, the one builder the Skills
card also reads, so what is banked is what was shown), then the member's own course work is cleared the way "Reset my
progress" does it, then the seat frees. Team-keyed work stays with the old team by construction. Both dialogs say what
stays, what goes and that it cannot be undone.

**Wired.** Migration 0028: `membership_cohort_floor` (self and instructor read; only the triggers write), `cohort_today()`
(pinnable for tests), `membership_guard` before insert or update (cohort prefixes the team id; this month or next in UTC
with a two-day grace; an update never moves the cohort backward; an insert never goes below the floor; editing role or
team inside the session you are in is not a join) and `membership_floor` before delete. Instructors are exempt. The
offline repo mirrors the floor on the device.

**Verified.** `cohortWindow.test.ts`, `leaveTeam.test.ts`, the R150 JoinPanel cases, the moved-member cohort case,
page-shape pins (`joinableCohorts(`, `switchCohortTeam(`, bank-before-reset) and the R150 block in `supabase/tests/rls.sql`
(forward ok, backward refused, two months out refused, mismatched team id refused, floor outlives the delete, rejoin
below the floor refused, a closed session still editable in place, Bob never reads Ada's floor nor writes the table,
Ivy places anyone).

## F22 — the SOC pictures match the build, and light up as it is done (R151, done)

**What.** The owner's report: the Security+ diagram showed tools no task uses (a Wazuh SIEM, rsyslog
forwarding, OpenVAS) and missed what the tasks really build, and nothing in any picture reflected
progress. The Security+ `ARCH` (`src/lib/docs/securityContent.ts`) is redrawn in three builder zones —
Red builds the attacker (Kali, OSINT, the nmap/nikto scan, the authorized attacks), Blue builds the
targets (the Ubuntu web server and DVWA in Docker, ufw/fail2ban/Lynis, the Windows firewall, Defender
and SMBv1, Windows logon auditing, the packet capture and detection filters, the web-log watch and the
ufw-deny containment, the pre-hardening snapshot) and GRC keeps the proof (the workspace, the risk
scoring, the evidence hashes, the final briefing) — with the arrival weeks fixed (the snapshot is Week
0, the Linux hardening is a Week-1 host control). CySA+, MSSP and SecAI+ had the same kind of
fictitious nodes replaced with the real stack (CySA+ edge ports; MSSP host controls, audit logging,
access policy, nmap/testssl scanner and the Burp/sqlmap retest evidence; SecAI+ Gitleaks, OpenBao,
LLM Guard, Presidio and ModelScan/Prowler). Security+ task text that cited files nothing produces was
corrected (`src/lib/content-data.ts`).

**Wired.** Live completion: `ArchNode.builtBy` names the work that builds a part; `archBuiltMap`
(`src/lib/archBuilt.ts`, pure) turns the team's completion and filed forms into a 0-to-1 map;
`useArchBuilt` (`src/components/course/useArchBuilt.ts`) feeds it live from `teamStepCompletions`, so a
part lights on the picture as ANY teammate finishes it. `ArchDiagram` gains a `built` prop (a ✓ and an
accent fill when built, a progress bar when partial, a built/this week/later legend) threaded through
`WeekBuildDiagram` and `WeekVisualPanel` from `TasksTab` and `GuideManual`; the status reads "N of M
parts built this week". It is a learner-only prop, never the instructor's `validation` overlay.

**Verified.** `archBuilt.test.ts`; the `ArchDiagram` and `WeekBuildDiagram` built-overlay tests; the
`archPicture.test.ts` contract that every `builtBy` id resolves to a real task or step; the redrawn
pictures still pass the archPicture, weekVisuals and content-integrity suites; the regenerated
`content/courses/{security-plus,cysa-plus,mssp,secai-plus}.json` and build sheets; page-shape pins for
the threaded `built` and the absent `validation`.

## F23 — the lab network picture (R152, done)

**What.** The owner asked for a picture students reference: the network structure and devices, what they
secure and attack, the attack types and the flow each week, and the system before and after. The R151
picture shows the parts a course builds, not the network. `src/lib/docs/labNetwork.ts` (course-agnostic)
and `src/lib/docs/securityNetwork.ts` (Security+) add the lab as a network — Kali, the Ubuntu web server
and the optional Windows host on one Host-Only segment, each with its open ports and the controls Blue
applies, and per week the numbered Red attacks (reconnaissance → scanning → enumeration → injection →
brute force → remote code execution) each paired with the Blue detection or containment that answers it.

**Wired.** A Build | Network switch on `WeekVisualPanel` and the Guide lab section (shown only when the
course carries a network); `LabNetworkDiagram` (pure SVG, token-only, `data-net-*` hooks, an aria-label
that never matches the build picture's `/week N/` img) inside `LabNetworkPanel` (Before | After toggle,
Prev/Next step-through whose sentence is `attackSentence`). Before/after is one data set projected by
`servicesAt`/`controlsAt`. Controls and attacks light as the team completes the work via `builtMapFrom`
(extracted from `archBuiltMap`), with `ctl:`/`atk:` ids disjoint from the architecture nodes so one
`useArchBuilt` map serves both. Content fixes: DVWA :8080 everywhere; Blue's Week-3 log watch reads the
DVWA container's log (`docker exec`); the dishonest `kali → windows` architecture edge removed, the
Windows 4625 case drawn as Blue's own test logons.

**Verified.** `labNetwork.test.ts` (addresses, builtBy resolution, id disjointness, before/after change,
word budgets, :8080); `LabNetworkPanel.test.tsx` (hosts, DVWA port, toggle, step-through, built tint,
aria-label); `WeekVisualPanel` switch present for Security+ and absent for azure, one h3; `dto.test`
(content.network carries three hosts, no top-level topology); page-shape pins; regenerated
`content/courses/security-plus.json` and `index.json`.

## F24 — the lab network made primary, with descriptions (R153, done)

**What.** R152 put the lab network behind a Build | Network switch that defaulted to the task-flow
picture and, on the Tasks tab, only appeared once expanded — so students saw the task-flow and never
found the network. The owner wanted the network primary (task-flow kept, but secondary) and a
description on each attack and each component. The week panel (`WeekVisualPanel`, and the Guide lab
section) now defaults to the **Network** view when the course has one, lists **Build** as the second
option, and shows the switch without expanding. Each `NetHost`, `NetService`, `NetControl` and
`NetAttack` gained a one-line `description`; `src/lib/docs/securityNetwork.ts` authors them.

**Wired.** `LabNetworkDiagram` makes each host, open port and control an accessible button
(`role="button"`, keyboard, `aria-label`) that calls `onSelect`; `LabNetworkPanel` holds the selection
and shows the component's description in an `aria-live` region (click-to-reveal), and always shows the
current attack's description beside the step-through. The diagram takes a `compact` prop for the
thumbnail (caps height, drops the spec table). Prose lives in the data module (`attackSentence` and the
authored descriptions), not the component.

**Verified.** `labNetwork.test.ts` (every component and attack has a description within budget;
`findComponent` resolves); `LabNetworkPanel.test.tsx` (the attack description updates on Next; clicking a
host and a control reveals its description); `WeekVisualPanel.test.tsx` (Security+ opens on Network with
Build secondary, one h3; azure shows no switch); page-shape pins; regenerated `security-plus.json`.

## F25 — a role is led by one, a peer only by permission (R154, done)

**What.** Nothing stopped two people taking the same role in a team (no browser check, no database
constraint). The owner's rule: keep the six seats and the three roles, but each role is led by one
member; a second may join that role as a **co-work peer** only if the first member has allowed it, and
never a third. The join panel now shows each role's state — open, "peer welcome", "taken — ask to allow
a peer", or full — disables the ones that are closed, and gives the role's leader an **allow-a-peer**
control; a peer sees a notice before joining.

**Wired.** `JoinResult.reason` gains `role-taken` and `role-full`; both progress repos check the role
seat in `joinTeam` and expose `getRolePeering`/`setRolePeering`. Migration 0029 adds `role_peering`
(course-readable; written only by a current holder of the role, or staff, via the `holds_role` SECURITY
DEFINER helper so no policy subqueries memberships) and `membership_role_guard`, a BEFORE INSERT OR
UPDATE trigger on `memberships` that refuses a third on any role and a second unless peering is open
(instructors exempt from the permission, never from the cap). The browser pre-checks for a precise
message; the database is the authority.

**Verified.** `rolePeering.test.ts` (first leads, second refused then allowed, third refused, free role
open, own role never refused); `JoinPanel.test.tsx` (taken role disabled with its note, peer-welcome
selectable with the notice, the leader's allow-a-peer control); the R154 block in `supabase/tests/rls.sql`
(second refused until allowed, cap holds even for an instructor, a non-holder cannot open peering, a
coursemate reads the flag, an instructor may place a permitted-free peer); page-shape pins and the
`setupSql` equality contract.

## F26 — the join panel sees the roster before you join, and it stays live (R155, done)

**What.** On the live site a signed-in student who had not yet joined saw every team as **0/6**, every
role as open and every lobby empty, and nothing changed while they watched — although others had joined
and the deploy was current. The join panel exists to be read *before* joining; the facts it shows were
hidden exactly then.

**Why.** `memberships` was readable only via `shares_course(course_id)`, which is true only for a caller
who *already* has a membership on the course (0006). A non-member's hydrate read an empty roster, so the
seat counts fell back to 0 and every role looked open. `role_peering` (R154) had the same rule, so
"taken" and "peer welcome" were invisible pre-join. Realtime was already wired for `memberships`, but
Supabase delivers `postgres_changes` only for rows the reader may select — so no live change either.
`role_peering` was not published at all, so an opened peer seat never reached other open panels.

**Wired.** Migration 0030 recreates `"memberships course read"` and `"role peering read"` as
`for select using (auth.uid() is not null)` — any signed-in user, never anonymous visitors, no subquery
(the 0006 recursion cannot return) — and adds `role_peering` to the Realtime publication (guarded, like
0024). `subscribeRealtime` listens on `role_peering` alongside `memberships`; the existing debounced
hydrate refills the roster and the peer flags and the join panel re-renders from the store. Everything a
team *works on* keeps its team-only rule; `shares_course` itself is unchanged.

**Verified.** `rls.sql`: Zed (signed in, joined nothing) reads the three fixture memberships and the
peer flags, anon reads neither; the hydrate test asserts the channel listens on `memberships` and
`role_peering` and never on `lab_access`; page-shape pins the two policies' bodies, the publication
line, the listener and the two rls assertions; the `setupSql` equality contract. Out of scope, by design:
lobby avatars before joining stay as initials (profiles remain teammate-scoped), and members of another
class session or a legacy team id stay off this month's chips.
