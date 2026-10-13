# CISSP Capstone: Six Releases — skills sheet

18 graded tasks · 48 skills · 27 tools · 20 procedures · 16 standards (20 controls cited) · 4 tactics · 37 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Scan configuration against a benchmark `comp.vuln.config-scan` | Vulnerability management | CISSP.d6, CIS.BENCHMARK | Prove AI controls and the config scan |
| Define metrics with a formula and a target `comp.report.security-metrics` | Reporting | CISSP.d1, CY0-001.d4, ISO27001.9.1 | Specify risk, assets and the metrics |
| Write federal incident reporting `comp.report.federal-incident-reporting` | Reporting | CISSP.d7, NIST.800-171.3.6 | Map identity and federal incident reporting |
| Re-test TLS and review the rule base `comp.harden.tls-and-rule-base` | Hardening and defence | CISSP.d6, NIST.800-53.SC-8 | Re-test architecture, network and change |
| Gate a pipeline on scans and tests `comp.harden.pipeline-gates` | Hardening and defence | CY0-001.d3, CISSP.d8, NIST_800_218 | Prove the pipeline and list the components |
| Make an AI gateway the sole path `comp.harden.ai-gateway-zone` | Hardening and defence | CISSP.d4, NIST_800_207 | Prove AI controls and the config scan |
| Specify the seven-step incident life cycle `comp.respond.seven-step-plan` | Incident response | CISSP.d7, NIST.800-61 | Specify access, recovery and incident response |
| Run a tabletop with injects `comp.respond.tabletop` | Incident response | CISSP.d6, NIST.800-53.CP-4 | Re-test access and run the tabletop |
| Restore from backup and compare hashes `comp.respond.restore-test` | Incident response | CISSP.d7, NIST.800-53.CP-4 | Prove detection, restore and contingency |
| Set MTD, RTO, RPO and WRT `comp.respond.recovery-targets` | Incident response | CISSP.d7, NIST_800_34 | Specify access, recovery and incident response |
| Write policy as shall statements with an owner `comp.grc.policy-shall` | Governance and compliance | CISSP.d1, CY0-001.d4, NIST.CSF.GV.PO | Write governance, assets and the first score |
| Classify assets with one owner each `comp.grc.classification` | Governance and compliance | CISSP.d2, ISO27001.A.5.12 | Write governance, assets and the first score |
| Score maturity on a 0 to 4 scale `comp.grc.maturity` | Governance and compliance | CISSP.d1 | Write governance, assets and the first score |
| Tier suppliers with top-tier terms `comp.grc.supplier-tiering` | Governance and compliance | CISSP.d1, NIST.CSF.GV.SC | Prove suppliers and the server migration |
| Decide EU AI Act applicability `comp.grc.ai-act-decision` | Governance and compliance | CISSP.d2, NIST_AI_RMF | Prove data discovery and categorization |
| Categorise a system by high-water mark `comp.grc.categorise-system` | Governance and compliance | CISSP.d2, NIST.800-53.RA-3 | Prove data discovery and categorization |
| Apply the ISC2 canons in order `comp.grc.ethics-canons` | Governance and compliance | CISSP.d1 | Assess all sixteen controls and close findings |
| Keep a risk register with owners `comp.risk.register` | Risk | CISSP.d1, SOC-2-ISO-27001.c2, ISO27001.6.1.2 | Specify risk, assets and the metrics |
| Quantify a risk with SLE and ALE `comp.risk.quantitative` | Risk | CISSP.d1 | Specify risk, assets and the metrics |
| Threat-model with STRIDE `comp.risk.threat-model` | Risk | CISSP.d3, CY0-001.d2, STRIDE | Prove suppliers and the server migration |
| Assess controls by examine, interview, test `comp.audit.assess-controls` | Audit and assessment | CISSP.d6, NIST.800-53.CA-2 | Assess all sixteen controls and close findings |
| Answer a customer questionnaire with evidence `comp.audit.questionnaire` | Audit and assessment | CISSP.d6, CY0-001.d4, SOC2 | Assess all sixteen controls and close findings |
| Self-assess against SP 800-171 `comp.audit.self-assess-171` | Audit and assessment | CISSP.d1, NIST.800-171 | Self-assess the basics and assemble the SSP |
| Assemble a System Security Plan `comp.audit.ssp` | Audit and assessment | CISSP.d1, NIST.800-53.PL-2 | Self-assess the basics and assemble the SSP |
| Map controls to federal requirements `comp.audit.map-to-federal` | Audit and assessment | CISSP.d4, CISSP.d7, NIST.800-171 | Map architecture and network to federal rules; Map identity and federal incident reporting |
| Design role-based access with MFA rules `comp.identity.rbac` | Identity and access | CISSP.d5, NIST.800-53.AC-6 | Write identity and operations |
| Specify joiner and leaver with timed disablement `comp.identity.joiner-leaver` | Identity and access | CISSP.d5, ISO27001.A.5.18 | Write identity and operations |
| Specify an access matrix with separation of duties `comp.identity.access-matrix` | Identity and access | CISSP.d5, NIST.800-53.AC-5 | Specify access, recovery and incident response |
| Prove MFA on the console `comp.identity.mfa-console` | Identity and access | CISSP.d5, NIST_800_63 | Prove MFA, accounts and federation |
| Find and disable orphan accounts `comp.identity.orphan-accounts` | Identity and access | CISSP.d5, NIST.800-53.AC-2 | Prove MFA, accounts and federation |
| Federate with SAML and OIDC `comp.identity.federation` | Identity and access | CISSP.d5, NIST_800_63 | Prove MFA, accounts and federation |
| Repeat an access review on schedule `comp.identity.access-review` | Identity and access | CISSP.d6, NIST.800-53.AC-2 | Re-test access and run the tabletop |
| Register machine identities with rotation `comp.identity.machine-identities` | Identity and access | CISSP.d4, NIST.800-53.IA-5 | Prove AI controls and the config scan |
| Write a cryptography standard: key sizes and rotation `comp.crypto.standard` | Cryptography | CISSP.d3, NIST.800-53.SC-12 | Specify cryptography and the rule base |
| Prove TLS versions and ciphers `comp.crypto.tls-versions` | Cryptography | CISSP.d8, NIST.800-53.SC-8 | Prove the pipeline and list the components |
| Rotate a key and record it `comp.crypto.key-rotation` | Cryptography | CISSP.d6, NIST.800-53.SC-12 | Re-test architecture, network and change |
| Draw architecture with trust boundaries `comp.arch.trust-boundaries` | Architecture and network design | CISSP.d3, ISO42010 | Write architecture and network |
| Write shared-responsibility rows `comp.arch.shared-responsibility` | Architecture and network design | CISSP.d3 | Write architecture and network |
| Design zones with default deny `comp.arch.default-deny-zones` | Architecture and network design | CISSP.d4, NIST.800-53.SC-7 | Write architecture and network |
| Specify a rule base with approved protocols `comp.arch.rule-base` | Architecture and network design | CISSP.d4, NIST.800-53.SC-7 | Specify cryptography and the rule base |
| Place a security gate per development phase `comp.arch.sdlc-gates` | Architecture and network design | CISSP.d8, NIST_800_218 | Specify cryptography and the rule base |
| Produce a component list (CycloneDX) `comp.arch.component-list` | Architecture and network design | CISSP.d8, NIST_800_218 | Prove the pipeline and list the components |
| Prove default-deny segmentation `comp.arch.segmentation-proof` | Architecture and network design | CISSP.d4, NIST.800-53.SC-7 | Re-test architecture, network and change |
| Find personal data and prove it is gone `comp.data.discovery` | Data security | CISSP.d2, NIST.CSF.ID.AM | Prove data discovery and categorization |
| Clear, purge or destroy media `comp.data.sanitisation` | Data security | CISSP.d2, NIST_800_88 | Prove suppliers and the server migration |
| Write logging, the incident first hour and backups `comp.ops.logging-first-hour` | Security operations | CISSP.d7, NIST.800-61.PREPARE | Write identity and operations |
| Prove a detection fires with timings `comp.ops.detection-fires` | Security operations | CISSP.d7, NIST.CSF.DE.AE | Prove detection, restore and contingency |
| Specify activation, recovery, reconstitution `comp.ops.contingency-phases` | Security operations | CISSP.d7, NIST_800_34 | Prove detection, restore and contingency |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Write governance, assets and the first score; Prove the pipeline and list the components; Prove MFA, accounts and federation; Prove suppliers and the server migration; Prove detection, restore and contingency; Prove AI controls and the config scan; Re-test architecture, network and change; Re-test access and run the tabletop; Self-assess the basics and assemble the SSP |
| curl | cli | Prove MFA, accounts and federation |
| sha256sum | cli | Write governance, assets and the first score; Prove suppliers and the server migration; Prove detection, restore and contingency; Self-assess the basics and assemble the SSP |
| Capstone forms | document | Write governance, assets and the first score; Write architecture and network; Write identity and operations; Specify risk, assets and the metrics; Specify cryptography and the rule base; Specify access, recovery and incident response; Prove detection, restore and contingency; Prove data discovery and categorization; Prove AI controls and the config scan; Assess all sixteen controls and close findings; Re-test access and run the tabletop; Self-assess the basics and assemble the SSP; Map identity and federal incident reporting |
| Notes | document | Write identity and operations; Specify access, recovery and incident response; Re-test access and run the tabletop; Map identity and federal incident reporting |
| Spreadsheet | app | Write governance, assets and the first score; Specify risk, assets and the metrics |
| draw.io | app | Write architecture and network; Specify cryptography and the rule base; Map architecture and network to federal rules |
| nmap | cli | Prove the pipeline and list the components; Re-test architecture, network and change |
| OWASP ZAP | app | Re-test architecture, network and change |
| OpenVAS | service | Prove AI controls and the config scan |
| nftables | cli | Prove the pipeline and list the components |
| Lynis | cli | Prove AI controls and the config scan |
| OpenSSL | cli | Prove the pipeline and list the components; Re-test architecture, network and change |
| shred | cli | Prove suppliers and the server migration |
| Wazuh | service | Prove detection, restore and contingency |
| Keycloak | service | Prove MFA, accounts and federation; Re-test access and run the tabletop |
| Trivy | cli | Prove the pipeline and list the components |
| Microsoft Presidio | service | Prove data discovery and categorization |
| eramba | service | Write governance, assets and the first score; Specify risk, assets and the metrics; Assess all sixteen controls and close findings |
| Snipe-IT | service | Specify risk, assets and the metrics |
| OWASP Threat Dragon | app | Prove suppliers and the server migration |
| OpenCRE | service | Assess all sixteen controls and close findings |
| OSCAL Compass | cli | Self-assess the basics and assemble the SSP |
| Git | cli | Write governance, assets and the first score; Prove the pipeline and list the components; Self-assess the basics and assemble the SSP |
| Jenkins | service | Prove the pipeline and list the components |
| Python | language | Prove data discovery and categorization |
| restic | cli | Prove detection, restore and contingency |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Incident response plan | incident | NIST.800-61, ISO27001.A.5.24, NIST.CSF.RS.MA, SOC2.CC7.4 | D7 Operations | Re-test access and run the tabletop |
| Change record | change | ITIL.change, ISO27001.A.8.32, NIST.800-53.CM-3, SOC2.CC8.1 | D8 Software & Change | Re-test architecture, network and change |
| Release record | release | ITIL.release, NIST.800-218, SOC2.CC8.1 | Release Note | — |
| Recovery drill | recovery | NIST.800-34, NIST.CSF.RC.RP, ISO27001.A.5.30, NIST.800-53.CP-4 | D7 Operations | Prove detection, restore and contingency |
| Backup plan | recovery | ISO27001.A.8.13, NIST.800-53.CP-9, CIS.11 | D7 Operations | Prove detection, restore and contingency |
| Risk register | risk | NIST.800-30, ISO27005, ISO27001.6.1.2, NIST.CSF.GV.RM | D1 Governance & Risk | — |
| Supplier review | risk | ISO27001.A.5.19, NIST.CSF.GV.SC, NIST.800-53.SR-6 | D1 Governance & Risk | — |
| Security policy | policy | ISO27001.5.2, ISO27001.A.5.1, NIST.CSF.GV.PO, NIST.800-53.PM-1 | D1 Governance & Risk | — |
| Data handling standard | policy | NIST.CSF.PR.DS, ISO27001.A.5.12, NIST.800-88 | D2 Assets & Data | Prove suppliers and the server migration; Prove data discovery and categorization |
| Access review | access | ISO27001.A.5.18, NIST.800-53.AC-2, SOC2.CC6.3, NIST.CSF.PR.AA | D5 Identity | Re-test access and run the tabletop |
| Identity and access standard | access | NIST.800-63, NIST.800-53.IA-2, ISO27001.A.5.15, NIST.CSF.PR.AA | D5 Identity | Prove MFA, accounts and federation |
| Asset inventory | inventory | NIST.CSF.ID.AM, CIS.1, ISO27001.A.5.9, ITIL.asset | D2 Assets & Data | — |
| Control mapping | governance | ISO27001.6.1.3, SOC2, NIST.CSF | Control Statements | — |
| Customer assurance response | governance | SOC2, ISO27001, ISO42001 | Customer Questionnaire Response | — |
| System security plan | governance | NIST.800-171, NIST.800-53.PL-2, FAR.52.204-21 | System Security Plan & Traceability | — |
| Internal audit | audit | ISO27001.9.2, ISO27001.9.3, SOC2.CC4.1 | D6 Assessment | Assess all sixteen controls and close findings |
| Retest and validation record | assessment | NIST.800-115, SOC2.CC4.1 | D6 Assessment | Re-test architecture, network and change |
| Architecture record | design | ISO42010, WAF, NIST.800-53.PL-8 | D3 Architecture | — |
| Network design | design | NIST.800-53.SC-7, ISO27001.A.8.22, NIST.CSF.PR.IR | D4 Network | — |
| Pipeline record | build | NIST.800-218, WAF.operational-excellence, ITIL.deployment | D8 Software & Change | Prove the pipeline and list the components |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| NIST CSF | Write governance, assets and the first score; Write architecture and network; Write identity and operations | D1 Governance & Risk; D2 Assets & Data; D3 Architecture; D4 Network; D5 Identity; D6 Assessment; D7 Operations |
| OWASP | — | D8 Software & Change |
| NIST 800-61 | — | D7 Operations |
| NIST 800-115 | — | D6 Assessment |
| ISO 27001 | Write governance, assets and the first score | D1 Governance & Risk |
| SOC 2 | Assess all sixteen controls and close findings | Customer Questionnaire Response |
| STRIDE | Prove suppliers and the server migration | — |
| ITIL 4 | — | Release Note |
| CISSP | Write governance, assets and the first score; Write architecture and network; Write identity and operations; Specify risk, assets and the metrics; Specify cryptography and the rule base; Specify access, recovery and incident response; Prove the pipeline and list the components; Prove MFA, accounts and federation; Prove suppliers and the server migration; Prove detection, restore and contingency; Prove data discovery and categorization; Prove AI controls and the config scan; Assess all sixteen controls and close findings; Re-test architecture, network and change; Re-test access and run the tabletop; Self-assess the basics and assemble the SSP; Map architecture and network to federal rules; Map identity and federal incident reporting | — |
| NIST AI RMF | Prove data discovery and categorization | — |
| NIST SP 800-53 | Specify risk, assets and the metrics; Specify cryptography and the rule base; Specify access, recovery and incident response; Prove the pipeline and list the components; Prove MFA, accounts and federation; Prove detection, restore and contingency; Prove AI controls and the config scan; Re-test architecture, network and change; Re-test access and run the tabletop | D3 Architecture; Control Statements |
| NIST SP 800-171 | Self-assess the basics and assemble the SSP; Map architecture and network to federal rules; Map identity and federal incident reporting | System Security Plan & Traceability |
| NIST SP 800-88 | — | D2 Assets & Data |
| NIST SP 800-207 | — | D4 Network |
| NIST SP 800-63 | — | D5 Identity |
| NIST SP 800-218 | — | D8 Software & Change |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.CSF.GV Govern | NIST_CSF | D1 Governance & Risk |
| NIST.CSF.ID Identify | NIST_CSF | D2 Assets & Data |
| NIST.CSF.PR Protect | NIST_CSF | D3 Architecture; D4 Network; D5 Identity |
| NIST.CSF.DE Detect | NIST_CSF | D7 Operations |
| NIST.CSF.RS Respond | NIST_CSF | D7 Operations |
| NIST.CSF.RC Recover | NIST_CSF | D7 Operations |
| NIST.CSF.PROFILE Organizational Profiles | NIST_CSF | D6 Assessment |
| NIST.800-53 Security and Privacy Controls Rev. 5 | NIST_800_53 | D3 Architecture; Control Statements |
| NIST.800-171 Protecting Controlled Unclassified Information | NIST_800_171 | System Security Plan & Traceability |
| FAR.52.204-21 FAR 52.204-21 basic safeguarding | NIST_800_171 | System Security Plan & Traceability |
| NIST.800-61 Computer Security Incident Handling Guide | NIST_800_61 | D7 Operations |
| NIST.800-115 Technical Guide to Information Security Testing | NIST_800_115 | D6 Assessment |
| NIST.800-88 Guidelines for Media Sanitization | NIST_800_88 | D2 Assets & Data |
| NIST.800-207 Zero Trust Architecture | NIST_800_207 | D4 Network |
| NIST.800-63 Digital Identity Guidelines | NIST_800_63 | D5 Identity |
| NIST.800-218 Secure Software Development Framework | NIST_800_218 | D8 Software & Change |
| ISO27001 Information security management system | ISO_27001 | D1 Governance & Risk |
| SOC2 Trust Services Criteria | SOC_2 | Customer Questionnaire Response |
| ITIL.release Release management | ITIL | Release Note |
| OWASP OWASP Top 10 and Web Security Testing Guide | OWASP | D8 Software & Change |

