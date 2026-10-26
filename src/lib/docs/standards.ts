/**
 * R107 — the standards register: every framework, exam blueprint, practice
 * standard and publication a course tags a task, a step or a form with, and
 * the controls inside them that a form cites by code. One module, so the
 * framework badge, the Guide's framework section, the member profile and the
 * published ontology print the same label and the same reason.
 *
 * The 26 ids the platform used before this round are unchanged (`Framework`
 * is still an open string); the helpers in `src/lib/utils.ts` now read from
 * here. The twelve ids added are the publications the forms cite ("NIST SP
 * 800-30 / ISO 27005") so a citation resolves to something with a publisher.
 *
 * Colour is a `tone`; the Tailwind class for a tone stays in `utils.ts`, so no
 * class string reaches a document.
 *
 * `CONTROLS` is a curated catalogue, not the whole of any standard: the
 * functions and categories of NIST CSF 2.0, the families and the cited
 * controls of SP 800-53, the clauses and Annex A controls ISO 27001 forms
 * cite, the SOC 2 criteria, the ITIL practices, the Well-Architected pillars,
 * the CIS controls, the SP 800-61 phases. `parseStandard()` reads a form's
 * `standard` string and returns the catalogue rows it cites, and only those:
 * a code the catalogue does not hold is never emitted, so nothing published
 * is invented from free text. A string that cites no control is listed in
 * `CONTROL_EXCEPTIONS` with the practices it stands for, and the test holds
 * every form to one of the two.
 */

export type StandardKind = 'framework' | 'exam' | 'practice' | 'publication';
export type StandardTone = 'info' | 'accent' | 'warn' | 'danger' | 'ok';

export interface StandardDef {
  /** The framework id tasks and steps carry, unchanged since the course was written. */
  id: string;
  /** Six words or fewer. */
  label: string;
  /** What it is, twenty words or fewer. */
  description: string;
  /** Why a step is tagged with it, seventy words or fewer. */
  why: string;
  kind: StandardKind;
  tone: StandardTone;
  publisher: string;
  url?: string;
  /** The shape of a control code of this standard, as a regex source. */
  codePattern?: string;
}

export interface ControlRef {
  /** 'NIST.CSF.DE.CM-01', 'ISO27001.A.8.32', 'SOC2.CC7.4', 'ITIL.change'. */
  code: string;
  /** A `StandardDef.id`. */
  standard: string;
  /** Eight words or fewer, the standard's own name for it. */
  label: string;
  /** The code this one sits under, when it does. */
  parent?: string;
  /** How a form cites it, matched as whole words, case-insensitively. */
  cites: string[];
  /** When set, a citation counts only if the whole text also matches this. */
  scope?: string;
}

const s = (id: string, label: string, description: string, why: string, kind: StandardKind, tone: StandardTone, publisher: string, url?: string, codePattern?: string): StandardDef => ({
  id, label, description, why, kind, tone, publisher, ...(url ? { url } : {}), ...(codePattern ? { codePattern } : {}),
});

