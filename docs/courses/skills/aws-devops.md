# AWS DevOps Engineer Capstone — skills sheet

16 graded tasks · 16 skills · 12 tools · 10 procedures · 4 standards (9 controls cited) · 0 tactics · 26 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Map a template and write an ADR `comp.cloud.template-map` | Cloud services | AZ-400.d1, DOP-C02.d2, ISO42010 | Map the template and set the environment strategy |
| Inventory with the CLI and detect drift `comp.cloud.inventory-and-drift` | Cloud services | AZ-400.d3, DOP-C02.d2, WAF.operational-excellence | Inventory with the CLI and detect drift |
| Preview and deploy from a template `comp.cloud.deploy-from-template` | Cloud services | AZ-400.d3, DOP-C02.d2 | Fill the starter and deploy to dev |
| Validate templates and enforce policy as code `comp.cloud.policy-as-code` | Cloud services | AZ-400.d4, DOP-C02.d6, WAF.security | Parameter files, validation and policy as code |
| Write a change request with gates `comp.cloud.change-request-and-gates` | Cloud services | AZ-400.d1, DOP-C02.d1, ITIL.change | Write the change request and the gates |
| Protect main and require checks `comp.cloud.branch-protection` | Cloud services | AZ-400.d2, DOP-C02.d1, NIST_800_218 | Protect main, add the environments and require the checks |
| Build a staged pipeline with approval `comp.cloud.staged-pipeline` | Cloud services | AZ-400.d3, DOP-C02.d1, NIST_800_218 | Build the staged pipeline |
| Deploy with a federated identity, no secret `comp.cloud.oidc-deploy-identity` | Cloud services | AZ-400.d4, DOP-C02.d6, NIST_800_63 | Sign in with OIDC, scope the deploy role and test rollback |
| Review cost by service and set SLOs `comp.cloud.cost-by-service-and-slos` | Cloud services | AZ-400.d5, DOP-C02.d4, WAF.cost | Review cost by service and set the service levels |
| Cut over blue-green with no failed request `comp.cloud.blue-green` | Cloud services | AZ-400.d3, DOP-C02.d3, WAF.operational-excellence | Blue/green the fleet with weighted target groups |
| Canary a release behind a metric `comp.cloud.canary` | Cloud services | AZ-400.d3, DOP-C02.d3, WAF.operational-excellence | Canary the counter with alias weights and an alarm |
| Dashboard the SLIs and enforce a tag `comp.cloud.dashboard-and-compliance` | Cloud services | AZ-400.d5, DOP-C02.d4, WAF.security | Build the dashboard, require the tag with Config and read the audit trail |
| Assemble a handover package with risks `comp.cloud.handover-package` | Cloud services | AZ-400.d1, DOP-C02.d5, ITIL.transition | Assemble the handover package |
| Rebuild from the template and automate a restart `comp.cloud.rebuild-and-automate` | Cloud services | AZ-400.d3, DOP-C02.d3, NIST.800-53.CP-4 | Rebuild from the template and automate the restart |
| Recover an app failure through CI `comp.cloud.fix-through-ci` | Cloud services | AZ-400.d3, DOP-C02.d5 | Fix an app failure through CI |
| Contain a cloud incident and write a post-mortem `comp.cloud.contain-and-post-mortem` | Cloud services | AZ-400.d4, DOP-C02.d5, NIST.800-61.POST | Contain a security incident and write the post-mortem |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Parameter files, validation and policy as code; Build the staged pipeline; Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Build the dashboard, require the tag with Config and read the audit trail; Rebuild from the template and automate the restart; Fix an app failure through CI; Contain a security incident and write the post-mortem |
| curl | cli | Parameter files, validation and policy as code; Fix an app failure through CI |
| Capstone forms | document | Map the template and set the environment strategy; Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Parameter files, validation and policy as code; Write the change request and the gates; Protect main, add the environments and require the checks; Build the staged pipeline; Sign in with OIDC, scope the deploy role and test rollback; Review cost by service and set the service levels; Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Build the dashboard, require the tag with Config and read the audit trail; Assemble the handover package; Rebuild from the template and automate the restart; Fix an app failure through CI; Contain a security incident and write the post-mortem |
| Capstone guide | document | Map the template and set the environment strategy; Fill the starter and deploy to dev |
| Git | cli | Parameter files, validation and policy as code |
| GitHub | service | Write the change request and the gates; Protect main, add the environments and require the checks; Build the staged pipeline; Sign in with OIDC, scope the deploy role and test rollback; Fix an app failure through CI |
| GitHub Actions | service | Build the staged pipeline |
| Python | language | Parameter files, validation and policy as code |
| CloudFormation | language | Parameter files, validation and policy as code |
| AWS console | portal | Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Parameter files, validation and policy as code; Build the staged pipeline; Sign in with OIDC, scope the deploy role and test rollback; Review cost by service and set the service levels; Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Build the dashboard, require the tag with Config and read the audit trail; Rebuild from the template and automate the restart; Fix an app failure through CI; Contain a security incident and write the post-mortem |
| AWS CloudShell | portal | Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Parameter files, validation and policy as code; Build the staged pipeline; Sign in with OIDC, scope the deploy role and test rollback; Review cost by service and set the service levels; Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Build the dashboard, require the tag with Config and read the audit trail; Rebuild from the template and automate the restart; Fix an app failure through CI; Contain a security incident and write the post-mortem |
| AWS CLI | cli | Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Parameter files, validation and policy as code; Build the staged pipeline; Sign in with OIDC, scope the deploy role and test rollback; Review cost by service and set the service levels; Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Build the dashboard, require the tag with Config and read the audit trail; Rebuild from the template and automate the restart; Fix an app failure through CI; Contain a security incident and write the post-mortem |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Incident record | incident | NIST.800-61.DETECT, ISO27001.A.5.26, NIST.CSF.RS.AN | — | Contain a security incident and write the post-mortem |
| Change record | change | ITIL.change, ISO27001.A.8.32, NIST.800-53.CM-3, SOC2.CC8.1 | Change Request & Release Record | Write the change request and the gates |
| Release record | release | ITIL.release, NIST.800-218, SOC2.CC8.1 | Change Request & Release Record | Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm |
| Recovery drill | recovery | NIST.800-34, NIST.CSF.RC.RP, ISO27001.A.5.30, NIST.800-53.CP-4 | — | Rebuild from the template and automate the restart |
| Operational handover | handover | ITIL.transition, ISO27001.A.5.37, ITIL.knowledge | Operational Handover Package | Assemble the handover package |
| Risk register | risk | NIST.800-30, ISO27005, ISO27001.6.1.2, NIST.CSF.GV.RM | Operational Handover Package | — |
| Cost review | governance | WAF.cost | Governance, Security & Cost Report | — |
| Governance report | governance | NIST.CSF.GV, ISO27001.9.3 | Governance, Security & Cost Report | — |
| Build record | build | ITIL.configuration, NIST.800-53.CM-2, ISO27001.A.8.9 | IaC Design & Deployment Record | — |
| Pipeline record | build | NIST.800-218, WAF.operational-excellence, ITIL.deployment | IaC Design & Deployment Record | Fill the starter and deploy to dev; Build the staged pipeline |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| ITIL 4 | — | Change Request & Release Record; Operational Handover Package |
| AWS DOP-C02 | Map the template and set the environment strategy; Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Parameter files, validation and policy as code; Write the change request and the gates; Protect main, add the environments and require the checks; Build the staged pipeline; Sign in with OIDC, scope the deploy role and test rollback; Review cost by service and set the service levels; Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Build the dashboard, require the tag with Config and read the audit trail; Assemble the handover package; Rebuild from the template and automate the restart; Fix an app failure through CI; Contain a security incident and write the post-mortem | — |
| Well-Architected | Map the template and set the environment strategy; Inventory with the CLI and detect drift; Fill the starter and deploy to dev; Parameter files, validation and policy as code; Write the change request and the gates; Protect main, add the environments and require the checks; Build the staged pipeline; Sign in with OIDC, scope the deploy role and test rollback; Review cost by service and set the service levels; Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm; Build the dashboard, require the tag with Config and read the audit trail; Assemble the handover package; Rebuild from the template and automate the restart; Fix an app failure through CI; Contain a security incident and write the post-mortem | IaC Design & Deployment Record; Governance, Security & Cost Report |
| NIST SP 800-53 | — | IaC Design & Deployment Record; Change Request & Release Record; Governance, Security & Cost Report; Operational Handover Package |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.800-53.AU-6 Audit Record Review, Analysis, and Reporting | NIST_800_53 | Governance, Security & Cost Report |
| NIST.800-53.CM-2 Baseline Configuration | NIST_800_53 | IaC Design & Deployment Record |
| NIST.800-53.CM-3 Configuration Change Control | NIST_800_53 | Change Request & Release Record |
| NIST.800-53.PL-2 System Security and Privacy Plans | NIST_800_53 | Operational Handover Package |
| ITIL.change Change enablement | ITIL | Change Request & Release Record |
| ITIL.transition Service transition | ITIL | Operational Handover Package |
| WAF.security Security pillar | WAF | Governance, Security & Cost Report |
| WAF.cost Cost optimisation pillar | WAF | Governance, Security & Cost Report |
| WAF.operational-excellence Operational excellence pillar | WAF | IaC Design & Deployment Record |

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Sign in with OIDC, scope the deploy role and test rollback |
| Federated identity | NIST_800_63 | Sign in with OIDC, scope the deploy role and test rollback |
| Secrets in a store | NIST.800-53.IA-5 | Parameter files, validation and policy as code |
| Separation of duties | NIST.800-53.AC-5 | Protect main, add the environments and require the checks |
| Likelihood-times-impact scoring | NIST_800_30 | Assemble the handover package |
| Change control | ITIL.change | Fill the starter and deploy to dev; Write the change request and the gates |
| Rollback plan | ITIL.change | Write the change request and the gates; Sign in with OIDC, scope the deploy role and test rollback |
| Infrastructure as code | WAF.operational-excellence | Map the template and set the environment strategy; Fill the starter and deploy to dev; Build the staged pipeline |
| Drift detection | WAF.operational-excellence | Inventory with the CLI and detect drift; Fix an app failure through CI |
| Rebuild, do not repair | WAF.reliability | Rebuild from the template and automate the restart |
| Reproducible builds | NIST_800_218 | Rebuild from the template and automate the restart |
| Blue-green deployment | WAF.operational-excellence | Blue/green the fleet with weighted target groups |
| Canary release | WAF.operational-excellence | Canary the counter with alias weights and an alarm |
| Automated rollback | WAF.reliability | Fix an app failure through CI |
| Pipeline gates | NIST_800_218 | Protect main, add the environments and require the checks; Build the staged pipeline |
| Policy as code | WAF.security | Parameter files, validation and policy as code; Build the dashboard, require the tag with Config and read the audit trail |
| Naming and tagging | WAF.cost | Inventory with the CLI and detect drift |
| Right-sizing | WAF.cost | Review cost by service and set the service levels |
| Health checks | WAF.reliability | Blue/green the fleet with weighted target groups; Canary the counter with alias weights and an alarm |
| Contain before analysing | NIST.800-61.CONTAIN | Contain a security incident and write the post-mortem |
| Evidence-backed timeline | NIST.800-61.DETECT | Contain a security incident and write the post-mortem |
| Lessons learned | NIST.800-61.POST | Contain a security incident and write the post-mortem |
| Written runbooks | ISO27001.A.5.37 | Rebuild from the template and automate the restart |
| As-built documentation | ITIL.transition | Assemble the handover package |
| Architecture decision records | ISO_42010 | Map the template and set the environment strategy |
| Metrics with targets | ISO27001.9.1 | Review cost by service and set the service levels; Build the dashboard, require the tag with Config and read the audit trail |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | arch: 1 skill with a verifiable step; infra: 3 skills with a verifiable step; dev: 4 skills with a verifiable step; secops: 4 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | arch: 68 percent of the exam over 4 domains; infra: 54 percent of the exam over 3 domains; dev: 68 percent of the exam over 4 domains; secops: 46 percent of the exam over 3 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | arch: 2 verifiable steps that run a command; infra: 10 verifiable steps that run a command; dev: 8 verifiable steps that run a command; secops: 9 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | arch: 8 procedures; infra: 9 procedures; dev: 8 procedures; secops: 9 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | arch: 1 fault, incident or triage table; infra: 1 fault, incident or triage table; dev: 1 fault, incident or triage table; secops: 1 fault, incident or triage table |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | arch: 2 verifiable steps; infra: 10 verifiable steps; dev: 8 verifiable steps; secops: 9 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | arch: 2 verifiable steps that can carry two stamps; infra: 10 verifiable steps that can carry two stamps; dev: 8 verifiable steps that can carry two stamps; secops: 9 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | arch: 1 task with two or more verifiable steps; infra: 3 tasks with two or more verifiable steps; dev: 2 tasks with two or more verifiable steps; secops: 4 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | arch: 2 verifiable steps; infra: 10 verifiable steps; dev: 8 verifiable steps; secops: 9 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | arch: 32 checks on 4 forms; infra: 32 checks on 4 forms; dev: 32 checks on 4 forms; secops: 32 checks on 4 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | arch: 1 decision block; infra: 1 decision block; dev: 1 decision block; secops: 1 decision block |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | arch: 1 decision block; infra: 1 decision block; dev: 1 decision block; secops: 1 decision block |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | arch: 1 decision block; infra: 1 decision block; dev: 1 decision block; secops: 1 decision block |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | arch: 1 change table with a rollback column; infra: 1 change table with a rollback column; dev: 1 change table with a rollback column; secops: 1 change table with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | arch: 4 hand-offs; infra: 4 hand-offs; dev: 4 hand-offs; secops: 4 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | arch: 4 forms with a RACI; infra: 4 forms with a RACI; dev: 4 forms with a RACI; secops: 4 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | arch: 4 tasks of the role; infra: 4 tasks of the role; dev: 4 tasks of the role; secops: 4 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | arch: 4 forms; infra: 4 forms; dev: 4 forms; secops: 4 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | arch: 2 control codes on 1 form; infra: 2 control codes on 1 form; dev: 2 control codes on 1 form; secops: 3 control codes on 1 form |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | arch: 4 forms; infra: 4 forms; dev: 4 forms; secops: 4 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | arch: 0 skills on two or more tasks; infra: 0 skills on two or more tasks; dev: 0 skills on two or more tasks; secops: 0 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | arch: 1 skill with a verifiable step; infra: 3 skills with a verifiable step; dev: 4 skills with a verifiable step; secops: 4 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | arch: Security Architect: 69 required, 65 not taught here; infra: System Administrator: 117 required, 113 not taught here; dev: Software Developer: 84 required, 80 not taught here; secops: Cyber Defense Analyst: 78 required, 74 not taught here |
| Values recalled `kpi.validation.recall-accuracy` | validation | metric.validation-recall (own) |  |
| Scenarios applied `kpi.validation.applied-scenarios` | validation | metric.validation-applied (own) |  |
| Conflicts resolved `kpi.validation.conflicts-resolved` | validation | metric.conflicts-resolved (own) |  |
| Minutes on task `kpi.validation.time-on-task` | validation | metric.minutes-on-task (own) |  |

