# SecAI+ Capstone: Four Releases — skills sheet

12 graded tasks · 29 skills · 26 tools · 17 procedures · 8 standards (9 controls cited) · 7 tactics · 27 practices

Generated from the registries and the course document by `npm run content:export`; edit `src/lib/docs/skills.ts`, `tools.ts`, `standards.ts`, `sops.ts`, `tactics.ts` or the seed, not this file.

## Skills

| Skill | Area | Anchored to | Practised by |
| --- | --- | --- | --- |
| Define metrics with a formula and a target `comp.report.security-metrics` | Reporting | CISSP.d1, CY0-001.d4, ISO27001.9.1 | Find shadow AI and measure accuracy |
| Store secrets and limit through a gateway `comp.harden.secrets-and-gateway` | Hardening and defence | CY0-001.d2, NIST.800-53.IA-5 | Close SA-1 and log every attempt |
| Guard model inputs and outputs `comp.harden.guardrails` | Hardening and defence | CY0-001.d2, OWASP_LLM | Guard the inputs, scope the agent, redact the logs |
| Scope an agent to least privilege `comp.harden.agent-scope` | Hardening and defence | CY0-001.d2, OWASP_LLM | Guard the inputs, scope the agent, redact the logs |
| Redact personal data before it is written `comp.harden.redaction` | Hardening and defence | CY0-001.d2, NIST_AI_RMF | Guard the inputs, scope the agent, redact the logs |
| Gate a pipeline on scans and tests `comp.harden.pipeline-gates` | Hardening and defence | CY0-001.d3, CISSP.d8, NIST_800_218 | Gate the pipeline and alert on every case |
| Turn guardrails into regression tests `comp.harden.guardrail-tests` | Hardening and defence | CY0-001.d3, NIST_800_218 | Gate the pipeline and alert on every case |
| Rebuild a system clean and prove it `comp.harden.clean-rebuild` | Hardening and defence | CY0-001.d2, WAF.reliability | Rebuild clean and hand over monitoring |
| Scan model files for unsafe code `comp.harden.model-scanning` | Hardening and defence | CY0-001.d2, OWASP_LLM | Rebuild clean and hand over monitoring |
| Route an alert to a ticket `comp.detect.alert-to-ticket` | Detection and monitoring | CY0-001.d3, ITIL.incident | Gate the pipeline and alert on every case |
| Find unsanctioned AI tools on the network `comp.detect.shadow-ai` | Detection and monitoring | CY0-001.d4, NIST_AI_RMF | Find shadow AI and measure accuracy |
| Hash and log evidence `comp.forensics.hash-evidence` | Evidence and forensics | SY0-701.d4, CS0-003.d3, CY0-001.d2, ISO_27037 | Prove two attack cases with evidence |
| Write policy as shall statements with an owner `comp.grc.policy-shall` | Governance and compliance | CISSP.d1, CY0-001.d4, NIST.CSF.GV.PO | Map the system, write the rules, sign v1 |
| Map the AI life cycle with checkpoints `comp.grc.ai-lifecycle` | Governance and compliance | CY0-001.d1, NIST.AI-RMF.MAP | Map the data and every rule that applies |
| Map data types and lineage `comp.grc.data-lineage` | Governance and compliance | CY0-001.d1, NIST.AI-RMF.MAP | Map the data and every rule that applies |
| Decide which rules apply, with a reason `comp.grc.applicability` | Governance and compliance | CY0-001.d4, ISO42001 | Map the data and every rule that applies |
| Write a model card per model `comp.grc.model-cards` | Governance and compliance | CY0-001.d4, NIST_AI_RMF | Accept the risks and answer the customers |
| Assess responsible-AI principles with evidence `comp.grc.responsible-ai` | Governance and compliance | CY0-001.d4, ISO42001 | Accept the risks and answer the customers |
| Map an AI system: models, prompts, writers `comp.grc.system-map` | Governance and compliance | CY0-001.d4, NIST.AI-RMF.MAP | Map the system, write the rules, sign v1 |
| Answer a customer questionnaire with evidence `comp.audit.questionnaire` | Audit and assessment | CISSP.d6, CY0-001.d4, SOC2 | Accept the risks and answer the customers |
| Prove prompt injection with evidence `comp.ai-attack.prompt-injection` | AI attack and evaluation | CY0-001.d2, OWASP.LLM | Prove two attack cases with evidence |
| Prove sensitive information disclosure `comp.ai-attack.sensitive-disclosure` | AI attack and evaluation | CY0-001.d2, OWASP.LLM | Prove two attack cases with evidence |
| Prove indirect injection through documents `comp.ai-attack.indirect-injection` | AI attack and evaluation | CY0-001.d2, OWASP.LLM | Six cases and a mapped threat model |
| Prove excessive agency and insecure output `comp.ai-attack.excessive-agency` | AI attack and evaluation | CY0-001.d2, OWASP.LLM | Six cases and a mapped threat model |
| Map AI threats to OWASP and ATLAS `comp.ai-attack.map-to-atlas` | AI attack and evaluation | CY0-001.d2, MITRE.ATLAS | Six cases and a mapped threat model |
| Automate an attack suite with a pass line `comp.ai-attack.automate-suite` | AI attack and evaluation | CY0-001.d3, NIST_AI_RMF | Automate the suite and check AI-assisted work |
| Check AI-assisted work with a human `comp.ai-attack.ai-assisted-check` | AI attack and evaluation | CY0-001.d3, NIST_AI_RMF | Automate the suite and check AI-assisted work |
| Reproduce a suite on a rebuilt copy `comp.ai-attack.reproduce` | AI attack and evaluation | CY0-001.d3, NIST_800_218 | Reproduce the suite and add four paper cases |
| Write paper cases: poisoning, theft, inference `comp.ai-attack.paper-cases` | AI attack and evaluation | CY0-001.d3, MITRE.ATLAS | Reproduce the suite and add four paper cases |

