# Azure Fundamentals Capstone — skills sheet

16 graded tasks · 18 skills · 12 tools · 6 procedures · 4 standards (2 controls cited) · 0 tactics · 18 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Write an incident report `comp.respond.incident-report` | Incident response | CS0-003.d3, AZ-900.d3, CLF-C02.d2, NIST.800-61 | Lock the resource group and write the incident record |
| Set a budget alert and a tag standard `comp.cloud.budget-and-tags` | Cloud services | AZ-900.d1, CLF-C02.d1, WAF.cost | Set the standard, the budget and the service model |
| State the shared-responsibility split `comp.cloud.shared-responsibility` | Cloud services | AZ-900.d1, CLF-C02.d1 | Set the standard, the budget and the service model |
| Create the network foundation: VNet or VPC `comp.cloud.network-foundation` | Cloud services | AZ-900.d2, CLF-C02.d3 | Create the resource group and VNet |
| Open a team repository and board `comp.cloud.team-repo-and-board` | Cloud services | AZ-900.d3, CLF-C02.d3 | Open the team repository and board |
| Grant team access through groups and roles `comp.cloud.identity-and-groups` | Cloud services | AZ-900.d2, CLF-C02.d2, NIST.800-53.AC-2 | Add the team to the account and give them access |
| Estimate monthly cost and choose storage classes `comp.cloud.cost-estimate` | Cloud services | AZ-900.d3, CLF-C02.d4, WAF.cost | Estimate the cost and choose redundancy |
| Launch a free-tier VM and stop it `comp.cloud.launch-vm` | Cloud services | AZ-900.d2, CLF-C02.d3, WAF.cost | Deploy the tools VM |
| Publish a static site over HTTPS `comp.cloud.static-site-https` | Cloud services | AZ-900.d2, CLF-C02.d3 | Publish the website with HTTPS |
| Allow SSH from one address only `comp.cloud.ssh-from-one-ip` | Cloud services | AZ-900.d2, CLF-C02.d2, NIST.800-53.SC-7 | Put an NSG on the subnet and allow SSH from your IP |
| Draw a request flow and who manages hops `comp.cloud.request-flow` | Cloud services | AZ-900.d1, CLF-C02.d1 | Draw the request flow and say who manages each hop |
| Create a managed NoSQL table and seed it `comp.cloud.managed-database` | Cloud services | AZ-900.d2, CLF-C02.d3 | Create Cosmos DB and seed the counter |
| Build a serverless function and API `comp.cloud.serverless-api` | Cloud services | AZ-900.d2, CLF-C02.d3 | Build the visitor-counter Function |
| Grant read-only access to a group with MFA `comp.cloud.read-only-access` | Cloud services | AZ-900.d2, CLF-C02.d2, NIST.800-53.AC-6 | Give the team the right access |
| Report spend and read the advisor `comp.cloud.cost-report` | Cloud services | AZ-900.d3, CLF-C02.d4, WAF.cost | Report the cost, and read Advisor and Service Health |
| Alert on function errors to the team `comp.cloud.error-alert` | Cloud services | AZ-900.d3, CLF-C02.d3, NIST.CSF.DE.CM | Alert on Function errors |
| Find a failure in logs and fix it `comp.cloud.read-logs` | Cloud services | AZ-900.d3, CLF-C02.d3 | Find a failure in Application Insights |
| Trace a change in the audit trail `comp.cloud.audit-trail` | Cloud services | AZ-900.d3, CLF-C02.d2, NIST.800-61.DETECT | Lock the resource group and write the incident record |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Add the team to the account and give them access; Deploy the tools VM; Publish the website with HTTPS; Put an NSG on the subnet and allow SSH from your IP; Build the visitor-counter Function; Give the team the right access; Report the cost, and read Advisor and Service Health; Find a failure in Application Insights; Lock the resource group and write the incident record |
| PowerShell | cli | Put an NSG on the subnet and allow SSH from your IP |
| curl | cli | Put an NSG on the subnet and allow SSH from your IP; Build the visitor-counter Function; Find a failure in Application Insights |
| Capstone forms | document | Set the standard, the budget and the service model; Create the resource group and VNet; Open the team repository and board; Add the team to the account and give them access; Estimate the cost and choose redundancy; Deploy the tools VM; Publish the website with HTTPS; Put an NSG on the subnet and allow SSH from your IP; Draw the request flow and say who manages each hop; Create Cosmos DB and seed the counter; Build the visitor-counter Function; Give the team the right access; Report the cost, and read Advisor and Service Health; Alert on Function errors; Find a failure in Application Insights; Lock the resource group and write the incident record |
| Capstone guide | document | Draw the request flow and say who manages each hop |
| Browser DevTools | app | Build the visitor-counter Function; Find a failure in Application Insights |
| Authenticator app | app | Add the team to the account and give them access |
| GitHub | service | Open the team repository and board |
| Azure portal | portal | Set the standard, the budget and the service model; Create the resource group and VNet; Add the team to the account and give them access; Deploy the tools VM; Publish the website with HTTPS; Put an NSG on the subnet and allow SSH from your IP; Create Cosmos DB and seed the counter; Build the visitor-counter Function; Give the team the right access; Report the cost, and read Advisor and Service Health; Alert on Function errors; Find a failure in Application Insights; Lock the resource group and write the incident record |
| Azure Cloud Shell | portal | Set the standard, the budget and the service model; Create the resource group and VNet; Add the team to the account and give them access; Deploy the tools VM; Publish the website with HTTPS; Put an NSG on the subnet and allow SSH from your IP; Create Cosmos DB and seed the counter; Build the visitor-counter Function; Give the team the right access; Report the cost, and read Advisor and Service Health; Alert on Function errors; Find a failure in Application Insights; Lock the resource group and write the incident record |
| Azure CLI | cli | Set the standard, the budget and the service model; Create the resource group and VNet; Add the team to the account and give them access; Deploy the tools VM; Publish the website with HTTPS; Put an NSG on the subnet and allow SSH from your IP; Create Cosmos DB and seed the counter; Give the team the right access; Report the cost, and read Advisor and Service Health; Alert on Function errors; Find a failure in Application Insights; Lock the resource group and write the incident record |
| Azure Pricing Calculator | portal | Estimate the cost and choose redundancy |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Incident record | incident | NIST.800-61.DETECT, ISO27001.A.5.26, NIST.CSF.RS.AN | Monitoring & Incident Report | Lock the resource group and write the incident record |
| Security policy | policy | ISO27001.5.2, ISO27001.A.5.1, NIST.CSF.GV.PO, NIST.800-53.PM-1 | Cloud Foundation & Naming Standard | — |
| Monitoring plan | monitoring | NIST.CSF.DE.CM, ISO27001.A.8.16, SOC2.CC7.2, ITIL.monitoring | Monitoring & Incident Report | — |
| Cost review | governance | WAF.cost | Cloud Foundation & Naming Standard | Deploy the tools VM |
| Architecture record | design | ISO42010, WAF, NIST.800-53.PL-8 | Solution Architecture Document | — |
| Requirements record | design | ISO42010, WAF | Application & API Design Specification | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| ITIL 4 | — | Monitoring & Incident Report |
| AZ-900 | Set the standard, the budget and the service model; Create the resource group and VNet; Open the team repository and board; Add the team to the account and give them access; Estimate the cost and choose redundancy; Deploy the tools VM; Publish the website with HTTPS; Put an NSG on the subnet and allow SSH from your IP; Draw the request flow and say who manages each hop; Create Cosmos DB and seed the counter; Build the visitor-counter Function; Give the team the right access; Report the cost, and read Advisor and Service Health; Alert on Function errors; Find a failure in Application Insights; Lock the resource group and write the incident record | — |
| Well-Architected | Set the standard, the budget and the service model; Create the resource group and VNet; Open the team repository and board; Add the team to the account and give them access; Estimate the cost and choose redundancy; Deploy the tools VM; Publish the website with HTTPS; Put an NSG on the subnet and allow SSH from your IP; Draw the request flow and say who manages each hop; Create Cosmos DB and seed the counter; Build the visitor-counter Function; Give the team the right access; Report the cost, and read Advisor and Service Health; Alert on Function errors; Find a failure in Application Insights; Lock the resource group and write the incident record | — |
| ISO/IEC/IEEE 42010 | — | Solution Architecture Document |

