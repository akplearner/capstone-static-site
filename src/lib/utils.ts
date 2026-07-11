import { Framework } from './types';

export const FRAMEWORK_COLORS: Record<Framework, string> = {
  'NIST_CSF': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'CIS': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'OWASP': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'CVSS': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'NIST_800_61': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'NIST_800_115': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  'ISO_27001': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'SOC_2': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
  'STRIDE': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
};

export const FRAMEWORK_LABELS: Record<Framework, string> = {
  'NIST_CSF': 'NIST CSF',
  'CIS': 'CIS',
  'OWASP': 'OWASP',
  'CVSS': 'CVSS',
  'NIST_800_61': 'NIST 800-61',
  'NIST_800_115': 'NIST 800-115',
  'ISO_27001': 'ISO 27001',
  'SOC_2': 'SOC 2',
  'STRIDE': 'STRIDE',
};

export const FRAMEWORK_DESCRIPTIONS: Record<Framework, string> = {
  'NIST_CSF': 'NIST Cybersecurity Framework - Identify, Protect, Detect, Respond, Recover',
  'CIS': 'CIS Critical Security Controls',
  'OWASP': 'OWASP Top 10 / Web Security',
  'CVSS': 'Common Vulnerability Scoring System',
  'NIST_800_61': 'NIST Guide to Incident Handling',
  'NIST_800_115': 'NIST Technical Guide to Information Security Testing and Assessment',
  'ISO_27001': 'ISO/IEC 27001 Information Security',
  'SOC_2': 'SOC 2 — AICPA Trust Services Criteria',
  'STRIDE': 'STRIDE Threat Modeling',
};

// Why each framework matters and the role it plays in the engagement. Surfaced
// next to the framework tags so students understand *why* a step is mapped to it,
// not just that it is.
export const FRAMEWORK_WHY: Record<Framework, string> = {
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
};

const FRAMEWORK_FALLBACK_COLOR =
  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';

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

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export function formatTeamId(id: string): string {
  // Format "01" as "Team 01"
  return `Team ${id.padStart(2, '0')}`;
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    'red': '🏃 Red (Runners)',
    'blue': '🛡️ Blue (Wardens)',
    'grc': '📋 GRC (Fixers)',
  };
  return labels[role] || role;
}

// Plain (emoji-free) labels — safe inside SVG diagrams, titles, and aria attributes.
export function getRoleName(role: string): string {
  const names: Record<string, string> = {
    'red': 'Red (Runners)',
    'blue': 'Blue (Wardens)',
    'grc': 'GRC (Fixers)',
  };
  return names[role] || role;
}

export function getRoleMission(role: string): string {
  const missions: Record<string, string> = {
    'red': 'Reconnaissance, enumeration, and exploitation.',
    'blue': 'Hardening, detection, and incident response.',
    'grc': 'Governance, risk, compliance, and reporting.',
  };
  return missions[role] || '';
}

// Shared role color tokens (previously duplicated inline across pages).
export interface RoleColor {
  text: string;
  bg: string;
  border: string;
  ring: string;
  hex: string; // for SVG fills/strokes
}

export const ROLE_COLORS: Record<string, RoleColor> = {
  red: {
    text: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    ring: 'ring-red-500',
    hex: '#dc2626',
  },
  blue: {
    text: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    ring: 'ring-blue-500',
    hex: '#2563eb',
  },
  grc: {
    text: 'text-green-700 dark:text-green-300',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    ring: 'ring-green-500',
    hex: '#16a34a',
  },
};

export function getRoleColor(role: string): RoleColor {
  return ROLE_COLORS[role] || ROLE_COLORS.blue;
}

// Inline styles derived from a role's hex color. Used for diagrams and badges so
// any number of instructor-defined roles render correctly (Tailwind can't
// generate class names from dynamic colors).
export function roleTint(hex: string, alpha = '22'): Record<string, string> {
  return { backgroundColor: `${hex}${alpha}`, borderColor: hex, color: hex };
}

export function roleAccent(hex: string): Record<string, string> {
  return { color: hex, borderColor: hex };
}

export function getWeekTitle(week: number): string {
  const titles: Record<number, string> = {
    1: 'Week 1: Cold Recon',
    2: 'Week 2: Hard Target',
    3: 'Week 3: The Breach',
    4: 'Week 4: Payday',
  };
  return titles[week] || `Week ${week}`;
}

export function generateEvidenceFileName(role: string, team: string, tool: string, action: string): string {
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  return `${date}_${team}_${tool}_${action}.png`;
}

/** Accepted evidence file extensions (see EVIDENCE_FILE_TYPES in evidence.ts). */
const EVIDENCE_EXT = /^\d{8}_Team\d{2}_\w+_\w+\.(png|jpg|jpeg|pdf|txt|log|pcap|mp4)$/;

export function validateEvidenceFileName(filename: string): { valid: boolean; message: string } {
  // Pattern: YYYYMMDD_TeamXX_Tool_Action.ext
  if (!EVIDENCE_EXT.test(filename)) {
    return {
      valid: false,
      message: 'File must follow format: YYYYMMDD_TeamXX_Tool_Action.ext (png/jpg/pdf/txt/log/pcap/mp4), e.g. 20260623_Team01_nmap_scan.txt'
    };
  }

  return { valid: true, message: 'Filename valid' };
}

// Calculate gate readiness based on completed tasks
export function canUnlockNextGate(currentGateCompletionPercent: number): boolean {
  return currentGateCompletionPercent >= 100;
}

export function getGateStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'locked': '🔒 Locked',
    'ready': '⚠️  Ready for Review',
    'passed': '✅ Passed',
  };
  return labels[status] || status;
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

