# A+ Capstone Bench — skills sheet

12 graded tasks · 22 skills · 19 tools · 9 procedures · 3 standards (5 controls cited) · 0 tactics · 14 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Harden Windows with Firewall and Defender `comp.harden.windows-baseline` | Hardening and defence | SY0-701.d3, CIS.BENCHMARK | Secure the machine |
| Restore from backup and prove it `comp.respond.restore-test` | Incident response | CISSP.d7, SK0-005.d3, NIST.800-53.CP-4 | Take the final image and time the restore |
| Set recovery targets: RTO, RPO, MTTR `comp.respond.recovery-targets` | Incident response | CISSP.d7, SK0-005.d3, AZ-104.d5, SAA-C03.d4, NIST_800_34 | Take the final image and time the restore |
| Hash and log evidence `comp.forensics.hash-evidence` | Evidence and forensics | SY0-701.d4, CS0-003.d3, CY0-001.d2, ISO_27037 | Image the disk before anything changes |
| Keep a chain of custody `comp.forensics.chain-of-custody` | Evidence and forensics | SY0-701.d4, ISO_27037 | Hand it over |
| Receive hardware and list what arrived `comp.hardware.receive-and-inspect` | Server hardware | SK0-005.d1 | Read what is really inside |
| Write boot media and set the boot order `comp.hardware.boot-media` | Server hardware | SK0-005.d1 | Set the firmware baseline |
| Troubleshoot with the structured method `comp.sysadmin.troubleshooting-method` | System administration | SK0-005.d4, 200-301.d3, ITIL.problem | Work the fault with the six-step method; Work three tickets with the method |
| Patch systems and record it `comp.sysadmin.patching` | System administration | SK0-005.d3, NIST_800_40 | Install Windows and set the baseline |
| Verify backups before they are needed `comp.continuity.verify-backups` | Backup and recovery | SK0-005.d3, NIST.800-53.CP-4 | Prove the image restores |
| Assemble and hand over an as-built package `comp.docs.as-built-handover` | Documentation and records | SK0-005.d2, 200-301.d1, ITIL.transition | Hand it over |
| Identify and record PC components `comp.hardware.identify-components` | Server hardware | 220-1201.d3 | Read what is really inside |
| Diagnose a PC fault to a part `comp.hardware.pc-fault-diagnosis` | Server hardware | 220-1201.d5, ITIL.problem | Work the fault with the six-step method |
| Set firmware boot and security options `comp.hardware.firmware-settings` | Server hardware | 220-1201.d3 | Set the firmware baseline |
| Connect a PC and prove the link `comp.hardware.pc-network-connect` | Server hardware | 220-1201.d2 | Connect it and prove the link |
| Install Windows and drivers from media `comp.sysadmin.windows-install` | System administration | 220-1201.d6 | Install Windows and set the baseline |
| Set up a user, printer and displays `comp.sysadmin.user-and-peripherals` | System administration | 220-1201.d6, 220-1201.d3 | Set up the user and the peripherals |
| Support a user remotely `comp.sysadmin.remote-support` | System administration | 220-1201.d6 | Set up the user and the peripherals |
| Secure an endpoint: encryption, Defender, firewall `comp.sysadmin.endpoint-security` | System administration | 220-1201.d7, CIS.BENCHMARK | Secure the machine |
| Record a service ticket end to end `comp.docs.service-ticket` | Documentation and records | 220-1201.d9, ITIL.incident | Work three tickets with the method |
| Image a disk before changing it `comp.continuity.disk-image` | Backup and recovery | 220-1201.d9, NIST.800-53.CP-9 | Image the disk before anything changes |
| Restore a machine from an image, timed `comp.continuity.restore-from-image` | Backup and recovery | 220-1201.d9, NIST.800-53.CP-4 | Prove the image restores; Take the final image and time the restore |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Read what is really inside; Work the fault with the six-step method; Set the firmware baseline; Image the disk before anything changes; Set up the user and the peripherals; Hand it over |
| PowerShell | cli | Install Windows and set the baseline; Prove the image restores; Connect it and prove the link; Set up the user and the peripherals; Work three tickets with the method; Secure the machine; Take the final image and time the restore |
| ping / traceroute | cli | Connect it and prove the link; Work three tickets with the method |
| nslookup | cli | Connect it and prove the link; Work three tickets with the method |
| sha256sum | cli | Image the disk before anything changes; Install Windows and set the baseline; Prove the image restores; Secure the machine; Hand it over |
| Capstone forms | document | Read what is really inside; Work the fault with the six-step method; Set the firmware baseline; Image the disk before anything changes; Install Windows and set the baseline; Prove the image restores; Connect it and prove the link; Set up the user and the peripherals; Work three tickets with the method; Secure the machine; Take the final image and time the restore; Hand it over |
| Remote Desktop | app | Set up the user and the peripherals |
| Vendor documentation | document | Set the firmware baseline; Install Windows and set the baseline |
| Windows Firewall | app | Secure the machine |
| Microsoft Defender | app | Secure the machine |
| Windows Event Viewer | app | Work three tickets with the method |
| Windows | platform | Install Windows and set the baseline; Connect it and prove the link; Set up the user and the peripherals; Work three tickets with the method; Secure the machine |
| Hand tools | hardware | Read what is really inside; Work the fault with the six-step method; Work three tickets with the method |
| USB install media | hardware | Read what is really inside; Work the fault with the six-step method; Set the firmware baseline; Image the disk before anything changes; Install Windows and set the baseline; Hand it over |
| The bench PC | hardware | Read what is really inside; Work the fault with the six-step method; Set the firmware baseline; Image the disk before anything changes; Install Windows and set the baseline; Prove the image restores; Connect it and prove the link; Set up the user and the peripherals; Work three tickets with the method; Secure the machine; Take the final image and time the restore; Hand it over |
| Clonezilla | app | Image the disk before anything changes; Prove the image restores; Take the final image and time the restore |
| smartctl | cli | Read what is really inside |
| MemTest86+ | app | Work the fault with the six-step method |
| Quick Assist | app | Set up the user and the peripherals |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Operational runbook | runbook | ISO27001.A.5.37, NIST.CSF.PR.PS | Support Ticket Log | — |
| Incident record | incident | NIST.800-61.DETECT, ISO27001.A.5.26, NIST.CSF.RS.AN | Troubleshooting Log; Support Ticket Log | Work the fault with the six-step method; Work three tickets with the method |
| Recovery drill | recovery | NIST.800-34, NIST.CSF.RC.RP, ISO27001.A.5.30, NIST.800-53.CP-4 | Backup & Image Register | Prove the image restores; Take the final image and time the restore |
| Backup plan | recovery | ISO27001.A.8.13, NIST.800-53.CP-9, CIS.11 | Backup & Image Register | Image the disk before anything changes; Take the final image and time the restore |
| Chain of custody | custody | ISO27037, ISO27001.A.5.28, NIST.800-61 | Handover & As-Built | Hand it over |
| Hardening baseline | baseline | CIS.BENCHMARK, NIST.800-53.CM-6, ISO27001.A.8.9, NIST.CSF.PR.PS | OS Build & Baseline Record; Security Checklist | Secure the machine |
| Operational handover | handover | ITIL.transition, ISO27001.A.5.37, ITIL.knowledge | Handover & As-Built | Hand it over |
| Asset inventory | inventory | NIST.CSF.ID.AM, CIS.1, ISO27001.A.5.9, ITIL.asset | Intake & Bench Checklist; Asset & Build Sheet | — |
| Build record | build | ITIL.configuration, NIST.800-53.CM-2, ISO27001.A.8.9 | Asset & Build Sheet; OS Build & Baseline Record | — |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| NIST CSF | Read what is really inside; Work the fault with the six-step method; Set the firmware baseline; Image the disk before anything changes; Install Windows and set the baseline; Prove the image restores; Connect it and prove the link; Set up the user and the peripherals; Work three tickets with the method; Secure the machine; Take the final image and time the restore; Hand it over | — |
| CIS | Read what is really inside; Set the firmware baseline; Image the disk before anything changes; Install Windows and set the baseline; Prove the image restores; Set up the user and the peripherals; Secure the machine | — |
| NIST SP 800-53 | — | Intake & Bench Checklist; Asset & Build Sheet; Troubleshooting Log; OS Build & Baseline Record; Backup & Image Register; Support Ticket Log; Security Checklist; Handover & As-Built |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.800-53.CM-6 Configuration Settings | NIST_800_53 | OS Build & Baseline Record; Security Checklist |
| NIST.800-53.CM-8 System Component Inventory | NIST_800_53 | Intake & Bench Checklist; Asset & Build Sheet |
| NIST.800-53.CP-9 System Backup | NIST_800_53 | Backup & Image Register |
| NIST.800-53.IR-4 Incident Handling | NIST_800_53 | Troubleshooting Log; Support Ticket Log |
| NIST.800-53.PL-2 System Security and Privacy Plans | NIST_800_53 | Handover & As-Built |

