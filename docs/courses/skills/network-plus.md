# Network+ Capstone Branch — skills sheet

13 graded tasks and 2 advanced · 25 skills · 13 tools · 11 procedures · 2 standards (0 controls cited) · 0 tactics · 17 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Troubleshoot with the structured method `comp.sysadmin.troubleshooting-method` | System administration | SK0-005.d4, 200-301.d3, ITIL.problem | Work three faults by layer |
| Design a hierarchical network with boundaries `comp.network.hierarchical-design` | Network engineering | 200-301.d1 | Plan the addresses and the VLANs |
| Bring switches up with management addressing `comp.network.switch-bringup` | Network engineering | 200-301.d2 | Cut the switches into VLANs; Build it on hardware |
| Cut a network into VLANs with trunks `comp.network.vlans-and-trunks` | Network engineering | 200-301.d2 | Cut the switches into VLANs; Build it on hardware |
| Route between VLANs with SVIs or subinterfaces `comp.network.inter-vlan-routing` | Network engineering | 200-301.d3 | Route between them and out |
| Route out with a default route and PAT `comp.network.default-route-and-nat` | Network engineering | 200-301.d4 | Route between them and out |
| Turn a policy into placed access lists `comp.network.acls` | Network engineering | 200-301.d5, NIST.800-53.SC-7 | Enforce the policy |
| Back up configurations and prove a restore `comp.network.config-backup` | Network engineering | 200-301.d4, NIST.800-53.CP-9 | Change it properly |
| Poll with SNMP and centralise syslog `comp.observe.snmp-and-syslog` | Monitoring and observability | 200-301.d4, NIST.CSF.DE.CM | Watch it and back it up |
| Record changes with rollback and approver `comp.docs.change-control` | Documentation and records | SK0-005.d2, 200-301.d4, ITIL.change | Change it properly |
| Assemble and hand over an as-built package `comp.docs.as-built-handover` | Documentation and records | SK0-005.d2, 200-301.d1, ITIL.transition | Plan the move and hand over |
| Gather requirements from the business `comp.docs.requirements-gathering` | Documentation and records | 200-301.d1 | Discover before you design |
| Survey a site before designing `comp.docs.site-survey` | Documentation and records | 200-301.d1 | Discover before you design |
| Keep a build log with proof per step `comp.docs.build-log` | Documentation and records | 200-301.d2, ITIL.configuration | Build the empty topology |
| Work a ticket with scope and layers `comp.docs.work-a-ticket` | Documentation and records | 200-301.d3, ITIL.incident | Work three faults by layer |
| List known issues honestly `comp.docs.known-issues` | Documentation and records | 200-301.d1, ITIL.transition | Write down what differed |
| Plan subnets and VLANs from one rule `comp.network.subnet-plan` | Network engineering | N10-009.d1 | Plan the addresses and the VLANs |
| Build and cable a topology in a simulator `comp.network.topology-in-simulator` | Network engineering | N10-009.d2 | Build the empty topology |
| Serve DHCP, DNS and NAT for a site `comp.network.dhcp-dns-services` | Network engineering | N10-009.d2 | Hand out addresses and names |
| Secure access ports and the guest VLAN `comp.network.port-security` | Network engineering | N10-009.d4 | Enforce the policy |
| Collect logs and back up configurations `comp.network.syslog-and-backups` | Network engineering | N10-009.d3 | Watch it and back it up |
| Isolate a network fault by layer `comp.network.fault-isolation` | Network engineering | N10-009.d5, ITIL.problem | Work three faults by layer |
| Research equipment against a design `comp.docs.equipment-research` | Documentation and records | N10-009.d2 | Research the equipment |
| Price a bill of materials `comp.docs.bill-of-materials` | Documentation and records | N10-009.d3 | Price the bill of materials |
| Plan a move from simulation to hardware `comp.docs.migration-plan` | Documentation and records | N10-009.d3, ITIL.transition | Plan the move and hand over |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Cut the switches into VLANs; Route between them and out; Hand out addresses and names; Enforce the policy; Change it properly |
| PowerShell | cli | Build the empty topology; Hand out addresses and names |
| ping / traceroute | cli | Route between them and out; Hand out addresses and names; Enforce the policy; Work three faults by layer |
| nslookup | cli | Hand out addresses and names |
| sha256sum | cli | Plan the move and hand over |
| Capstone forms | document | Discover before you design; Plan the addresses and the VLANs; Build the empty topology; Cut the switches into VLANs; Route between them and out; Hand out addresses and names; Watch it and back it up; Enforce the policy; Change it properly; Work three faults by layer; Research the equipment; Price the bill of materials; Plan the move and hand over; Build it on hardware; Write down what differed |
| Notes | document | Discover before you design; Write down what differed |
| Spreadsheet | app | Plan the addresses and the VLANs; Research the equipment; Price the bill of materials |
| Terminal program | app | Build it on hardware |
| Vendor documentation | document | Research the equipment |
| Cisco IOS | appliance | Build the empty topology; Cut the switches into VLANs; Route between them and out; Hand out addresses and names; Watch it and back it up; Enforce the policy; Change it properly; Work three faults by layer; Build it on hardware |
| Console cable | hardware | Build it on hardware |
| Network simulator | app | Build the empty topology; Cut the switches into VLANs; Route between them and out; Hand out addresses and names; Watch it and back it up; Enforce the policy; Change it properly; Work three faults by layer |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Incident record | incident | NIST.800-61.DETECT, ISO27001.A.5.26, NIST.CSF.RS.AN | Change & Fault Log | Work three faults by layer |
| Change record | change | ITIL.change, ISO27001.A.8.32, NIST.800-53.CM-3, SOC2.CC8.1 | Change & Fault Log | Change it properly |
| Backup plan | recovery | ISO27001.A.8.13, NIST.800-53.CP-9, CIS.11 | Change & Fault Log | Watch it and back it up; Change it properly |
| Chain of custody | custody | ISO27037, ISO27001.A.5.28, NIST.800-61 | Migration Plan & Handover | Plan the move and hand over |
| Hardening baseline | baseline | CIS.BENCHMARK, NIST.800-53.CM-6, ISO27001.A.8.9, NIST.CSF.PR.PS | — | Enforce the policy |
| Operational handover | handover | ITIL.transition, ISO27001.A.5.37, ITIL.knowledge | Migration Plan & Handover | Plan the move and hand over |
| Asset inventory | inventory | NIST.CSF.ID.AM, CIS.1, ISO27001.A.5.9, ITIL.asset | Lab & Path Register; Equipment Research & BOM | — |
| Network design | design | NIST.800-53.SC-7, ISO27001.A.8.22, NIST.CSF.PR.IR | Design Brief & IP Plan; VLAN & Port Map | — |
| Requirements record | design | ISO42010, WAF | Design Brief & IP Plan | — |
| Build record | build | ITIL.configuration, NIST.800-53.CM-2, ISO27001.A.8.9 | Configuration Record | — |
| Test and acceptance record | build | ITIL.transition, NIST.800-53.CA-2, ISO27001.A.8.29 | Services & Verification Log | Hand out addresses and names |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| Network+ N10-009 | Discover before you design; Plan the addresses and the VLANs; Build the empty topology; Cut the switches into VLANs; Route between them and out; Hand out addresses and names; Watch it and back it up; Enforce the policy; Change it properly; Work three faults by layer; Research the equipment; Price the bill of materials; Plan the move and hand over; Build it on hardware; Write down what differed | — |
| ITIL 4 | Watch it and back it up; Change it properly; Work three faults by layer; Plan the move and hand over | — |