export const STANDARDS: StandardDef[] = [
  s('NIST_CSF', 'NIST CSF', 'NIST Cybersecurity Framework 2.0: Govern, Identify, Protect, Detect, Respond, Recover',
    'Organises all security work into six functions. Tagging a step here shows which part of the lifecycle it strengthens and proves the work covered the whole picture, not just attack or defence.',
    'framework', 'info', 'NIST', 'https://www.nist.gov/cyberframework', '^NIST\\.CSF(\\.(GV|ID|PR|DE|RS|RC)(\\.[A-Z]{2}(-\\d{2})?)?|\\.PROFILE)?$'),
  s('CIS', 'CIS', 'CIS Critical Security Controls v8 and the CIS Benchmarks',
    'A prioritised "do these first" list of safeguards. A CIS tag means this step implements an industry-baseline control that auditors and blue teams recognise at once.',
    'framework', 'accent', 'Center for Internet Security', 'https://www.cisecurity.org/controls', '^CIS(\\.(CONTROLS|BENCHMARK|\\d{1,2}))?$'),
  s('OWASP', 'OWASP', 'OWASP Top 10 and the Web Security Testing Guide',
    'Catalogues the most common web application weaknesses. This tag means the step attacks or defends one of those top risks, the shared language developers use to talk about web security.',
    'framework', 'warn', 'OWASP Foundation', 'https://owasp.org/www-project-top-ten/'),
  s('CVSS', 'CVSS', 'Common Vulnerability Scoring System',
    'A 0 to 10 severity score for vulnerabilities. It turns "this is bad" into a consistent number, so stakeholders can rank findings and decide what to fix first.',
    'framework', 'danger', 'FIRST', 'https://www.first.org/cvss/'),
  s('NIST_800_61', 'NIST 800-61', 'NIST SP 800-61 Computer Security Incident Handling Guide',
    'The incident-handling playbook: prepare, detect and analyse, contain, eradicate, recover, learn. This tag means the step is part of a defensible, court-ready incident response process.',
    'publication', 'warn', 'NIST', 'https://csrc.nist.gov/pubs/sp/800/61/r3/final', '^NIST\\.800-61(\\.(PREPARE|DETECT|CONTAIN|POST))?$'),
  s('NIST_800_115', 'NIST 800-115', 'NIST SP 800-115 Technical Guide to Information Security Testing and Assessment',
    'The standard method for security testing and assessment. Following it makes scanning and exploitation repeatable, authorised and credible in a report.',
    'publication', 'ok', 'NIST', 'https://csrc.nist.gov/pubs/sp/800/115/final'),
  s('ISO_27001', 'ISO 27001', 'ISO/IEC 27001:2022 information security management system',
    'The certifiable information security management standard. This tag means the step produces the documented policy or evidence an ISO 27001 audit expects to see.',
    'framework', 'ok', 'ISO/IEC', 'https://www.iso.org/standard/27001', '^ISO27001(\\.(\\d+(\\.\\d+)*|A\\.\\d+\\.\\d+))?$'),
  s('SOC_2', 'SOC 2', 'AICPA Trust Services Criteria for a SOC 2 examination',
    'The AICPA attestation standard built on the Trust Services Criteria: Security is CC1 to CC9, plus Availability, Confidentiality and the rest. This tag means the step produces a control or the evidence a SOC 2 Type I or II examiner samples.',
    'framework', 'info', 'AICPA', 'https://www.aicpa-cima.com/topic/audit-assurance/audit-and-assurance-greater-than-soc-2', '^SOC2(\\.(CC\\d(\\.\\d)?|A1|C1|PI1|P\\d))?$'),
  s('STRIDE', 'STRIDE', 'STRIDE threat modelling',
    'A threat modelling lens: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege. It names the category of threat this step addresses.',
    'practice', 'danger', 'Microsoft'),
  s('CCNA', 'CCNA 200-301', 'Cisco CCNA 200-301 v1.1: the exam blueprint and its six domains',
    'The CCNA blueprint: network fundamentals, access, IP connectivity, IP services, security fundamentals and automation. This tag says which exam domain the work covers, so the portfolio and the syllabus can be read against each other.',
    'exam', 'info', 'Cisco', 'https://learningnetwork.cisco.com/s/ccna-exam-topics'),
  s('ITIL', 'ITIL 4', 'ITIL 4 service management practices: change, incident, problem, release',
    'The operating disciplines a network team is judged on: change, incident and problem management. A tag here means the step is not just technically right but done the way an organisation can audit: requested, reviewed, reversible and recorded.',
    'framework', 'accent', 'PeopleCert', 'https://www.axelos.com/certifications/itil-service-management', '^ITIL(\\.[a-z-]+)?$'),
  s('AZ_900', 'AZ-900', 'Microsoft Azure Fundamentals (AZ-900)',
    'The Azure Fundamentals exam: cloud concepts, Azure architecture and services, and management and governance. The tag says which exam area a task practises, so the course and the syllabus can be read side by side.',
    'exam', 'info', 'Microsoft', 'https://learn.microsoft.com/credentials/certifications/azure-fundamentals/'),
  s('AZ_104', 'AZ-104', 'Microsoft Azure Administrator (AZ-104)',
    'The Azure Administrator exam: identities and governance, storage, compute, networking and monitoring. The tag says which exam area a task practises.',
    'exam', 'info', 'Microsoft', 'https://learn.microsoft.com/credentials/certifications/azure-administrator/'),
  s('AZ_400', 'AZ-400', 'Microsoft DevOps Engineer Expert (AZ-400)',
    'The DevOps Engineer exam: source control, pipelines, infrastructure as code, security and compliance in the pipeline, and monitoring. The tag says which exam area a task practises.',
    'exam', 'info', 'Microsoft', 'https://learn.microsoft.com/credentials/certifications/devops-engineer/'),
  s('AWS_CLF', 'AWS CLF-C02', 'AWS Certified Cloud Practitioner (CLF-C02)',
    'The AWS Cloud Practitioner exam: cloud concepts, security and compliance, core services, and billing and pricing. The tag says which area a task practises.',
    'exam', 'warn', 'Amazon Web Services', 'https://aws.amazon.com/certification/certified-cloud-practitioner/'),
  s('AWS_SAA', 'AWS SAA-C03', 'AWS Certified Solutions Architect Associate (SAA-C03)',
    'The AWS Solutions Architect Associate exam: secure, resilient, high-performing and cost-optimised design. The tag says which area a task practises.',
    'exam', 'warn', 'Amazon Web Services', 'https://aws.amazon.com/certification/certified-solutions-architect-associate/'),
  s('AWS_DOP', 'AWS DOP-C02', 'AWS Certified DevOps Engineer Professional (DOP-C02)',
    'The AWS DevOps Engineer Professional exam: CI/CD, infrastructure as code, monitoring, incident response and governance at scale. The tag says which area a task practises.',
    'exam', 'warn', 'Amazon Web Services', 'https://aws.amazon.com/certification/certified-devops-engineer-professional/'),
  s('WAF', 'Well-Architected', 'Well-Architected Framework pillars, Azure and AWS',
    'Both clouds judge a design on the same pillars: reliability, security, cost, operational excellence and performance. A tag here means the step is a design choice one of them would ask about.',
    'framework', 'ok', 'Microsoft and Amazon Web Services', 'https://learn.microsoft.com/azure/well-architected/', '^WAF(\\.[a-z-]+)?$'),
  s('SECAI', 'SecAI+ CY0-001', 'CompTIA SecAI+ (CY0-001): securing AI systems',
    'The SecAI+ exam: AI concepts and data, securing AI systems, AI-assisted security, and AI governance and compliance. The tag says which exam objective a task practises.',
    'exam', 'info', 'CompTIA', 'https://www.comptia.org/certifications/secai'),
  s('CISSP', 'CISSP', 'ISC2 CISSP: the eight domains of the Common Body of Knowledge',
    'The CISSP exam outline has eight domains, from security and risk management to software development security. The tag says which domain a sheet or control belongs to.',
    'exam', 'accent', 'ISC2', 'https://www.isc2.org/certifications/cissp'),
  s('NIST_AI_RMF', 'NIST AI RMF', 'NIST AI Risk Management Framework 1.0 and its Generative AI Profile',
    'The AI framework Ridgeline adopts: Govern, Map, Measure, Manage. A tag here means the step produces something an AI risk register or the AI questions a buyer asks will ask for.',
    'framework', 'ok', 'NIST', 'https://www.nist.gov/itl/ai-risk-management-framework', '^NIST\\.AI-RMF(\\.(GOVERN|MAP|MEASURE|MANAGE))?$'),
  s('OWASP_LLM', 'OWASP LLM Top 10', 'OWASP Top 10 for Large Language Model Applications',
    'The shared catalogue of LLM application weaknesses: prompt injection, sensitive disclosure, excessive agency and the rest. A tag here names the weakness the step attacks or defends.',
    'framework', 'warn', 'OWASP Foundation', 'https://owasp.org/www-project-top-10-for-large-language-model-applications/'),
  s('MITRE_ATLAS', 'MITRE ATLAS', 'MITRE ATLAS: adversary tactics and techniques against AI systems',
    'ATT&CK for AI: real-world techniques attackers use against models and their data. Mapping a case to an ATLAS technique makes it comparable with the threat intelligence everyone else holds.',
    'framework', 'danger', 'MITRE', 'https://atlas.mitre.org/'),
  s('ISO_42001', 'ISO/IEC 42001', 'ISO/IEC 42001 AI management system',
    'The certifiable management system standard for AI. Customers ask about it; a tag here means the step produces the kind of record an AI management system keeps.',
    'framework', 'ok', 'ISO/IEC', 'https://www.iso.org/standard/42001'),
  s('NIST_800_53', 'NIST SP 800-53', 'NIST SP 800-53 Rev. 5 security and privacy controls',
    'The federal control catalogue the sixteen CISSP control statements are drawn from (PM-1, SC-7, AC-2). A tag here means the step writes or proves one of those controls.',
    'publication', 'info', 'NIST', 'https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final', '^NIST\\.800-53(\\.[A-Z]{2}(-\\d+)?)?$'),
  s('NIST_800_171', 'NIST SP 800-171', 'NIST SP 800-171: protecting controlled unclassified information',
    'What a federal contract requires once controlled unclassified information arrives. A tag here means the step feeds the gap analysis or the System Security Plan.',
    'publication', 'warn', 'NIST', 'https://csrc.nist.gov/pubs/sp/800/171/r3/final', '^(NIST\\.800-171(\\.3\\.\\d{1,2})?|FAR\\.52\\.204-21)$'),
  // Publications the forms cite, added in R107 so every citation resolves.
  s('NIST_800_30', 'NIST SP 800-30', 'NIST SP 800-30 Guide for Conducting Risk Assessments',
    'The federal method for a risk assessment: threat sources, events, likelihood and impact. A risk register that follows it can be defended line by line.',
    'publication', 'info', 'NIST', 'https://csrc.nist.gov/pubs/sp/800/30/r1/final'),
  s('NIST_800_34', 'NIST SP 800-34', 'NIST SP 800-34 Contingency Planning Guide for Federal Information Systems',
    'Where the business impact analysis and the recovery objectives (RTO, RPO) come from. A recovery plan that cites it states what must come back, and how fast.',
    'publication', 'ok', 'NIST', 'https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final'),
  s('NIST_800_40', 'NIST SP 800-40', 'NIST SP 800-40 Guide to Enterprise Patch Management Planning',
    'Patching as a managed routine rather than a scramble: inventory, prioritise, test, deploy, verify. A vulnerability management SOP that cites it has a defensible cadence.',
    'publication', 'accent', 'NIST', 'https://csrc.nist.gov/pubs/sp/800/40/r4/final'),
  s('NIST_800_88', 'NIST SP 800-88', 'NIST SP 800-88 Guidelines for Media Sanitization',
    'Clear, purge, destroy: the three sanitisation levels and when each applies. A disposal record that cites it proves the data left with the hardware.',
    'publication', 'warn', 'NIST', 'https://csrc.nist.gov/pubs/sp/800/88/r2/final'),
  s('NIST_800_207', 'NIST SP 800-207', 'NIST SP 800-207 Zero Trust Architecture',
    'The reference for zero trust: no implicit trust from network location, every access decided per request. A network design that cites it explains its default-deny rules.',
    'publication', 'info', 'NIST', 'https://csrc.nist.gov/pubs/sp/800/207/final'),
  s('NIST_800_63', 'NIST SP 800-63', 'NIST SP 800-63-4 Digital Identity Guidelines',
    'The assurance levels for identity proofing, authenticators and federation. An identity standard that cites it says which level MFA and single sign-on reach.',
    'publication', 'info', 'NIST', 'https://pages.nist.gov/800-63-4/'),
  s('NIST_800_218', 'NIST SP 800-218', 'NIST SP 800-218 Secure Software Development Framework (SSDF)',
    'The practices a secure software pipeline follows: protect the code, produce well-secured software, respond to vulnerabilities. A pipeline record that cites it names the gate each practice became.',
    'publication', 'accent', 'NIST', 'https://csrc.nist.gov/pubs/sp/800/218/final'),
  s('ISO_27005', 'ISO/IEC 27005', 'ISO/IEC 27005 information security risk management',
    'The risk method behind ISO 27001 clause 6: identify, analyse, evaluate, treat. A risk register that cites it reads the same way to an auditor.',
    'publication', 'ok', 'ISO/IEC', 'https://www.iso.org/standard/80585.html'),
  s('ISO_27037', 'ISO/IEC 27037', 'ISO/IEC 27037 identification, collection, acquisition and preservation of digital evidence',
    'How evidence is collected and kept so it still counts later: identify, collect, acquire, preserve, with a chain of custody. An evidence log that cites it can be trusted in a dispute.',
    'publication', 'warn', 'ISO/IEC', 'https://www.iso.org/standard/44381.html'),
  s('ISO_42010', 'ISO/IEC/IEEE 42010', 'ISO/IEC/IEEE 42010 architecture description',
    'What an architecture description must contain: stakeholders, concerns, viewpoints and the decisions behind them. A solution architecture document that cites it is complete rather than a diagram.',
    'publication', 'info', 'ISO/IEC/IEEE', 'https://www.iso.org/standard/74393.html'),
  s('PTES', 'PTES', 'Penetration Testing Execution Standard',
    'The seven phases of a penetration test, from pre-engagement and intelligence gathering to reporting. A test that cites it can show it was scoped, authorised and complete.',
    'practice', 'ok', 'PTES community', 'http://www.pentest-standard.org/'),
  s('MITRE_ATTACK', 'MITRE ATT&CK', 'MITRE ATT&CK Enterprise: adversary tactics and techniques',
    'The shared vocabulary for adversary behaviour: fourteen tactics and the techniques under them. A detection or an indicator mapped to a technique id is comparable with the work of every other team.',
    'framework', 'danger', 'MITRE', 'https://attack.mitre.org/'),
];

