# AWS Security Specialty — the Secure Workload — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Set up the account

> The account with a budget guard, root locked with MFA, daily work on a scoped identity, and the folder ready.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Root user | The account itself, protected with MFA and used for nothing routine | Account & Access Register |
| IAM user | The scoped identity daily work runs as, never root | Account & Access Register |
| 1 Account & access | Records the account, root, the MFA identity and the budget | Account & Access Register |

**Process — Set up: the account, an MFA identity, the folder:** root → user (daily work moves off root).

## Week 1 — Identity and governance

> New: a role per focus assumed with MFA, least privilege proved on a denial, and the governance baseline on.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Scoped roles | A role per focus, assumed with MFA and proved to deny | Identity & Access Matrix |
| Trail & Config | A multi-region validated trail and a config recorder under everything | Control Baseline |
| Control baseline | Every control named with its state — the floor it all stands on | Control Baseline |
| 2 Identity matrix | Records the roles, least privilege and the proven denial | Identity & Access Matrix |
| 3 Control baseline | Records the account-wide governance controls | Control Baseline |

**Process — Week 1: least privilege, proved, and the baseline:** user → role (assumes a scoped role with MFA); role → bucket (allowed in, denied what it must not); baseline_c → baseline (trail and config on).

## Week 2 — Infrastructure security

> New: the segmented network, least-exposure security groups, and the host reached through SSM with SSH closed.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| VPC | The network, segmented so the private subnet has no internet door | Network Security Record |
| Security groups | Only the needed port open, proved by a dry-run | Network Security Record |
| The host | Reached through SSM with port 22 closed to everyone | Network Security Record |
| SSM | The audited management path that lets port 22 stay closed | Network Security Record |
| 4 Network record | Records the segments, the groups and the closed SSH | Network Security Record |

**Process — Week 2: segment it, fence it, close the door:** vpc → host (private subnet, no internet door); sg → host (only the needed port); ssm → host (reached without SSH).

## Week 3 — Data protection and detection

> New: a customer-managed key, a locked bucket that refuses an unencrypted put, and the findings triaged.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| KMS key | The customer-managed key the data is encrypted with | Data Protection Record |
| Data bucket | Public access blocked, an unencrypted upload refused | Data Protection Record |
| Findings | The detection findings, sorted so the fire is first | Detection & Findings Log |
| 5 Data protection | Records the key, the locked bucket and the key decision | Data Protection Record |
| 6 Detection log | Records the findings, the triage and the alarm | Detection & Findings Log |

**Process — Week 3: its own key, a locked bucket, the findings:** kms → bucket (customer-managed key); bucket → findings (unencrypted put refused); findings → incident (triaged, top one is the incident).

## Week 4 — Incident response and handover

> New: the incident contained one change per row, the alarm wired to page, and the baseline handed over with custody.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Metric alarm | A metric filter and alarm so the next unauthorized call pages | Detection & Findings Log |
| The actor | The unauthorized caller the incident is worked against | Incident Response Log |
| Incident log | The incident contained one action per row, failures kept | Incident Response Log |
| Custody | A hash for every policy, finding and log the course produced | Security Handover & Baseline |
| 7 Incident log | Records the incident worked one change per row | Incident Response Log |
| 8 Handover | The capstone: the baseline as it is, with custody for every artifact | Security Handover & Baseline |
| 9 Portfolio | The repository, case study, resume bullets and diagram | Portfolio |

**Process — Week 4: work the incident, wire the alarm, hand over:** attacker → incident (contained one change per row); findings → alarm (the next one pages); custody → r_handover (baseline and custody handed over).

## Week 5 — AI security validation: Attack the model

Nothing new is built this week; the process is drawn over the picture.

## Week 6 — AI security validation: A suite that holds

Nothing new is built this week; the process is drawn over the picture.

## Week 7 — Local LLM serving: Serve a model locally

Nothing new is built this week; the process is drawn over the picture.

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Identity & Access (Identity Lead) | Leads the identity record: users, roles, least-privilege policies and the proof of every denial. | Identity & Access Matrix | Account & Access Register, Control Baseline, Security Handover & Baseline, Portfolio | Data Protection Record, Incident Response Log | Infrastructure Security (Network Lead), Detection & Response (SecOps Lead) | Data Protection (Data Lead), Detection & Response (SecOps Lead) |
| Infrastructure Security (Network Lead) | Leads the infrastructure record: the network, the segments, the security groups and the exposure. | Network Security Record | Detection & Findings Log, Incident Response Log | Account & Access Register, Identity & Access Matrix, Control Baseline, Security Handover & Baseline, Portfolio | Data Protection (Data Lead), Detection & Response (SecOps Lead) | Identity & Access (Identity Lead), Detection & Response (SecOps Lead) |
| Data Protection (Data Lead) | Leads the data record: the keys, the encryption, bucket policies and what stays private. | Data Protection Record | Network Security Record | Detection & Findings Log | Identity & Access (Identity Lead), Detection & Response (SecOps Lead) | Infrastructure Security (Network Lead), Detection & Response (SecOps Lead) |
| Detection & Response (SecOps Lead) | Leads the records that outlive the build: detection, the incident log, the baseline and handover. | Account & Access Register, Control Baseline, Detection & Findings Log, Incident Response Log, Security Handover & Baseline, Portfolio | Identity & Access Matrix, Data Protection Record | Network Security Record | Identity & Access (Identity Lead), Infrastructure Security (Network Lead), Data Protection (Data Lead) | Identity & Access (Identity Lead), Infrastructure Security (Network Lead), Data Protection (Data Lead) |