Forms whose standard names a practice rather than a control:

- Lab & Path Register: practice.asset-inventory
- Design Brief & IP Plan: practice.addressing-plan, practice.segmentation
- VLAN & Port Map: practice.addressing-plan
- Configuration Record: practice.configuration-record
- Services & Verification Log: practice.test-and-acceptance
- Change & Fault Log: practice.change-control, practice.patch-management, practice.runbooks-written
- Equipment Research & BOM: practice.asset-inventory
- Migration Plan & Handover: practice.as-built-documentation

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Default deny | NIST.800-53.SC-7 | Enforce the policy |
| Network segmentation | ISO27001.A.8.22 | Plan the addresses and the VLANs; Cut the switches into VLANs |
| Backup before change | ITIL.change | Watch it and back it up; Change it properly |
| Change control | ITIL.change | Change it properly |
| Hardening baseline | CIS.BENCHMARK | Enforce the policy |
| Configuration record | ITIL.configuration | Cut the switches into VLANs; Route between them and out |
| Build record | ITIL.configuration | Build the empty topology; Build it on hardware |
| Centralised logging | NIST.CSF.DE.CM | Watch it and back it up |
| Lessons learned | NIST.800-61.POST | Write down what differed |
| Sign and version documents | ISO27001.7.5 | Plan the move and hand over |
| As-built documentation | ITIL.transition | Plan the move and hand over; Write down what differed |
| Requirements before design | ISO_42010 | Discover before you design; Research the equipment |
| Addressing plan | NIST.CSF.ID.AM | Plan the addresses and the VLANs |
| Test and acceptance | ITIL.transition | Route between them and out; Hand out addresses and names; Build it on hardware |
| Structured troubleshooting | ITIL.problem | Work three faults by layer |
| Asset inventory | NIST.CSF.ID.AM | Price the bill of materials |
| Work tracked on a board | ITIL.knowledge | Work three faults by layer |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.ability.skills-verified` | ability | metric.skill-verified (own) | design: 18 skills with a verifiable step; sw: 18 skills with a verifiable step; rt: 18 skills with a verifiable step; ops: 18 skills with a verifiable step |
| Exam weight verified `kpi.ability.exam-weight-verified` | ability | metric.domain-weight-verified (own) | design: 100 percent of the exam over 5 domains; sw: 100 percent of the exam over 5 domains; rt: 100 percent of the exam over 5 domains; ops: 100 percent of the exam over 5 domains |
| Profile coverage `kpi.ability.profile-coverage` | ability | metric.profile-coverage (own) | design: Network Operations Specialist: 62 required, 38 not taught here; sw: Network Operations Specialist: 62 required, 38 not taught here; rt: Network Operations Specialist: 62 required, 38 not taught here; ops: Network Operations Specialist: 62 required, 38 not taught here |
| Skills proved twice `kpi.ability.skills-transferred` | ability | metric.skill-transfer (own) | design: 2 skills on two or more tasks; sw: 2 skills on two or more tasks; rt: 2 skills on two or more tasks; ops: 2 skills on two or more tasks |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | design: 5 tasks with two or more verifiable steps; sw: 5 tasks with two or more verifiable steps; rt: 5 tasks with two or more verifiable steps; ops: 5 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | design: 15 verifiable steps; sw: 15 verifiable steps; rt: 15 verifiable steps; ops: 15 verifiable steps |
| Commands verified `kpi.execution.commands-verified` | execution | metric.tool-commands-verified (own) | design: 15 verifiable steps that run a command; sw: 15 verifiable steps that run a command; rt: 15 verifiable steps that run a command; ops: 15 verifiable steps that run a command |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Procedures to standard `kpi.procedure.followed-to-standard` | procedure | metric.procedure-to-standard (team) | design: 11 procedures; sw: 11 procedures; rt: 11 procedures; ops: 11 procedures |
| Definition-of-Done met `kpi.procedure.dod-met` | procedure | metric.doc-dod-met (team) | design: 31 checks on 8 forms; sw: 31 checks on 8 forms; rt: 31 checks on 8 forms; ops: 31 checks on 8 forms |
| Controls cited `kpi.procedure.controls-cited` | procedure | metric.standard-controls-cited (team) | design: 0 control codes on 3 forms; sw: 0 control codes on 1 form; rt: 0 control codes on 2 forms; ops: 0 control codes on 2 forms |
| Document control complete `kpi.procedure.document-control` | procedure | metric.doc-control-complete (team) | design: 8 forms; sw: 8 forms; rt: 8 forms; ops: 8 forms |
| Submissions rubric-green `kpi.outcome.rubric-green` | outcome | metric.doc-rubric-green (team) | the submissions the member freezes; no content denominator |
| Hand-offs completed `kpi.outcome.handoffs` | outcome | metric.collab-handoffs (team) | design: 0 hand-offs; sw: 0 hand-offs; rt: 0 hand-offs; ops: 0 hand-offs |
| Instructor approved `kpi.outcome.instructor-approved` | outcome | metric.doc-instructor-approved (team) | design: 8 forms; sw: 8 forms; rt: 8 forms; ops: 8 forms |
| Capstone filed `kpi.outcome.capstone-filed` | outcome | metric.outcome-capstone-filed (team) | one capstone per course |

