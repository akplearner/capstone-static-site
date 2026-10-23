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
are the member's own). The same record now comes to 231 KB for all thirteen courses and 114 KB for the four
largest. The member also chooses which courses go in the copy: the dialog lists each course with its size, shows
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
hash optional, one session refresh and retry, and a typed result (session, permission, network, unknown) with the code in
the console. The gate names the cause, signs out an expired session, quotes the code for a permission fault, and lets a
network or lag fault continue and retry, because the log is a record, not a lock. `SUPABASE_SETUP.md` has the SQL that checks one account.

**Still to learn.** If an account keeps failing, the console line (or the SQL result) says which of the above it is.
