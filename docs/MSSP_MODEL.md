# The Capstone as a Real MSSP — SOC 2 + ISO 27001 Engagement Model

> **What this is.** The current Security+ capstone teaches three roles (Red, Blue, GRC) running a
> 4-week engagement (plus Week 0 lab setup) against a single practice lab. This document reframes
> that same shape as a **real Managed Security Service Provider (MSSP)** serving *multiple clients*,
> and maps each role's week-by-week work to the two audit frameworks a young MSSP actually sells
> against: **SOC 2** (AICPA Trust Services Criteria) and **ISO/IEC 27001:2022**. It is the
> reference for a future "MSSP / Compliance" course track and a north-star for how the roles map to
> professional practice.
>
> **What this is *not*.** It is not a change to the shipped Security+ course, and it is not
> audit-grade compliance advice. Control counts and cell-level crosswalk mappings below are
> **directional** and must be verified against the official AICPA Trust Services Criteria document
> and the AICPA/NIST crosswalk spreadsheets before they drive any grading or client work
> (see [Accuracy & sources](#accuracy--sources)).

Related: [`ARCHITECTURE.md`](ARCHITECTURE.md) · [`CURRENT_STATE.md`](CURRENT_STATE.md) ·
[`ROADMAP.md`](ROADMAP.md) · [`INTEGRATION_CERTHATCH.md`](INTEGRATION_CERTHATCH.md)

---

## 1. The reframe: from a course to a service

The capstone today is a **2-dimensional grid**: `Role × Week`. One team, one lab, four weeks, three
gates. A real MSSP adds **two more dimensions**:

| Dimension | Capstone today | Real MSSP |
|---|---|---|
| **Role** | Red / Blue / GRC | Same three families, professionalized (see §2) |
| **Week** | Week 0–4, fixed | **Engagement phase** — repeats per client, on the client's clock |
| **Client** | one shared lab | **many tenants**, each isolated, each at a different phase |
| **Framework** | tags (NIST CSF, CIS, OWASP, ISO 27001, 800-115, 800-61) | **the product you sell**: SOC 2 and/or ISO 27001 attestation readiness |

So the professional model is **`Client × Engagement-phase × Role`**, where the "week" axis becomes a
repeatable **engagement lifecycle** the MSSP runs for every client, and the deliverables stop being
a class artifact and become the **audit evidence** that gets a client through SOC 2 Type II or ISO
27001 certification.

The good news: the app is already ~90% the right shape for this. Roles, weeks, gates, tasks, and 14
deliverable forms are all **data** (`src/lib/content-data.ts`, `src/lib/docs/definitions.ts`,
`src/lib/data/seed/securityPlus.ts`). Building the MSSP track is authoring a **new course object**,
not rewriting the engine (see [§7](#7-how-this-maps-onto-the-app)).

---

## 2. The three role families, professionalized

The capstone's three roles map cleanly onto how an MSSP actually staffs an engagement. The mission
strings shipped in the seed are the seed of the professional titles below.

| Capstone role | Seed mission | MSSP function | Professional titles |
|---|---|---|---|
| **Red (Runners)** | *Reconnaissance, enumeration, and exploitation* | **Offensive Security / Penetration Testing** | Penetration Tester, Red Team Operator, Offensive Security Engineer |
| **Blue (Wardens)** | *Hardening, detection, and incident response* | **Managed Detection & Response (MDR) / SecOps** | SOC Analyst (Tier 1–3), Detection Engineer, Incident Responder, Security Engineer |
| **GRC (Fixers)** | *Governance, risk, compliance, and reporting* | **GRC / vCISO / Audit Readiness** | GRC Analyst, Compliance Lead, virtual CISO, Internal Auditor |

**GRC is the spine.** In a compliance-driven MSSP, GRC owns the framework, defines the controls, and
assembles the audit evidence; Red and Blue *produce the evidence that proves the controls work*.
That is exactly the capstone's current hand-off model (Red/Blue produce → GRC assembles the Final
Report), just pointed at an auditor instead of an instructor.

---

## 3. The engagement lifecycle (the new "week" axis)

A real SOC 2 / ISO 27001 engagement is not 4 weeks; it's a **repeating lifecycle** the MSSP runs per
client. The capstone's Week 0→4 is a compressed single pass through it. Professionally it has ~7
phases:

| Phase | Capstone analog | Purpose | Framework milestone |
|---|---|---|---|
| **P0 — Onboarding & Scoping** | Week 0 (lab setup) | MSA/SOW/NDA, define the system boundary, tenant provisioning | Define the **SOC 2 system / ISO 27001 scope (Clause 4)** |
| **P1 — Gap Assessment** | Week 1 (recon + asset/risk) | Current-state vs. the framework; asset inventory; risk assessment | **ISO risk assessment (6.1)**; SOC 2 readiness gap analysis |
| **P2 — Remediation / Control Implementation** | Week 2 (hardening) | Stand up the missing controls; write the policies/SOPs | Implement **Annex A controls / SOC 2 CC controls** |
| **P3 — Validation / Testing** | Week 3 (breach + IR) | Prove controls work — pentest, tabletop, control testing | Evidence for **operating effectiveness** |
| **P4 — Audit Readiness** | Week 4 (final report) | Assemble the evidence package; internal audit; SoA | **SOC 2 Type I** / **ISO Stage 1** |
| **P5 — Attestation / Certification** | (beyond the capstone) | External auditor examination | **SOC 2 Type II** (observation window) / **ISO Stage 2** |
| **P6 — Continuous Monitoring** | (beyond the capstone) | Ongoing evidence collection, surveillance audits | Maintain the attestation |

The capstone's three **gates** (1 = scope locked, 2 = hardened, 3 = tested & reported) become the
**audit milestones**: Gate 1 ≈ scope/SoA signed, Gate 2 ≈ controls implemented, Gate 3 ≈ operating
effectiveness evidenced (Type I → the door to Type II).

---

## 4. The two frameworks in one paragraph each

**SOC 2** (AICPA) is an *attestation* — a CPA firm examines your controls against the **Trust
Services Criteria (TSC)**. The mandatory category is **Security** (a.k.a. the **Common Criteria,
CC1–CC9**); optional categories are Availability, Confidentiality, Processing Integrity, and Privacy.
**Type I** = "the controls are suitably designed at a point in time." **Type II** = "the controls
*operated effectively* over a period" (typically 3–12 months). The CC series maps roughly to COSO:
CC1 control environment, CC2 communication, CC3 risk assessment, CC4 monitoring, CC5 control
activities, CC6 logical/physical access, CC7 system operations (incl. detection & IR), CC8 change
management, CC9 risk mitigation.

**ISO/IEC 27001:2022** is a *certification* of an **Information Security Management System (ISMS)**.
The management-system requirements are **Clauses 4–10** (context, leadership, planning incl. risk,
support, operation, performance evaluation, improvement). The controls live in **Annex A**, which in
the 2022 revision has **93 controls in 4 themes**: Organizational (37), People (8), Physical (14),
Technological (34). The centerpiece document is the **Statement of Applicability (SoA)** — every
Annex A control, whether it applies, and why. Certification is a two-stage external audit: **Stage 1**
(documentation/readiness) → **Stage 2** (implementation effectiveness) → surveillance audits.

They overlap ~80%. An MSSP that builds one control set can sell readiness for both.

---

## 5. Per-role, week-by-week — what you actually do

Each phase below shows, per role: the **framework anchor**, the **tools**, the **procedure**, and the
**document(s) produced**. The document names in **bold** already exist as forms in the app
(`src/lib/docs/definitions.ts`); names marked *(new)* are Phase-B additions ([§7](#7-how-this-maps-onto-the-app)).

### GRC — the compliance spine

| Phase | Framework anchor | Tools | Procedure | Documents |
|---|---|---|---|---|
| P0 Scoping | ISO 4.3 scope · SOC 2 system description | GRC platform (Vanta/Drata/Tugboat), doc templates | Sign MSA/SOW/NDA; draw the system boundary; list in-scope systems/data | *MSA/SOW/NDA (new)* · **Scope & Rules of Engagement** |
| P1 Gap & risk | ISO 6.1 risk · ISO 27005 · NIST CSF | Risk register, asset CMDB | Asset inventory; threat/risk assessment; gap vs. framework | **Asset Inventory** · **Risk Register** · **Framework Mapping** |
| P2 Controls | ISO Annex A · SOC 2 CC5/CC6 · CIS | Policy templates | Author policies + SOPs; build the **SoA**; assign control owners | **Lab Security Policy** · **Hardening Standard** · **Vuln-Mgmt SOP** · *Statement of Applicability (new)* · *Control Matrix (new)* |
| P3 Validation | SOC 2 CC4/CC7 · ISO 9.1 | Ticketing, evidence store | Coordinate pentest + IR test; track remediation; collect evidence | **IR Runbook** · **Evidence Log** |
| P4 Audit-ready | SOC 2 Type I · ISO Stage 1 · ISO 9.2 | Audit-prep checklist | Internal audit; assemble evidence package; management review | **Final Report & Briefing** · *Internal Audit Report (new)* · *Audit Evidence Packet (new)* |

### Red — offensive security / penetration testing

| Phase | Framework anchor | Tools | Procedure | Documents |
|---|---|---|---|---|
| P0 Scoping | PTES pre-engagement · SOC 2 CC4.1 | — | Agree targets, windows, and **Rules of Engagement**; get written authorization | *Rules of Engagement (RoE)* (the Scope & RoE form) |
| P1 Recon | PTES · OSINT · MITRE ATT&CK Recon | `theHarvester`, `whois`, `dig`, `nmap` | Passive OSINT then active enumeration of the in-scope estate | (feeds **Pentest Report** findings) |
| P2 — (Red waits) | — | — | Blue/GRC implement controls; Red re-scopes for the test | — |
| P3 Exploitation | PTES · OWASP WSTG · NIST **800-115** · ATT&CK | `nmap` NSE, `nikto`, `sqlmap`, `hydra`, Burp | Vulnerability analysis → controlled exploitation → post-exploitation, all logged | **Penetration Test Report** (findings, CVSS, evidence) |
| P4 Retest | 800-115 §6 (reporting) | same | Re-test remediated findings; confirm closure | *Retest / Remediation-Validation Report (new)* |

### Blue — managed detection & response / SecOps

| Phase | Framework anchor | Tools | Procedure | Documents |
|---|---|---|---|---|
| P0 Onboard | SOC 2 CC7.2 · ISO A.8.15 logging | SIEM, EDR, syslog | Deploy sensors; centralize logs; baseline "normal" | (config → **Change Log**) |
| P1 Baseline | CIS Benchmarks · ISO A.8.9 config | `lynis`, CIS-CAT, `ufw`/GPO | Assess current hardening against CIS; find the gaps | (feeds **Hardening Baseline**) |
| P2 Harden | CIS Controls · SOC 2 CC6 · ISO A.8 | `ufw`, `fail2ban`, Defender, auditpol | Implement the **Hardening Standard** GRC issued; record every change | **Hardening Baseline** · **Change Log** |
| P3 Detect & respond | SOC 2 CC7.3/7.4 · NIST **800-61r3** · ATT&CK · Sigma | SIEM rules, `tcpdump`, Sigma, IR runbook | Detect the Red activity; run detect→contain→eradicate→recover; write it up | **Incident Report** · *Detection Rules (new)* |
| P4 Metrics | SOC 2 CC7 · ISO 9.1 | SIEM dashboards | Report MTTD/MTTR and detection coverage as operating-effectiveness evidence | *Detection & Response Metrics (new)* |

**Reading the tables:** GRC *defines* a control (e.g. the Hardening Standard), Blue *implements* it and
*proves it operates* (Change Log + detection), Red *tries to break it* (Pentest Report), and GRC
*collects the result as audit evidence* (Evidence Log → Audit Packet). That produce→prove→attack→attest
loop is the heart of both SOC 2 Type II and ISO Stage 2.

---

## 6. The crosswalk: SOC 2 ↔ ISO 27001 ↔ NIST CSF ↔ the capstone

This is the single most useful artifact for a multi-framework MSSP — build the control once, satisfy
several frameworks. **Directional** mapping (verify per [§Accuracy](#accuracy--sources)):

| Capstone deliverable / activity | SOC 2 (TSC) | ISO 27001:2022 | NIST CSF 2.0 | Owner |
|---|---|---|---|---|
| Scope & RoE, system boundary | CC1.x, CC2.x | Clause 4, 5 | GV (Govern) | GRC |
| Asset Inventory | CC3.2, CC6.1 | A.5.9 | ID.AM | GRC |
| Risk Register / assessment | CC3.1–CC3.4 | Clause 6.1, A.5.7 | ID.RA | GRC |
| Framework Mapping / SoA | CC3.x | Clause 6.1.3 (SoA) | GV.PO | GRC |
| Lab Security Policy | CC1.4, CC5.3 | A.5.1 | GV.PO | GRC |
| Hardening Standard / Baseline | CC6.1, CC6.6, CC6.8 | A.8.9, A.8.20 | PR.PS, PR.IR | GRC→Blue |
| Change Log | CC8.1 | A.8.32 | PR.PS | Blue |
| Logging / monitoring / detection | CC7.1–CC7.3 | A.8.15, A.8.16 | DE.CM, DE.AE | Blue |
| Incident Report / IR Runbook | CC7.3–CC7.5 | A.5.24–A.5.28 | RS, RC | Blue/GRC |
| Penetration Test Report | CC4.1, CC7.1 | A.8.8, A.8.29 | ID.RA, PR.PS | Red |
| Vulnerability-Management SOP | CC7.1 | A.8.8 | ID.RA-01, PR.PS | GRC→Blue |
| Evidence Log / chain of custody | CC4.1, CC7.3 | A.5.28 | RS.AN | GRC |
| Final Report / Internal Audit | CC4.1, CC4.2 | Clause 9.2, 9.3 | GV, ID.IM | GRC |

The app already carries most of these anchors as `framework:` tags on the deliverables
(`ISO_27001`, `NIST_CSF`, `CIS`, `NIST_800_115`, `NIST_800_61`, `OWASP`). **SOC 2 is the one framework
with no tag yet** — adding it is the core of Phase B.

---

## 7. How this maps onto the app

The engine is data-driven, so the MSSP track is **new content, not new code**. Recommended shape
(this is the optional **Phase B** of the approved plan — the doc you're reading is **Phase A**):

1. **Author a new `Course` object** (do *not* edit the Security+ seed in
   `src/lib/data/seed/securityPlus.ts`). This avoids touching the `'red' | 'blue' | 'grc'` role
   literals and the duplicated framework maps in `src/lib/utils.ts` / `src/lib/content-data.ts`.
2. **Add a `SOC_2` framework tag** — label/color/description/why in the `FRAMEWORK_*` maps in
   `src/lib/utils.ts` (`Framework` is already an open string, so this is additive), alongside the
   existing `ISO_27001`.
3. **Weeks → engagement phases** (P0–P4), **gates → audit milestones** (Type I / Stage 1 / Type II),
   **tasks → the per-role procedures in §5**.
4. **New `DeliverableDef`s** for the *(new)* documents in §5 — Statement of Applicability, Control
   Matrix, MSA/SOW/NDA, Retest Report, Detection Rules, IR Metrics, Internal Audit Report, Audit
   Evidence Packet — each authored the same way as the current 14 (reuse the `c()` column factory,
   `FieldGroup`, `seed`, and `DodCheck` patterns in `src/lib/docs/definitions.ts`), tagged
   `framework: 'SOC_2'` / `'ISO_27001'`.
5. **Register the course** so it appears alongside Security+ and CySA+ (locked/unlocked like the
   existing courses). No rendering code changes — the folder tree, matrix, ZIP, PDF, DoD panels, and
   framework badges all derive from `DELIVERABLES` and pick up the new content automatically.

The **multi-client / multi-tenant** dimension (each client isolated, at its own phase) is the
`tenant_id` + RLS work already described in [`ROADMAP.md`](ROADMAP.md) Phase 1 and
[`adr/0002-tenant-id-rls.md`](adr/0002-tenant-id-rls.md) — the MSSP model is a concrete reason that
foundation matters.

---

## 8. What changes vs. the current capstone

| Aspect | Security+ capstone (today) | MSSP / compliance track |
|---|---|---|
| Customer | one shared practice lab | many isolated client tenants |
| Time axis | fixed Week 0–4 | repeating engagement lifecycle per client |
| Deliverable purpose | graded by instructor | **audit evidence** for a CPA / certification body |
| Frameworks | learning tags | **the product** (SOC 2 + ISO 27001 readiness) |
| GRC role | writes the report | owns the ISMS / SoA / audit package (vCISO) |
| End state | Gate 3 + Final Report | Type I → **Type II** / ISO **Stage 2 certificate** |
| Engine impact | — | **none** — a new course object + a `SOC_2` tag |

---

## Accuracy & sources

The structure above is faithful to how MSSPs and auditors work, but treat every **number and
cell-level mapping as directional** until checked against primary sources:

- **SOC 2** — verify the CC series and per-criterion points against the official **AICPA Trust
  Services Criteria (TSC 2017, rev. 2022)**. Do not quote a specific count of CC criteria without it.
- **ISO/IEC 27001:2022 & ISO/IEC 27002:2022** — verify the **93 Annex A controls / 4 themes** and any
  specific `A.x.y` reference against the standard (it is copyrighted; use a licensed copy).
- **Crosswalks** — verify §6 against the **AICPA SOC 2 ↔ ISO 27001 mapping** and the **NIST
  CSF 2.0 informative references / NIST SP 800-53 ↔ ISO 27001 crosswalk** spreadsheets, not memory.
- **Methodologies referenced** — PTES, OWASP WSTG, **NIST SP 800-115** (pentest/technical assessment),
  **NIST SP 800-61r3** (incident response), **CIS Controls v8 / CIS Benchmarks**, **MITRE ATT&CK**,
  **Sigma**, **ISO/IEC 27005** (risk).

Anchor any grading, SoA, or client-facing artifact to the primary documents above before use.
