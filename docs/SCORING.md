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

## The scores

| Score | Components (weight) | Caveat |
|---|---|---|
| `score.tool-proficiency` Tool proficiency | commands verified (0.4), skills verified (0.3), skills proved twice (0.3) | Browser checks and receipts of stamps, not proof of the machine; the per-tool table names each command. |
| `score.troubleshooting-success` Troubleshooting success | faults resolved (0.4), verified after retry (0.2), stuck flags cleared (0.2), time to resolution within the hour (0.2) | Faults are team rows; the minutes are a median between two recorded stamps, so a step left open overnight is counted apart. |
| `score.judgment` Judgment | decisions recorded (0.25), decisions justified (0.25), decisions approved (0.25), changes with rollback (0.25) | Counts what was written against named options; it does not judge whether the choice was right. |
| `score.collaboration` Collaboration | hand-offs completed (0.35), RACI respected (0.35), peer reviews given (0.3) | Team facts count for the team; the role share on the KPIs says what this member moved. |
| `score.reliability` Reliability | on time (0.4), document control complete (0.2), controls cited (0.2), instructor approved (0.2) | On time needs the cohort start date; without one the score stands on the other three and says so. |
| `score.readiness` Readiness | exam weight verified (0.3), profile coverage (0.3), skills retained (0.2), steps verified in order (0.2) | A reading of the record against an exam and a work role, not a prediction of a pass or a hire. |

Each KPI a score reads carries `scored: true` in the registry and in the ontology, and every scored
KPI is read by exactly one score (`src/lib/docs/recordCategories.test.ts` holds both).

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
  percentage caps at one hundred.
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
