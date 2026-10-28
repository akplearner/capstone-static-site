# Capstone Labs — Current State (as-is)

> An honest snapshot of what exists today, mapped to the [North Star](./ARCHITECTURE.md). For each layer:
> **today → target → the seed we build on**. The path is in [`ROADMAP.md`](./ROADMAP.md).
> **Updated by:** repository exploration of the live codebase.

---

## TL;DR

Today the app is a **fully working, mostly client-side course platform**: authored Security+ content
(Weeks 0–4 × Red/Blue/GRC, ~90 steps, 3 gates), 8 deliverable forms that render PDF/CSV and a team ZIP,
guided task runner with progress, advisory gate notes + completion, a lab-access panel, and
evidence/chain-of-custody *guidance*. Persistence is **localStorage by default**, with an **optional
Supabase backend** (auth + cloud progress + team sync) behind a clean repo seam.

The good news for the north star: **metrics are already side-effect-free projections**, there's a **clean
data seam** to swap in an event-sourced backend, frameworks are **already tagged** on every task/step, the
**DoD-check interface** is a natural seed for validators, and the **chain-of-custody / SHA-256** work is the
conceptual seed for content-addressed evidence. The gaps are an **event log**, **published control-code
anchoring**, **state-reading validators**, **tenant_id + agent actors**, and **consent/provenance** — all
additive, none requiring a rewrite.

---

## Layer-by-layer map

### 1. Persistence / event sourcing
- **Today:** state-based upserts. `step_completions` rows and `deliverables` jsonb are overwritten in
  place; **still no general event log and no history of those tables.** The one exception is the
  **evidence ledger** (`step_evidence`, `evidence_artifacts` — `supabase/migrations/0003_evidence_ledger.sql`),
  which keeps per-step verification records with hashes, attempt counts and timestamps. That is a
  purpose-built fact table, not the xAPI event log Phase 1 calls for — a step's history is still
  folded into one row rather than appended. Repo seam: `src/lib/data/index.ts`; impls
  `src/lib/data/supabaseProgressRepo.ts`, `supabaseDocsRepo.ts`, `supabaseEvidenceRepo.ts`,
  `localStorage*Repo.ts`.
- **Target:** append-only, immutable, signed `events`; everything else a projection.
- **Seed to build on:** the **repo seam** is the single swap point; `step_completions` is already a fact
  table (one row per completed step) — a short step from an event.

### 2. Measurement / CQRS
- **Today:** `getTaskPercent`/`getWeekCompletion`/`deriveGateStatus` are **pure, recomputable** functions
  over a completion key-set (same math reused by both localStorage and Supabase repos).
- **Target:** read models projected from the event log.
- **Seed:** these *are* projections already — they just read state instead of an event stream. Half-done.

### 3. Ontology — frameworks → controls/competencies
- **Today:** frameworks are **coarse string labels** (`NIST_CSF`, `CIS`, `OWASP`, `ISO_27001`,
  `NIST_800_61`, `NIST_800_115`, `CVSS`, `STRIDE`) attached to `Task.frameworks` / `Step.frameworks` /
  `DeliverableDef.framework`, with helpers in `src/lib/utils.ts` (`getFrameworkLabel/Description/Why/Color`)
  that read the standards register (`src/lib/docs/standards.ts`, R107).
  Published control codes appear only as **free text** in deliverable `standard`/`reference` fields. **No
  competency or cert-objective concept** exists.
- **Target:** Control + Competency + CertObjective entities; everything anchored to published codes
  (`NIST.ID.AM-1`, `CIS 5.x`, `OWASP A03`, `SY0-7xx`).
- **Seed:** every task/step/deliverable is already framework-tagged — we add a `controls` map and
  `controlIds`/`competencyIds` rather than starting from zero.

### 4. Validators / ground truth
- **Today:** `DodCheck` (`src/lib/docs/types.ts`) — `test: (d: DeliverableData) => boolean` — inspects
  **only the student-typed form data**, not real system state. Gates = "all required steps marked complete"
  (`deriveGateStatus`).
- **Target:** validators that **read environment state** (config, services, logs, tool output) → pass/fail
  + evidence, mapped to controls.
- **Seed:** `DodCheck` is the right *shape* (declarative check → boolean + label); generalize it to a
  `Validator` interface that can later read state.

### 5. Environments-as-code
- **Today:** environments are **implicit** in task prerequisite prose ("SSH to Ubuntu…") and the new Lab
  Setup guide; students build VMs themselves. No `Environment` entity.
