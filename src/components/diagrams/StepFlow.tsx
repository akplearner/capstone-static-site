'use client';

import { motion } from 'framer-motion';

/**
 * A per-step "follow the path" mini-diagram: node → (labelled arrow) → node.
 * Fed by `Step.path`, an alternating array of node keys (even indices) and arrow
 * labels (odd indices), e.g. ['you','ssh + paste','ubuntu','reports in','soc'].
 * Node keys resolve against NODES; unknown keys render as a plain slate node.
 * Colors use theme tokens so the diagram adapts to light/dark. Nodes/arrows fade
 * in left-to-right (house `delay: i*0.05` stagger); reduce-motion is honoured
 * globally via <MotionConfig reducedMotion="user">.
 */

type NodeColor = 'teal' | 'blue' | 'red' | 'slate';

const NODES: Record<string, { t: string; s: string; c: NodeColor }> = {
  build: { t: 'You (builder)', s: 'SSH / console', c: 'slate' },
  you: { t: 'You', s: 'browser / SSH', c: 'slate' },
  ubuntu: { t: 'Ubuntu + DVWA', s: '10.10.100.N', c: 'blue' },
  win: { t: 'Windows 11', s: '10.10.20.N', c: 'blue' },
  soc: { t: 'Wazuh SOC', s: '10.10.100.100', c: 'teal' },
  dash: { t: 'Wazuh dashboard', s: 'in your browser', c: 'teal' },
  kali: { t: 'Kali', s: 'attacker', c: 'red' },
  report: { t: 'Your report', s: 'written up', c: 'slate' },
  // Role nodes, so a hand-off step draws the actual roles instead of falling
  // through to the raw id and rendering a box literally labelled "blue".
  analyst: { t: 'SOC Analyst', s: 'triage', c: 'blue' },
  hunter: { t: 'Threat Hunter', s: 'investigate', c: 'teal' },
  responder: { t: 'Incident Responder', s: 'contain & report', c: 'red' },
};

const DOT: Record<NodeColor, string> = {
  teal: 'var(--color-accent)',
  blue: 'var(--color-w2)',
  red: 'var(--color-danger)',
  slate: 'var(--color-muted)',
};

export function StepFlow({ path }: { path: string[] }) {
  if (!path || path.length === 0) return null;

  const items: React.ReactNode[] = [];
  for (let i = 0; i < path.length; i++) {
    const delay = Math.min(i * 0.05, 0.5);
    if (i % 2 === 0) {
      const n = NODES[path[i]] ?? { t: path[i], s: '', c: 'slate' as NodeColor };
      items.push(
        <motion.div
          key={`n-${i}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay, duration: 0.2 }}
          whileHover={{ scale: 1.03 }}
          className="flex min-w-[92px] flex-col justify-center rounded-lg border border-line bg-panel px-2.5 py-1.5"
        >
          <span className="flex items-center gap-1.5 text-xs font-semibold leading-tight text-ink">
            <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: DOT[n.c] }} aria-hidden />
            {n.t}
          </span>
          {n.s && <span className="mt-0.5 font-mono text-[10px] text-muted">{n.s}</span>}
        </motion.div>
      );
    } else {
      items.push(
        <motion.div
          key={`a-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay, duration: 0.2 }}
          className="flex min-w-[52px] flex-col items-center justify-center px-0.5"
        >
          <span className="text-center font-mono text-[9px] leading-tight text-muted">{path[i]}</span>
          <span className="text-[15px] font-bold leading-none text-accent" aria-hidden>→</span>
        </motion.div>
      );
    }
  }

  return (
    <div className="mb-3 flex flex-wrap items-stretch gap-1.5 rounded-lg border border-line bg-panel-2 p-3">
      {items}
    </div>
  );
}
