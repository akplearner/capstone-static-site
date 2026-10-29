# CCNA Network Capstone — skills sheet

15 graded tasks and 10 advanced · 32 skills · 10 tools · 14 procedures · 7 standards (11 controls cited) · 0 tactics · 26 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Run a local AI assistant offline `comp.ai.local-assistant` | Applied AI | NIST.AI-RMF.MANAGE | AI extension: explain the high-level design; AI extension: check the IP plan; AI extension: read a validation result; AI extension: draft the ACL rationale; Serve a model behind an API |
| Ground an AI answer in the records `comp.ai.ground-in-records` | Applied AI | NIST.AI-RMF.MAP | AI extension: check the IP plan; AI extension: read a validation result; AI extension: draft the ACL rationale |
| Verify AI output against the evidence `comp.ai.verify-ai-output` | Applied AI | NIST.AI-RMF.MEASURE | AI extension: explain the high-level design; AI extension: check the IP plan; AI extension: read a validation result; AI extension: draft the ACL rationale |
| Write a task-specific prompt `comp.ai.prompt-for-the-task` | Applied AI | NIST.AI-RMF.MAP | AI extension: explain the high-level design |
| Serve a model behind an API `comp.ai.serve-model` | Applied AI | NIST.AI-RMF.MEASURE | Serve a model behind an API; Size the memory |
| Size GPU memory for a model `comp.ai.gpu-sizing` | Applied AI | NIST.AI-RMF.MEASURE | Size the memory |
| Troubleshoot with the structured method `comp.sysadmin.troubleshooting-method` | System administration | SK0-005.d4, 200-301.d3, ITIL.problem | Work a ticket, not a hunch |
| Design a hierarchical network with boundaries `comp.network.hierarchical-design` | Network engineering | 200-301.d1 | Design the shape; Join the second building |
| Bring switches up with management addressing `comp.network.switch-bringup` | Network engineering | 200-301.d2 | Bring the first switches up; Survive a cable being pulled |
| Cut a network into VLANs with trunks `comp.network.vlans-and-trunks` | Network engineering | 200-301.d2 | Cut the network into departments; Route between the departments |
| Route between VLANs with SVIs or subinterfaces `comp.network.inter-vlan-routing` | Network engineering | 200-301.d3 | Route between the departments; One way out to the internet |
| Survive a pulled cable with spanning tree `comp.network.spanning-tree` | Network engineering | 200-301.d2 | Survive a cable being pulled |
| Join sites with OSPF adjacencies `comp.network.ospf` | Network engineering | 200-301.d3 | Join the second building |
| Route out with a default route and PAT `comp.network.default-route-and-nat` | Network engineering | 200-301.d4 | One way out to the internet |
| Turn a policy into placed access lists `comp.network.acls` | Network engineering | 200-301.d5, NIST.800-53.SC-7 | Turn the policy into access lists; Harden the management plane |
| Harden the management plane: SSH, secrets, port security `comp.network.management-plane-hardening` | Network engineering | 200-301.d5, CIS.BENCHMARK | Harden the management plane |
| Put WLANs on the air mapped to VLANs `comp.network.wlan` | Network engineering | 200-301.d2 | Put the WLANs on the air |
| Back up configurations and prove a restore `comp.network.config-backup` | Network engineering | 200-301.d4, NIST.800-53.CP-9 | Back it up, then change it properly |
| Poll with SNMP and centralise syslog `comp.observe.snmp-and-syslog` | Monitoring and observability | 200-301.d4, NIST.CSF.DE.CM | Build a small NOC |
| Configure hosts with Ansible roles `comp.automation.ansible-roles` | Automation and infrastructure as code | SK0-005.d2, 200-301.d6 | Configure from the source of truth |
| Read a network API and write YAML `comp.automation.network-as-data` | Automation and infrastructure as code | 200-301.d6 | The network as data |
| Write playbooks that change nothing twice `comp.automation.idempotent-playbooks` | Automation and infrastructure as code | 200-301.d6 | Configure from the source of truth |
| Record changes with rollback and approver `comp.docs.change-control` | Documentation and records | SK0-005.d2, 200-301.d4, ITIL.change | Back it up, then change it properly; Something breaks — work it properly |
| Assemble and hand over an as-built package `comp.docs.as-built-handover` | Documentation and records | SK0-005.d2, 200-301.d1, ITIL.transition | Hand the network over |
| Keep racks and addresses as a record `comp.docs.netbox-ipam` | Documentation and records | SK0-005.d2, 200-301.d6, NIST.CSF.ID.AM | A source of truth, not a spreadsheet |
| Gather requirements from the business `comp.docs.requirements-gathering` | Documentation and records | 200-301.d1 | Discover before you design |
| Survey a site before designing `comp.docs.site-survey` | Documentation and records | 200-301.d1 | Discover before you design |
| Record design decisions traced to requirements `comp.docs.design-decisions` | Documentation and records | 200-301.d1, ISO42010 | Design the shape |
| Keep a build log with proof per step `comp.docs.build-log` | Documentation and records | 200-301.d2, ITIL.configuration | Bring the first switches up |
| Work a ticket with scope and layers `comp.docs.work-a-ticket` | Documentation and records | 200-301.d3, ITIL.incident | Work a ticket, not a hunch |
| Work an incident to root cause `comp.docs.incident-management` | Documentation and records | 200-301.d3, ITIL.incident | Something breaks — work it properly |
| List known issues honestly `comp.docs.known-issues` | Documentation and records | 200-301.d1, ITIL.transition | Hand the network over |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Bring the first switches up; Back it up, then change it properly; Build a small NOC; The network as data; Configure from the source of truth; Size the memory |
| curl | cli | Serve a model behind an API |
| ping / traceroute | cli | Route between the departments; Join the second building; Turn the policy into access lists |
| Capstone forms | document | Cut the network into departments; Turn the policy into access lists; Harden the management plane; Back it up, then change it properly; Work a ticket, not a hunch; Configure from the source of truth; Something breaks — work it properly; Hand the network over; AI extension: explain the high-level design; AI extension: check the IP plan; AI extension: read a validation result; AI extension: draft the ACL rationale; Serve a model behind an API; Size the memory |
| Notes | document | Discover before you design; Design the shape |
| Wireshark | app | Work a ticket, not a hunch |
| Ollama | service | AI extension: explain the high-level design; AI extension: check the IP plan; AI extension: read a validation result; AI extension: draft the ACL rationale; Serve a model behind an API |
| Python | language | Serve a model behind an API; Size the memory |
| NetBox | service | A source of truth, not a spreadsheet |
| Cisco IOS | appliance | Discover before you design; Design the shape; Bring the first switches up; Cut the network into departments; Route between the departments; Survive a cable being pulled; Join the second building; One way out to the internet; Turn the policy into access lists; Harden the management plane; Put the WLANs on the air; Back it up, then change it properly; Build a small NOC; Work a ticket, not a hunch; Something breaks — work it properly |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Incident record | incident | NIST.800-61.DETECT, ISO27001.A.5.26, NIST.CSF.RS.AN | Monitoring & Incident Log | Work a ticket, not a hunch; Something breaks — work it properly |
| Change record | change | ITIL.change, ISO27001.A.8.32, NIST.800-53.CM-3, SOC2.CC8.1 | Operations & Change Records | Back it up, then change it properly; Something breaks — work it properly |
| Backup plan | recovery | ISO27001.A.8.13, NIST.800-53.CP-9, CIS.11 | Operations & Change Records | Back it up, then change it properly |
| Hardening baseline | baseline | CIS.BENCHMARK, NIST.800-53.CM-6, ISO27001.A.8.9, NIST.CSF.PR.PS | Security Baseline & ACL Policy | Harden the management plane |
| Operational handover | handover | ITIL.transition, ISO27001.A.5.37, ITIL.knowledge | As-Built & Operations Handover | Hand the network over |
| Security policy | policy | ISO27001.5.2, ISO27001.A.5.1, NIST.CSF.GV.PO, NIST.800-53.PM-1 | Security Baseline & ACL Policy | — |
| Monitoring plan | monitoring | NIST.CSF.DE.CM, ISO27001.A.8.16, SOC2.CC7.2, ITIL.monitoring | Monitoring & Incident Log | — |
| Asset inventory | inventory | NIST.CSF.ID.AM, CIS.1, ISO27001.A.5.9, ITIL.asset | Kit & Capability Register | — |
| Architecture record | design | ISO42010, WAF, NIST.800-53.PL-8 | High-Level Design | — |
| Network design | design | NIST.800-53.SC-7, ISO27001.A.8.22, NIST.CSF.PR.IR | Low-Level Design & IP Plan | — |
| Requirements record | design | ISO42010, WAF | Requirements & Site Survey | — |
| Build record | build | ITIL.configuration, NIST.800-53.CM-2, ISO27001.A.8.9 | Build & Configuration Log | Bring the first switches up |
| Test and acceptance record | build | ITIL.transition, NIST.800-53.CA-2, ISO27001.A.8.29 | Validation & Test Matrix | Route between the departments; Join the second building; Turn the policy into access lists |
| Portfolio record | handover | ISO42010, NIST.800-53.PL-2, ITIL.knowledge | Portfolio | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| NIST CSF | Turn the policy into access lists; Something breaks — work it properly | — |
| CIS | Harden the management plane | — |
| CCNA 200-301 | Discover before you design; Design the shape; Bring the first switches up; Cut the network into departments; Route between the departments; Survive a cable being pulled; Join the second building; One way out to the internet; Turn the policy into access lists; Harden the management plane; Put the WLANs on the air; A source of truth, not a spreadsheet; Back it up, then change it properly; Build a small NOC; Work a ticket, not a hunch; The network as data; Configure from the source of truth; Something breaks — work it properly; Hand the network over | — |
| ITIL 4 | Discover before you design; A source of truth, not a spreadsheet; Back it up, then change it properly; Work a ticket, not a hunch; Something breaks — work it properly; Hand the network over | Operations & Change Records; Monitoring & Incident Log |
| NIST AI RMF | AI extension: explain the high-level design; AI extension: check the IP plan; AI extension: read a validation result; AI extension: draft the ACL rationale; Serve a model behind an API; Size the memory | — |
| NIST SP 800-53 | — | Kit & Capability Register; Requirements & Site Survey; High-Level Design; Low-Level Design & IP Plan; Build & Configuration Log; Validation & Test Matrix; Security Baseline & ACL Policy; Operations & Change Records; Monitoring & Incident Log; As-Built & Operations Handover; Portfolio |
| ISO/IEC/IEEE 42010 | — | Portfolio |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.800-53.CA-2 Control Assessments | NIST_800_53 | Validation & Test Matrix |
| NIST.800-53.CM-2 Baseline Configuration | NIST_800_53 | Build & Configuration Log |
| NIST.800-53.CM-3 Configuration Change Control | NIST_800_53 | Operations & Change Records |
| NIST.800-53.CM-6 Configuration Settings | NIST_800_53 | Security Baseline & ACL Policy |
| NIST.800-53.CM-8 System Component Inventory | NIST_800_53 | Kit & Capability Register; Low-Level Design & IP Plan |
| NIST.800-53.PL-2 System Security and Privacy Plans | NIST_800_53 | Requirements & Site Survey; As-Built & Operations Handover; Portfolio |
| NIST.800-53.PL-8 Security and Privacy Architectures | NIST_800_53 | High-Level Design |
| NIST.800-53.SI-4 System Monitoring | NIST_800_53 | Monitoring & Incident Log |
| ITIL.change Change enablement | ITIL | Operations & Change Records |
| ITIL.problem Problem management | ITIL | Monitoring & Incident Log |
| ISO42010 Architecture description | ISO_42010 | Portfolio |

