# The value register (R107)

What the platform's own assets are worth, to whom, and what is true today. Every item names the
asset it rides on, the metrics that carry it (`src/lib/docs/metricCatalogue.ts`, published as
`content/ontology/metrics.json`) and an honest status:

- **available now** — shipped, read from facts the platform keeps;
- **needs validators** — needs a check that reads real state, not pasted text (`docs/ROADMAP.md`);
- **needs events** — needs a fact the platform does not record (there is no event log);
- **needs consent** — needs a consent the member has not been asked for;
- **needs legal change** — conflicts with a sentence on the legal pages, which say today that a
  verification record is the member's own and is not shared with third parties
  (`src/app/legal/privacy/page.tsx`, `src/app/legal/terms/page.tsx`);
- **Phase 4** — deliberately not built (ADR-0007: no MCP gateway now).

Since R132 a number may be scored by a published method (`docs/SCORING.md`) and a duration is the difference of two recorded stamps; nothing ranks one member against another. R110 added the consent grants
(`share-employer`, `benchmark`, `outcome`) and the consented outcome form: an item marked "needs
consent" below now means "needs the member's grant", which the member can give from the account page.
R112 added the platform's own effectiveness view for instructors: the funnel from enrolment to a filed
capstone, active-weeks bands and the step friction map, counts only. The member profile is sent by the
member, unsigned, and says so in its `claim`. R108 added rows 11 onward in each list: the Skill
board's thirty-two KPIs, the environment profile, the work roles, the credential envelope, the cohort
report and the event contract. R132 to R134 added the last row of each list: the record by category with its tier, the eight domains with the scores, and the decision, category and scoring shapes.

## For companies (the hiring pipeline)

| # | Value | Asset | Metrics | Status |
|---|---|---|---|---|
| 1 | A competency ontology anchored to the exams and controls they hire against | `content/ontology/competencies.json`, `domains.json` | `metric.platform-skill-coverage` | available now |
| 2 | "What a graduate of course X did": the skills, tools, procedures, standards, tactics and practices per course, task by task | `docs/courses/skills/<course>.md`, `content/courses/index.json` counts | `metric.platform-skill-coverage`, `metric.platform-course-verifiability` | available now |
| 3 | A machine-readable member profile the candidate sends themselves: levels per skill, tools, procedures followed to standard, exam domains, evidence hashes | the `/dashboard` chip's Copy JSON and a member-created link (`capstone-member-profile/1`, built by `src/lib/memberExport.ts`), `content/schemas/member-profile.schema.json`; the file a member saves is the PDF (R127) | `metric.skill-verified`, `metric.tool-verified`, `metric.procedure-to-standard`, `metric.domain-weight-verified` | available now (member-initiated, unsigned; by clipboard, or a member-created link to a frozen copy, unsigned, expiring, revocable, R114); signed attestation: needs validators |
| 4 | Weighted exam-domain coverage per course and per member | `docs/courses/cert-coverage/`, `index.json.coveredWeight`, the dashboard strip | `metric.domain-weight-verified` | available now |
| 5 | A tool register, so a résumé line maps to verified steps | `content/ontology/tools.json` | `metric.tool-verified`, `metric.tool-evidenced` | available now |
| 6 | A procedure record: which runbooks and SOPs were followed, to which NIST CSF / ISO 27001 / SOC 2 reference, and approved by whom | `content/ontology/sops.json`, the portfolio's "Procedures followed to standard" | `metric.procedure-followed`, `metric.procedure-to-standard` | available now (course facts) |
| 7 | Standards and control codes practised, with the citing document | `content/ontology/standards.json` (controls), the portfolio's "Standards practised" | `metric.standard-effectiveness-steps`, `-forms`, `-sops`, `metric.standard-controls-cited` | available now |
| 8 | A reusable work-sample rubric: deliverable templates with a RACI, Definition-of-Done predicates and four rubric categories | course DTO `deliverables[]`, `src/lib/docs/predicate.ts` | `metric.doc-rubric-green`, `metric.doc-dod-met` | available now |
| 9 | The honest reading guide: what "verified" proves, every metric's definition and status | `content/ontology/metrics.json`, `SKILLS_COPY.exportClaim`, the legal pages | — | available now |
| 10 | Named candidate shortlists or cohort data for an employer programme | the cohort CSV (`src/lib/cohort.ts`); one candidate at a time, the member's own link (`/share`) | `metric.platform-cohort-domain-coverage` | needs consent + legal change for shortlists; a member's own link is available now (R114) |
| 11 | An Environment Profile: the stack, methodology, policies, ticket taxonomy and the competencies a company requires per work role, published as a file and measured against | `content/schemas/environment-profile.schema.json`, `content/profiles/sample-mssp.json`, the Skill board's "Measured against" picker | `metric.profile-coverage` | available now (published by file; over MCP: Phase 4) |
| 12 | The thirty-two-KPI board per candidate (R132, R140): technical capability, problem solving, execution, decision making, teamwork, professionalism and growth, each a ratio of counts (or a median of minutes between two recorded stamps) with its fact kind and, on team facts, the share on forms the candidate's role drafts, plus six scores by the published method, sent by the candidate | `/courses/<id>/skills`, the `KpiPack` and its chip on the Home card and every `/dashboard` card, the export's `courses[].kpis` and `courses[].scores` (`capstone-kpi-board/3`), `content/ontology/kpis.json`, `content/ontology/scoring.json` | the twenty-eight `kpi.*` rows of `src/lib/docs/kpis.ts`, the six `score.*` rows of `scoring.ts` | available now (member-sent, unsigned; by link, measured against an employer profile an instructor published, R114) |
| 13 | A credential envelope a hiring system can parse: Open Badges 3.0 with alignment to competency, exam-domain and NICE work-role ids | Create link → credential (the function serves it; the shared page prints it as a PDF statement, R127), `content/schemas/credential.schema.json` | — | available now by link (unsigned, no `proof`); a signed attestation: needs validators |
| 14 | The cohort KPI report: counts per band per cohort, nobody named | the instructor cohort page, its KPI CSV (`src/lib/cohortKpi.ts`) | the twenty-eight `kpi.*` rows | available now for a programme's own instructors; handing it to an employer: needs consent + legal change |
| 15 | The record by category: fourteen professional categories across every course, each with verified uses, a success rate, the last activity, six months of trend, the evidence and the industry relevance, and a tier at ten verified uses (R133, R134) | the `/dashboard` record, the export's `categories` (`capstone-member-profile/3`), the credential's `record <category>` results, the PDF's "Record by category", a candidate link, `content/schemas/record-category.schema.json` | `metric.readiness-tier`, `metric.trouble-resolved`, `metric.decision-recorded` | available now (member-sent, unsigned) |
| 16 | Understanding retained: values the team recorded, recalled and applied weeks later, conflicts the record found and the team resolved, and the minutes on task, measured and never rewarded (R139, R140) | the `validation` KPI family and `score.understanding` on the Skill board, the cohort report and the export (`capstone-kpi-board/3`), `content/ontology/project-record.json` | `metric.validation-recall`, `metric.validation-applied`, `metric.conflicts-resolved`, `metric.minutes-on-task` | available now (member-sent, unsigned) |