## Tools

| Tool | Kind | Used by |
| --- | --- | --- |
| Linux shell | cli | Map the system, write the rules, sign v1; Prove two attack cases with evidence; Close SA-1 and log every attempt; Six cases and a mapped threat model; Map the data and every rule that applies; Gate the pipeline and alert on every case; Automate the suite and check AI-assisted work; Find shadow AI and measure accuracy; Rebuild clean and hand over monitoring; Reproduce the suite and add four paper cases; Accept the risks and answer the customers |
| sha256sum | cli | Map the system, write the rules, sign v1; Prove two attack cases with evidence; Accept the risks and answer the customers |
| Capstone forms | document | Map the system, write the rules, sign v1; Map the data and every rule that applies; Find shadow AI and measure accuracy; Rebuild clean and hand over monitoring; Reproduce the suite and add four paper cases; Accept the risks and answer the customers |
| draw.io | app | Map the system, write the rules, sign v1; Map the data and every rule that applies |
| Mermaid | language | Map the system, write the rules, sign v1 |
| garak | cli | Prove two attack cases with evidence |
| shred | cli | Close SA-1 and log every attempt |
| Zeek | service | Find shadow AI and measure accuracy |
| Wazuh | service | Gate the pipeline and alert on every case |
| OpenBao | service | Close SA-1 and log every attempt |
| Gitleaks | cli | Close SA-1 and log every attempt |
| Semgrep | cli | Gate the pipeline and alert on every case |
| Trivy | cli | Gate the pipeline and alert on every case |
| ModelScan | cli | Rebuild clean and hand over monitoring |
| Prowler | cli | Rebuild clean and hand over monitoring |
| Microsoft Presidio | service | Guard the inputs, scope the agent, redact the logs |
| LLM Guard | service | Guard the inputs, scope the agent, redact the logs |
| LiteLLM | service | Close SA-1 and log every attempt; Guard the inputs, scope the agent, redact the logs |
| Ollama | service | Prove two attack cases with evidence; Six cases and a mapped threat model; Automate the suite and check AI-assisted work; Reproduce the suite and add four paper cases |
| Continue (IDE assistant) | app | Automate the suite and check AI-assisted work |
| CISO Assistant | service | Map the data and every rule that applies; Find shadow AI and measure accuracy |
| OWASP Threat Dragon | app | Six cases and a mapped threat model |
| Git | cli | Map the system, write the rules, sign v1; Accept the risks and answer the customers |
| Jenkins | service | Gate the pipeline and alert on every case |
| Python | language | Prove two attack cases with evidence; Guard the inputs, scope the agent, redact the logs; Gate the pipeline and alert on every case; Automate the suite and check AI-assisted work; Find shadow AI and measure accuracy; Reproduce the suite and add four paper cases |
| GLPI | service | Gate the pipeline and alert on every case |

## Procedures

Runbooks and standard operating procedures the forms are instances of, and the tasks that execute them.

