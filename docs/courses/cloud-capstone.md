# Cloud Capstones — Azure and AWS (R87 · R90 · R92 · R93 · R94 · R95 · R96 · R97 · R98 · R99 · R100)

One twelve-week plan per platform, delivered as **three four-week courses**,
one per certification level. The tasks, documents, diagram and template are
authored once against the global weeks 1–12; each course is a quarter of
them, renumbered 1–4.

| Quarter | Azure | AWS | Global weeks |
|---|---|---|---|
| Fundamentals | **Azure Fundamentals Capstone** (`azure-fundamentals`, AZ-900) | **AWS Cloud Practitioner Capstone** (`aws-cloud-practitioner`, CLF-C02) | 1–4 |
| Operate | **Azure Administrator Capstone** (`azure-administrator`, AZ-104) | **AWS Solutions Architect Capstone** (`aws-solutions-architect`, SAA-C03) | 5–8 |
| Codify & hand over | **Azure DevOps Capstone** (`azure-devops`, AZ-400) | **AWS DevOps Engineer Capstone** (`aws-devops`, DOP-C02) | 9–12 |

A course after the first opens with a **Week 0** that deploys the previous
course's end state from the template (`throughWeek=4` / `8`) for a team that
did not build it; a team that did skips it. The diagram shows the course's own
four weeks (Week 0 shows what is inherited); "Show what comes later" reveals
the rest of the plan.

## Course description

> Run a small company in the cloud. Over twelve weeks your team of four
> builds a real environment: a website with HTTPS, a serverless visitor
> counter on a managed database, and one small Linux server. Then you
> secure it, watch it, break it and fix it, back it up and restore it, write
> it as infrastructure as code (an ARM template on Azure, CloudFormation on
> AWS), deploy it from a pipeline with no stored keys, and hand it over to a
> new team. Each role does one independent task a week, under an hour, and
> records it in that week's industry-standard team document. A $5 budget
> alert is the first thing you build.

## Shape

| | |
|---|---|
| Weeks | 4 graded per course (12 across the three), plus Week 0 in the second and third. No week is ever locked. |
| Roles | Cloud Architect · Infrastructure Admin · App & DevOps · Security & Ops (the Architect doubles up in a team of three). |
| Per week | 4 objectives, one task per role, 30–55 minutes, at most 4 steps. |
| Difficulty | Beginner 1–4 · Intermediate 5–8 · Advanced 9–11 · Integrated 12. |
| Tasks | One visible line; "Show me how" holds the **portal clicks** (at most three on the entry courses), a **Read the docs** line, and **What you should see**; "Why, and if it breaks" holds the reasoning and fixes. On the entry courses the same step as Cloud Shell / CloudShell commands sits in a closed drawer, "Optional: the same step in Cloud Shell" (R97); on the later courses it shows under "Or in the shell". |
| Docs | Every task opens with one or two official documentation pages (Microsoft Learn, AWS docs, GitHub docs) and a **Look for:** sentence — what to read on that page and how. On the entry courses every step names its own page too (R97). |
| Cost | Students use an Azure free account and the AWS 12-month Free Tier. Every task carries a one-line free-tier note; $5 budget in Week 1; every step that starts the VM ends with it deallocated/stopped. |
| IaC | Native first (ARM / CloudFormation), graded Weeks 9–12. Terraform is one optional comparison step. |

## Weekly plan