## For students

| # | Value | Asset | Metrics | Status |
|---|---|---|---|---|
| 1 | "Your skills" per course by level, with the next task that closes each gap | the course Home card (`SkillsCard`) | `metric.skill-practised`, `metric.skill-verified`, `metric.skill-next-gap` | available now |
| 2 | Exam-domain mastery per capstone | the dashboard strip (`DomainStrip`) | `metric.domain-practised`, `metric.domain-verified`, `metric.domain-gap-next` | available now |
| 3 | Tools used and verified, by name | the portfolio's "Tools used" | `metric.tool-used`, `metric.tool-verified` | available now |
| 4 | Procedures: the runbooks and SOPs followed, the standard each follows, what the team approved | the portfolio's "Procedures followed to standard" | `metric.procedure-started`, `-followed`, `-to-standard` | available now (course facts; on the dashboard after the cross-course hydrate) |
| 5 | Standards practised and the controls the approved forms cite | the portfolio's "Standards practised" | `metric.standard-practised`, `metric.standard-controls-cited` | available now |
| 6 | Tactics (security courses) and engineering practices (every course) | the portfolio's "Tactics and practices" | `metric.tactic-practised`, `metric.practice-practised` | available now |
| 7 | A JSON document with a published schema, to hand to anyone | the `/dashboard` chip's Copy JSON, a member-created link, `content/schemas/` | — | available now (R127: copied or linked, no longer a downloaded file) |
| 8 | A printable record with the skills sections | `/portfolio` → Print the full record | — | available now |
| 8b | A compact PDF of skills, progress and issues, to hand to anyone | "Download PDF" on `/dashboard`, `/portfolio`, the Home card and a shared copy (`src/lib/recordPdf.ts`) | — | available now (R127; unsigned) |
| 9 | The documentation and collaboration record: drafted, reviewed, issued, rubric-green, hand-offs, RACI respected | the Home card's indicators | `metric.doc-drafted`, `-reviewed`, `-issued`, `metric.collab-handoffs`, `metric.collab-raci-respected` | available now (course facts) |
| 10 | Ability indicators without speed: first-try beside persistence, partial progress, investigation, consistency | the Home card's indicators | `metric.ability-first-try`, `-persistence`, `-partial-progress`, `-investigation-reports`, `-consistency-days` | available now; recall, calibration, independence: needs events / validators; remediation from another platform: Phase 4 |
| 11 | The Skill board: the competency map lit by level and the thirty-two KPIs with the seven scores, replayable, measured against a job role or a company profile with the untaught gap named; the same twenty-eight as the socket pack on the Home card and every dashboard card | `/courses/<id>/skills` (`SkyMap`, `KpiBoard`, `KpiTable`), `KpiPack` | the twenty-eight `kpi.*` rows, `metric.profile-coverage` | available now |
| 12 | A credential beside the profile | Create link → credential (R127: no longer a downloaded file) | — | available now by link (unsigned) |
| 13 | The eight domains: skills by course listed only where evidence stands behind a row, with how often, how consistently, what the role expects and the evidence, and the scores by the published method (R133, R134) | `/courses/<id>/skills` (`DomainBoard`, the scores and timing on `KpiBoard`), `docs/SCORING.md` | the `kpi.*` and `score.*` rows | available now |
| 14 | Validate what you built: from the middle graded week the course asks for the values the team recorded, why they were chosen and what they imply under a change, generated from the team's own forms; a conflict the record finds is shown on the form as a hint; a timer per task that the member pauses, hiding the content until Resume (R139, R140) | the Tasks tab's validation panel, the Consistency hints on the Expectations panel, the Pause button and cover, `kpi.validation.*`, `score.understanding` | `metric.validation-recall`, `metric.validation-applied`, `metric.conflicts-resolved`, `metric.minutes-on-task` | available now |