| Procedure | Kind | Standards | Forms | Executed by |
| --- | --- | --- | --- | --- |
| Incident response plan | incident | NIST.800-61, ISO27001.A.5.24, NIST.CSF.RS.MA, SOC2.CC7.4 | P4 Watch Plan | — |
| Release record | release | ITIL.release, NIST.800-218, SOC2.CC8.1 | Release Note; Release v4 Package & Assurance Response | Rebuild clean and hand over monitoring |
| Recovery drill | recovery | NIST.800-34, NIST.CSF.RC.RP, ISO27001.A.5.30, NIST.800-53.CP-4 | — | Rebuild clean and hand over monitoring; Reproduce the suite and add four paper cases |
| Chain of custody | custody | ISO27037, ISO27001.A.5.28, NIST.800-61 | Lab Rule & Evidence Ledger | — |
| Lab rule and evidence ledger | scope | NIST.800-115, ISO27037 | Lab Rule & Evidence Ledger | Prove two attack cases with evidence; Six cases and a mapped threat model; Automate the suite and check AI-assisted work; Reproduce the suite and add four paper cases |
| Hardening baseline | baseline | CIS.BENCHMARK, NIST.800-53.CM-6, ISO27001.A.8.9, NIST.CSF.PR.PS | P3 Control Set | Close SA-1 and log every attempt |
| Risk register | risk | NIST.800-30, ISO27005, ISO27001.6.1.2, NIST.CSF.GV.RM | P5 Governance Pack | — |
| Security policy | policy | ISO27001.5.2, ISO27001.A.5.1, NIST.CSF.GV.PO, NIST.800-53.PM-1 | P5 Governance Pack | — |
| Monitoring plan | monitoring | NIST.CSF.DE.CM, ISO27001.A.8.16, SOC2.CC7.2, ITIL.monitoring | P4 Watch Plan | — |
| Asset inventory | inventory | NIST.CSF.ID.AM, CIS.1, ISO27001.A.5.9, ITIL.asset | P1 System Map | — |
| AI system map | inventory | NIST.AI-RMF.MAP, ISO42001 | P1 System Map | — |
| Control mapping | governance | ISO27001.6.1.3, SOC2, NIST.CSF | P3 Control Set | — |
| Governance report | governance | NIST.CSF.GV, ISO27001.9.3 | P5 Governance Pack | — |
| Customer assurance response | governance | SOC2, ISO27001, ISO42001 | Release v4 Package & Assurance Response | — |
| Assessment report | assessment | NIST.800-115, PTES, CVSS | P2 Attack Casebook | — |
| Threat model | assessment | STRIDE, OWASP, NIST.CSF.ID.RA | P2 Attack Casebook | — |
| Pipeline record | build | NIST.800-218, WAF.operational-excellence, ITIL.deployment | — | Gate the pipeline and alert on every case |

## Standards

| Standard | Tagged on tasks | Cited by forms |
| --- | --- | --- |
| NIST CSF | Map the system, write the rules, sign v1; Close SA-1 and log every attempt; Guard the inputs, scope the agent, redact the logs; Map the data and every rule that applies; Gate the pipeline and alert on every case; Rebuild clean and hand over monitoring | P3 Control Set; P4 Watch Plan |
| STRIDE | Six cases and a mapped threat model | — |
| ITIL 4 | — | Release Note |
| SecAI+ CY0-001 | Map the system, write the rules, sign v1; Prove two attack cases with evidence; Close SA-1 and log every attempt; Six cases and a mapped threat model; Guard the inputs, scope the agent, redact the logs; Map the data and every rule that applies; Gate the pipeline and alert on every case; Automate the suite and check AI-assisted work; Find shadow AI and measure accuracy; Rebuild clean and hand over monitoring; Reproduce the suite and add four paper cases; Accept the risks and answer the customers | — |
| NIST AI RMF | Map the system, write the rules, sign v1; Map the data and every rule that applies; Find shadow AI and measure accuracy; Accept the risks and answer the customers | P1 System Map; P5 Governance Pack |
| OWASP LLM Top 10 | Prove two attack cases with evidence; Close SA-1 and log every attempt; Six cases and a mapped threat model; Guard the inputs, scope the agent, redact the logs; Gate the pipeline and alert on every case; Automate the suite and check AI-assisted work; Reproduce the suite and add four paper cases | P2 Attack Casebook |
| MITRE ATLAS | Six cases and a mapped threat model; Reproduce the suite and add four paper cases | P2 Attack Casebook |
| ISO/IEC 42001 | Map the data and every rule that applies; Accept the risks and answer the customers | P5 Governance Pack |

