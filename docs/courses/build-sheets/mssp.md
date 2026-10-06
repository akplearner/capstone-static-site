# MSSP: SOC 2 + ISO 27001 Engagement — build sheet

What the architecture gains each week, what each part is for, which form records it, and the process the week walks through. Generated from the course document by `npm run content:export`; edit the picture module, not this file.

## Week 0 — Onboarding & Scoping

> The engagement at signing: the client’s endpoints and servers, the edge that will forward their logs, your analysts and the signed scope.

You start with:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Endpoints | What staff work on; where phishing and malware land | Statement of Applicability (SoA) |
| Servers | The systems the contract protects and the pentest targets | Statement of Applicability (SoA) |
| Client edge | The boundary, and the one path the client’s logs take out | Control Matrix |
| Analyst bench | Your team: works the queue and reports to the client | Detection & Response Metrics |
| Engagement & scope | Records the signed scope, RoE and the boundary | Engagement Agreement & Scope |

**Process — Onboarding & scoping:** analysts → r_engagement (sign the scope and RoE); r_engagement → servers (what the contract covers).

## Week 1 — Gap Assessment

> New: the pentester, the vulnerability scanner, the SoA and the gap assessment. The gap says what the client has and lacks.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Vulnerability scanner | Measures the estate against the baseline, scored | Gap Assessment |
| Pentester | Proves the gaps, then proves the fixes on retest | Retest & Remediation-Validation Report |
| SoA | Records which controls apply and why | Statement of Applicability (SoA) |
| Gap assessment | Records the attack surface and the baseline gaps, scored | Gap Assessment |

**Process — Gap assessment:** pentester → client-edge (external attack surface); scanner → servers (CIS gap scan, scored); analysts → r_soa (statement of applicability).

## Week 2 — Control Implementation

> New: client identity with MFA, EDR, the backup target and the SIEM. The client’s logs reach your SOC; the control matrix is live.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Client identity | One account per person; MFA is the first control implemented | Control Matrix |
| EDR agents | Sees process activity on every host and feeds the SIEM | Control Matrix |
| Backup target | The copy the recovery promise in the contract rests on | Control Matrix |
| SIEM / log platform | Collects the client’s logs and keeps them for the contract term | Detection Rules |
| Control matrix | Records each control, its owner and its evidence | Control Matrix |

**Process — Control implementation:** r_matrix → servers (hardening · MFA · logging); idp → endpoints (MFA everywhere); client-edge → siem (encrypted log stream).

## Week 3 — Validation & Testing

> New: detection rules, the ticket queue and threat-intel feeds. The pentest proves the controls; every alert runs on an SLA clock.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Detection rules | Turns the client’s logs into alerts worth a ticket | Detection Rules |
| Ticket queue | Every alert timed from raise to close: MTTD and MTTR | Detection & Response Metrics |
| Threat-intel feeds | Indicators the rules match against | Detection Rules |
| Detection rules | Records every rule, what it catches and its test | Detection Rules |
| Retest report | Records each finding, the fix and the retest result | Retest & Remediation-Validation Report |

**Process — Validation & testing:** pentester → servers (pentest); siem → tickets (alert → ticket, on the clock); analysts → pentester (fix and retest).

## Week 4 — Audit Readiness

> New: the evidence vault and the auditor. MTTD and MTTR are measured and the audit packet is handed over.

This week adds:

| Part | Purpose | Recorded in |
| --- | --- | --- |
| Evidence vault | Hashed copies of every artefact the packet cites | Audit Evidence Packet |
| Auditor | Reads the evidence packet and decides | Internal Audit Report |
| D&R metrics | Records MTTD, MTTR and the SLA results | Detection & Response Metrics |
| Internal audit | Records the audit findings before the auditor arrives | Internal Audit Report |
| Evidence packet | The capstone: everything the auditor will ask for | Audit Evidence Packet |

**Process — Audit readiness:** tickets → analysts (MTTD · MTTR); analysts → evidence (the evidence packet); evidence → auditor (Type I · Stage 1).

## The roles

| Role | Mission | Drafts | Reviews | Approves | Hands to | Waits on |
| --- | --- | --- | --- | --- | --- | --- |
| Offensive Security (Penetration Tester) | Penetration testing and control validation for the client. | Retest & Remediation-Validation Report, Gap Assessment | Detection Rules, Detection & Response Metrics, Internal Audit Report | — | Detection & Response (MDR Analyst), Governance & Audit (vCISO) | Detection & Response (MDR Analyst), Governance & Audit (vCISO) |
| Detection & Response (MDR Analyst) | Hardening, detection engineering and incident response for the client. | Detection Rules, Detection & Response Metrics | Engagement Agreement & Scope, Statement of Applicability (SoA), Control Matrix, Retest & Remediation-Validation Report, Gap Assessment, Audit Evidence Packet | — | Offensive Security (Penetration Tester), Governance & Audit (vCISO) | Offensive Security (Penetration Tester), Governance & Audit (vCISO) |
| Governance & Audit (vCISO) | Scope, risk, controls and the audit evidence spine. | Engagement Agreement & Scope, Statement of Applicability (SoA), Control Matrix, Internal Audit Report, Audit Evidence Packet | — | Engagement Agreement & Scope, Statement of Applicability (SoA), Control Matrix, Retest & Remediation-Validation Report, Gap Assessment, Detection Rules, Detection & Response Metrics, Internal Audit Report, Audit Evidence Packet | Offensive Security (Penetration Tester), Detection & Response (MDR Analyst) | Offensive Security (Penetration Tester), Detection & Response (MDR Analyst) |