Forms whose standard names a practice rather than a control:

- Intake & Bench Checklist: practice.asset-inventory
- Asset & Build Sheet: practice.asset-inventory
- Troubleshooting Log: practice.troubleshooting-method
- OS Build & Baseline Record: practice.hardening-baseline, practice.written-policy
- Backup & Image Register: practice.backup-before-change, practice.backups-tested
- Support Ticket Log: practice.troubleshooting-method, practice.work-tracked
- Security Checklist: practice.hardening-baseline, practice.written-policy
- Handover & As-Built: practice.as-built-documentation

## Tactics and practices

Adversary tactics are not part of this course.

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Set up the user and the peripherals; Secure the machine |
| Hash evidence at capture | ISO_27037 | Image the disk before anything changes; Hand it over |
| Backup before change | ITIL.change | Image the disk before anything changes |
| Hardening baseline | CIS.BENCHMARK | Install Windows and set the baseline; Secure the machine |
| Configuration record | ITIL.configuration | Set the firmware baseline; Connect it and prove the link; Set up the user and the peripherals |
| Build record | ITIL.configuration | Read what is really inside; Work the fault with the six-step method; Set the firmware baseline; Install Windows and set the baseline |
| Backups tested by restore | NIST.800-53.CP-4 | Prove the image restores; Take the final image and time the restore |
| Recovery objectives | NIST_800_34 | Take the final image and time the restore |
| Sign and version documents | ISO27001.7.5 | Hand it over |
| As-built documentation | ITIL.transition | Hand it over |
| Test and acceptance | ITIL.transition | Connect it and prove the link |
| Structured troubleshooting | ITIL.problem | Work the fault with the six-step method; Work three tickets with the method |
| Asset inventory | NIST.CSF.ID.AM | Read what is really inside |
| Work tracked on a board | ITIL.knowledge | Work three tickets with the method |