## Tactics and practices

| Tactic | Practised or defended by |
| --- | --- |
| Reconnaissance (TA0043) | Re-test architecture, network and change |
| Initial Access (TA0001) | Prove suppliers and the server migration |
| Credential Access (TA0006) | Prove detection, restore and contingency |
| Discovery (TA0007) | Re-test architecture, network and change |

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Least privilege | NIST.800-53.AC-6 | Write identity and operations |
| Defence in depth | NIST.CSF.PR | Write architecture and network |
| Default deny | NIST.800-53.SC-7 | Write architecture and network |
| Network segmentation | ISO27001.A.8.22 | Write architecture and network |
| Zero trust access | NIST_800_207 | Prove AI controls and the config scan |
| Multi-factor authentication | NIST_800_63 | Prove MFA, accounts and federation |
| Federated identity | NIST_800_63 | Prove MFA, accounts and federation |
| Machine identity register | NIST.800-53.IA-5 | Prove AI controls and the config scan |
| Separation of duties | NIST.800-53.AC-5 | Specify access, recovery and incident response |
| Periodic access review | NIST.800-53.AC-2 | Prove MFA, accounts and federation; Re-test access and run the tabletop |
| Joiner and leaver process | ISO27001.A.5.18 | Write identity and operations; Re-test access and run the tabletop |
| Encryption in transit | NIST.800-53.SC-8 | Specify cryptography and the rule base; Prove the pipeline and list the components; Map architecture and network to federal rules |
| Key rotation | NIST.800-53.SC-12 | Specify cryptography and the rule base; Re-test architecture, network and change |
| Retest to closure | NIST_800_115 | Re-test architecture, network and change |
| Likelihood-times-impact scoring | NIST_800_30 | Specify risk, assets and the metrics |
| Threat modelling | STRIDE | Prove suppliers and the server migration |
| Tabletop exercise | NIST.800-53.CP-4 | Re-test access and run the tabletop |
| Change control | ITIL.change | Re-test architecture, network and change |
| Configuration scanning | CIS.BENCHMARK | Prove AI controls and the config scan |
| Media sanitisation | NIST_800_88 | Prove suppliers and the server migration |
| Pipeline gates | NIST_800_218 | Specify cryptography and the rule base; Prove the pipeline and list the components |
| Software bill of materials | NIST_800_218 | Prove the pipeline and list the components |
| Backups tested by restore | NIST.800-53.CP-4 | Prove detection, restore and contingency |
| Recovery objectives | NIST_800_34 | Specify access, recovery and incident response; Prove detection, restore and contingency |
| Centralised logging | NIST.CSF.DE.CM | Write identity and operations; Prove detection, restore and contingency |
| Written policy | NIST.CSF.GV.PO | Write governance, assets and the first score |
| Written runbooks | ISO27001.A.5.37 | Specify access, recovery and incident response |
| Sign and version documents | ISO27001.7.5 | Self-assess the basics and assemble the SSP |
| Asset inventory | NIST.CSF.ID.AM | Write governance, assets and the first score |
| Data classification | ISO27001.A.5.12 | Write governance, assets and the first score; Prove data discovery and categorization |
| Personal data discovery | NIST.CSF.ID.AM | Prove data discovery and categorization |
| Control mapping | ISO27001.6.1.3 | Assess all sixteen controls and close findings; Self-assess the basics and assemble the SSP; Map architecture and network to federal rules; Map identity and federal incident reporting |
| Evidence by design | SOC2 | Assess all sixteen controls and close findings |
| Corrective action | ISO27001.10.2 | Assess all sixteen controls and close findings |
| Supplier tiering | NIST.CSF.GV.SC | Prove suppliers and the server migration |
| Write for leadership | NIST.CSF.RS.CO | Map identity and federal incident reporting |
| Metrics with targets | ISO27001.9.1 | Specify risk, assets and the metrics |

