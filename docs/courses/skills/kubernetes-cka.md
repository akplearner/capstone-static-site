# Certified Kubernetes Administrator — the Cluster Yard — skills sheet

16 graded tasks and 6 advanced · 20 skills · 6 tools · 8 procedures · 4 standards (10 controls cited) · 0 tactics · 11 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Harden Linux with ufw, fail2ban and Lynis `comp.harden.linux-baseline` | Hardening and defence | SY0-701.d3, CIS.BENCHMARK | Lock access down with RBAC |
| Implement host firewall and access controls `comp.harden.host-firewall` | Hardening and defence | SOC-2-ISO-27001.c3, NIST.800-53.SC-7 | Fence it with a NetworkPolicy |
| Rebuild a system clean and prove it `comp.harden.clean-rebuild` | Hardening and defence | CY0-001.d2, WAF.reliability | Back up and restore the cluster state |
| Keep a chain of custody `comp.forensics.chain-of-custody` | Evidence and forensics | SY0-701.d4, ISO_27037 | Hand the cluster over |
| Write a hardening standard as an SOP `comp.grc.hardening-standard` | Governance and compliance | SY0-701.d5, CIS.BENCHMARK | Lock access down with RBAC |
| Run a local AI assistant offline `comp.ai.local-assistant` | Applied AI | NIST.AI-RMF.MANAGE | AI extension: draft the cluster architecture notes; AI extension: summarise the workloads and scheduling; AI extension: explain the services, policy and volumes; AI extension: summarise the troubleshooting and recovery; Serve a model behind an API |
| Ground an AI answer in the records `comp.ai.ground-in-records` | Applied AI | NIST.AI-RMF.MAP | AI extension: summarise the workloads and scheduling; AI extension: explain the services, policy and volumes; AI extension: summarise the troubleshooting and recovery |
| Verify AI output against the evidence `comp.ai.verify-ai-output` | Applied AI | NIST.AI-RMF.MEASURE | AI extension: draft the cluster architecture notes; AI extension: summarise the workloads and scheduling; AI extension: explain the services, policy and volumes; AI extension: summarise the troubleshooting and recovery; Give the agent tools; Keep it on a leash; Audit the agent |
| Write a task-specific prompt `comp.ai.prompt-for-the-task` | Applied AI | NIST.AI-RMF.MAP | AI extension: draft the cluster architecture notes |
| Give an agent tools to call `comp.ai.agent-tools` | Applied AI | NIST.AI-RMF.MANAGE | Give the agent tools; Keep it on a leash; Serve a tool over MCP; Audit the agent |
| Expose a tool over a model context protocol `comp.ai.mcp-connector` | Applied AI | NIST.AI-RMF.MANAGE | Serve a tool over MCP |
| Serve a model behind an API `comp.ai.serve-model` | Applied AI | NIST.AI-RMF.MEASURE | Serve a model behind an API; Size the memory |
| Size GPU memory for a model `comp.ai.gpu-sizing` | Applied AI | NIST.AI-RMF.MEASURE | Size the memory |
| Keep the infrastructure in Git `comp.automation.infra-in-git` | Automation and infrastructure as code | SK0-005.d2, ITIL.configuration | Read the control plane and nodes; Create and use a namespace |
| Assemble and hand over an as-built package `comp.docs.as-built-handover` | Documentation and records | SK0-005.d2, 200-301.d1, ITIL.transition | Hand the cluster over |
| Create the network foundation: VNet or VPC `comp.cloud.network-foundation` | Cloud services | AZ-900.d2, CLF-C02.d3 | Expose it with a Service and Ingress; Fence it with a NetworkPolicy |
| Choose a data store and storage tiers `comp.cloud.data-store-choice` | Cloud services | AZ-104.d2, SAA-C03.d4, WAF.cost | Persist data on a volume |
| Autoscale on CPU and prove self-healing `comp.cloud.autoscale-and-self-heal` | Cloud services | AZ-104.d3, SAA-C03.d2, WAF.reliability | Deploy the app with probes; Set requests, limits and scale; Steer where pods schedule |
| Cut over blue-green with no failed request `comp.cloud.blue-green` | Cloud services | AZ-400.d3, DOP-C02.d3, WAF.operational-excellence | Steer where pods schedule |
| Recover an app failure through CI `comp.cloud.fix-through-ci` | Cloud services | AZ-400.d3, DOP-C02.d5 | Work a broken pod, one change per row |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Read the control plane and nodes; Steer where pods schedule; Expose it with a Service and Ingress; Fence it with a NetworkPolicy; Work a broken pod, one change per row; Hand the cluster over; Size the memory; Give the agent tools; Keep it on a leash; Audit the agent |
| curl | cli | Serve a model behind an API |
| Capstone forms | document | Hand the cluster over; AI extension: draft the cluster architecture notes; AI extension: summarise the workloads and scheduling; AI extension: explain the services, policy and volumes; AI extension: summarise the troubleshooting and recovery; Serve a model behind an API; Size the memory; Give the agent tools; Keep it on a leash; Serve a tool over MCP; Audit the agent |
| Ollama | service | AI extension: draft the cluster architecture notes; AI extension: summarise the workloads and scheduling; AI extension: explain the services, policy and volumes; AI extension: summarise the troubleshooting and recovery; Serve a model behind an API; Give the agent tools |
| Kubernetes | cli | Read the control plane and nodes; Create and use a namespace; Lock access down with RBAC; Deploy the app with probes; Set requests, limits and scale; Steer where pods schedule; Expose it with a Service and Ingress; Fence it with a NetworkPolicy; Persist data on a volume; Work a broken pod, one change per row; Back up and restore the cluster state; Hand the cluster over |
| Python | language | Serve a model behind an API; Size the memory; Give the agent tools; Keep it on a leash; Serve a tool over MCP; Audit the agent |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Chain of custody | custody | ISO27037, ISO27001.A.5.28, NIST.800-61 | Handover & As-Built | Hand the cluster over |
| Operational handover | handover | ITIL.transition, ISO27001.A.5.37, ITIL.knowledge | Handover & As-Built | Hand the cluster over |
| Risk register | risk | NIST.800-30, ISO27005, ISO27001.6.1.2, NIST.CSF.GV.RM | Backup & Recovery Record | Back up and restore the cluster state |
| Asset inventory | inventory | NIST.CSF.ID.AM, CIS.1, ISO27001.A.5.9, ITIL.asset | Cluster Setup & Access Register | — |
| Governance report | governance | NIST.CSF.GV, ISO27001.9.3 | Backup & Recovery Record | — |
| Build record | build | ITIL.configuration, NIST.800-53.CM-2, ISO27001.A.8.9 | Cluster Architecture & Access Record; Workloads & Scheduling Record; Services, Networking & Storage Record | Read the control plane and nodes; Deploy the app with probes |
| Test and acceptance record | build | ITIL.transition, NIST.800-53.CA-2, ISO27001.A.8.29 | Cluster Troubleshooting Log | Work a broken pod, one change per row |
| Portfolio record | handover | ISO42010, NIST.800-53.PL-2, ITIL.knowledge | Portfolio | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| CIS | Read the control plane and nodes; Create and use a namespace; Lock access down with RBAC; Deploy the app with probes; Set requests, limits and scale; Steer where pods schedule; Expose it with a Service and Ingress; Fence it with a NetworkPolicy; Persist data on a volume; Work a broken pod, one change per row; Back up and restore the cluster state; Hand the cluster over | Cluster Setup & Access Register; Cluster Architecture & Access Record; Services, Networking & Storage Record; Backup & Recovery Record |
| NIST AI RMF | AI extension: draft the cluster architecture notes; AI extension: summarise the workloads and scheduling; AI extension: explain the services, policy and volumes; AI extension: summarise the troubleshooting and recovery; Serve a model behind an API; Size the memory; Give the agent tools; Keep it on a leash; Serve a tool over MCP; Audit the agent | — |
| NIST SP 800-53 | — | Cluster Setup & Access Register; Cluster Architecture & Access Record; Workloads & Scheduling Record; Services, Networking & Storage Record; Cluster Troubleshooting Log; Backup & Recovery Record; Handover & As-Built; Portfolio |
| ISO/IEC/IEEE 42010 | — | Portfolio |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.800-53 Security and Privacy Controls Rev. 5 | NIST_800_53 | Workloads & Scheduling Record |
| NIST.800-53.AC-6 Least Privilege | NIST_800_53 | Cluster Architecture & Access Record |
| NIST.800-53.CM-6 Configuration Settings | NIST_800_53 | Cluster Setup & Access Register |
| NIST.800-53.CM-8 System Component Inventory | NIST_800_53 | Handover & As-Built |
| NIST.800-53.CP-9 System Backup | NIST_800_53 | Backup & Recovery Record |
| NIST.800-53.IR-4 Incident Handling | NIST_800_53 | Cluster Troubleshooting Log |
| NIST.800-53.PL-2 System Security and Privacy Plans | NIST_800_53 | Handover & As-Built; Portfolio |
| NIST.800-53.SC-7 Boundary Protection | NIST_800_53 | Services, Networking & Storage Record |
| CIS Center for Internet Security | CIS | Cluster Setup & Access Register; Cluster Architecture & Access Record; Services, Networking & Storage Record; Backup & Recovery Record |
| ISO42010 Architecture description | ISO_42010 | Portfolio |

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Serve a model behind an API |
| Retest to closure | NIST_800_115 | Work a broken pod, one change per row |
| Likelihood-times-impact scoring | NIST_800_30 | Back up and restore the cluster state |
| Configuration record | ITIL.configuration | Read the control plane and nodes; Create and use a namespace; Lock access down with RBAC; Expose it with a Service and Ingress; Fence it with a NetworkPolicy |
| Build record | ITIL.configuration | Deploy the app with probes; Set requests, limits and scale; Hand the cluster over |
| Right-sizing | WAF.cost | Size the memory |
| Architecture decision records | ISO_42010 | Steer where pods schedule; Back up and restore the cluster state |
| Test and acceptance | ITIL.transition | Deploy the app with probes |
| Evidence by design | SOC2 | Lock access down with RBAC; Persist data on a volume; Hand the cluster over |
| Least privilege for agents | OWASP_LLM | Give the agent tools; Serve a tool over MCP |
| Human checkpoint | NIST_AI_RMF | Fence it with a NetworkPolicy; Work a broken pod, one change per row; AI extension: draft the cluster architecture notes; AI extension: summarise the workloads and scheduling; AI extension: explain the services, policy and volumes; AI extension: summarise the troubleshooting and recovery; Keep it on a leash; Audit the agent |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | cluster: 20 skills with a verifiable step; workloads: 20 skills with a verifiable step; net: 20 skills with a verifiable step; records: 20 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | cluster: 100 percent of the exam over 5 domains; workloads: 100 percent of the exam over 5 domains; net: 100 percent of the exam over 5 domains; records: 100 percent of the exam over 5 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | cluster: 25 verifiable steps that run a command; workloads: 25 verifiable steps that run a command; net: 25 verifiable steps that run a command; records: 25 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | cluster: 8 procedures; workloads: 8 procedures; net: 8 procedures; records: 8 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | cluster: 1 fault, incident or triage table; workloads: 1 fault, incident or triage table; net: 1 fault, incident or triage table; records: 1 fault, incident or triage table |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | cluster: 25 verifiable steps; workloads: 25 verifiable steps; net: 25 verifiable steps; records: 25 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | cluster: 25 verifiable steps that can carry two stamps; workloads: 25 verifiable steps that can carry two stamps; net: 25 verifiable steps that can carry two stamps; records: 25 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | cluster: 3 tasks with two or more verifiable steps; workloads: 3 tasks with two or more verifiable steps; net: 3 tasks with two or more verifiable steps; records: 3 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | cluster: 25 verifiable steps; workloads: 25 verifiable steps; net: 25 verifiable steps; records: 25 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | cluster: 28 checks on 8 forms; workloads: 28 checks on 8 forms; net: 28 checks on 8 forms; records: 28 checks on 8 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | cluster: 1 decision block; workloads: 1 decision block; net: 1 decision block; records: 1 decision block |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | cluster: 1 decision block; workloads: 1 decision block; net: 1 decision block; records: 1 decision block |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | cluster: 1 decision block; workloads: 1 decision block; net: 1 decision block; records: 1 decision block |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | cluster: 1 change table with a rollback column; workloads: 1 change table with a rollback column; net: 1 change table with a rollback column; records: 1 change table with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | cluster: 16 hand-offs; workloads: 16 hand-offs; net: 16 hand-offs; records: 16 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | cluster: 8 forms with a RACI; workloads: 8 forms with a RACI; net: 8 forms with a RACI; records: 8 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | cluster: 22 tasks of the role; workloads: 22 tasks of the role; net: 22 tasks of the role; records: 22 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | cluster: 8 forms; workloads: 8 forms; net: 8 forms; records: 8 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | cluster: 3 control codes on 2 forms; workloads: 1 control code on 1 form; net: 2 control codes on 1 form; records: 6 control codes on 4 forms |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | cluster: 8 forms; workloads: 8 forms; net: 8 forms; records: 8 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | cluster: 8 skills on two or more tasks; workloads: 8 skills on two or more tasks; net: 8 skills on two or more tasks; records: 8 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | cluster: 20 skills with a verifiable step; workloads: 20 skills with a verifiable step; net: 20 skills with a verifiable step; records: 20 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | cluster: System Administrator: 117 required, 111 not taught here; workloads: System Administrator: 117 required, 111 not taught here; net: Network Operations Specialist: 62 required, 61 not taught here; records: Cyber Policy and Strategy Planner: 47 required, 45 not taught here |
| Values recalled `kpi.validation.recall-accuracy` | validation | metric.validation-recall (own) |  |
| Scenarios applied `kpi.validation.applied-scenarios` | validation | metric.validation-applied (own) |  |
| Conflicts resolved `kpi.validation.conflicts-resolved` | validation | metric.conflicts-resolved (own) |  |
| Minutes on task `kpi.validation.time-on-task` | validation | metric.minutes-on-task (own) |  |

