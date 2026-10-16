# Fix list

What the admin asked to have fixed, kept in one place so that nothing on it is overlooked. Each item has an
id, the symptom in the admin's words, the cause once it is known, the round that fixes it, what counts as
fixed, and how that is verified. An item stays here after it ships (status **Done**), so the list is also
the record. `src/lib/page-shape.test.ts` fails if an id is removed from the table.

| Id | Symptom | Round | Status |
|----|---------|-------|--------|
| F1 | A text field takes one character at a time (creating a link, reporting an issue) | R123 | Done |
| F2 | Create link fails: "The copy is larger than 256 KB, the most a link can hold." | R124 | Open |
| F3 | The dashboard's "Your record" does not update | R126 | Open |
| F4 | Each record metric expands to the tools, commands, procedures and actions behind it | R126 | Open |
| F5 | A skill is earned the first time a course is completed; a retake only adds what is missing and never overwrites an earned skill | R125 | Open |
| F6 | An export is a compact PDF of skills, progress and issues, not a JSON file | R127 | Open |

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

## F2 — the link copy is larger than 256 KB (R124, open)

**Known limit.** A candidate link serves a frozen copy of the member's portfolio export or credential. The
`share` function refuses a copy over `SHARE_MAX_BYTES` (256 KB, `supabase/functions/_shared/shareGuard.ts`),
and the app runs the same check before asking (`src/lib/shares.ts`). The profile carries every skill row,
tool, procedure, KPI and evidence record of every course the member has started, so it grows with each
course. Fixed when a full record fits well under the cap, and when a copy that still does not fit says how
large it is and what to do.

## F3 and F4 — the record updates, and each metric expands (R126, open)

Fixed when finishing a step moves the record on the dashboard without a reload, in local and cloud mode, and
when each tile opens to the tools, commands, procedures, standards and actions that make up its number, with
the task and step each came from.

## F5 — first completion earns a skill (R125, open)

Fixed when an earned skill is kept as a record of its own (first earned when, in which course, from which
evidence) that a reset or a retake never lowers, rewrites or re-dates, and a retake adds only the skills not
yet earned.

## F6 — exports are a compact PDF (R127, open)

Fixed when each learner-facing export (dashboard, portfolio, credential, account data, shared copy) gives
one compact PDF of skills, progress and issues, and no file the app generates for a learner is JSON.
Machine-readable files an admin moves between systems (course import and export, the fix bundle, CSV) are a
different kind of file and are not part of this item unless the admin says so.