## For other AI platforms and agents (A2A and MCP consumers)

| # | Value | Asset | Metrics | Status |
|---|---|---|---|---|
| 1 | The ontology as a versioned artifact: semver, additive, ids as join keys | `content/ontology/` (`index.json` states the rules) | — | available now |
| 2 | JSON Schemas for every published shape | `content/schemas/` | — | available now |
| 3 | Twenty-two course DTOs and the catalogue, content only | `content/courses/` | — | available now |
| 4 | The SOP register anchored to standards, as an evaluation target ("did the agent follow the runbook to NIST CSF RS.MA") | `content/ontology/sops.json`, DTO `deliverables[]` | `metric.procedure-followed` | available now |
| 5 | The predicate vocabulary: Definition-of-Done checks and derived columns an agent can evaluate | `src/lib/docs/predicate.ts`, DTO `deliverables[].dod` | `metric.doc-dod-met` | available now |
| 6 | The xAPI statement shape with `competencyIds` and `consentScope` | `content/schemas/xapi-statement.schema.json` | — | shape now; statements: needs events + consent |
| 7 | The metric catalogue with definitions, inputs and statuses | `content/ontology/metrics.json` | — | definitions now; per-member values: needs consent |
| 8 | Agent-readable Markdown: build, cert-coverage and skills sheets | `docs/courses/` | — | available now |
| 9 | Verify tokens and Definition-of-Done predicates per step and form as a validator interface; environment templates (`azuredeploy.json`, `template.yaml`) as agent sandboxes | course DTOs, `src/lib/cloud/*Iac.ts`, `src/lib/docs/validators.ts` | `metric.platform-course-verifiability` | available now as content, with one browser validator (`ufw-least-privilege`, shown live, not recorded) and server receipts of stamps in cloud mode; state-reading validators: needs validators |
| 10 | An MCP server or A2A federation over all of the above | ADR-0007 | — | Phase 4, deliberately not built |
| 11 | The KPI board as a document: thirty-two ratios with catalogue ids, fact kinds, units and loaded flags, six scores with every component named, and the timing block, the Agent view of the Skill board | `content/ontology/kpis.json`, `content/ontology/scoring.json`, `content/schemas/kpi-board.schema.json` | the twenty-eight `kpi.*` rows | available now |
| 12 | The event contract: the xAPI-shaped event every write site would append, with actor type, assist level and consent scope | `content/schemas/event.schema.json`, `docs/EVENTS.md` | `metric.ability-unassisted`, `metric.doc-rubric-events` | contract now; the log: ROADMAP Phase 1 item 1 |
| 13 | The work-role crosswalk and the environment-profile schema, so a job posting or a company stack joins the ontology | `content/ontology/work-roles.json`, `content/schemas/work-role.schema.json`, `content/schemas/environment-profile.schema.json` | `metric.profile-coverage` | available now (NICE ids transcribed from the 2017 edition; confirm) |
| 14 | The decision record and the record category as published shapes, and the scores with their weights, so an agent can read a choice among named options and a tier it can recompute (R132 to R134) | `content/schemas/decision-record.schema.json`, `record-category.schema.json`, `scoring.schema.json`, `content/ontology/scoring.json`, `record-categories.json`, `skill-domains.json` | `metric.decision-justified`, `metric.readiness-tier` | available now |
| 15 | The project record as a published registry: the facts every form records by kind and area, the nine conflict rules, and the validation answers as the fact behind the Understanding score (R139, R140) | `content/ontology/project-record.json`, `src/lib/docs/projectRecord.ts`, `src/lib/validation/activities.ts`, migration 0026 (`validation_answers`) | `metric.validation-recall`, `metric.conflicts-resolved` | available now |

## What crosses a boundary

Only competency-level conclusions cross platforms, and only under `share-cross-platform`
(`docs/INTEGRATION_CERTHATCH.md`). Raw output, form data and the evidence ledger never leave the
member's account except in the export the member downloads themselves.
