# Scoring (R132)

What a score is on this platform, how each one is computed, and what a reader may and may not
read into it. Every number here is derived from facts the platform already records; the method is
this page, and `src/lib/docs/scoring.ts` is the same table as data. Nothing on the platform ranks
one member against another.

## The rule

A score is a **weighted mean of KPI percentages**. Each KPI (`src/lib/docs/kpis.ts`) is a ratio of
counts with its numerator and denominator in words, or, for one row, a median of minutes between
two recorded stamps. A score names its components and their weights; the weights sum to one; the
result is 0 to 100.

A component counts only when its fact was loaded and its denominator is not zero. A score stands
on the components that counted, with the weights renormalised, and says how many of them it stands
on (`counted` of `of`). A score with no component that counted is 0 and `loaded: false`: it is not
measured, and the surfaces print a dash. The computation is `src/lib/scores.ts`; the board carries
every component with its weight, its percentage and whether it counted, so a reader can redo the
sum (`content/schemas/kpi-board.schema.json`, `score`).

## Not measured, and the graded weeks (R137)

A KPI is a count over what the course offers the role: checkable steps, fault tables, decision blocks, hand-offs.
Where the course offers the role nothing, the row is **not measured** (`applies: false`, `notMeasured: 'role'` in
`capstone-kpi-board/3`), the surfaces say "Not measured in this course for this role", and no score reads it.
Where the course offers something and the member has not yet done it, the row reads "Nothing to count yet"
(`notMeasured: 'yet'`). Neither is ever printed as `0 of 0`, and neither lowers a score. A decision belongs to
the role that drafts the decision form; every other role reads not measured on the three decision KPIs.

Every denominator is counted over the **graded weeks** only (`isGradedWeek`): not the setup week, not an
advanced week, which is "never required". The record cards already counted that way; since R137 the board does
too, so a course with four optional advanced weeks is no longer compared on a denominator twice the size.

`src/lib/kpiBoard.allCourses.test.ts` runs every course and every role through the pipeline with a member who
did everything the course offers, and asserts that every KPI is either measured or named in
`src/lib/kpiBoard.allCourses.allow.json`, the content debt R138 pays off (`scripts/kpi-debt.ts` prints it).

## The scores

| Score | Components (weight) | Caveat |
|---|---|---|
| `score.tool-proficiency` Tool proficiency | commands verified (0.4), skills verified (0.3), skills proved twice (0.3) | Browser checks and receipts of stamps, not proof of the machine; the per-tool table names each command. |
| `score.troubleshooting-success` Troubleshooting success | faults resolved (0.4), verified after retry (0.2), stuck flags cleared (0.2), time to resolution within the hour (0.2) | Faults are team rows; the minutes are a median between two recorded stamps, so a step left open overnight is counted apart. |
| `score.judgment` Judgment | decisions recorded (0.25), decisions justified (0.25), decisions approved (0.25), changes with rollback (0.25) | Counts what was written against named options; it does not judge whether the choice was right. |
| `score.collaboration` Collaboration | hand-offs completed (0.35), RACI respected (0.35), peer reviews given (0.3) | Team facts count for the team; the role share on the KPIs says what this member moved. |
| `score.reliability` Reliability | on time (0.4), document control complete (0.2), controls cited (0.2), instructor approved (0.2) | On time needs the cohort start date; without one the score stands on the other three and says so. |
| `score.readiness` Readiness | exam weight verified (0.3), profile coverage (0.3), skills retained (0.2), steps verified in order (0.2) | A reading of the record against an exam and a work role, not a prediction of a pass or a hire. |
| `score.understanding` Understanding retained | values recalled (0.4), scenarios applied (0.4), conflicts resolved (0.2) | Asks only about values the team recorded; before the checkpoint week the score stands on nothing and says so. |

Each KPI a score reads carries `scored: true` in the registry and in the ontology, and every scored
KPI is read by exactly one score (`src/lib/docs/recordCategories.test.ts` holds both).

## The validation family and the seventh score (R140)