## KPI board

The sixteen numbers the Skill board keeps per member of this course, the catalogue row and kind of fact each one reads, and what it is counted over here, role by role.

| KPI | Family | Reads | Denominator in this course |
| --- | --- | --- | --- |
| Skills verified `kpi.technical.skills-verified` | technical | metric.skill-verified (own) | hw: 22 skills with a verifiable step; os: 22 skills with a verifiable step; support: 22 skills with a verifiable step; records: 22 skills with a verifiable step |
| Exam weight verified `kpi.technical.exam-weight-verified` | technical | metric.domain-weight-verified (own) | hw: 88 percent of the exam over 7 domains; os: 88 percent of the exam over 7 domains; support: 88 percent of the exam over 7 domains; records: 88 percent of the exam over 7 domains |
| Commands verified `kpi.technical.commands-verified` | technical | metric.tool-commands-verified (own) | hw: 19 verifiable steps that run a command; os: 19 verifiable steps that run a command; support: 19 verifiable steps that run a command; records: 19 verifiable steps that run a command |
| Procedures to standard `kpi.technical.procedures-to-standard` | technical | metric.procedure-to-standard (team) | hw: 9 procedures; os: 9 procedures; support: 9 procedures; records: 9 procedures |
| Faults resolved `kpi.problem-solving.faults-resolved` | problem-solving | metric.trouble-resolved (team) | hw: 2 fault, incident or triage tables; os: 2 fault, incident or triage tables; support: 2 fault, incident or triage tables; records: 2 fault, incident or triage tables |
| Verified after retry `kpi.problem-solving.persistence` | problem-solving | metric.ability-persistence (own) | hw: 19 verifiable steps; os: 19 verifiable steps; support: 19 verifiable steps; records: 19 verifiable steps |
| Stuck flags cleared `kpi.problem-solving.flags-cleared` | problem-solving | metric.ability-flags-cleared (own) | the stuck flags the member raises; no content denominator |
| Time to resolution `kpi.problem-solving.time-to-resolution` | problem-solving | metric.time-to-verify (own) | hw: 19 verifiable steps that can carry two stamps; os: 19 verifiable steps that can carry two stamps; support: 19 verifiable steps that can carry two stamps; records: 19 verifiable steps that can carry two stamps |
| Steps verified in order `kpi.execution.steps-in-order` | execution | metric.procedure-in-order (own) | hw: 6 tasks with two or more verifiable steps; os: 6 tasks with two or more verifiable steps; support: 6 tasks with two or more verifiable steps; records: 6 tasks with two or more verifiable steps |
| First-try verifications `kpi.execution.first-try` | execution | metric.ability-first-try (own) | hw: 19 verifiable steps; os: 19 verifiable steps; support: 19 verifiable steps; records: 19 verifiable steps |
| Files named to convention `kpi.execution.evidence-named` | execution | metric.evidence-naming (own) | the files the member hashes; no content denominator |
| Definition-of-Done met `kpi.execution.dod-met` | execution | metric.doc-dod-met (team) | hw: 39 checks on 8 forms; os: 39 checks on 8 forms; support: 39 checks on 8 forms; records: 39 checks on 8 forms |
| Decisions recorded `kpi.decision-making.decisions-recorded` | decision-making | metric.decision-recorded (team) | hw: 1 decision block; os: 1 decision block; support: 1 decision block; records: 1 decision block |
| Decisions justified `kpi.decision-making.decisions-justified` | decision-making | metric.decision-justified (team) | hw: 1 decision block; os: 1 decision block; support: 1 decision block; records: 1 decision block |
| Decisions approved `kpi.decision-making.decisions-approved` | decision-making | metric.decision-approved (team) | hw: 1 decision block; os: 1 decision block; support: 1 decision block; records: 1 decision block |
| Changes with rollback `kpi.decision-making.change-rollback` | decision-making | metric.procedure-change-recorded (team) | hw: 1 change table with a rollback column; os: 1 change table with a rollback column; support: 1 change table with a rollback column; records: 1 change table with a rollback column |
| Hand-offs completed `kpi.teamwork.handoffs` | teamwork | metric.collab-handoffs (team) | hw: 12 hand-offs; os: 12 hand-offs; support: 12 hand-offs; records: 12 hand-offs |
| RACI respected `kpi.teamwork.raci-respected` | teamwork | metric.collab-raci-respected (team) | hw: 8 forms with a RACI; os: 8 forms with a RACI; support: 8 forms with a RACI; records: 8 forms with a RACI |
| Peer reviews given `kpi.teamwork.peer-reviews-given` | teamwork | metric.collab-peer-reviews-given (own) | the reviews assigned to the member; no content denominator |
| Teammate steps ticked `kpi.teamwork.teammate-steps` | teamwork | metric.collab-teammate-steps (own) | a count; no denominator |
| On time `kpi.professionalism.on-time` | professionalism | metric.ability-deadline-adherence (own) | hw: 12 tasks of the role; os: 12 tasks of the role; support: 12 tasks of the role; records: 12 tasks of the role |
| Document control complete `kpi.professionalism.document-control` | professionalism | metric.doc-control-complete (team) | hw: 8 forms; os: 8 forms; support: 8 forms; records: 8 forms |
| Controls cited `kpi.professionalism.controls-cited` | professionalism | metric.standard-controls-cited (team) | hw: 2 control codes on 2 forms; os: 1 control code on 2 forms; support: 1 control code on 1 form; records: 3 control codes on 3 forms |
| Instructor approved `kpi.professionalism.instructor-approved` | professionalism | metric.doc-instructor-approved (team) | hw: 8 forms; os: 8 forms; support: 8 forms; records: 8 forms |
| Skills proved twice `kpi.growth.skills-transferred` | growth | metric.skill-transfer (own) | hw: 2 skills on two or more tasks; os: 2 skills on two or more tasks; support: 2 skills on two or more tasks; records: 2 skills on two or more tasks |
| Skills retained `kpi.growth.retention` | growth | metric.ability-recall (own) | hw: 22 skills with a verifiable step; os: 22 skills with a verifiable step; support: 22 skills with a verifiable step; records: 22 skills with a verifiable step |
| Learning velocity `kpi.growth.learning-velocity` | growth | metric.time-learning-velocity (own) | the verification stamps of the last two months; no content denominator |
| Profile coverage `kpi.growth.profile-coverage` | growth | metric.profile-coverage (own) | hw: System Administrator: 117 required, 100 not taught here; os: System Administrator: 117 required, 100 not taught here; support: System Administrator: 117 required, 100 not taught here; records: System Administrator: 117 required, 100 not taught here |
| Values recalled `kpi.validation.recall-accuracy` | validation | metric.validation-recall (own) |  |
| Scenarios applied `kpi.validation.applied-scenarios` | validation | metric.validation-applied (own) |  |
| Conflicts resolved `kpi.validation.conflicts-resolved` | validation | metric.conflicts-resolved (own) |  |
| Minutes on task `kpi.validation.time-on-task` | validation | metric.minutes-on-task (own) |  |