const c = (code: string, standard: string, label: string, cites: string[] = [], parent?: string, scope?: string): ControlRef => ({
  code, standard, label, ...(parent ? { parent } : {}), cites, ...(scope ? { scope } : {}),
});

const CSF = 'NIST_CSF';
const R5 = 'NIST_800_53';
const ISO = 'ISO_27001';
const SOC = 'SOC_2';

export const CONTROLS: ControlRef[] = [
  // ── NIST CSF 2.0: the six functions and their categories ────────────────
  c('NIST.CSF', CSF, 'Cybersecurity Framework 2.0', ['NIST CSF']),
  c('NIST.CSF.GV', CSF, 'Govern', ['Govern', 'GV'], 'NIST.CSF', 'CSF'),
  c('NIST.CSF.ID', CSF, 'Identify', ['Identify'], 'NIST.CSF', 'CSF'),
  c('NIST.CSF.PR', CSF, 'Protect', ['Protect'], 'NIST.CSF', 'CSF'),
  c('NIST.CSF.DE', CSF, 'Detect', ['Detect'], 'NIST.CSF', 'CSF'),
  c('NIST.CSF.RS', CSF, 'Respond', ['Respond'], 'NIST.CSF', 'CSF'),
  c('NIST.CSF.RC', CSF, 'Recover', ['Recover'], 'NIST.CSF', 'CSF'),
  c('NIST.CSF.PROFILE', CSF, 'Organizational Profiles', ['CSF Profiles', 'Profiles'], 'NIST.CSF', 'CSF'),
  c('NIST.CSF.GV.OC', CSF, 'Organizational Context', ['GV.OC'], 'NIST.CSF.GV'),
  c('NIST.CSF.GV.RM', CSF, 'Risk Management Strategy', ['GV.RM'], 'NIST.CSF.GV'),
  c('NIST.CSF.GV.RR', CSF, 'Roles, Responsibilities, and Authorities', ['GV.RR'], 'NIST.CSF.GV'),
  c('NIST.CSF.GV.PO', CSF, 'Policy', ['GV.PO'], 'NIST.CSF.GV'),
  c('NIST.CSF.GV.OV', CSF, 'Oversight', ['GV.OV'], 'NIST.CSF.GV'),
  c('NIST.CSF.GV.SC', CSF, 'Cybersecurity Supply Chain Risk Management', ['GV.SC'], 'NIST.CSF.GV'),
  c('NIST.CSF.ID.AM', CSF, 'Asset Management', ['ID.AM'], 'NIST.CSF.ID'),
  c('NIST.CSF.ID.RA', CSF, 'Risk Assessment', ['ID.RA'], 'NIST.CSF.ID'),
  c('NIST.CSF.ID.IM', CSF, 'Improvement', ['ID.IM'], 'NIST.CSF.ID'),
  c('NIST.CSF.PR.AA', CSF, 'Identity Management, Authentication, and Access Control', ['PR.AA'], 'NIST.CSF.PR'),
  c('NIST.CSF.PR.AT', CSF, 'Awareness and Training', ['PR.AT'], 'NIST.CSF.PR'),
  c('NIST.CSF.PR.DS', CSF, 'Data Security', ['PR.DS'], 'NIST.CSF.PR'),
  c('NIST.CSF.PR.PS', CSF, 'Platform Security', ['PR.PS'], 'NIST.CSF.PR'),
  c('NIST.CSF.PR.IR', CSF, 'Technology Infrastructure Resilience', ['PR.IR'], 'NIST.CSF.PR'),
  c('NIST.CSF.DE.CM', CSF, 'Continuous Monitoring', ['DE.CM'], 'NIST.CSF.DE'),
  c('NIST.CSF.DE.CM-01', CSF, 'Networks and network services are monitored', ['DE.CM-1', 'DE.CM-01'], 'NIST.CSF.DE.CM'),
  c('NIST.CSF.DE.AE', CSF, 'Adverse Event Analysis', ['DE.AE'], 'NIST.CSF.DE'),
  c('NIST.CSF.RS.MA', CSF, 'Incident Management', ['RS.MA'], 'NIST.CSF.RS'),
  c('NIST.CSF.RS.AN', CSF, 'Incident Analysis', ['RS.AN'], 'NIST.CSF.RS'),
  c('NIST.CSF.RS.CO', CSF, 'Incident Response Reporting and Communication', ['RS.CO'], 'NIST.CSF.RS'),
  c('NIST.CSF.RS.MI', CSF, 'Incident Mitigation', ['RS.MI'], 'NIST.CSF.RS'),
  c('NIST.CSF.RC.RP', CSF, 'Incident Recovery Plan Execution', ['RC.RP'], 'NIST.CSF.RC'),
  c('NIST.CSF.RC.CO', CSF, 'Incident Recovery Communication', ['RC.CO'], 'NIST.CSF.RC'),
  // ── NIST SP 800-53 Rev. 5: the families and the controls the forms cite ─
  c('NIST.800-53', R5, 'Security and Privacy Controls Rev. 5', ['NIST SP 800-53', 'SP 800-53', '800-53']),
  c('NIST.800-53.AC', R5, 'Access Control', [], 'NIST.800-53'),
  c('NIST.800-53.AT', R5, 'Awareness and Training', [], 'NIST.800-53'),
  c('NIST.800-53.AU', R5, 'Audit and Accountability', [], 'NIST.800-53'),
  c('NIST.800-53.CA', R5, 'Assessment, Authorization, and Monitoring', [], 'NIST.800-53'),
  c('NIST.800-53.CM', R5, 'Configuration Management', [], 'NIST.800-53'),
  c('NIST.800-53.CP', R5, 'Contingency Planning', [], 'NIST.800-53'),
  c('NIST.800-53.IA', R5, 'Identification and Authentication', [], 'NIST.800-53'),
  c('NIST.800-53.IR', R5, 'Incident Response', [], 'NIST.800-53'),
  c('NIST.800-53.MA', R5, 'Maintenance', [], 'NIST.800-53'),
  c('NIST.800-53.MP', R5, 'Media Protection', [], 'NIST.800-53'),
  c('NIST.800-53.PE', R5, 'Physical and Environmental Protection', [], 'NIST.800-53'),
  c('NIST.800-53.PL', R5, 'Planning', [], 'NIST.800-53'),
  c('NIST.800-53.PM', R5, 'Program Management', [], 'NIST.800-53'),
  c('NIST.800-53.PS', R5, 'Personnel Security', [], 'NIST.800-53'),
  c('NIST.800-53.PT', R5, 'PII Processing and Transparency', [], 'NIST.800-53'),
  c('NIST.800-53.RA', R5, 'Risk Assessment', [], 'NIST.800-53'),
  c('NIST.800-53.SA', R5, 'System and Services Acquisition', [], 'NIST.800-53'),
  c('NIST.800-53.SC', R5, 'System and Communications Protection', [], 'NIST.800-53'),
  c('NIST.800-53.SI', R5, 'System and Information Integrity', [], 'NIST.800-53'),
  c('NIST.800-53.SR', R5, 'Supply Chain Risk Management', [], 'NIST.800-53'),
  c('NIST.800-53.AC-2', R5, 'Account Management', ['AC-2'], 'NIST.800-53.AC'),
  c('NIST.800-53.AC-5', R5, 'Separation of Duties', ['AC-5'], 'NIST.800-53.AC'),
  c('NIST.800-53.AC-6', R5, 'Least Privilege', ['AC-6'], 'NIST.800-53.AC'),
  c('NIST.800-53.AU-6', R5, 'Audit Record Review, Analysis, and Reporting', ['AU-6'], 'NIST.800-53.AU'),
  c('NIST.800-53.CA-2', R5, 'Control Assessments', ['CA-2'], 'NIST.800-53.CA'),
  c('NIST.800-53.CM-2', R5, 'Baseline Configuration', ['CM-2'], 'NIST.800-53.CM'),
  c('NIST.800-53.CM-3', R5, 'Configuration Change Control', ['CM-3'], 'NIST.800-53.CM'),
  c('NIST.800-53.CM-6', R5, 'Configuration Settings', ['CM-6'], 'NIST.800-53.CM'),
  c('NIST.800-53.CM-8', R5, 'System Component Inventory', ['CM-8'], 'NIST.800-53.CM'),
  c('NIST.800-53.CP-2', R5, 'Contingency Plan', ['CP-2'], 'NIST.800-53.CP'),
  c('NIST.800-53.CP-4', R5, 'Contingency Plan Testing', ['CP-4'], 'NIST.800-53.CP'),
  c('NIST.800-53.CP-9', R5, 'System Backup', ['CP-9'], 'NIST.800-53.CP'),
  c('NIST.800-53.IA-2', R5, 'Identification and Authentication (Organizational Users)', ['IA-2'], 'NIST.800-53.IA'),
  c('NIST.800-53.IA-5', R5, 'Authenticator Management', ['IA-5'], 'NIST.800-53.IA'),
  c('NIST.800-53.IR-4', R5, 'Incident Handling', ['IR-4'], 'NIST.800-53.IR'),
  c('NIST.800-53.IR-8', R5, 'Incident Response Plan', ['IR-8'], 'NIST.800-53.IR'),
  c('NIST.800-53.MP-6', R5, 'Media Sanitization', ['MP-6'], 'NIST.800-53.MP'),
  c('NIST.800-53.PL-2', R5, 'System Security and Privacy Plans', ['PL-2'], 'NIST.800-53.PL'),
  c('NIST.800-53.PL-8', R5, 'Security and Privacy Architectures', ['PL-8'], 'NIST.800-53.PL'),
  c('NIST.800-53.PM-1', R5, 'Information Security Program Plan', ['PM-1'], 'NIST.800-53.PM'),
  c('NIST.800-53.RA-3', R5, 'Risk Assessment', ['RA-3'], 'NIST.800-53.RA'),
  c('NIST.800-53.RA-5', R5, 'Vulnerability Monitoring and Scanning', ['RA-5'], 'NIST.800-53.RA'),
  c('NIST.800-53.SC-7', R5, 'Boundary Protection', ['SC-7'], 'NIST.800-53.SC'),
  c('NIST.800-53.SC-8', R5, 'Transmission Confidentiality and Integrity', ['SC-8'], 'NIST.800-53.SC'),
  c('NIST.800-53.SC-12', R5, 'Cryptographic Key Establishment and Management', ['SC-12'], 'NIST.800-53.SC'),
  c('NIST.800-53.SI-2', R5, 'Flaw Remediation', ['SI-2'], 'NIST.800-53.SI'),
  c('NIST.800-53.SI-4', R5, 'System Monitoring', ['SI-4'], 'NIST.800-53.SI'),
  c('NIST.800-53.SR-6', R5, 'Supplier Assessments and Reviews', ['SR-6'], 'NIST.800-53.SR'),
  // ── NIST SP 800-171 Rev. 3 families and the FAR clause beside it ─────────
  c('NIST.800-171', 'NIST_800_171', 'Protecting Controlled Unclassified Information', ['NIST SP 800-171', 'SP 800-171', '800-171']),
  c('NIST.800-171.3.1', 'NIST_800_171', 'Access Control', ['3.1'], 'NIST.800-171', '800-171'),
  c('NIST.800-171.3.2', 'NIST_800_171', 'Awareness and Training', ['3.2'], 'NIST.800-171', '800-171'),
  c('NIST.800-171.3.3', 'NIST_800_171', 'Audit and Accountability', ['3.3'], 'NIST.800-171', '800-171'),
  c('NIST.800-171.3.4', 'NIST_800_171', 'Configuration Management', ['3.4'], 'NIST.800-171', '800-171'),
  c('NIST.800-171.3.5', 'NIST_800_171', 'Identification and Authentication', ['3.5'], 'NIST.800-171', '800-171'),
  c('NIST.800-171.3.6', 'NIST_800_171', 'Incident Response', ['3.6'], 'NIST.800-171', '800-171'),
  c('NIST.800-171.3.7', 'NIST_800_171', 'Maintenance', ['3.7'], 'NIST.800-171', '800-171'),
  c('NIST.800-171.3.8', 'NIST_800_171', 'Media Protection', ['3.8'], 'NIST.800-171', '800-171'),
  c('NIST.800-171.3.9', 'NIST_800_171', 'Personnel Security', ['3.9'], 'NIST.800-171', '800-171'),
  c('NIST.800-171.3.10', 'NIST_800_171', 'Physical Protection', ['3.10'], 'NIST.800-171', '800-171'),
  c('NIST.800-171.3.11', 'NIST_800_171', 'Risk Assessment', ['3.11'], 'NIST.800-171', '800-171'),
  c('NIST.800-171.3.12', 'NIST_800_171', 'Security Assessment and Monitoring', ['3.12'], 'NIST.800-171', '800-171'),
  c('NIST.800-171.3.13', 'NIST_800_171', 'System and Communications Protection', ['3.13'], 'NIST.800-171', '800-171'),
  c('NIST.800-171.3.14', 'NIST_800_171', 'System and Information Integrity', ['3.14'], 'NIST.800-171', '800-171'),
  c('FAR.52.204-21', 'NIST_800_171', 'FAR 52.204-21 basic safeguarding', ['FAR 52.204-21', '52.204-21']),
  // ── NIST SP 800-61: the handling phases ──────────────────────────────────
  c('NIST.800-61', 'NIST_800_61', 'Computer Security Incident Handling Guide', ['NIST SP 800-61', 'SP 800-61', 'NIST 800-61', '800-61']),
  c('NIST.800-61.PREPARE', 'NIST_800_61', 'Preparation', ['Preparation'], 'NIST.800-61', '800-61'),
  c('NIST.800-61.DETECT', 'NIST_800_61', 'Detection and Analysis', ['Detection & Analysis', 'Detection and Analysis'], 'NIST.800-61', '800-61'),
  c('NIST.800-61.CONTAIN', 'NIST_800_61', 'Containment, Eradication, and Recovery', ['Containment'], 'NIST.800-61', '800-61'),
  c('NIST.800-61.POST', 'NIST_800_61', 'Post-Incident Activity', ['Post-Incident', 'Post-Incident Activity', 'Lessons Learned'], 'NIST.800-61', '800-61'),
  // ── The other NIST publications, cited as a whole ────────────────────────
  c('NIST.800-115', 'NIST_800_115', 'Technical Guide to Information Security Testing', ['NIST SP 800-115', 'SP 800-115', '800-115']),
  c('NIST.800-30', 'NIST_800_30', 'Guide for Conducting Risk Assessments', ['NIST SP 800-30', 'SP 800-30', '800-30']),
  c('NIST.800-34', 'NIST_800_34', 'Contingency Planning Guide', ['NIST SP 800-34', 'SP 800-34', '800-34']),
  c('NIST.800-40', 'NIST_800_40', 'Enterprise Patch Management Planning', ['NIST SP 800-40', 'SP 800-40', '800-40']),
  c('NIST.800-88', 'NIST_800_88', 'Guidelines for Media Sanitization', ['NIST SP 800-88', 'SP 800-88', '800-88']),
  c('NIST.800-207', 'NIST_800_207', 'Zero Trust Architecture', ['NIST SP 800-207', 'SP 800-207', '800-207']),
  c('NIST.800-63', 'NIST_800_63', 'Digital Identity Guidelines', ['NIST SP 800-63', 'SP 800-63', '800-63']),
  c('NIST.800-218', 'NIST_800_218', 'Secure Software Development Framework', ['NIST SP 800-218', 'SP 800-218', '800-218', 'SSDF']),
  c('NIST.AI-RMF', 'NIST_AI_RMF', 'AI Risk Management Framework 1.0', ['NIST AI RMF', 'AI RMF']),
  c('NIST.AI-RMF.GOVERN', 'NIST_AI_RMF', 'Govern', ['Govern'], 'NIST.AI-RMF', 'AI RMF'),
  c('NIST.AI-RMF.MAP', 'NIST_AI_RMF', 'Map', ['Map'], 'NIST.AI-RMF', 'AI RMF'),
  c('NIST.AI-RMF.MEASURE', 'NIST_AI_RMF', 'Measure', ['Measure'], 'NIST.AI-RMF', 'AI RMF'),
  c('NIST.AI-RMF.MANAGE', 'NIST_AI_RMF', 'Manage', ['Manage'], 'NIST.AI-RMF', 'AI RMF'),
  // ── ISO/IEC 27001:2022: the clauses and the Annex A controls forms cite ──
  c('ISO27001', ISO, 'Information security management system', ['ISO 27001', 'ISO/IEC 27001']),
  c('ISO27001.4', ISO, 'Context of the organization', ['Clause 4', 'cl. 4'], 'ISO27001', 'ISO'),
  c('ISO27001.5', ISO, 'Leadership', ['Clause 5', 'cl. 5'], 'ISO27001', 'ISO'),
  c('ISO27001.5.2', ISO, 'Policy', ['Clause 5.2', '5.2', 'ISO 27001 policy'], 'ISO27001.5', 'ISO'),
  c('ISO27001.6', ISO, 'Planning', ['Clause 6', 'cl. 6'], 'ISO27001', 'ISO'),
  c('ISO27001.6.1.2', ISO, 'Information security risk assessment', ['6.1.2'], 'ISO27001.6', 'ISO'),
  c('ISO27001.6.1.3', ISO, 'Information security risk treatment', ['6.1.3'], 'ISO27001.6', 'ISO'),
  c('ISO27001.7', ISO, 'Support', ['Clause 7', 'cl. 7'], 'ISO27001', 'ISO'),
  c('ISO27001.7.5', ISO, 'Documented information', ['7.5'], 'ISO27001.7', 'ISO'),
  c('ISO27001.8', ISO, 'Operation', ['Clause 8', 'cl. 8'], 'ISO27001', 'ISO'),
  c('ISO27001.9', ISO, 'Performance evaluation', ['Clause 9', 'cl. 9'], 'ISO27001', 'ISO'),
  c('ISO27001.9.1', ISO, 'Monitoring, measurement, analysis and evaluation', ['9.1'], 'ISO27001.9', 'ISO'),
  c('ISO27001.9.2', ISO, 'Internal audit', ['9.2'], 'ISO27001.9', 'ISO'),
  c('ISO27001.9.3', ISO, 'Management review', ['9.3', 'ISO 27001 reporting'], 'ISO27001.9', 'ISO'),
  c('ISO27001.10', ISO, 'Improvement', ['Clause 10', 'cl. 10'], 'ISO27001', 'ISO'),
  c('ISO27001.10.2', ISO, 'Nonconformity and corrective action', ['10.2'], 'ISO27001.10', 'ISO'),
  c('ISO27001.A.5.1', ISO, 'Policies for information security', ['A.5.1'], 'ISO27001'),
  c('ISO27001.A.5.9', ISO, 'Inventory of information and other associated assets', ['A.5.9'], 'ISO27001'),
  c('ISO27001.A.5.12', ISO, 'Classification of information', ['A.5.12'], 'ISO27001'),
  c('ISO27001.A.5.15', ISO, 'Access control', ['A.5.15'], 'ISO27001'),
  c('ISO27001.A.5.17', ISO, 'Authentication information', ['A.5.17'], 'ISO27001'),
  c('ISO27001.A.5.18', ISO, 'Access rights', ['A.5.18'], 'ISO27001'),
  c('ISO27001.A.5.19', ISO, 'Information security in supplier relationships', ['A.5.19'], 'ISO27001'),
  c('ISO27001.A.5.24', ISO, 'Incident management planning and preparation', ['A.5.24'], 'ISO27001'),
  c('ISO27001.A.5.26', ISO, 'Response to information security incidents', ['A.5.26'], 'ISO27001'),
  c('ISO27001.A.5.27', ISO, 'Learning from information security incidents', ['A.5.27'], 'ISO27001'),
  c('ISO27001.A.5.28', ISO, 'Collection of evidence', ['A.5.28'], 'ISO27001'),
  c('ISO27001.A.5.29', ISO, 'Information security during disruption', ['A.5.29'], 'ISO27001'),
  c('ISO27001.A.5.30', ISO, 'ICT readiness for business continuity', ['A.5.30'], 'ISO27001'),
  c('ISO27001.A.5.35', ISO, 'Independent review of information security', ['A.5.35'], 'ISO27001'),
  c('ISO27001.A.5.37', ISO, 'Documented operating procedures', ['A.5.37'], 'ISO27001'),
  c('ISO27001.A.8.8', ISO, 'Management of technical vulnerabilities', ['A.8.8'], 'ISO27001'),
  c('ISO27001.A.8.9', ISO, 'Configuration management', ['A.8.9'], 'ISO27001'),
  c('ISO27001.A.8.13', ISO, 'Information backup', ['A.8.13'], 'ISO27001'),
  c('ISO27001.A.8.15', ISO, 'Logging', ['A.8.15'], 'ISO27001'),
  c('ISO27001.A.8.16', ISO, 'Monitoring activities', ['A.8.16'], 'ISO27001'),
  c('ISO27001.A.8.20', ISO, 'Networks security', ['A.8.20'], 'ISO27001'),
  c('ISO27001.A.8.22', ISO, 'Segregation of networks', ['A.8.22'], 'ISO27001'),
  c('ISO27001.A.8.24', ISO, 'Use of cryptography', ['A.8.24'], 'ISO27001'),
  c('ISO27001.A.8.29', ISO, 'Security testing in development and acceptance', ['A.8.29'], 'ISO27001'),
  c('ISO27001.A.8.32', ISO, 'Change management', ['A.8.32'], 'ISO27001'),
  // ── SOC 2 Trust Services Criteria ────────────────────────────────────────
  c('SOC2', SOC, 'Trust Services Criteria', ['SOC 2', 'SOC2', 'SOC 2 TSC', 'Trust Services Criteria']),
  c('SOC2.CC1', SOC, 'Control Environment', ['CC1'], 'SOC2'),
  c('SOC2.CC2', SOC, 'Communication and Information', ['CC2'], 'SOC2'),
  c('SOC2.CC3', SOC, 'Risk Assessment', ['CC3'], 'SOC2'),
  c('SOC2.CC3.2', SOC, 'Risks to objectives are identified and analysed', ['CC3.2'], 'SOC2.CC3'),
  c('SOC2.CC4', SOC, 'Monitoring Activities', ['CC4'], 'SOC2'),
  c('SOC2.CC4.1', SOC, 'Ongoing and separate evaluations', ['CC4.1'], 'SOC2.CC4'),
  c('SOC2.CC5', SOC, 'Control Activities', ['CC5'], 'SOC2'),
  c('SOC2.CC6', SOC, 'Logical and Physical Access Controls', ['CC6'], 'SOC2'),
  c('SOC2.CC6.1', SOC, 'Logical access security over protected assets', ['CC6.1'], 'SOC2.CC6'),
  c('SOC2.CC6.2', SOC, 'Access provisioning and removal', ['CC6.2'], 'SOC2.CC6'),
  c('SOC2.CC6.3', SOC, 'Role-based access and periodic review', ['CC6.3'], 'SOC2.CC6'),
  c('SOC2.CC6.6', SOC, 'Boundary protection against external threats', ['CC6.6'], 'SOC2.CC6'),
  c('SOC2.CC6.7', SOC, 'Protection of data in transit and on media', ['CC6.7'], 'SOC2.CC6'),
  c('SOC2.CC6.8', SOC, 'Prevention and detection of unauthorised software', ['CC6.8'], 'SOC2.CC6'),
  c('SOC2.CC7', SOC, 'System Operations', ['CC7'], 'SOC2'),
  c('SOC2.CC7.1', SOC, 'Vulnerability and configuration change monitoring', ['CC7.1'], 'SOC2.CC7'),
  c('SOC2.CC7.2', SOC, 'Anomaly monitoring and analysis', ['CC7.2'], 'SOC2.CC7'),
  c('SOC2.CC7.3', SOC, 'Security event evaluation', ['CC7.3'], 'SOC2.CC7'),
  c('SOC2.CC7.4', SOC, 'Incident response program', ['CC7.4'], 'SOC2.CC7'),
  c('SOC2.CC7.5', SOC, 'Incident recovery', ['CC7.5'], 'SOC2.CC7'),
  c('SOC2.CC8', SOC, 'Change Management', ['CC8'], 'SOC2'),
  c('SOC2.CC8.1', SOC, 'Authorised, tested and approved changes', ['CC8.1'], 'SOC2.CC8'),
  c('SOC2.CC9', SOC, 'Risk Mitigation', ['CC9'], 'SOC2'),
  c('SOC2.CC9.2', SOC, 'Vendor and business partner risk', ['CC9.2'], 'SOC2.CC9'),
  c('SOC2.A1', SOC, 'Availability', ['A1'], 'SOC2', 'SOC'),
  c('SOC2.C1', SOC, 'Confidentiality', ['C1'], 'SOC2', 'SOC'),
  // ── ITIL 4 practices ─────────────────────────────────────────────────────
  c('ITIL', 'ITIL', 'ITIL 4 service management practices', ['ITIL', 'ITIL 4']),
  c('ITIL.change', 'ITIL', 'Change enablement', ['change enablement', 'change record', 'change management'], 'ITIL'),
  c('ITIL.incident', 'ITIL', 'Incident management', ['incident management'], 'ITIL'),
  c('ITIL.problem', 'ITIL', 'Problem management', ['problem management'], 'ITIL'),
  c('ITIL.release', 'ITIL', 'Release management', ['release management', 'release record'], 'ITIL'),
  c('ITIL.deployment', 'ITIL', 'Deployment management', ['deployment management'], 'ITIL'),
  c('ITIL.configuration', 'ITIL', 'Service configuration management', ['service configuration management'], 'ITIL'),
  c('ITIL.monitoring', 'ITIL', 'Monitoring and event management', ['monitoring and event management'], 'ITIL'),
  c('ITIL.continuity', 'ITIL', 'Service continuity management', ['service continuity'], 'ITIL'),
  c('ITIL.asset', 'ITIL', 'IT asset management', ['IT asset management'], 'ITIL'),
  c('ITIL.transition', 'ITIL', 'Service transition', ['service transition'], 'ITIL'),
  c('ITIL.knowledge', 'ITIL', 'Knowledge management', ['knowledge management'], 'ITIL'),
  // ── Well-Architected pillars (both clouds) ───────────────────────────────
  c('WAF', 'WAF', 'Well-Architected Framework', ['Well-Architected']),
  c('WAF.security', 'WAF', 'Security pillar', ['security'], 'WAF', 'Well-Architected'),
  c('WAF.reliability', 'WAF', 'Reliability pillar', ['reliability'], 'WAF', 'Well-Architected'),
  c('WAF.cost', 'WAF', 'Cost optimisation pillar', ['cost', 'cost optimisation', 'cost optimization'], 'WAF', 'Well-Architected'),
  c('WAF.operational-excellence', 'WAF', 'Operational excellence pillar', ['operational excellence'], 'WAF', 'Well-Architected'),
  c('WAF.performance', 'WAF', 'Performance efficiency pillar', ['performance', 'performance efficiency'], 'WAF', 'Well-Architected'),
  // ── CIS: the Benchmarks and the Controls v8 ──────────────────────────────
  c('CIS', 'CIS', 'Center for Internet Security', ['CIS']),
  c('CIS.BENCHMARK', 'CIS', 'CIS Benchmarks', ['CIS Benchmark', 'CIS Benchmarks'], 'CIS'),
  c('CIS.CONTROLS', 'CIS', 'CIS Critical Security Controls v8', ['CIS Controls', 'CIS Controls v8', 'CIS Critical Security Controls'], 'CIS'),
  c('CIS.1', 'CIS', 'Inventory and Control of Enterprise Assets', ['CIS Control 1'], 'CIS.CONTROLS'),
  c('CIS.2', 'CIS', 'Inventory and Control of Software Assets', ['CIS Control 2'], 'CIS.CONTROLS'),
  c('CIS.3', 'CIS', 'Data Protection', ['CIS Control 3'], 'CIS.CONTROLS'),
  c('CIS.4', 'CIS', 'Secure Configuration of Enterprise Assets and Software', ['CIS Control 4'], 'CIS.CONTROLS'),
  c('CIS.5', 'CIS', 'Account Management', ['CIS Control 5'], 'CIS.CONTROLS'),
  c('CIS.6', 'CIS', 'Access Control Management', ['CIS Control 6'], 'CIS.CONTROLS'),
  c('CIS.7', 'CIS', 'Continuous Vulnerability Management', ['CIS Control 7'], 'CIS.CONTROLS'),
  c('CIS.8', 'CIS', 'Audit Log Management', ['CIS Control 8'], 'CIS.CONTROLS'),
  c('CIS.10', 'CIS', 'Malware Defenses', ['CIS Control 10'], 'CIS.CONTROLS'),
  c('CIS.11', 'CIS', 'Data Recovery', ['CIS Control 11'], 'CIS.CONTROLS'),
  c('CIS.12', 'CIS', 'Network Infrastructure Management', ['CIS Control 12'], 'CIS.CONTROLS'),
  c('CIS.13', 'CIS', 'Network Monitoring and Defense', ['CIS Control 13'], 'CIS.CONTROLS'),
  c('CIS.15', 'CIS', 'Service Provider Management', ['CIS Control 15'], 'CIS.CONTROLS'),
  c('CIS.16', 'CIS', 'Application Software Security', ['CIS Control 16'], 'CIS.CONTROLS'),
  c('CIS.17', 'CIS', 'Incident Response Management', ['CIS Control 17'], 'CIS.CONTROLS'),
  c('CIS.18', 'CIS', 'Penetration Testing', ['CIS Control 18'], 'CIS.CONTROLS'),
  // ── The standards cited as a whole ───────────────────────────────────────
  c('CVSS', 'CVSS', 'Common Vulnerability Scoring System', ['CVSS']),
  c('OWASP', 'OWASP', 'OWASP Top 10 and Web Security Testing Guide', ['OWASP', 'OWASP Top 10', 'WSTG']),
  c('OWASP.LLM', 'OWASP_LLM', 'OWASP Top 10 for LLM Applications', ['OWASP LLM Top 10', 'OWASP LLM', 'LLM Top 10']),
  c('STRIDE', 'STRIDE', 'STRIDE threat model', ['STRIDE']),
  c('MITRE.ATTACK', 'MITRE_ATTACK', 'ATT&CK Enterprise', ['MITRE ATT&CK', 'ATT&CK']),
  c('MITRE.ATLAS', 'MITRE_ATLAS', 'ATLAS', ['MITRE ATLAS', 'ATLAS']),
  c('ISO42001', 'ISO_42001', 'AI management system', ['ISO/IEC 42001', 'ISO 42001', '42001']),
  c('ISO42010', 'ISO_42010', 'Architecture description', ['ISO/IEC/IEEE 42010', 'ISO 42010', '42010']),
  c('ISO27005', 'ISO_27005', 'Information security risk management', ['ISO/IEC 27005', 'ISO 27005']),
  c('ISO27037', 'ISO_27037', 'Digital evidence handling', ['ISO/IEC 27037', 'ISO 27037']),
  c('PTES', 'PTES', 'Penetration Testing Execution Standard', ['PTES']),
];