| Wk | Focus | Architect | Infrastructure | App & DevOps | Security & Ops |
|---|---|---|---|---|---|
| 1 | Cloud concepts and governance | Naming/tags, $5 budget, **service model and shared responsibility** | RG + VNet / VPC + subnet | Repo and board | **Add the team to the account**: invite / create users, builders group (Contributor on the RG / AdministratorAccess), sign-in handover, **MFA for everyone** |
| 2 | Core services | SAD v1, calculator vs free tier, **redundancy and storage classes** | B1s VM / t3.micro EC2 (+ its security group), zone | Static website / S3 + CloudFront + OAC | NSG on the subnet, SSH from your /32, allowed + blocked test |
| 3 | Serverless, data and identity | Request flow, who manages each hop | Cosmos DB / DynamoDB + seed | Function / Lambda + HTTP API | **Entra / IAM group, Reader / ReadOnlyAccess, MFA**, no keys |
| 4 | Monitor, govern, pay | Cost to date, **Advisor + Service Health / Trusted Advisor + support plans** | Error alert + action group / SNS | Find a failure in App Insights / CloudWatch Logs | **Resource lock / CloudTrail**, incident record |
| 5 | Identity | Access matrix | **Key Vault + Secrets User / Parameter Store** | Managed identity / table-scoped role | Prove a denial |
| 6 | Networking | Network design doc | snet-mgmt / private subnet | **CORS lock + negative test**, trace request paths | Remove SSH; Run Command / Session Manager |
| 7 | Server admin | Right-size | Data disk / EBS volume at /data | Update Manager / Patch Manager | Baseline + runbook with the **five-layer step**; AWS: **require IMDSv2** |
| 8 | Backup + recovery | RPO/RTO per asset | Snapshot → restore | Soft delete / S3 versioning restore | Timed drill |
| 9 | Infrastructure as code | Template ↔ diagram map, **ADR-001** | CLI inventory | Fill the starter, what-if / change set, deploy dev | Parameter files, validate (Terraform optional) |
| 10 | CI/CD | RFC in a pull request | Branch protection + prod environment | GitHub Actions deploy | OIDC (no stored keys) + rollback test |
| 11 | Governance | Cost by service | Policy / Config required-tags | Activity Log / CloudTrail | Defender free CSPM / Trusted Advisor + Access Analyzer |
| 12 | Handover | Handover package (capstone) | Rebuild from the template | App failure fixed through CI | Security incident contained |

## Service translation

| Concept | Azure | AWS |
|---|---|---|
| Container | Subscription › resource group | Account › stack |
| Network | VNet, subnets, NSG | VPC, subnets, route tables, IGW, security group |
| Server | B1s Ubuntu VM | t3.micro Amazon Linux 2023, IMDSv2 |
| Website | Storage static website (HTTPS built in) | Private S3 + CloudFront + Origin Access Control |
| API | Function App (Consumption) | Lambda + API Gateway HTTP API |
| Database | Cosmos DB serverless | DynamoDB on-demand (atomic `ADD`) |
| No-secret access | Managed identity + Cosmos data role | Execution role scoped to one table ARN |
| Monitoring | Log Analytics, App Insights, metric alert, action group | CloudWatch Logs, alarm, SNS |
| Admin without ports | Run Command | Session Manager |
| Backup | Incremental disk snapshot, blob soft delete + versioning | EBS snapshot, S3 versioning |
| IaC | ARM template, `what-if` | CloudFormation, change set |
| Pipeline sign-in | Federated credential (azure/login) | IAM OIDC provider + role |
| Governance | Azure Policy (deny), Activity Log, Defender free CSPM | AWS Config (detect), CloudTrail, Trusted Advisor + Access Analyzer |

## Documents — one per week, the same twelve across the three courses, on both platforms

Every document opens with **Document control** (ID, version, owner,
approver, date, status) and closes with **Evidence** (a screenshot named
`YYYYMMDD_TeamXX_Tool_Action.png` and a line per component). Every section
names the role that fills it. Each form draws Architecture vN for its week.

| # | Document | Standard it follows |
|---|---|---|
| 1 | Cloud Foundation & Naming Standard | Cloud Adoption Framework / AWS tagging best practices |
| 2 | Solution Architecture Document + ADR-001 | ISO/IEC/IEEE 42010, ADR |
| 3 | Application & API Design Specification | OpenAPI-style interface spec |
| 4 | Monitoring & Incident Report | ITIL 4 incident management |
| 5 | Access Control Matrix & Secrets Register | NIST SP 800-53 AC-6 |
| 6 | Network Design Document | RFC 1918, segmentation |
| 7 | Server Configuration & Maintenance Runbook | CIS benchmark (reference) |
| 8 | Backup & Disaster Recovery Plan | NIST SP 800-34 |
| 9 | IaC Design & Deployment Record | Well-Architected, operational excellence |
| 10 | Change Request & Release Record | ITIL 4 change enablement |
| 11 | Governance, Security & Cost Report | Well-Architected, cost + security |
| 12 | Operational Handover Package (capstone) | ITIL 4 service transition |

## Architecture and IaC

R103: every template resource that is not plumbing carries a `purpose`; the Tasks tab, the Guide's architecture slider and `docs/courses/build-sheets/<course>.md` print what each week adds from it. The four documents of each quarter carry a RACI (the Architect drafts, Security & Ops reviews, the role whose work it records approves) and move through the lifecycle described in `docs/courses/arch-pictures.md`.

