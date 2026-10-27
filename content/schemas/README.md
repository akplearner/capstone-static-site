# Published schemas

JSON Schema (draft 2020-12) for every shape the platform publishes or exports, written inside the
subset `src/lib/schema/validate.ts` checks (type, required, properties, additionalProperties, items,
enum, const, pattern, minimum, maximum, minLength, minItems, maxItems, anyOf, local `$ref`), so a
consumer with any validator and the platform with its own get the same answer.

| Schema | Shape | Produced by |
|---|---|---|
| `member-profile.schema.json` | the portfolio export (`capstone-member-profile/1`): summary, per-course metrics and skill profile, artifacts; `signature` is `null`. A candidate link's copy (R124) is the same shape, kept small: a row may omit a zero counter, a course may omit gaps and indicators | the dashboard chip's Copy JSON; the copy a link serves (the file a member saves is a PDF, R127) |
| `skill-profile.schema.json` | one member against one course: rows per dimension, ability indicators, gaps | `src/lib/skillProfile.ts` |
| `competency-node.schema.json` | one node of `content/ontology/competencies.json` | `src/lib/docs/skills.ts` |
| `tool.schema.json` | one tool of `content/ontology/tools.json` | `src/lib/docs/tools.ts` |
| `standard.schema.json` | one standard of `content/ontology/standards.json` (no colour) | `src/lib/docs/standards.ts` |
| `sop.schema.json` | one SOP kind of `content/ontology/sops.json` | `src/lib/docs/sops.ts` |
| `xapi-statement.schema.json` | the statement shape of `docs/INTEGRATION_CERTHATCH.md` §5; a shape only, nothing is emitted | — |
| `course-index-entry.schema.json` | one row of `content/courses/index.json` | `scripts/export-courses.ts` |
| `kpi-board.schema.json` | the twenty-eight KPIs of one member on one course (`capstone-kpi-board/2`): value, denominator, percentage, unit, scored, fact kind, loaded; the six scores with every component; the timing block (R108, R132) | `src/lib/kpiBoard.ts`; the Skill board's Agent view and the portfolio export |
| `scoring.schema.json` | one published score: the KPIs it reads and their weights, with the caveat (R132) | `src/lib/docs/scoring.ts`; `content/ontology/scoring.json` |
| `record-category.schema.json` | one of the fourteen subcards of a member's record across courses, with the tier at ten verified uses (R132) | `src/lib/recordCard.ts` (R133) |
| `decision-record.schema.json` | one decision as a form stores it: at least three options, the one chosen, who, when, the answers (R132) | `DecisionBlock` in `src/lib/docs/types.ts`; `DeliverableForm` |
| `work-role.schema.json` | one NICE work role of `content/ontology/work-roles.json` (R108) | `src/lib/docs/workRoles.ts` |
| `environment-profile.schema.json` | what a company publishes to be measured against (`capstone-environment-profile/1`): infrastructure, tools, methodology, policies, ticket taxonomy, required competencies per work role (R108); the sample is `content/profiles/sample-mssp.json` | `src/lib/docs/environmentProfile.ts` → `scripts/export-profiles.ts`; a company, by file |
| `credential.schema.json` | the Open Badges 3.0 `AchievementCredential` envelope a candidate link serves around the member profile; it admits no `proof`, so it is unsigned by construction (R108) | Create link → credential |
| `event.schema.json` | the xAPI-shaped platform event of `docs/EVENTS.md`: actor type, verb, object, result, competencies, assist level, consent scope; a contract only, nothing is emitted (R108) | — |
| `issue.schema.json` | one student report joined to its course (`capstone-issue/1`, R120): who filed it, when, course, week, task, step, role, the version of the course they saw, status and resolution; names a person, never an account | `src/lib/issueInbox.ts`; the issues inbox's CSV and JSON export |
| `content-fix.schema.json` | one entry of a course's content fix ledger (`capstone-content-fix/1`, R121): a correction to the words (the text was `before`, now `after`), a revert, or a fold; numbered per course by the database; a course's content version is `{docVersion}.{revision}` | `src/lib/contentFix.ts`; the `content_fixes` table |
| `content-fixes.schema.json` | what the Fixes tab downloads for one course (`capstone-content-fixes/1`, R121): the live fixes with the titles to search for and the file to edit, and the whole ledger | `src/lib/contentFix.ts` → the Fixes tab's Fix bundle |

`src/lib/schema/schemas.test.ts` validates a fixture of each shape against its schema and refuses a
schema outside the subset. The schemas are hand-written and versioned with the shapes they describe:
a change to a shape is a change here, in the same commit.
