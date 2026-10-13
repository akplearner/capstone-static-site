# Published schemas

JSON Schema (draft 2020-12) for every shape the platform publishes or exports, written inside the
subset `src/lib/schema/validate.ts` checks (type, required, properties, additionalProperties, items,
enum, const, pattern, minimum, maximum, minLength, minItems, maxItems, anyOf, local `$ref`), so a
consumer with any validator and the platform with its own get the same answer.

| Schema | Shape | Produced by |
|---|---|---|
| `member-profile.schema.json` | the portfolio export (`capstone-member-profile/1`): summary, per-course metrics and skill profile, artifacts; `signature` is `null` | `/portfolio` → Export JSON |
| `skill-profile.schema.json` | one member against one course: rows per dimension, ability indicators, gaps | `src/lib/skillProfile.ts` |
| `competency-node.schema.json` | one node of `content/ontology/competencies.json` | `src/lib/docs/skills.ts` |
| `tool.schema.json` | one tool of `content/ontology/tools.json` | `src/lib/docs/tools.ts` |
| `standard.schema.json` | one standard of `content/ontology/standards.json` (no colour) | `src/lib/docs/standards.ts` |
| `sop.schema.json` | one SOP kind of `content/ontology/sops.json` | `src/lib/docs/sops.ts` |
| `xapi-statement.schema.json` | the statement shape of `docs/INTEGRATION_CERTHATCH.md` §5; a shape only, nothing is emitted | — |
| `course-index-entry.schema.json` | one row of `content/courses/index.json` | `scripts/export-courses.ts` |
| `kpi-board.schema.json` | the sixteen KPIs of one member on one course (`capstone-kpi-board/1`): value, denominator, fact kind, loaded (R108) | `src/lib/kpiBoard.ts`; the Skill board's Agent view and the portfolio export |
| `work-role.schema.json` | one NICE work role of `content/ontology/work-roles.json` (R108) | `src/lib/docs/workRoles.ts` |
| `environment-profile.schema.json` | what a company publishes to be measured against (`capstone-environment-profile/1`): infrastructure, tools, methodology, policies, ticket taxonomy, required competencies per work role (R108); the sample is `content/profiles/sample-mssp.json` | `src/lib/docs/environmentProfile.ts` → `scripts/export-profiles.ts`; a company, by file |
| `credential.schema.json` | the Open Badges 3.0 `AchievementCredential` envelope `/portfolio` exports around the member profile; it admits no `proof`, so it is unsigned by construction (R108) | `/portfolio` → Export credential |
| `event.schema.json` | the xAPI-shaped platform event of `docs/EVENTS.md`: actor type, verb, object, result, competencies, assist level, consent scope; a contract only, nothing is emitted (R108) | — |

`src/lib/schema/schemas.test.ts` validates a fixture of each shape against its schema and refuses a
schema outside the subset. The schemas are hand-written and versioned with the shapes they describe:
a change to a shape is a change here, in the same commit.