- **Target:** declarative IaC (hosts/network/services/seed state), versioned, referenced by Scenario.
- **Seed:** the Lab Setup guide + lab-access fields enumerate the intended topology; a good spec source for
  the first `Environment` definitions.

### 6. Identity / tenancy
- **Today:** optional Supabase **OIDC** (Google/GitHub/magic-link), **humans only**, `profiles.is_instructor`
  and `is_admin` flags (set by SQL; no screen grants them). Multi-tenancy is **soft**: scoped by `course_id` + `team_id` (no `tenant_id`); RLS uses
  `(course_id, team_id)` JOINs (`supabase/migrations/`).
- **Target:** `tenant_id` on every row + RLS; `actor.type: human|agent`.
- **Seed:** RLS is already in place and the auth layer is OIDC — adding `tenant_id` and an actor type is
  additive.

### 7. Evidence / content addressing
- **Today:** evidence stays **local**; the app provides a naming convention
  (`YYYYMMDD_TeamXX_Tool_Action.ext`, validated by `validateEvidenceFileName`), `sha256sum` guidance, and a
  downloadable **chain-of-custody log** (`src/lib/docs/custodyTemplate.ts`) seeded into the team ZIP
  (`src/lib/docs/package.ts`). The **hashes are now persisted** to `evidence_artifacts`, keyed by the
  digest itself, so re-hashing a file cannot double-count it and the custody log renders from recorded
  data rather than retyped data. The **files themselves are still never uploaded**, which is ADR-0004's
  intent for self-study; object storage remains unbuilt.
- **Target:** blobs in object storage keyed by SHA-256; hash stored in Postgres; integrity/dedup/provenance
  for free.
- **Seed:** the chain-of-custody / SHA-256 model is exactly the platform-scale pattern, one level up.

### 8. Consent / provenance
- **Today:** **partial (R110).** Three consent grants (`share-employer`, `benchmark`, `outcome`) as an append-only per-account log (`consent_grants`), off by default, revocable from the account page; the consented outcome form (`learner_outcomes`) with a five-member floor on the only aggregate. Provenance/CLA fields on contributed content: still absent.
- **Target:** consent grants + provenance/CLA fields as first-class data on every relevant row.
- **Seed:** none — this is net-new, hence "build the fields now, brutal to retrofit later."

### 9. Standards & interop
- **Today:** none formally adopted (OIDC via Supabase is the exception).
- **Target:** xAPI/cmi5 events, OSCAL control data, LTI 1.3 launch, OIDC identity.
- **Seed:** event shape can be authored xAPI-style from day one; control data can be authored OSCAL-mappable.

---

## Domain entities: present / partial / absent