/**
 * Form `standard` strings that cite no control of the catalogue, and the
 * engineering practices (`tactics.ts` PRACTICES) they stand for. Every form's
 * `standard` either parses to at least one control or is listed here.
 */
export const CONTROL_EXCEPTIONS: Record<string, string[]> = {
  'AWS tagging best practices — naming and tagging': ['practice.naming-and-tagging'],
  'Microsoft Cloud Adoption Framework — naming and tagging': ['practice.naming-and-tagging'],
  'Addressing plan & connectivity verification': ['practice.addressing-plan', 'practice.test-and-acceptance'],
  'Architecture definition': ['practice.architecture-decision-records'],
  'As-built documentation · operational handover': ['practice.as-built-documentation'],
  'Authorisation · evidence integrity': ['practice.authorised-testing', 'practice.evidence-hashing'],
  'Change & patch management, standard operating procedures': ['practice.change-control', 'practice.patch-management', 'practice.runbooks-written'],
  'Configuration baseline, hardening benchmark & written policy': ['practice.hardening-baseline', 'practice.written-policy'],
  'Configuration record': ['practice.configuration-record'],
  'Customer assurance': ['practice.customer-assurance'],
  'Detailed design · IPAM': ['practice.addressing-plan'],
  'Device hardening · policy': ['practice.hardening-baseline', 'practice.written-policy'],
  'Disaster recovery & as-built handover documentation': ['practice.recovery-objectives', 'practice.as-built-documentation'],
  'Hardware audit & compatibility validation': ['practice.asset-inventory'],
  'Inventory & capability baseline': ['practice.asset-inventory'],
  'MSA / SOW / NDA': ['practice.engagement-agreement'],
  'OpenAPI-style interface specification': ['practice.api-contract'],
  'Physical installation & asset inventory': ['practice.asset-inventory'],
  'RFC 1918 addressing · segmentation': ['practice.addressing-plan', 'practice.segmentation'],
  'Requirements definition': ['practice.requirements-first'],
  'Rules of Engagement': ['practice.authorised-testing'],
  'Test & acceptance': ['practice.test-and-acceptance'],
  'Troubleshooting method, RAID & hypervisor build record': ['practice.troubleshooting-method', 'practice.build-record'],
  'Structured troubleshooting method': ['practice.troubleshooting-method'],
  'Backup & restore proof': ['practice.backup-before-change', 'practice.backups-tested'],
  'Incident & request handling': ['practice.troubleshooting-method', 'practice.work-tracked'],
};