From the middle graded week the course asks each member about what THEIR TEAM recorded (the project
record, R139): a recall (the recorded value among three distractors drawn from the record, the column's
options or a perturbation), an explanation (why this decision, forty words or more, marked by the
instructor), an applied scenario (an address inside the recorded prefix, a port still free on the
recorded host, the committed RAM doubled) and a consistency task (a conflict the record found, resolved
in the form). The checkpoints are the course's own: `recall` in the middle graded week, `apply` in the
last, `extend` in every advanced week (`src/lib/validation/plan.ts`; a course may set its own in
`course.validation`). The activities are generated from the record (`src/lib/validation/activities.ts`),
deterministically, so the projection generates the same ones the panel showed and reads each answer
against its activity; only the hash of an answer is stored (migration 0026, append-only, a retry is a
second row).

- **Values recalled** (`kpi.validation.recall-accuracy`): recall activities answered correctly over
  recall activities answered.
- **Scenarios applied** (`kpi.validation.applied-scenarios`): applied scenarios answered correctly over
  applied scenarios offered at the checkpoints reached.
- **Conflicts resolved** (`kpi.validation.conflicts-resolved`): conflicts no longer in the record, over
  those plus the conflicts still open, once the apply checkpoint is reached.
- **Minutes on task** (`kpi.validation.time-on-task`): a count of whole minutes the member had tasks
  open on a visible tab, pauses excluded. Measured, never rewarded: no score reads it.

The rows are never "not measured for the role": every course has a record registry. Before the
checkpoint week, or before the team records anything, they read "Nothing to count yet", and the
Understanding score stands on nothing and says so.

## Timing

A duration on this platform is the difference of two stamps the platform recorded; no projection
reads a clock. The stamps are the first paste on a step (`firstAttemptAt`) and its verification
(`verifiedAt`), the verification of a task and the due date of its week from the cohort start date,
and the page's own clock (`asOf`), which the pages pass in for the currency window and the
learning velocity.

- **Time to resolution** (`kpi.problem-solving.time-to-resolution`): per verified step with both
  stamps, minutes from the first paste to the verification. The board prints the median over the
  steps resolved within a day, how many were resolved within the hour (the percentage), and how
  many were left over a day, counted apart so one long gap moves nothing.
- **On time** (`kpi.professionalism.on-time`): tasks whose last verification fell on or before the
  week's due date, over tasks with a verification. Without a cohort start date the row is not
  loaded and the surfaces say so.
- **Learning velocity** (`kpi.growth.learning-velocity`): verified steps in the twenty-eight days
  before the page clock, over verified steps in the twenty-eight days before those; the
  percentage caps at one hundred. R137: with no prior window there is nothing to compare yet, and
  the row reads so rather than one hundred.
- **Retention** (`kpi.growth.retention`): skills verified again seven or more days after their
  first verification, over skills verified.

## The tier

"Your record" has fourteen categories (`src/lib/docs/recordCategories.ts`). An item reaches the
**professional** tier at **ten verified uses across every course and retake**; below that it reads
**building**, with the count shown as `n/10`. Nothing is hidden for being small: a category with
one use shows one use.

## Industry relevance

Each category names the competency areas (`AREA_LABEL` in `src/lib/docs/skills.ts`) it serves.
Its relevance is the share of the NICE work roles (`src/lib/docs/workRoles.ts`) whose areas
intersect that set, 0 to 100. It is a crosswalk this platform publishes, read from the registries
alone, not a market figure.

## What changed

Before R132 nothing was scored and no duration was reported. The reversal was asked for and the
condition was that the method be published: this page, the registry, the schema and the tests
that pin them (`src/lib/docs/kpis.test.ts`, `src/lib/scores.test.ts`,
`src/lib/docs/recordCategories.test.ts`). The sixteen R108 KPI ids stay published as deprecated
with the row that replaced each (`DEPRECATED_KPIS`), because the ontology never removes an id.

R140 adds the eighth family, `validation`, and the seventh score, `score.understanding`; the board is
`capstone-kpi-board/3` and the member profile `capstone-member-profile/3` (thirty-two KPIs, seven
scores). The six R132 scores and the twenty-eight R132 KPIs are unchanged.