| Control cited | Standard | By |
| --- | --- | --- |
| ITIL.incident Incident management | ITIL | Monitoring & Incident Report |
| ISO42010 Architecture description | ISO_42010 | Solution Architecture Document |

Forms whose standard names a practice rather than a control:

- Cloud Foundation & Naming Standard: practice.naming-and-tagging
- Application & API Design Specification: practice.api-contract

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Add the team to the account and give them access; Put an NSG on the subnet and allow SSH from your IP; Give the team the right access |
| Default deny | NIST.800-53.SC-7 | Put an NSG on the subnet and allow SSH from your IP |
| Multi-factor authentication | NIST_800_63 | Add the team to the account and give them access; Give the team the right access |
| Secrets in a store | NIST.800-53.IA-5 | Build the visitor-counter Function |
| Encryption in transit | NIST.800-53.SC-8 | Publish the website with HTTPS |
| Interface contract | WAF.operational-excellence | Build the visitor-counter Function |
| Naming and tagging | WAF.cost | Set the standard, the budget and the service model |
| Budget guardrails | WAF.cost | Set the standard, the budget and the service model; Report the cost, and read Advisor and Service Health |
| Tear down after use | WAF.cost | Deploy the tools VM |
| Right-sizing | WAF.cost | Estimate the cost and choose redundancy; Create Cosmos DB and seed the counter; Report the cost, and read Advisor and Service Health |
| Centralised logging | NIST.CSF.DE.CM | Alert on Function errors; Find a failure in Application Insights |
| Alert to ticket | ITIL.incident | Alert on Function errors |
| Evidence-backed timeline | NIST.800-61.DETECT | Lock the resource group and write the incident record |
| Lessons learned | NIST.800-61.POST | Lock the resource group and write the incident record |
| Architecture decision records | ISO_42010 | Draw the request flow and say who manages each hop |
| Addressing plan | NIST.CSF.ID.AM | Create the resource group and VNet |
| Structured troubleshooting | ITIL.problem | Find a failure in Application Insights |
| Work tracked on a board | ITIL.knowledge | Open the team repository and board |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | arch: 3 skills with a verifiable step; infra: 4 skills with a verifiable step; dev: 3 skills with a verifiable step; secops: 5 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | arch: 59 percent of the exam over 2 domains; infra: 69 percent of the exam over 2 domains; dev: 69 percent of the exam over 2 domains; secops: 69 percent of the exam over 2 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | arch: 2 verifiable steps that run a command; infra: 9 verifiable steps that run a command; dev: 6 verifiable steps that run a command; secops: 9 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | arch: 6 procedures; infra: 6 procedures; dev: 6 procedures; secops: 6 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | arch: 2 fault, incident or triage tables; infra: 2 fault, incident or triage tables; dev: 2 fault, incident or triage tables; secops: 2 fault, incident or triage tables |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | arch: 2 verifiable steps; infra: 9 verifiable steps; dev: 6 verifiable steps; secops: 9 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | arch: 2 verifiable steps that can carry two stamps; infra: 9 verifiable steps that can carry two stamps; dev: 6 verifiable steps that can carry two stamps; secops: 9 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | arch: 0 tasks with two or more verifiable steps; infra: 4 tasks with two or more verifiable steps; dev: 3 tasks with two or more verifiable steps; secops: 4 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | arch: 2 verifiable steps; infra: 9 verifiable steps; dev: 6 verifiable steps; secops: 9 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | arch: 28 checks on 4 forms; infra: 28 checks on 4 forms; dev: 28 checks on 4 forms; secops: 28 checks on 4 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | arch: 1 decision block; infra: 1 decision block; dev: 1 decision block; secops: 1 decision block |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | arch: 1 decision block; infra: 1 decision block; dev: 1 decision block; secops: 1 decision block |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | arch: 1 decision block; infra: 1 decision block; dev: 1 decision block; secops: 1 decision block |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | arch: 0 change tables with a rollback column; infra: 0 change tables with a rollback column; dev: 0 change tables with a rollback column; secops: 0 change tables with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | arch: 0 hand-offs; infra: 0 hand-offs; dev: 0 hand-offs; secops: 0 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | arch: 4 forms with a RACI; infra: 4 forms with a RACI; dev: 4 forms with a RACI; secops: 4 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | arch: 4 tasks of the role; infra: 4 tasks of the role; dev: 4 tasks of the role; secops: 4 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | arch: 4 forms; infra: 4 forms; dev: 4 forms; secops: 4 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | arch: 2 control codes on 4 forms; infra: 0 control codes on 0 forms; dev: 0 control codes on 0 forms; secops: 0 control codes on 0 forms |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | arch: 4 forms; infra: 4 forms; dev: 4 forms; secops: 4 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | arch: 0 skills on two or more tasks; infra: 0 skills on two or more tasks; dev: 0 skills on two or more tasks; secops: 0 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | arch: 3 skills with a verifiable step; infra: 4 skills with a verifiable step; dev: 3 skills with a verifiable step; secops: 5 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | arch: Security Architect: 69 required, 64 not taught here; infra: System Administrator: 68 required, 68 not taught here; dev: Software Developer: 84 required, 80 not taught here; secops: Cyber Defense Analyst: 29 required, 29 not taught here |

