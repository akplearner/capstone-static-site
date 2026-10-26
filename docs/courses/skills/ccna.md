# CCNA Network Capstone — skills sheet

11 graded tasks and 8 advanced · 26 skills · 7 tools · 13 procedures · 4 standards (2 controls cited) · 0 tactics · 23 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Troubleshoot with the structured method `comp.sysadmin.troubleshooting-method` | System administration | SK0-005.d4, 200-301.d3, ITIL.problem | Work a ticket, not a hunch |
| Design a hierarchical network with boundaries `comp.network.hierarchical-design` | Network engineering | 200-301.d1 | Design the shape |
| Bring switches up with management addressing `comp.network.switch-bringup` | Network engineering | 200-301.d2 | Bring the first switches up |
| Cut a network into VLANs with trunks `comp.network.vlans-and-trunks` | Network engineering | 200-301.d2 | Cut the network into departments |
| Route between VLANs with SVIs or subinterfaces `comp.network.inter-vlan-routing` | Network engineering | 200-301.d3 | Route between the departments |
| Survive a pulled cable with spanning tree `comp.network.spanning-tree` | Network engineering | 200-301.d2 | Survive a cable being pulled |
| Join sites with OSPF adjacencies `comp.network.ospf` | Network engineering | 200-301.d3 | Join the second building |
| Route out with a default route and PAT `comp.network.default-route-and-nat` | Network engineering | 200-301.d4 | One way out to the internet |
| Turn a policy into placed access lists `comp.network.acls` | Network engineering | 200-301.d5, NIST.800-53.SC-7 | Turn the policy into access lists |
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
| Linux shell | cli | Back it up, then change it properly; Build a small NOC; The network as data; Configure from the source of truth |
| ping / traceroute | cli | Join the second building |
| Capstone forms | document | Cut the network into departments; Turn the policy into access lists; Back it up, then change it properly; Work a ticket, not a hunch; Configure from the source of truth; Something breaks — work it properly; Hand the network over |
| Notes | document | Discover before you design; Design the shape |
| Wireshark | app | Work a ticket, not a hunch |
| NetBox | service | A source of truth, not a spreadsheet |
| Cisco IOS | appliance | Bring the first switches up; Cut the network into departments; Route between the departments; Survive a cable being pulled; Join the second building; One way out to the internet; Turn the policy into access lists; Harden the management plane; Put the WLANs on the air; Back it up, then change it properly; Build a small NOC; Work a ticket, not a hunch; Something breaks — work it properly |

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

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| NIST CSF | Turn the policy into access lists; Something breaks — work it properly | — |
| CIS | Harden the management plane | — |
| CCNA 200-301 | Discover before you design; Design the shape; Bring the first switches up; Cut the network into departments; Route between the departments; Survive a cable being pulled; Join the second building; One way out to the internet; Turn the policy into access lists; Harden the management plane; Put the WLANs on the air; A source of truth, not a spreadsheet; Back it up, then change it properly; Build a small NOC; Work a ticket, not a hunch; The network as data; Configure from the source of truth; Something breaks — work it properly; Hand the network over | — |
| ITIL 4 | Discover before you design; A source of truth, not a spreadsheet; Back it up, then change it properly; Work a ticket, not a hunch; Something breaks — work it properly; Hand the network over | Operations & Change Records; Monitoring & Incident Log |

