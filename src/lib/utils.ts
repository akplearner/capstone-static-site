import { Framework } from './types';
import { EVIDENCE_NAMING } from './evidence';
import { standardOf, type StandardTone } from './docs/standards';

/**
 * R107: the framework maps moved to `src/lib/docs/standards.ts`, where every
 * standard, exam blueprint and publication a course tags lives with its
 * publisher and its controls. These helpers keep their signatures; colour is a
 * `tone` in the register and the Tailwind class for a tone stays here, so no
 * class string reaches a document.
 */
const TONE_CLASS: Record<StandardTone, string> = {
  info: 'bg-info-soft text-info',
  accent: 'bg-accent-soft text-accent-ink',
  warn: 'bg-warn-soft text-warn',
  danger: 'bg-danger-soft text-danger',
  ok: 'bg-ok-soft text-ok',
};

const FRAMEWORK_FALLBACK_COLOR = 'bg-panel-2 text-muted';

// Framework is an open string (instructors can add their own), so these fall
// back gracefully when a framework id is not in the register.
export function getFrameworkColor(framework: Framework): string {
  const tone = standardOf(framework)?.tone;
  return tone ? TONE_CLASS[tone] : FRAMEWORK_FALLBACK_COLOR;
}

export function getFrameworkLabel(framework: Framework): string {
  return standardOf(framework)?.label || framework;
}

export function getFrameworkDescription(framework: Framework): string {
  return standardOf(framework)?.description || '';
}

export function getFrameworkWhy(framework: Framework): string {
  return standardOf(framework)?.why || '';
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

