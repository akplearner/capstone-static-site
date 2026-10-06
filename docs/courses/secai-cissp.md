# SecAI+ and CISSP capstones (R101)

Two capstones built from the instructor's requirement specifications. Both
secure the same fictional company — Ridgeline Facility Services — as it moves
to a cloud platform with AI at its centre, the Ridgeline Service Hub.

## What they are

| | SecAI+ (`secai-plus`) | CISSP (`cissp`) |
|---|---|---|
| Vendor · credential | CompTIA · SecAI+ (CY0-001) | ISC2 · CISSP |
| Weeks | Setup + 4 releases | Setup + 6 releases |
| Theme | Secure one AI product, release by release | Build a whole security program, release by release |
| Documents | P1–P5 + release note each week | Eight domain sheets D1–D8 each week |
| Capstone | The v4 release package and assurance response | The System Security Plan and traceability |

Each release is complete on its own; later releases improve the same
documents. The spec is written for one learner — the platform is a team
course, so each is split into three roles.

## The three roles

Both specs are one person's work; the platform gives every graded week a task
per role, so the work is split so that each role owns coherent documents.

| Course | Role | Drafts | Reviews | Approves |
|---|---|---|---|---|
| SecAI+ | AI Red Team | P2 attack casebook | P3 control set, P4 watch plan, release package | — |
| SecAI+ | AI Defender | P3 control set, P4 watch plan | P1, P2, P5, lab rule, release note | — |
| SecAI+ | AI Governance Lead | P1 map, P5 pack, lab rule, release note, package | — | everything; issues the package |
| CISSP | Governance & Risk | D1, D2, D6, controls, questionnaire, release note, SSP | — | everything; issues the SSP |
| CISSP | Architecture & Network | D3, D4, D8 | D1, D2, D5, D6, D7, controls, questionnaire, release note, SSP | — |
| CISSP | Identity & Operations | D5, D7 | D3, D4, D8 | — |

The table is the RACI in `src/lib/docs/raci.ts`; the app draws it as the role
table on the Guide and the hand-off picture in the manual.

## How the spec maps to tasks

- The spec's "information needed" becomes the steps' inputs.
- "This release must contain" becomes numbered actions and form sections.
- "Done when" becomes the week `milestone` and each task's `definitionOfDone`.
- The tool table supplies `task.tools`; `task.docs` links each tool's docs.
- The planted weaknesses (SA-1…SA-8, S-1…S-10) are named in the step that
  closes them, and `secaiCissp.test.ts` checks each one is.

## The picture

R103: both pictures are `ArchPicture`s (`docs/courses/arch-pictures.md`): SecAI+ gained identity, the WAF, the runtime, backups and the quality audit; CISSP's app is drawn as web, API and agent with key management, device management and the VPN; both carry a records lane of their forms and a purpose per part. The weekly tables are in `build-sheets/secai-plus.md` and `build-sheets/cissp.md`. Their documents move through the lifecycle (RACI in `src/lib/docs/raci.ts`).

Neither course has a machine lab of its own, so each draws the SYSTEM it
secures through one generic renderer, `HubDiagram`, fed by its own content
module (`secaiContent.ts`, `cisspContent.ts`). The data carries the parts,
the zones and each week's process; the component holds only the box shape and
the colours. `topologyPicture: 'hub'` selects it.

## The lab is not built yet

Both specs say the starter kit (Service Hub Lite; the sample repository and
images) is "not yet built". Until it ships, the commands use a stand-in and
each such step says so:

- **SecAI+** — a small open-weight model in Ollama behind a LiteLLM gateway,
  with Chroma as the retrieval store. The real open-source tools (garak, LLM
  Guard, Presidio, Semgrep, Trivy, Gitleaks, ModelScan, Prowler) run as
  written.
- **CISSP** — containers on one Linux machine play the cloud account; the
  sample repository and the old-server image are the instructor's to supply.
  OpenSSL, nmap, Keycloak, restic, OpenVAS, Lynis and Trivy run as written.

## Laws to re-confirm per cohort

Both specs name laws and frameworks that change: the Texas Responsible AI
Governance Act, the Texas Data Privacy and Security Act, the EU AI Act, the
SP 800-171 revision a federal contract cites, and FedRAMP authorizations.
Confirm the current status of each before a cohort starts; the courses teach
the method, not a frozen legal snapshot.

## No gatekeeping

Both ship `noGatekeeping: true`: every week is open from the start. The gates
still mark each release (v1–v3 for SecAI+, v1–v5 for CISSP) so the Home tab
can say which release the team has signed, but no gate locks a week.

## The step contract (R102)

Every one of the 80 steps on both courses is written to one shape, and
`src/lib/data/secaiCissp.test.ts` ("R102 — the step contract") fails the build
when a step drifts from it:

| Element | Rule |
|---|---|
| `where` | the place the step happens, 2–5 words (the WHERE chip) |
| `instruction` | one line, ≤14 words, starts with a verb |
| `instructionList` | 2–4 actions, ≤20 prose words each, with a Ridgeline example value |
| `commands[]` | each with `explain`, `flags` (every non-obvious flag) and `sample` |
| `expectedOutput` + `outputHighlights` | the sample, with the lines that prove it labelled |
| `verify` | tokens of ≥4 characters that only appear when it worked (never `1`, `OK`) |
| `docs` | 1–2 official pages with a `lookFor` of 5–18 words: what to find and how to use it |
| `fixes` | the two most likely failures, symptom → fix |
| `whatItMeans` | ≤30 words, names the weakness or control |

Form-only steps carry the same shape with a result sentence as
`expectedOutput` instead of a command. No task has more than three steps;
every graded task names its `prerequisites` and a `handoff` or `consumes`.

Step docs now render on every course (`StepHow` no longer gates the
"Read the docs" line on `shellOptional`), and a command that sits under a
list of actions is captioned "Then run" unless the course tucks the shell
away ("Or in the shell" on the entry cloud courses).

### The spec's tables, seeded into the forms

- SecAI+: P3 holds the 18 configuration items of spec §3.5; P4 the five
  alert thresholds; P5 the 11 rules of §2.3, procedures PR1–PR14 and
  weaknesses SA-1–SA-8.
- CISSP: the questionnaire holds all 16 questions with their domain; the
  control statements all 16 ids with domain and release; D6 the six CSF
  profile rows and the 15 basic-safeguarding requirements of FAR 52.204-21;
  D1 procedures PR1–PR33, weaknesses S-1–S-10 and a risk row per weakness;
  D7 the four recovery-target processes; D3 five shared-responsibility rows.