| Control cited | Standard | By |
| --- | --- | --- |
| ITIL.change Change enablement | ITIL | Operations & Change Records |
| ITIL.problem Problem management | ITIL | Monitoring & Incident Log |

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
| Default deny | NIST.800-53.SC-7 | Turn the policy into access lists |
| Network segmentation | ISO27001.A.8.22 | Cut the network into departments; Put the WLANs on the air |
| Encryption in transit | NIST.800-53.SC-8 | Harden the management plane |
| Backup before change | ITIL.change | Back it up, then change it properly |
| Change control | ITIL.change | Back it up, then change it properly; Something breaks — work it properly |
| Hardening baseline | CIS.BENCHMARK | Harden the management plane |
| Configuration record | ITIL.configuration | Cut the network into departments; One way out to the internet |
| Build record | ITIL.configuration | Bring the first switches up |
| Infrastructure as code | WAF.operational-excellence | The network as data; Configure from the source of truth |
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
| Redundant paths | WAF.reliability | Survive a cable being pulled |
| Idempotent automation | WAF.operational-excellence | Configure from the source of truth |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.ability.skills-verified` | ability | metric.skill-verified (own) | arch: 0 skills with a verifiable step; impl: 0 skills with a verifiable step; ops: 0 skills with a verifiable step; auto: 0 skills with a verifiable step |
| Exam weight verified `kpi.ability.exam-weight-verified` | ability | metric.domain-weight-verified (own) | arch: 100 percent of the exam over 6 domains; impl: 100 percent of the exam over 6 domains; ops: 100 percent of the exam over 6 domains; auto: 100 percent of the exam over 6 domains |
| Profile coverage `kpi.ability.profile-coverage` | ability | metric.profile-coverage (own) | arch: Network Operations Specialist: 53 required, 31 not taught here; impl: Network Operations Specialist: 53 required, 31 not taught here; ops: Network Operations Specialist: 53 required, 31 not taught here; auto: Software Developer: 81 required, 68 not taught here |
| Skills proved twice `kpi.ability.skills-transferred` | ability | metric.skill-transfer (own) | arch: 1 skill on two or more tasks; impl: 1 skill on two or more tasks; ops: 1 skill on two or more tasks; auto: 1 skill on two or more tasks |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | arch: 0 tasks with two or more verifiable steps; impl: 0 tasks with two or more verifiable steps; ops: 0 tasks with two or more verifiable steps; auto: 0 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | arch: 0 verifiable steps; impl: 0 verifiable steps; ops: 0 verifiable steps; auto: 0 verifiable steps |
| Commands verified `kpi.execution.commands-verified` | execution | metric.tool-commands-verified (own) | arch: 0 verifiable steps that run a command; impl: 0 verifiable steps that run a command; ops: 0 verifiable steps that run a command; auto: 0 verifiable steps that run a command |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Procedures to standard `kpi.procedure.followed-to-standard` | procedure | metric.procedure-to-standard (team) | arch: 13 procedures; impl: 13 procedures; ops: 13 procedures; auto: 13 procedures |
| Definition-of-Done met `kpi.procedure.dod-met` | procedure | metric.doc-dod-met (team) | arch: 37 checks on 10 forms; impl: 37 checks on 10 forms; ops: 37 checks on 10 forms; auto: 37 checks on 10 forms |
| Controls cited `kpi.procedure.controls-cited` | procedure | metric.standard-controls-cited (team) | arch: 0 control codes on 5 forms; impl: 0 control codes on 1 form; ops: 2 control codes on 3 forms; auto: 0 control codes on 1 form |
| Document control complete `kpi.procedure.document-control` | procedure | metric.doc-control-complete (team) | arch: 10 forms; impl: 10 forms; ops: 10 forms; auto: 10 forms |
| Submissions rubric-green `kpi.outcome.rubric-green` | outcome | metric.doc-rubric-green (team) | the submissions the member freezes; no content denominator |
| Hand-offs completed `kpi.outcome.handoffs` | outcome | metric.collab-handoffs (team) | arch: 0 hand-offs; impl: 0 hand-offs; ops: 0 hand-offs; auto: 0 hand-offs |
| Instructor approved `kpi.outcome.instructor-approved` | outcome | metric.doc-instructor-approved (team) | arch: 10 forms; impl: 10 forms; ops: 10 forms; auto: 10 forms |
| Capstone filed `kpi.outcome.capstone-filed` | outcome | metric.outcome-capstone-filed (team) | one capstone per course |