Forms whose standard names a practice rather than a control:

- Kit & Capability Register: practice.asset-inventory
- Requirements & Site Survey: practice.requirements-first
- High-Level Design: practice.architecture-decision-records
- Low-Level Design & IP Plan: practice.addressing-plan
- Build & Configuration Log: practice.configuration-record
- Validation & Test Matrix: practice.test-and-acceptance
- Security Baseline & ACL Policy: practice.hardening-baseline, practice.written-policy
- As-Built & Operations Handover: practice.as-built-documentation

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Serve a model behind an API |
| Default deny | NIST.800-53.SC-7 | Turn the policy into access lists |
| Network segmentation | ISO27001.A.8.22 | Cut the network into departments; Put the WLANs on the air |
| Encryption in transit | NIST.800-53.SC-8 | Harden the management plane |
| Backup before change | ITIL.change | Back it up, then change it properly |
| Change control | ITIL.change | Back it up, then change it properly; Something breaks — work it properly |
| Hardening baseline | CIS.BENCHMARK | Harden the management plane |
| Configuration record | ITIL.configuration | Cut the network into departments; One way out to the internet |
| Build record | ITIL.configuration | Bring the first switches up |
| Infrastructure as code | WAF.operational-excellence | The network as data; Configure from the source of truth |
| Right-sizing | WAF.cost | Size the memory |
| Backups tested by restore | NIST.800-53.CP-4 | Back it up, then change it properly |
| Centralised logging | NIST.CSF.DE.CM | Build a small NOC |
| Alert to ticket | ITIL.incident | Build a small NOC |
| Lessons learned | NIST.800-61.POST | Something breaks — work it properly |
| Sign and version documents | ISO27001.7.5 | Hand the network over |
| As-built documentation | ITIL.transition | Hand the network over |
| Architecture decision records | ISO_42010 | Design the shape |
| Requirements before design | ISO_42010 | Discover before you design; Design the shape |
| Addressing plan | NIST.CSF.ID.AM | Bring the first switches up; Join the second building; A source of truth, not a spreadsheet |
| Test and acceptance | ITIL.transition | Route between the departments; Join the second building; One way out to the internet; Turn the policy into access lists; Put the WLANs on the air |
| Structured troubleshooting | ITIL.problem | Work a ticket, not a hunch; Something breaks — work it properly |
| Asset inventory | NIST.CSF.ID.AM | A source of truth, not a spreadsheet |
| Human checkpoint | NIST_AI_RMF | AI extension: explain the high-level design; AI extension: check the IP plan; AI extension: read a validation result; AI extension: draft the ACL rationale |
| Redundant paths | WAF.reliability | Survive a cable being pulled |
| Idempotent automation | WAF.operational-excellence | Configure from the source of truth |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | arch: 20 skills with a verifiable step; impl: 20 skills with a verifiable step; ops: 20 skills with a verifiable step; auto: 20 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | arch: 100 percent of the exam over 6 domains; impl: 100 percent of the exam over 6 domains; ops: 100 percent of the exam over 6 domains; auto: 100 percent of the exam over 6 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | arch: 28 verifiable steps that run a command; impl: 28 verifiable steps that run a command; ops: 28 verifiable steps that run a command; auto: 28 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | arch: 14 procedures; impl: 14 procedures; ops: 14 procedures; auto: 14 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | arch: 2 fault, incident or triage tables; impl: 2 fault, incident or triage tables; ops: 2 fault, incident or triage tables; auto: 2 fault, incident or triage tables |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | arch: 28 verifiable steps; impl: 28 verifiable steps; ops: 28 verifiable steps; auto: 28 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | arch: 28 verifiable steps that can carry two stamps; impl: 28 verifiable steps that can carry two stamps; ops: 28 verifiable steps that can carry two stamps; auto: 28 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | arch: 11 tasks with two or more verifiable steps; impl: 11 tasks with two or more verifiable steps; ops: 11 tasks with two or more verifiable steps; auto: 11 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | arch: 28 verifiable steps; impl: 28 verifiable steps; ops: 28 verifiable steps; auto: 28 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | arch: 43 checks on 11 forms; impl: 43 checks on 11 forms; ops: 43 checks on 11 forms; auto: 43 checks on 11 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | arch: 1 decision block; impl: 1 decision block; ops: 1 decision block; auto: 1 decision block |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | arch: 1 decision block; impl: 1 decision block; ops: 1 decision block; auto: 1 decision block |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | arch: 1 decision block; impl: 1 decision block; ops: 1 decision block; auto: 1 decision block |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | arch: 1 change table with a rollback column; impl: 1 change table with a rollback column; ops: 1 change table with a rollback column; auto: 1 change table with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | arch: 16 hand-offs; impl: 16 hand-offs; ops: 16 hand-offs; auto: 16 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | arch: 11 forms with a RACI; impl: 11 forms with a RACI; ops: 11 forms with a RACI; auto: 11 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | arch: 25 tasks of the role; impl: 25 tasks of the role; ops: 25 tasks of the role; auto: 25 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | arch: 11 forms; impl: 11 forms; ops: 11 forms; auto: 11 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | arch: 4 control codes on 6 forms; impl: 1 control code on 1 form; ops: 5 control codes on 3 forms; auto: 1 control code on 1 form |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | arch: 11 forms; impl: 11 forms; ops: 11 forms; auto: 11 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | arch: 10 skills on two or more tasks; impl: 10 skills on two or more tasks; ops: 10 skills on two or more tasks; auto: 10 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | arch: 20 skills with a verifiable step; impl: 20 skills with a verifiable step; ops: 20 skills with a verifiable step; auto: 20 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | arch: Network Operations Specialist: 62 required, 40 not taught here; impl: Network Operations Specialist: 62 required, 40 not taught here; ops: Network Operations Specialist: 62 required, 40 not taught here; auto: Software Developer: 84 required, 71 not taught here |
| Values recalled `kpi.validation.recall-accuracy` | validation | metric.validation-recall (own) |  |
| Scenarios applied `kpi.validation.applied-scenarios` | validation | metric.validation-applied (own) |  |
| Conflicts resolved `kpi.validation.conflicts-resolved` | validation | metric.conflicts-resolved (own) |  |
| Minutes on task `kpi.validation.time-on-task` | validation | metric.minutes-on-task (own) |  |