* `src/lib/cloud/azureIac.ts` / `awsIac.ts`: one source template per platform
  with `⟦FILL:hint|value⟧` markers. A `throughWeek` parameter (4, 8 or 12)
  makes every Week-5+ resource conditional, so one template deploys any
  course's starting point. The full template and the Week 9 starter
  are both derived from it, and every resource is tagged with the week it
  arrives.
* `azureTopology.ts` / `awsTopology.ts`: the diagram, drawn in each
  platform's style. Node ids are template resource ids. The dependency
  arrows are derived from the template, so they are never typed by hand.
* The Guide's **Architecture & IaC** section shows the diagram and the
  template side by side: a week slider (Architecture v1…v12), a click to
  jump to a resource's lines, copy, download, parameters, outputs and
  commands.
* `src/lib/cloud/cloud.test.ts` holds the parity and soundness tests:
  * template ↔ diagram match;
  * weeks, the reference graph, starter/full and parameters are consistent;
  * no SSH from the internet;
  * TLS 1.2 is enforced and the bucket is private;
  * IMDSv2 is required;
  * the Lambda role is scoped to one table.
* `src/lib/data/cloudCourses.test.ts` holds this document's rules as
  numbers:
  * exactly one task per role per week;
  * every task is an hour or less, with 4 steps at most;
  * each visible line is 12 words or fewer;
  * every VM that is started is stopped again, and its free-tier line says so;
  * every graded task names official documentation with a "look for" sentence
    and carries a free-tier line;
  * every step with commands also has portal clicks, unless listed shell-only
    with a reason;
  * every document has Document control and Evidence;
  * the two courses have the same shape.

## Free tier (R92)

The rule: free wherever the free tier allows; a paid service only where the
exam needs it, and then the task says what it costs.

| Service | Azure | AWS | Decision |
|---|---|---|---|
| VM | B1s, 750 h/month free for 12 months | t3.micro, 750 h/month free for 12 months | Keep; every VM task says to stop it. |
| VM OS disk | Standard SSD (`StandardSSD_LRS`), inside the free 64 GB | 8 GB gp3, inside the free 30 GB | ARM template changed from Premium SSD (≈ $5/month) to Standard SSD. |
| Public IPv4 | ≈ $3.60/month, bills while stopped | Free 750 h in year one | Kept (instructor decision); stated in the task; the Week 6 document records the NAT / private-subnet alternative (≈ $32/month). |
| Website | Storage 5 GB free 12 months | S3 5 GB + CloudFront 1 TB always free | Free. |
| API + data | Functions 1 M executions; Cosmos DB serverless ≈ 1 cent | Lambda 1 M always free; API Gateway 1 M for 12 months; DynamoDB 25 GB always free | Free or cents. |
| Monitoring | Log Analytics 5 GB, 10 metric alerts, action-group email | 10 alarms, 5 GB logs, 1,000 SNS emails | Free. |
| Cost data | Cost analysis free | Cost Explorer console free; **API $0.01 per call** | AWS Weeks 4 and 11: console first; the CLI is the labelled option. |
| Backup | Incremental snapshots: cents | 1 GB of snapshots free | Cents; drills delete what they made. |
| Governance | Policy, Activity Log, Defender free CSPM: free | Config ≈ cents per evaluation (needed for DOP-C02); CloudTrail history, Trusted Advisor basic, Access Analyzer external: free | Config kept, cost stated, three resource types only. |
| Shell | Cloud Shell needs a 5 GB file share: cents | CloudShell free | Stated once in Week 1. |

Three steps in the whole plan are shell-only, because the portal cannot do
them: the two forged-Origin CORS tests (`curl`) and the Cosmos DB data-plane
role assignment. `cloudCourses.test.ts` lists them with the reason; any other
step with commands must also carry its portal clicks.

## The entry courses, written for a first-time reader (R93)

Weeks 1–4 (AZ-900 and CLF-C02) were reviewed step by step and rewritten so
that a student who has never opened a cloud console can follow them:

* **Every step says why** — what the thing is, why it is done this way, and
  what goes wrong otherwise — in "Why, and if it breaks" (≤ 40 words, guarded).
  Every name is read out where it first appears: `nsg-snet-app-team01` is
  *the NSG that guards subnet snet-app, owned by team01*.
* **Every flag in Weeks 1–2 is explained** under the command (`flags`), and
  the shell alternative is never the only path.
* **Variations sit side by side** where the student's situation decides:
  SSH from Windows vs macOS/Linux, an Azure free account vs Azure for
  Students, an own AWS account vs an AWS Academy Learner Lab.
