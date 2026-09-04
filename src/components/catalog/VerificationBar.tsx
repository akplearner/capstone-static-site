'use client';

import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import type { CourseMetrics } from '@/lib/metrics';
import { evidenceQuality } from '@/lib/metrics';

/**
 * Verified vs self-attested, as one bar.
 *
 * This is the number that answers "did they really do it", so it gets stated
 * plainly and never inflated: the denominator is steps that CAN be verified, and
 * when a course has none the bar is replaced by a sentence saying so rather than
 * rendering an ambiguous 0%.
 *
 * The wording is deliberately bounded — "verified from output you pasted" — since
 * the check is client-side and cannot prove a command truly ran. Claiming more
 * than the ledger supports would be worse than showing nothing.
 */
export function VerificationBar({ m, compact }: { m: CourseMetrics; compact?: boolean }) {
  const quality = evidenceQuality(m);

  if (m.verifiable === 0) {
    return (
      <p className="text-xs text-muted">
        No steps in this capstone can be checked against command output.
      </p>
    );
  }

  const pct = m.verificationRate;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
          <ShieldCheck className="h-4 w-4 text-accent" />
          {pct}% verified
        </span>
        <span className="font-mono text-2xs text-muted">
          {m.verified}/{m.verifiable} checkable steps
        </span>
      </div>
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-panel-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${m.verified} of ${m.verifiable} checkable steps verified from pasted output`}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: 'var(--color-accent)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      {!compact && (
        <p className="text-xs text-muted">
          {quality.label}
          {m.selfAttested > 0 && ` · ${m.selfAttested} self-attested`}
        </p>
      )}
    </div>
  );
}