/* ── helpers (lowercase: never written to a document) ───────────────────── */

const byId = new Map(STANDARDS.map((x) => [x.id, x]));
const byCode = new Map(CONTROLS.map((x) => [x.code, x]));

export function standardOf(id: string): StandardDef | undefined {
  return byId.get(id);
}

export function controlOf(code: string): ControlRef | undefined {
  return byCode.get(code);
}

/** The catalogue rows of one standard, in catalogue order. */
export function controlsOf(standardId: string): ControlRef[] {
  return CONTROLS.filter((x) => x.standard === standardId);
}

/** True when `code` is `ancestor` or sits under it. */
export function underControl(code: string, ancestor: string): boolean {
  let cur: ControlRef | undefined = byCode.get(code);
  while (cur) {
    if (cur.code === ancestor) return true;
    cur = cur.parent ? byCode.get(cur.parent) : undefined;
  }
  return false;
}

const escape = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const edge = (x: string, start: boolean) => (/\w/.test(start ? x[0] : x[x.length - 1]) ? '\\b' : '');
const citeRe = (alias: string) => new RegExp(`${edge(alias, true)}${escape(alias)}${edge(alias, false)}`, 'gi');

/**
 * The catalogue rows a form's `standard` string cites, most specific first in
 * catalogue order: 'NIST CSF (DE.CM-1)' is the subcategory, not the framework;
 * 'OWASP LLM Top 10 · MITRE ATLAS' is the LLM list, not OWASP. A citation the
 * catalogue does not hold is not a citation.
 */
