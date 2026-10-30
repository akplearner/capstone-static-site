# Architecture pictures, the weekly breakdown and the document lifecycle (R103)

Every course draws the system it builds, says what arrives each week and
what each part is for, and moves its documents through one lifecycle. This
page is the contract; the build sheets in `build-sheets/` are the generated
weekly tables, one per course.

## One picture shape for the self-drawn courses

Security+, CySA+, MSSP, SecAI+, CISSP, A+ and Network+ draw an `ArchPicture`
(`src/lib/docs/archPicture.ts`) from their content module
(`securityContent.ts`, `cysaContent.ts`, `msspContent.ts`, `secaiContent.ts`,
`cisspContent.ts`, `aPlusContent.ts`, `networkPlusContent.ts`). One renderer, `ArchDiagram`, draws all seven from the course
document (`content.arch`).

| Element | Rule |
|---|---|
| `zones` | sites, trust boundaries, network segments; `lane: true` marks the records strip |
| `nodes[].kind` | a real component kind: endpoint, server, app, ai, data, firewall, router, switch, wireless, network, idp, identity, siem, monitor, pipeline, backup, scanner, ticket, evidence, control, people, outside; `record` is a form in the lane |
| `nodes[].purpose` | what it is for, at most twelve words — printed under the picture and in the build sheet |
| `nodes[].records` | the deliverable (by id) whose form records the part; a record pill names itself |
| `nodes[].addr` | only by reference into `labTopology` / `serverTopology` / `ccnaTopology`, never typed |
| `nodes[].arrives` | the course-local week the part appears; 0 = there from the start; the build model is derived, never typed twice |
| `edges[].kind` | traffic (solid), log, backup, trust, admin (dashed per kind) |
| overlays | `ARCH_BUILD = archBuildModel(ARCH, { processes, captions })` — a process of 1–6 arrows and a caption ≤25 words per week |

`archPicture.test.ts` holds the picture to this: purposes present and short,
records resolve to the course's forms, the lane holds every form as a pill
and nothing else, no two boxes overlap, addresses only by reference.

Server+ (`rack`) and CCNA (`campus`) keep their own renderers because their
pictures are generated from the rack and the device list; each exports a
`PARTS` catalogue (`serverDiagrams.ts`, `ccnaDiagrams.ts`) with the same
id · label · purpose · records · arrives rows. The six cloud courses carry a
`purpose` on every non-plumbing template resource (`azureTopology.ts`,
`awsTopology.ts`).

## The validation overlay (R141)

An instructor surface may pass `ArchDiagram` a `validation` overlay: per form id (a part's
`records`), the number of facts the team's project record holds for that form and the number
of conflicts that touch it. The picture draws a badge at the part's corner (the count, and
`!n` in the warning colour when a conflict touches the form). The overlay is props only and is
computed by the console from `projectRecord` and `recordConflicts`; a learner's surface never
passes it, so the picture a learner sees is unchanged. The contract on the picture itself does
not change: parts, zones, edges and the records lane are as above.

## The live build overlay (R151)

