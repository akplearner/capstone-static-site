'use client';

import { motion } from 'framer-motion';

/**
 * A small SVG progress ring for ratios with a known denominator — the number
 * renders inside it. Animates once on mount (the platform's meter rule) and
 * honours reduced motion via the app-wide MotionConfig.
 */
export function ProgressRing({
  value,
  max,
  size = 56,
  stroke = 5,
  label,
}: {
  value: number;
  max: number;
  size?: number;
  stroke?: number;
  /** Accessible name, e.g. "Steps verified". */
  label: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${label}: ${value} of ${max}`}
      className="shrink-0 -rotate-90"
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-line" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - pct) }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="stroke-accent"
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        transform={`rotate(90 ${size / 2} ${size / 2})`}
        className="fill-[var(--color-ink)] font-mono text-sm font-bold"
      >
        {value}
      </text>
    </svg>
  );
}