| Target entity | Today | Status |
|---|---|---|
| Course / Week / Gate / Task / Step | `src/lib/types.ts` | **Present** |
| Deliverable (form + data) | `src/lib/docs/*` | **Present** |
| Member / Roster / Completion | `src/lib/types.ts`, repos | **Present** |
| Framework → Standard / Control | `src/lib/docs/standards.ts` (`STANDARDS`, a controls catalogue, `parseStandard()`); `utils.ts` helpers delegate | **Present** (R107; `Framework` stays an open string) |
| Tool | `src/lib/docs/tools.ts` (`TOOLS` with aliases and command heads); a task's tools are derived at export | **Present** (R107; no version/env link) |
| Validator | `DodCheck` (form-data only); the ledger's output-token check is the first pass/fail evidence that survives a reload | **Partial** (still not state-reading) |
| Control / Objective | `CONTROLS` in `standards.ts`; a form's `standard` parses to catalogue codes, `CONTROL_OF` in the document | **Present** (R107; content-side, not a database entity) |
| Competency / CertObjective | `src/lib/docs/skills.ts` (`comp.<area>.<slug>`, anchored to `CERTS` domains or controls); published as `content/ontology/competencies.json` | **Present** (R107; content-side) |
| Environment | implicit in prose + Lab Setup guide | **Absent** as an entity |
| Scenario | implicit (week theme + gate) | **Minimal** |
| Benchmark / SOP / Policy | `src/lib/docs/sops.ts` (SOP kinds anchored to NIST CSF / ISO 27001 / SOC 2 / SP 800-61 / ITIL; form → SOPs, task → SOPs) | **Present** (R107; adherence read from DoD, document control, hashes, lifecycle) |
| Tactic / Practice | `src/lib/docs/tactics.ts` (ATT&CK + ATLAS tactic ids; engineering practices anchored to a standard) | **Present** (R107) |
| Metric catalogue | `src/lib/docs/metricCatalogue.ts`, `content/ontology/metrics.json` | **Present** (R107; definitions and statuses; R132: `scored` and `timing` flags, the Time rows computed from two recorded stamps) |
| Member profile (skills, tools, procedures, standards, domains per member) | `src/lib/skillProfile.ts`; `/portfolio` export `capstone-member-profile/1` | **Present** (R107; a projection; unsigned) |
| Published schemas | `content/schemas/*.schema.json`, `src/lib/schema/validate.ts` | **Present** (R107; R108 adds kpi-board, work-role, environment-profile, credential, event) |
| KPI board (twenty-eight per member per course, six scores, timing) | `src/lib/docs/kpis.ts`, `src/lib/docs/scoring.ts`, `src/lib/kpiBoard.ts`, `src/lib/scores.ts` (`capstone-kpi-board/2`); `/courses/<id>/skills`, the export's `courses[].kpis` and `courses[].scores` | **Present** (R108; R132: seven families, scores by the published method, minutes between two recorded stamps; every tile a ratio of counts with its fact kind; the Home card and every dashboard card show it as the pack, R109) |
| Skill domains, record categories, decision blocks, review marks and flag history | `src/lib/docs/skillDomains.ts`, `src/lib/docs/recordCategories.ts`, `DecisionBlock` in `src/lib/docs/types.ts`, `supabase/migrations/0021`, `0022` | **Present as model and data** (R132; the eight-domain board, the fourteen subcards and the KPI surfaces are R133 and R134) |
| Funnel and step friction (instructor) | `src/lib/funnel.ts`, `src/lib/friction.ts`; `/instructor/<course>/effectiveness`; `src/lib/data/selectAll.ts` (paged reads) | **Present** (R112; counts per cohort, nobody named; steps ordered, never people; fixed-header CSVs) |
| Attribution and currency | `src/lib/skillProfile.ts` (`Indicator.own`, `draftedForms`, `raciRespected`, `lastVerifiedAt`/`current` with the page's `asOf`), `src/lib/kpiBoard.ts` (`contribution`) | **Present** (R111; the role's share of seven team KPIs; a 180-day currency window; no duration reported) |
| KPI pack and DTO chips | `src/components/skills/KpiPack.tsx`, `DtoChip.tsx`; `src/lib/memberExport.ts` (one builder for `/portfolio` and `/dashboard`) | **Present** (R109; twenty-eight sockets off the same board on the Home card and every dashboard card; the board DTO on a course, the member profile and the credential on the dashboard; two cross-course totals) |
| Work role (NICE) | `src/lib/docs/workRoles.ts`; `content/ontology/work-roles.json` | **Present** (R108; 2017 ids transcribed, `checkedYear`; the area crosswalk is the platform's own) |
| Environment profile | `src/lib/docs/environmentProfile.ts`; `content/profiles/sample-mssp.json`; the board's "measured against" picker and a device-local import | **Present** (R108; content-side; a company publishes by file) |
| Cohort KPI report | `src/lib/cohortKpi.ts`; the instructor cohort page and its KPI CSV | **Present** (R108; bands per cohort, no member named) |
| Credential shape | `content/schemas/credential.schema.json`; Create link → credential (the function serves it) | **Present** (R108; Open Badges 3.0 envelope, unsigned: no `proof`; R127: no longer a file download, the shared page prints it as a PDF statement) |
| Event schema | `content/schemas/event.schema.json`, `docs/EVENTS.md` | **Present** as a contract (R108); the table and dual-write: **Absent** |
| Evidence ledger (step verification + artifact hashes) | `step_evidence`, `evidence_artifacts`, `src/lib/evidenceLedger.ts`; browsable at `/courses/<id>/ledger` (`src/lib/ledgerView.ts`) | **Partial** (records proof; not an event log) |
| Review (instructor verdict on a form, per week) | `deliverable_reviews`, `reviewRepo`, `ReviewBanner` / `ReviewCell` | **Present** (R68) |
| Cohort (start date → week due dates, .ics) | `cohorts`, `cohortRepo`, `src/lib/calendar.ts` | **Present** (R68; one date per cohort, seeds carry none) |
| Step note / stuck flag | `step_notes` (owner-only) + `step_flags` (team + instructor), `stepNotesRepo` | **Present** (R68) |
| Rubric points (70 TEAM / 30 FOCUS per week) | `src/lib/rubric.ts`, `src/lib/cohort.ts` (CSV) | **Partial** (the platform's share; quality is still marked by hand) |
| Course snapshot (JSON DTO) | `content/courses/<id>.json`, `src/lib/content/dto.ts`, `npm run content:export` | **Present** (generated; the TS seeds stay the source of truth) |
| Consent grants and outcomes | `src/lib/legal/consents.ts`, `outcomes.ts`; `consent_grants`, `learner_outcomes`, `outcome_counts()` (0013); the account page sections; the cohort Outcomes line | **Present** (R110; append-only; counts only from five members; no `train` grant) |
| Server stamps and verification receipts | `supabase/functions/stamp`, `receipt`, `_shared/`; `verification_stamps`, `verification_receipts` (0014); `src/lib/stamps.ts`; the verify box and the ledger | **Present, cloud mode, once deployed** (R113; deploys from the dashboard by pasting `supabase/dashboard/stamp.ts` and `receipt.ts`, no secrets, R115; the paste never leaves the browser; a receipt records the stamp, not the machine; without the functions the client stamp stands in) |
| Re-hash checks | `rehash_checks` (0014), the ledger's Re-check, `src/lib/hashFile.ts` | **Present** (R113; append-only; works offline; the artifact is never rewritten) |
| State validators | `src/lib/docs/validators.ts` (`ufw-least-privilege`), `Step.validator` | **Minimal** (R113; one validator on one Server+ step, shown live in the verify box, not recorded; reads pasted text, not the machine) |
| Candidate links | `supabase/functions/share`, `shared-profile`, `_shared/shareGuard.ts`; `profile_shares` (0015); `src/lib/shares.ts`; the Create link dialog, the account's "Links you created", `/share` | **Present, cloud mode, once deployed** (R114; deploys from the dashboard by pasting `supabase/dashboard/share.ts` and `shared-profile.ts`, no secrets, R115; member-created, unsigned, 7/30/90 days, revocable; no identity in the copy; token in the fragment, stored as a hash) |
| Employer profiles | `environment_profiles` (0015), `src/lib/employerProfiles.ts`, `/instructor/profiles`, the Skill board picker | **Present, cloud mode** (R114; instructor-published, validated on publish and read; links record the measure) |
| The role on top | `src/components/course/RoleStrip.tsx` inside the sticky `CourseSubNav` (every course page renders it), the dashboard card's role chip, the role's `arc` line on Home | **Present** (R116; Your role, icon, name and team; "No role yet. Join" for a visitor; page-shape pins that every course page renders the bar) |
| Whose task is whose | `src/lib/taskOwnership.ts`, `OwnerChip`, `YourTasksStrip`, the opened task's sentence in `TasksTab` | **Present** (R116; every row says Your task, Everyone, or {Role} · open to anyone; no padlock on any task surface) |
| Gates | `openGateSteps` (`teamProgress.ts`), `WeekGateNote`, the week rail's gate flag, the scope note on the pentest report | **Advisory** (R116; no week or form is locked; the note lists the exact open tasks, setup tasks included, as links) |
| Cover for an empty role | `isVacant`, `coverOf`, `allowedActions` in `src/lib/docs/lifecycle.ts`; `StatusStrip`, the submit bar, `TeamReviewQueueCard` | **Present** (R117; any member covers a role nobody on the team holds, on record, no migration; `raciRespected` skips cover rows) |
| A failed load is not "not enrolled" | `courseHydrateFailed` (`supabaseCache`), `useMember().failed`, `CourseLoadFailed`, `CourseEnrolGate` | **Present** (R117; a retry instead of the Join panel; a removed role is asked for again; a full house is said) |
| One word for done | `src/lib/taskState.ts`, `TaskStateChip`, `TaskRow`, the opened task's header, `WeekHeader`, `WeekRail` tick labels, `REVIEW_VERDICT_LABEL` | **Present** (R118; the team's state and the member's own count, in words and an icon; the instructor's verdict is always named) |
| What a member waits on | `MyWaitingCard` on Home; the late joiner's "Done for the team. Your own record" on Home | **Present** (R118) |
| The team's roles board | `src/lib/roleBoard.ts`, `RoleBoard` on Home (`#roles`), `takeRole`, the role strip's target, `roleCoverage` in `RegistrationsPanel` | **Present** (R119; every role with its holders and this week's tasks, an open role is one click to take, ticks stay; staff see each team's open roles) |
| Reported issues inbox | `/instructor/issues`, `src/lib/issueInbox.ts` (pure), `issuesLoader.ts`, `IssuesBoard`, `IssueCard`, migration `0016_report_context.sql`, `content/schemas/issue.schema.json` | **Present** (R120; every report across every course with who, when, course, week, task, step, role and the version seen; four statuses and a note for the reporter; tabs, filters, group by task, CSV and JSON) |
| Reports record their context, for good | `task_reports.step_id, week, reporter_name, reporter_role, content_version`; the `task_reports_frozen` trigger; `contentVersion()` | **Present** (R120; a student files only an open report; who, what, when and which version are frozen, for staff too) |
| Versioned content fixes | `src/lib/contentFix.ts` (pure), `readingBudget.ts`, `content/docs.ts` (`effectiveCourse`, `courseDocument`), `localStorageContentFixesRepo`, `supabaseContentFixesRepo`, `FixTextPanel`, `FixesLedger`, migration `0017_content_fixes.sql`, `content/schemas/content-fix.schema.json` | **Present** (R121; an admin corrects the words of a task or step from a report: a numbered, append-only ledger over the course, applied in one place, revertible, folded into the code later; held to the seeds' reading budgets and self-check tokens) |
| Content version | `contentVersion()`, `Course.revision`, `CourseDto.revision` and `fixes` | **Present** (R121; `{document version}.{revision}`; a report stamps the one the student saw; the ledger prints it per entry) |
| Course versions and history | `supabase/migrations/0018_course_document_versions.sql`, `courseHistoryRepo` (`localStorageCourseRepo.ts`, `supabaseCourseHistoryRepo.ts`), `HistoryPanel`, the studio's History tab | **Present** (R122; every studio save is numbered by the database and kept with who, when and size; restore saves an old version as a new one; offline the last eight saves are kept) |
| No silent fork, saved ids read-only | the studio's built-in banner and Save confirmation, `ID_LOCKED_HINT` in the Tasks, Roles and Gates editors | **Present** (R122; a built-in's first save asks and says where the copy lives; task, step, role and gate ids cannot change once saved) |
| Earned-skills ledger | `src/lib/earnedSkills.ts` (the rule, pure), `earnedRepo` (`localStorageEarnedRepo.ts`, `supabaseEarnedRepo.ts`), `src/lib/earnedBank.ts` (`withEarned`, `useBankEarned`), `supabase/migrations/0019_earned_skills.sql` | **Present** (R125; a skill is earned the first time it is reached and a reset or retake never lowers, rewrites or re-dates it; a retake only adds what is missing; the database enforces it; per-device until 0019 is applied; the instructor's cohort figures are not yet laid over by it) |
| PDF exports | `src/lib/pdf.ts`, `src/lib/recordPdf.ts`, `downloadBytes`; "Download PDF" on the dashboard (whole record and each card), the portfolio, the Home card, the shared page and the issues inbox | **Present** (R127; one compact PDF of skills, progress and issues, a few kilobytes, no dependency; no learner-facing file is JSON; Copy JSON stays on the clipboard; the account data export, the Deliverables handoff file, Studio files, fix bundle, IaC files and CSVs stay machine-readable) |
| The record, live and openable | `src/lib/recordDetail.ts`, `src/lib/recordFacts.ts`, `RecordStrip` / `RecordDetailPanel`, `useUserSync` (refresh, `ready`), the dashboard's twelve figures | **Present** (R126; steps done, tasks done and weeks sealed join the proof figures; each figure opens to the steps, commands, tools and procedures behind it with a link to the task; the page refreshes when looked at; kept-from-an-earlier-run rows are listed as such; the portfolio and skill board are unchanged) |
| The eight domains and the fourteen categories | `src/lib/skillDomainsView.ts`, `src/lib/recordCard.ts`, `DomainBoard`, `RecordCategories`, `categoryDetail` | **Present** (R133; the Skill board lists only evidenced rows per domain with frequency, consistency, the role's expectation and evidence; the dashboard's record leads with fourteen category cards, the tier at ten verified uses across courses, the twelve progress figures following) |
| Scores, timing and the record by category on every surface | `KpiBoard` (scores, timing), `KpiTable`, `KpiPack`, `cohortKpi.ts` (score means, timing), `memberExport.ts` (`categories`), `recordPdf.ts` ("Record by category", scores per course), `SharedProfile`, `ReviewCell` (marks per category) | **Present** (R134; a count prints no denominator and a minutes row prints its median; the cohort report folds score means and the group's timing; the credential carries one result per category; the instructor's marks are appended per rubric category) |
| The project record, its history and its conflicts | `src/lib/docs/projectRecord.ts` (`RECORD_FIELDS`, `projectRecord`, `recordConflicts`), column types `cidr`/`port`, `deliverableRubric.ts` (`BundleContext.docs`/`defs`), migration 0025 `deliverable_history`, `docsRepo.history`, `content/ontology/project-record.json` | **Present** (R139; every course's facts are read as a typed, keyed record from the team's own rows; nine conflict rules; the Consistency category lists a form's own; the database keeps every replaced version per sitting; hidden from learners as a whole until R141's console) |
| Every course feeds every KPI for every role | `docs/handoffForms.ts`, `recordCategories.ts` (`TROUBLE_GROUPS`, `CHANGE_GROUPS`), `derive.ts` (`withDocumentControl`), `standards.ts` (`practiceKeyOf`), `raci.ts` (`CLOUD_RACI`), `workRoles.ts`, the seeds | **Present** (R138; the allow-list of `kpiBoard.allCourses.test.ts` is empty: every KPI is measured in every course for every role, the three decision KPIs for the drafter only, by design) |
| Measured as documented, not-measured state | `KpiValue.applies`/`notMeasured`, `Indicator.offered`, `kpiBoard.allCourses.test.ts` + `allow.json`, `scripts/kpi-debt.ts`, `bandOf` per unit, cohort `earnedFor` | **Present** (R137; no tile prints 0 of 0; graded weeks only; definitions match SCORING.md; decisions are the drafter's; every course × role runs through the pipeline in a test with the content debt pinned for R138) |
| Every fact reaches the projection | `src/lib/recordFacts.ts` (`teamFactsOf`, `ownFactsOf`, `weekDueOf`), `src/lib/weekDue.ts`, `hydrateUser`, `cohortLoader.ts`, migration 0024, `importRewrite.ts` | **Present** (R136; the marks, the flag history, the review queue and the calendar reach every surface in both storage modes; the dashboard and the portfolio carry team facts without a course page; a tick is not an attempt; one rule for a role's forms; the import re-signs decisions, status rows and notes) |
| Ownership and hardening | `LICENSE`, `NOTICE.md`, `SECURITY.md`, `.github/CODEOWNERS`, `.github/dependabot.yml`, migration 0023, `supabase/functions/_shared/cors.ts` and `limits.ts`, `src/lib/csv.ts` (`FORMULA_START`), `clearDeliverableOutbox`, the CI `security` job | **Present** (R135; proprietary licence under akplearner; the database refuses a self-inserted profile, clamps an unreviewed `reviewed`, caps reports, support rows and sizes, allows https avatars only; the functions fail closed on origin and cap links, stamps and emails; CSV cells cannot be formulas; sign-out clears the outbox; CI is read-only, pinned, audited and secret-scanned. The visibility switch, secret scanning, branch protection and the lab password rotation are the owner's, listed in OPERATIONS.md) |
| Acceptance gate (agreements v2, AUP page) | `src/lib/legal/agreements.ts`, `/legal/aup`, `LegalGateOverlay`, `agreement_acceptances.text_sha256` | **Present** (R110; sandbox-only and liability wording drafted, counsel review pending; re-asked at the next sign-in on a version bump) |
| Event / Attestation | — | **Absent** |
| `tenant_id` | `course_id`+`team_id` soft scope | **Absent** (column) |

---

## Key seams (where the roadmap plugs in)

- **Data seam:** `src/lib/data/index.ts` selects repo impls — the swap point for an event-sourced backend.
- **Progress math:** `src/lib/data/localStorageProgressRepo.ts` / `supabaseProgressRepo.ts` — the
  projection functions to keep as read models.
- **Validators:** `DodCheck.when` in `src/lib/docs/types.ts` is a `Predicate` — DATA, not a function —
  evaluated by `src/lib/docs/predicate.ts`. The vocabulary is CLOSED (a field is filled, a table has at
  least N rows, every/some row satisfies a row test, distinct values number at least N, plus all/any/not),
  and `predicateErrors` rejects an unknown key with its JSON path, because `{ group: 'machines',
  atleast: 4 }` would otherwise evaluate quietly as "at least one row" and mark a gate passed.
- **Frameworks:** `src/lib/utils.ts` (helpers); `frameworks: [...]` on tasks/steps/deliverables.
- **Schema:** `supabase/migrations/` (tables + RLS to extend with `events`, `tenant_id`, consent).
- **Evidence:** `src/lib/docs/custodyTemplate.ts`, `package.ts`, `validateEvidenceFileName` in `utils.ts`.
- **Identity:** `src/lib/useAuth.ts`, `src/lib/supabase/*`, `profiles.is_instructor`.
- **Instructor view:** `src/lib/data/cohortLoader.ts` reads a whole course (six selects, bypassing the
  per-user cache) for `/instructor/<course>/cohort`; `src/lib/search.ts` is the ⌘K index.
- **The host's holes:** `PUBLISHED_PORTS`, `CROSS_ZONE_ALLOW` and `hostRulesFile()` in `src/lib/serverTopology.ts`
  render the Proxmox host's iptables-restore file; the Week-2/3 seed steps, the guide, the topology diagram
  and the IP Plan's published-ports table all read that one model.
- **Topology symbols:** a Server+ command is authored against the model
  (`<vm.websrv.address>`, `<bridge.vmbr1.gateway>`) and resolved once at module load by
  `src/lib/topologySymbols.ts`, so the same procedure can be pointed at different addressing.
  `serverProcedures.test.ts` fails on a literal topology address in any authored command, sample or
  explanation, and names the symbol that belongs there — the inverse of the old `commandsExempt` rule.
  The student's own numbers are a separate, later substitution (`fillPlaceholders`).
- **Content loading — the documents ARE the source:** `localStorageCourseRepo` builds every built-in course
  from `content/courses/<id>.json` through `src/lib/content/load.ts` (path-naming validator), with the
  TypeScript modules compiled in as a LOUD fallback: a document that fails to validate logs what is wrong
  and the app keeps working. `courseSource.test.ts` asserts the loaded object is not the module object, so
  "the documents are live" is checked rather than assumed; `dto.test.ts` proves the UI helpers give
  identical answers either way, and that the function-marker count is zero for all five courses.
- **Content export:** `src/lib/content/dto.ts` writes every course to `content/courses/<id>.json` — weeks, tasks,
  steps, commands, forms, guide procedures, the topology model, the glossary, the lab-access fields, the IaC
  tools and the marking split. The topology section is COMPUTED from the module (`topologyData`), not a
  hand-kept list, because the hand-kept list silently missed nine constants across three rounds;
  `dto.test.ts` fails if anyone goes back to listing names. The same computed rule assembles the `content`
  section (`contentData`), so a table added to a content module reaches the document by existing.
- **One home per command:** `src/lib/docs/serverCommands.ts` holds every Server+ base-build command once —
  which machine types it (`MACHINES` in `serverTopology.ts`), why it exists, what it prints, and whether it
  overwrites config. The seed and the guide are filled from it at load (`withCommandDetail` /
  `withProcedureDetail`); `serverProcedures.test.ts` fails if a command is explained in both files, if a chip
  disagrees with its sentence, or if a config write has no backup before it.
- **Content, not components:** five data modules hold the course's reference material — `serverDiagrams.ts`
  (the 24U rack, the week each part of the topology arrives, every caption), `cysaContent.ts` (five diagrams,
  the Wazuh/Suricata/Sysmon manual, the lab spec), `securityContent.ts` (the self-study lab, the 17-files map),
  `manual.ts` (the manual's sections and the quick-reference card) and `troubleshooting.ts` (terminal basics
  and the error rows, each with the lab capabilities it needs). The components render them and keep the
  colours; `page-shape.test.ts` fails if one declares a table of rows or types a sentence beside the markup.
  A manual section is gated on a CAPABILITY (`Course.manualSections`, plus what the course demonstrates),
  never on a course id, so a course built from the deployment capstone gets its configuration guide.
- **A course declares what it has, never its id:** `Course.manualSections` says which manual sections it
  ships content for, and `Course.topologyPicture` ('soc' | 'rack' | 'campus') says which reference picture
  its lab section draws. The picture used to be inferred from the configuration-guide flag — a coincidence
  that held only while exactly one course had a build guide. A section or a picture a course cannot fill is
  one it does not declare, so the CCNA skeleton renders no empty configuration guide and no other course's
  rack. `manual.test.ts` pins both.
- **The acquisition model (CCNA):** `src/lib/docs/ccnaKit.ts` is the vocabulary of what a team's NETWORK
  equipment can do — 15 capabilities, each with the `show` command that proves it, the device classes that
  provide it, the week that first needs it, and what the course does instead without it. Week 0's register
  records the answers; later weeks branch on them (SVIs vs router-on-a-stick), so a team builds with the kit
  it has rather than the kit the course assumed. The buying guide is capability-first: what a class unlocks,
  with representative used-market models and no prices to go stale.
- **The CCNA addressing model:** `src/lib/ccnaTopology.ts`, with one rule the course teaches — the third
  octet IS the VLAN id — so every prefix, gateway and pool is DERIVED (`prefixOf`, `gatewayOf`,
  `dhcpRangeOf`) rather than typed. `ccnaTopology.test.ts` asserts the derivation, that no DHCP pool contains
  a static device address, that a trunk never carries a VLAN its far site lacks, and that anything "public"
  is inside the RFC 5737 documentation range.
- **The A+ bench (R130):** `src/lib/data/seed/aPlus.ts` is the first entry-level CompTIA capstone, on real
  equipment — one used desktop per team — in the Server+ shape (shared track, four focuses, no gates, every graded
  command with a sample and verify tokens). Its rule is image first: the disk is imaged and hashed before the
  installer runs, and an image counts only once a restore from it has been run and timed against a written
  target (`aPlusDeliverables.ts`, the Backup & Image Register). The Troubleshooting Log is the six-step method as
  data, with a DoD that requires a wrong theory. Its picture is an `ArchPicture` (`aPlusContent.ts`); its lab
  panel collects the bench PC's name and address; `certs.ts` carries the two cores as one row at half weight.
- **The Network+ branch (R131):** `src/lib/data/seed/networkPlus.ts` is the second entry-level CompTIA capstone,
  in the CCNA shape with Packet Tracer as the lab and no hardware needed to pass. Its branch is data
  (`src/lib/networkPlusTopology.ts`: the CCNA addressing rule in its own second octet, nine devices, the policy
  table, an RFC 5737 ISP link) that the seed, the forms and the picture read. The test matrix carries the rows that
  MUST FAIL, and Week 3's access list is what makes them fail; Week 4 moves toward real equipment by research, a
  priced bill of materials and a migration plan that lists the simulator's gaps. The CompTIA ladder now reads
  A+ → Network+ → Security+.
- **Reading budgets apply to every course's graded weeks,** not just Server+'s: the 36-word command
  explanation and 30-word step-subtitle limits now key on `isGradedWeek`. The "every command shows a sample
  and an explanation" rule is a RATCHET — a measured per-course backlog (security-plus 68, cysa-plus 77,
  mssp 4, the two newest 0) that may fall and never rise.
- **Drawing the part being built:** `TopologyFocus` (derived from the machines a task's commands name) sits on
  the task row, the week header and each guide week; `ServerTopologyDiagram` takes `highlight` and
  `builtThrough` to light one week and dim what has not been built yet.
- **Remote administration:** `REMOTE_ADMIN` in `src/lib/serverTopology.ts` is the tailnet's way into the zones
  (the host advertises both subnets; `hostRulesFile('the-holes')` allows `tailscale0` forward for SSH and RDP only).
- **Following the build:** `Course.buildMap` (one milestone per week) renders as `src/components/BuildMap.tsx` above
  the Tasks list; `Course.stepDensity` / `Course.guidedDefault` set a course's default view, and
  `src/lib/stepDensity.ts` keeps the student's own choice in `UserCourseState.stepDensity`.
- **IaC tool choice:** `src/lib/iacTool.ts` derives the OpenTofu form of every Terraform command, expected
  output and verify token at render time (`commandFor`/`applyIacTool`); the install line is authored twice
  (`opentofu` on a command entry); the choice is a Lab access field (`IAC_TOOL`) in `src/lib/labAccess.ts`.
- **Offline:** `public/sw.js` (hand-written; navigations network-first, `/_next/static` cache-first,
  RSC and Supabase never cached), `src/lib/pwa.ts`, `src/components/pwa/*`; `/offline` is the fallback.