| Control cited | Standard | By |
| --- | --- | --- |
| NIST.CSF.PR Protect | NIST_CSF | P3 Control Set |
| NIST.CSF.DE Detect | NIST_CSF | P4 Watch Plan |
| NIST.CSF.RS Respond | NIST_CSF | P4 Watch Plan |
| NIST.AI-RMF AI Risk Management Framework 1.0 | NIST_AI_RMF | P5 Governance Pack |
| NIST.AI-RMF.MAP Map | NIST_AI_RMF | P1 System Map |
| ITIL.release Release management | ITIL | Release Note |
| OWASP.LLM OWASP Top 10 for LLM Applications | OWASP_LLM | P2 Attack Casebook |
| MITRE.ATLAS ATLAS | MITRE_ATLAS | P2 Attack Casebook |
| ISO42001 AI management system | ISO_42001 | P5 Governance Pack |

Forms whose standard names a practice rather than a control:

- Lab Rule & Evidence Ledger: practice.authorised-testing, practice.evidence-hashing
- Release v4 Package & Assurance Response: practice.customer-assurance

## Tactics and practices

| Tactic | Practised or defended by |
| --- | --- |
| Resource Development (AML.TA0003) | Reproduce the suite and add four paper cases |
| Initial Access (AML.TA0004) | Prove two attack cases with evidence; Six cases and a mapped threat model; Guard the inputs, scope the agent, redact the logs; Automate the suite and check AI-assisted work |
| Execution (AML.TA0005) | Six cases and a mapped threat model |
| Persistence (AML.TA0006) | Reproduce the suite and add four paper cases |
| Defense Evasion (AML.TA0007) | Six cases and a mapped threat model; Guard the inputs, scope the agent, redact the logs |
| Collection (AML.TA0009) | Prove two attack cases with evidence |
| Exfiltration (AML.TA0010) | Reproduce the suite and add four paper cases |

| Practice | Anchor | Asked for by |
| --- | --- | --- |
| Secrets in a store | NIST.800-53.IA-5 | Close SA-1 and log every attempt |
| Hash evidence at capture | ISO_27037 | Prove two attack cases with evidence |
| Authorised testing only | NIST_800_115 | Prove two attack cases with evidence |
| Likelihood-times-impact scoring | NIST_800_30 | Map the data and every rule that applies |
| Threat modelling | STRIDE | Six cases and a mapped threat model |
| Compensating controls | ISO27001.6.1.3 | Reproduce the suite and add four paper cases |
| Rebuild, do not repair | WAF.reliability | Rebuild clean and hand over monitoring |
| Reproducible builds | NIST_800_218 | Rebuild clean and hand over monitoring; Reproduce the suite and add four paper cases |
| Pipeline gates | NIST_800_218 | Gate the pipeline and alert on every case |
| Secret scanning | NIST_800_218 | Close SA-1 and log every attempt |
| Guardrail regression tests | NIST_800_218 | Gate the pipeline and alert on every case |
| Alert to ticket | ITIL.incident | Gate the pipeline and alert on every case |
| ATT&CK-mapped reporting | MITRE_ATTACK | Six cases and a mapped threat model |
| Written policy | NIST.CSF.GV.PO | Map the system, write the rules, sign v1 |
| Sign and version documents | ISO27001.7.5 | Map the system, write the rules, sign v1 |
| Asset inventory | NIST.CSF.ID.AM | Map the system, write the rules, sign v1 |
| Data classification | ISO27001.A.5.12 | Map the data and every rule that applies |
| Metrics with targets | ISO27001.9.1 | Find shadow AI and measure accuracy |
| Customer assurance | SOC2 | Accept the risks and answer the customers |
| Input and output guardrails | OWASP_LLM | Guard the inputs, scope the agent, redact the logs |
| Least privilege for agents | OWASP_LLM | Guard the inputs, scope the agent, redact the logs |
| Redact before write | NIST_AI_RMF | Guard the inputs, scope the agent, redact the logs |
| Model file scanning | OWASP_LLM | Rebuild clean and hand over monitoring |
| Human checkpoint | NIST_AI_RMF | Automate the suite and check AI-assisted work |
| Model cards | NIST_AI_RMF | Accept the risks and answer the customers |
| Shadow AI discovery | NIST_AI_RMF | Find shadow AI and measure accuracy |
| Suites with a pass line | NIST_AI_RMF | Automate the suite and check AI-assisted work |

