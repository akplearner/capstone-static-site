import { Framework } from './types';
import { EVIDENCE_NAMING } from './evidence';

const FRAMEWORK_COLORS: Record<Framework, string> = {
  'NIST_CSF': 'bg-info-soft text-info',
  'CIS': 'bg-accent-soft text-accent-ink',
  'OWASP': 'bg-warn-soft text-warn',
  'CVSS': 'bg-danger-soft text-danger',
  'NIST_800_61': 'bg-warn-soft text-warn',
  'NIST_800_115': 'bg-ok-soft text-ok',
  'ISO_27001': 'bg-ok-soft text-ok',
  'SOC_2': 'bg-info-soft text-info',
  'STRIDE': 'bg-danger-soft text-danger',
  'CCNA': 'bg-info-soft text-info',
  'ITIL': 'bg-accent-soft text-accent-ink',
};

const FRAMEWORK_LABELS: Record<Framework, string> = {
  'NIST_CSF': 'NIST CSF',
  'CIS': 'CIS',
  'OWASP': 'OWASP',
  'CVSS': 'CVSS',
  'NIST_800_61': 'NIST 800-61',
  'NIST_800_115': 'NIST 800-115',
  'ISO_27001': 'ISO 27001',
  'SOC_2': 'SOC 2',
  'STRIDE': 'STRIDE',
  'CCNA': 'CCNA 200-301',
  'ITIL': 'ITIL 4',
};

const FRAMEWORK_DESCRIPTIONS: Record<Framework, string> = {
  'NIST_CSF': 'NIST Cybersecurity Framework - Identify, Protect, Detect, Respond, Recover',
  'CIS': 'CIS Critical Security Controls',
  'OWASP': 'OWASP Top 10 / Web Security',
  'CVSS': 'Common Vulnerability Scoring System',
  'NIST_800_61': 'NIST Guide to Incident Handling',
  'NIST_800_115': 'NIST Technical Guide to Information Security Testing and Assessment',
  'ISO_27001': 'ISO/IEC 27001 Information Security',
  'SOC_2': 'SOC 2 — AICPA Trust Services Criteria',
  'STRIDE': 'STRIDE Threat Modeling',
  'CCNA': 'Cisco CCNA 200-301 v1.1 — the exam blueprint’s six domains',
  'ITIL': 'ITIL 4 — change, incident and problem management',
};

// Why each framework matters and the role it plays in the engagement. Surfaced
// next to the framework tags so students understand *why* a step is mapped to it,
// not just that it is.
const FRAMEWORK_WHY: Record<Framework, string> = {
  'NIST_CSF':
    'Organizes all security work into five functions — Identify, Protect, Detect, Respond, Recover. Tagging a step here shows which part of the lifecycle it strengthens and proves you covered the whole picture, not just attack or defense.',
  'CIS':
    'A prioritized "do these first" list of safeguards. A CIS tag means this step implements an industry-baseline control that auditors and blue teams immediately recognize.',
  'OWASP':
    'Catalogs the most common web-application weaknesses. This tag means the step attacks or defends one of those top risks — the shared language developers use to talk about web security.',
  'CVSS':
    'A 0–10 severity score for vulnerabilities. It turns "this is bad" into a consistent number, so stakeholders can rank findings and decide what to fix first.',
  'NIST_800_61':
    'The incident-handling playbook: prepare, detect & analyze, contain, eradicate, recover. This tag means the step is part of a defensible, court-ready incident-response process.',
  'NIST_800_115':
    'The standard method for security testing and assessment. Following it makes your scanning and exploitation repeatable, authorized, and credible in a report.',
  'ISO_27001':
    'The certifiable information-security management standard. This tag means the step produces the documented policy or evidence an ISO 27001 audit expects to see.',
  'SOC_2':
    'The AICPA attestation standard built on the Trust Services Criteria (Security = CC1–CC9, plus Availability/Confidentiality/etc.). This tag means the step produces a control or the evidence a SOC 2 Type I/II examiner samples.',
  'STRIDE':
    'A threat-modeling lens — Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege. It names the *category* of threat this step addresses.',
  'CCNA':
    'The CCNA 200-301 blueprint: network fundamentals, access, IP connectivity, IP services, security fundamentals and automation. This tag says which exam domain the work covers — so the portfolio and the syllabus can be read against each other.',
  'ITIL':
    'The operating disciplines a network team is judged on: change, incident and problem management. A tag here means the step is not just technically right but done the way an organisation can audit — requested, reviewed, reversible and recorded.',
};

const FRAMEWORK_FALLBACK_COLOR =
  'bg-panel-2 text-muted';

// Framework is now an open string (instructors can add their own), so these
// fall back gracefully when a framework id isn't one of the built-ins.
export function getFrameworkColor(framework: Framework): string {
  return FRAMEWORK_COLORS[framework] || FRAMEWORK_FALLBACK_COLOR;
}

export function getFrameworkLabel(framework: Framework): string {
  return FRAMEWORK_LABELS[framework] || framework;
}

export function getFrameworkDescription(framework: Framework): string {
  return FRAMEWORK_DESCRIPTIONS[framework] || '';
}

export function getFrameworkWhy(framework: Framework): string {
  return FRAMEWORK_WHY[framework] || '';
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

/** Accepted evidence file extensions (see EVIDENCE_FILE_TYPES in evidence.ts). */
const EVIDENCE_EXT = /^\d{8}_Team\d{2}_\w+_\w+\.(png|jpg|jpeg|pdf|txt|log|pcap|mp4)$/;

export function validateEvidenceFileName(filename: string): { valid: boolean; message: string } {
  // Pattern: YYYYMMDD_TeamXX_Tool_Action.ext
  if (!EVIDENCE_EXT.test(filename)) {
    return {
      valid: false,
      message: `File must follow format: ${EVIDENCE_NAMING} (png/jpg/pdf/txt/log/pcap/mp4), e.g. 20260623_Team01_nmap_scan.txt`
    };
  }

  return { valid: true, message: 'Filename valid' };
}

// Monthly cohorts as `YYYY-MM`, starting from `base`'s month (default: now).
// Replaces the old seasonal cohorts so classes are tracked by month.
export function getMonthlyCohorts(count = 12, base: Date = new Date()): string[] {
  const out: string[] = [];
  const year = base.getFullYear();
  const month = base.getMonth();
  for (let i = 0; i < count; i++) {
    const d = new Date(year, month + i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