export function parseStandard(text: string): ControlRef[] {
  type Hit = { ref: ControlRef; start: number; end: number };
  const hits: Hit[] = [];
  for (const ref of CONTROLS) {
    if (ref.scope && !new RegExp(ref.scope, 'i').test(text)) continue;
    for (const alias of ref.cites) {
      for (const m of text.matchAll(citeRe(alias))) hits.push({ ref, start: m.index ?? 0, end: (m.index ?? 0) + m[0].length });
    }
  }
  // A citation inside a longer one is the longer one ('OWASP' in 'OWASP LLM Top 10').
  const outer = hits.filter((h) => !hits.some((o) => o.ref !== h.ref && o.start <= h.start && o.end >= h.end && o.end - o.start > h.end - h.start));
  const refs = [...new Set(outer.map((h) => h.ref))];
  // A standard cited beside one of its own controls is the control ('NIST CSF' beside 'DE.CM-1').
  return refs.filter((r) => !refs.some((o) => o !== r && underControl(o.code, r.code))).sort((a, b) => CONTROLS.indexOf(a) - CONTROLS.indexOf(b));
}

/** The distinct standards a form's `standard` string cites, via its controls. */
export function standardsCited(text: string): string[] {
  return [...new Set(parseStandard(text).map((r) => r.standard))];
}