* **"Needs from a teammate"** states the real cross-role timing (Security's
  SSH test needs Infra's VM and key; Dev's function needs Infra's database;
  Security's CORS lock needs Dev's API; Infra's alert needs Dev's function).
* **What was missing or wrong, now fixed:** the function code is given in
  full (Node.js v4 model on Azure, the template's Python on AWS); Week 3
  Security on Azure builds the whole Key Vault path (vault → secret →
  Function identity → Secrets User → `@Microsoft.KeyVault(...)` reference,
  with the template's role assignment moved to Week 3 to match); the SSH
  test names the key, its owner and `-i`; the laptop-vs-Cloud Shell `$MYIP`
  gap; CloudFront's WAF checkbox (≈ $14/month) is switched off; Cost
  Explorer is enabled in Week 1 because it needs a day; the counter item is
  `site` in tasks, templates and forms; AWS gateways and route tables are
  tagged so the Week 9 inventory finds them.
* A glossary tooltip (`src/lib/glossary.ts`) now covers the cloud
  vocabulary — resource group, VNet/VPC, NSG/security group, CIDR, RBAC/IAM,
  managed identity, CORS, serverless, partition key and the rest.

## Exam alignment of the entry courses (R95)

Weeks 1–4 teach what AZ-900 and CLF-C02 test, and nothing from the next
exam. Every task's first "What you'll learn" line is its exam domain, and a
guard (`cloudCourses.test.ts` R95) fails if a Week 1–4 step mentions a topic
that belongs to the next course (Key Vault references, managed identity,
CORS, IMDSv2, ADRs, layered troubleshooting, Parameter Store) — and fails
again if that topic is missing from the next course.

| Exam domain | Where it is done |
|---|---|
| AZ-900 1 · Cloud concepts / CLF 1 · Cloud Concepts | W1 Architect classifies every service IaaS/PaaS/serverless and writes the shared-responsibility line; W3 Architect says who manages each hop |
| AZ-900 2 · Architecture and services / CLF 3 · Technology and Services | W1 RG + VNet / VPC (regions, zones); W2 VM / EC2, storage website / S3 + CloudFront, redundancy and storage classes; W3 Cosmos DB / DynamoDB, Functions / Lambda + API Gateway; W4 Monitor / CloudWatch, action group / SNS |
| AZ-900 2 · Identity, access, security / CLF 2 · Security and Compliance | W1 the team is added to the account (Entra guests / IAM users, a builders group, Contributor / AdministratorAccess, MFA for everyone); W2 NSG / security group, SSH from one /32; W3 Entra group + Reader / IAM group + ReadOnlyAccess, MFA per member, no key in the page; W4 resource lock / CloudTrail |
| AZ-900 3 · Management and governance / CLF 4 · Billing, Pricing and Support | W1 budget, tags, Cloud Shell / CloudShell; W2 pricing calculator vs the free account / Free Tier; W4 cost analysis / Cost Explorer, Advisor + Service Health / Trusted Advisor + support plans, lock |

## Easier to follow, and the shell out of the way (R97)

Students on the entry courses read "clicks AND a command" as two jobs, and
some copied the command instead of learning the console. R97 makes the
console the task and the shell an option:

* `Course.shellOptional` is set on the two entry courses. On a step with
  clicks, `StepHow` keeps the clicks, a **Read the docs** line and **What you
  should see** in the open, and moves the command block and the
  paste-to-verify box into a closed drawer, "Optional: the same step in Cloud
  Shell / CloudShell", with the lead "Only if you are curious — the clicks
  above are the task". The "Show me how" bar counts clicks and docs, not
  commands. The four later courses render exactly as before.
* A step whose "command" is code the clicks paste into the console editor (the
  Function body, the Lambda handler, the inline policy, the page snippet) is
  marked `codeToPaste` and stays in the open under "The code to paste".
* Every Week 1–4 step carries `docs` (the page for that step, with a look-for
  sentence) and `expectedOutput` (what the screen shows when the clicks are
  done). The clicks are at most three per step and sixteen words each; the
  reason under a step is at most thirty words; the free-tier line at most
  twenty-five; a look-for sentence at most eighteen.
* Guards (`cloudCourses.test.ts` R97) hold all of that on the entry courses
  and prove `shellOptional` is set there and nowhere else; `StepHow.test.tsx`
  proves the drawer is closed, opens to the command and the verify box, and
  is absent on a course without the flag.

## Every task open to every member, done for the team (R98)

A role-split week used to show a member only their own role's task; the other
three objectives were grey and disabled, and their tasks were a read-only
"reference" inside the closed drawer. If one member did not do their task,
the team was stuck. The instructor's rule, for every course on the platform:
**a role says who a task is for, never who may do it**.

* The Tasks tab lists every task of the week — the shared build first, then
  yours, then your teammates' in role order (`weekTasksOrdered`). Every
  objective card is clickable and says whose it is ("Yours · Security & Ops ·
  1 task · ~50 min" / "Infrastructure Admin · 1 task · ~35 min"); every row
  carries a role chip or a **Yours** badge; every task opens in the runner
  with checkboxes, notes and the verify box, under a line "This task is for:
  Infrastructure Admin (Ada) — anyone on the team can do it; say who did in
  the document."
* **Done for the team** (`src/lib/teamProgress.ts`): the union of every
  teammate's ticks drives the task and week percentages on the tab, the rail,
  the gate lock and the Home banner. A step a teammate ticked reads "done by
  Ada" and only they can untick it; your own ticks are written under your id.
  The personal record — the stone's rarity, the gem tray, the pack and mine,
  the evidence stamp, the portfolio, the instructor's per-student grading —
  stays your own. A task Ada finished shows you a split stone with no gem:
  the work is done, the gem was hers.
* Deliverables: every form of the week is open to every member, your own
  role's first, the others chipped "Infrastructure Admin's".
* Guards: `cloudCourses.test.ts` R98 (every role reaches every task of every
  week), `teamProgress.test.ts`, `useCourseProgress.test.tsx`,
  `TasksTab.test.tsx`, and the page-shape rule that the list is never
  filtered by the viewer's role.

## What you build this week, on every course (R99)

Every week of every course now has a picture of the build as it stands at
the end of that week, this week's additions glowing, and — on a week that
adds nothing (the cloud DevOps weeks, the Server+ operations weeks, CySA's
hunting week) — the week's process drawn over the same picture. One contract
(`src/lib/weekVisual.ts`: `WeekVisual { week, builtThrough, highlight,
process, caption }`), one renderer (`WeekBuildDiagram`, a switch on the
course's `topologyPicture`), three places: the Tasks tab ("What you build
this week", pinned to the week on screen), the Guide's lab section (with week
pills) and every deliverable form (its own week).

* The cloud courses derive their build from the topology (every node carries
  its global week) and get a process per global week (`cloudWeekProcesses` in
  `src/lib/cloud/workflows.ts`: the incident loop, no-open-port admin,
  snapshot → restore, what-if/change set → deploy, OIDC → deploy, deny
  untagged, the handover). The DevOps slice, which adds nothing to the
  template, is carried by its processes.
* Security+, CySA+, Server+ and CCNA carry a build model in their content
  module (`LAB_BUILD`, `SOC_BUILD`, `SERVER_BUILD`, `CCNA_BUILD`): which part
  arrives in which week, plus the week's process and caption. Server+ now
  draws the advanced hosts (secmon, wazuh, tools) and the operations network;
  CCNA draws its operating practice (backups, NOC, automation) on NETOPS.
* MSSP gets its own picture at last: the engagement (`src/lib/docs/
  msspContent.ts`, `EngagementDiagram`), not the borrowed attack lab; its kit
  preset is a projection of the same data.
* Guards: `src/lib/docs/weekVisuals.test.ts` — every graded week of every
  course has a highlight or a process, every id it names is in the picture,
  the build never shrinks, processes are short; page-shape R99 — the Tasks
  tab draws the panel, the Guide draws one week-scoped picture, the overlay
  pieces carry no literal colour.

## The Tasks tab on one screen (R100)

The first task row sat a screen and a half down the page, and an open task
was taller than the window with wide empty gutters. Ten changes, one aim:
the student sees the task they are on without scrolling past the week.

* **Split view** from 1100px (`TasksLayout`, `useSplitView`): the list —
  rail, header, gem tray, picture, objectives, rows, "More" — is a sticky
  column that scrolls on its own; the open task is the pane beside it
  (`TaskPane`, `id="task-pane"`, its heading takes focus). A row is a
  selector there (`TaskRow mode="select"`), one task open at a time; below
  the breakpoint it is the accordion it always was. The page is wider on
  this tab (`html[data-tasks-wide]`, 88rem).
* **The week picture is a thumbnail** (`WeekVisualPanel`, Expand/Shrink)
  in the list, and full-size in the pane while no task is open. Two bugs
  went with it: the cloud frame printed "What you build this week" twice
  (`CloudTopology title={null}`), and a process arrow to a person not yet
  drawn that week ran off the picture — a person the process names is now
  drawn whatever their week, at full strength, and the crop includes them.
* **One line per row, one chip row per task** (`ui/Chip`: role, Yours,
  Next, Done by, stuck, issues, time, docs, free tier, needs, and the stamp
  — a chip that copies itself, with the explanation as its tooltip).
* **A step breathes**: `StepDetail` is a container, so `StepHow` goes
  two-column by the width of the pane (`@2xl:grid-cols-2`), not the window;
  "Show me how" is a tighter bar and "Why, and if it breaks" an inline link.
* **Resizing**: every SVG picture scales below `sm` (`min-w-0`,
  `preserveAspectRatio`), the rack and campus pictures scroll only from
  `sm`, the objectives flow is a 2×2 grid on a phone, the rail and the gem
  tray wrap tighter.
* **Chrome**: the hero is one line on the Tasks tab (`CourseHero compact`);
  the site header hides on a scroll down and returns on the first scroll up
  (`useHideOnScroll`, `navChrome.ts`, `--nav-top`), and the sub-nav follows
  it; task scrolls land the top of the task under the bars.
* **Keys**: ←/→ walk the steps of the open task, Esc closes the open one
  (`useStepKeys`: never while typing, never under a dialog, never when the
  objectives flow already took the key).
* **Focus mode** (`KEYS.focusMode`, per device, the Focus switch in the
  sub-nav on the Tasks tab): just the rows and the open task.
* Guards: page-shape R100 — `TasksLayout`/`TaskPane` in the tab, container
  columns in a step, the thumbnail with Expand, the process-person fix, no
  SVG forcing a sideways scroll, one chip, the current ring, the hidden
  header, Focus mode; tests on `TasksLayout`, `TaskPane` via `TasksTab`,
  `TaskRow`, `Chip`, `Collapsible`, `CloudTopology`, `WeekVisualPanel`,
  `useHideOnScroll`, and the runner's keys and stamp chip.

## Honest limits, stated in the course

* The VM keeps a public IP for outbound patching only. Production would put
  the VM in a private subnet behind a NAT gateway, which costs about $32 a
  month.
* ARM cannot switch on the static website, so one CLI step does it.
* The Azure counter uses bindings, and its read-then-write is a known race.
  AWS uses an atomic `ADD`.
* AWS Config reports untagged resources but does not block them. Blocking
  needs an SCP in AWS Organizations. Config stays a console step (one
  recorder per region); CloudTrail, which has no such limit, is in the
  template from Week 11.
* R103: the missing components are template resources now. Azure: Bastion
  Developer (Week 6, free, no AzureBastionSubnet, not offered in every
  region), the GitHub deploy identity with its federated credential and a
  resource-group Contributor assignment (Week 10). AWS: an AWS Backup vault,
  daily plan, role and selection for the data volume (Week 8), the GitHub
  OIDC provider and deploy role (Week 10), CloudTrail with its bucket and
  policy (Week 11, `Week9Plus`). Azure keeps disk snapshots in Week 8 on
  purpose: a Recovery Services vault costs about $5 a month per VM, so the
  course records the trade-off instead of deploying it. Every non-plumbing
  node carries a `purpose`, which the weekly breakdown ("This week adds")
  and the build sheets print.
* The icons are the official AWS Architecture Icons and Microsoft Azure
  icons, copied unchanged into `public/cloud-icons/` (see its README for the
  source file of each and the terms). The keys the packs have no file for
  are drawn (`CloudIcon.tsx`): on Azure GitHub, an action group, Bastion and
  the managed identity; on AWS the Backup vault, the OIDC provider and
  CloudTrail. `cloud.test.ts` pins that list.
* The picture shows one week at a time. A Week-1 student sees the foundation
  only; "Show what comes later" reveals the rest greyed with its week.
* R94: the picture fits what it shows. Containers shrink-wrap their visible
  members and the viewBox crops to the drawn part (`src/lib/cloud/layout.ts`),
  so Week 1 is a small, zoomed picture — not empty boxes. Template plumbing
  (an API stage, a route association, runtime storage: `detail` nodes) and
  the full reference graph sit behind "Show template details"; people and
  GitHub appear only once a line reaches them. Governance / account-level
  boxes sit at the top so an early week is one compact column. Guards
  (`cloud.test.ts` R94): every drawn node inside its computed box, boxes
  nest, no two icons overlap, and Week 1 is well under Week 12's area.