A learner surface passes `ArchDiagram` (through `WeekBuildDiagram` and `WeekVisualPanel`) a `built`
map: for each part, how much of it the team has built, from 0 to 1. A part names the work that builds
it on `ArchNode.builtBy` — a task id, or a `task::step` key in the `teamProgress` shape — and a record
pill lights from its filed form. `archBuiltMap` (`src/lib/archBuilt.ts`, pure) turns the team's live
completion into the map, and `useArchBuilt` (`src/components/course/useArchBuilt.ts`) feeds it from
`teamStepCompletions`, the per-task team percent, and the team's filed forms, live over the store — so
a part lights on the picture as **any** teammate finishes the work. A fully built part gets a ✓ and an
accent fill; a partial part gets a thin progress bar; and `WeekBuildDiagram` reads "`N of M parts built
this week`". The map is **separate from the instructor's `validation` overlay**: a learner surface
never passes `validation`, and with no `built` prop the picture is exactly the calendar-only one above.
`archPicture.test.ts` proves every `builtBy` id resolves to a real task or step of its course.

## The lab network picture (R152)

Security+ carries a second, different picture behind a **Build | Network** switch on the week panel
(the Tasks tab and the Guide lab section): the lab as a NETWORK. `src/lib/docs/labNetwork.ts` is the
course-agnostic shape — hosts with their open ports (`NetService`, each with the week window it is
present), the controls Blue puts on each host (`NetControl`, by kind: harden, detect, contain, recover),
and per week a list of numbered `NetAttack`s in exam vocabulary (reconnaissance, scanning, enumeration,
injection, brute force, remote code execution) with the Blue `response` that answers each. One data set
is projected two ways: `servicesAt`/`controlsAt` give the system **before** and **after** each week, so
the Before | After toggle is a pure projection, not a second copy. The attack `tool` is a category, never
a command. `src/lib/docs/securityNetwork.ts` holds the Security+ instance (addresses from `labTopology`),
read through `networkOf` and drawn by `LabNetworkDiagram` inside `LabNetworkPanel` (the Before|After
toggle and the Prev/Next attack step-through, whose sentence comes from `attackSentence`). Controls and
attack steps light up as the team completes the work, through the same `builtMapFrom` the architecture
picture uses; their ids are namespaced (`ctl:`, `atk:`) so one built map serves both pictures. A course
without a network reads the empty `NO_NETWORK`, so the switch never shows. Honest framing: no Red step
attacks Windows, so its Week-3 4625 case is drawn as Blue's own test logons (`selfTest`), a badge on the
host, never a Kali arrow.

## The weekly breakdown

`partsOf(doc)` (`src/lib/content/read.ts`) returns the catalogue of any
course; `weekAdds(doc, week)` (`src/lib/weekAdds.ts`) filters it to the week's
arrivals. The Tasks tab and the Guide print it under the picture ("This week
adds": part · purpose · Recorded in → the form); week 0 prints "You start
with". `weekAdds.test.ts` asserts every glowing part has a row and, for the
self-drawn courses, that the catalogue matches the build model exactly.

`npm run content:export` also writes `docs/courses/build-sheets/<course>.md`
from the same function (`scripts/export-build-sheets.ts`,
`src/lib/docs/buildSheet.ts`); `buildSheets.test.ts` and CI fail when a
picture changed without regenerating.

## The document lifecycle

Every deliverable carries a RACI (`src/lib/docs/raci.ts`; the cloud factory
sets its own): who drafts (the `owner`), who reviews (never the drafter) and
who approves (never the reviewer where the course has three roles). Once
approved, the document is handed to its approving role.

The rules (`src/lib/docs/lifecycle.ts`, pure):

| From | Action | Who | To |
|---|---|---|---|
| draft | submit (freezing the document in the Expectations panel, once the definition of done passes) | the drafting role | in review |
| in review | approve | the reviewing role, not the submitter while another reviewer exists | approved |
| in review | return, with a reason | the reviewing role | draft |
| approved | issue | the approving role | issued |
| approved / issued | reopen | the drafting role | draft |

Transitions are append-only rows: a localStorage blob offline, the
`deliverable_status` table in the cloud (migration 0012: team insert and
read, instructor read, an immutable trigger, realtime). The status strip on
each form shows the four states, who moved it last, the RACI line and the
viewer's one action; the "Waiting on" notice names the upstream forms not
yet approved (a notice, never a lock); the Home queue card lists the
documents waiting on the viewer's review or issue; exports carry a Document
control block.

The chain itself (`feeds`) is guarded per course: no edge points back in
time, no document is a dead end, every document reaches the capstone, and
every form is written by at least one step.

## The roles (R104/R105)

The Guide shows the roles as one table and the manual draws the hand-offs as
one picture, both derived from the RACI above and the `feeds` chain
(`src/lib/docs/roleFlow.ts`): what each role drafts, reviews and approves, who
it hands to and waits on, and how many documents cross each way. The picture
draws a line per direction and kind — review solid, approve dashed, feeds
dotted — with a legend, and the viewer's role in focus (click another to move
it). Each role's profile (summary, responsibilities, how it works, its arc)
and the motion of the pictures live in the document's `content.roles`
(`src/lib/docs/roles.ts`); the Overview standard and the role content
standard in `docs/ARCHITECTURE.md` §6 set the register and the word budgets.
Every build sheet ends with the course's role table.
