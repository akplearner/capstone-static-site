'use client';

import { motion } from 'framer-motion';
import { ClipboardList, Terminal, Eye, Lightbulb, FileCheck2, ChevronRight } from 'lucide-react';

interface StepFlowDiagramProps {
  hasInstruction?: boolean;
  hasCommand?: boolean;
  hasOutput?: boolean;
  deliverable?: string;
}

type Node = {
  key: string;
  label: string;
  Icon: typeof Terminal;
  tone: string;
};

/**
 * A small left-to-right diagram of the "shape" every step follows:
 * Do → Run → Observe → Understand → (Evidence). Nodes that don't apply to a
 * step are dropped, so it adapts to steps with or without a command/output.
 * Purely illustrative — it gives each step a consistent visual map of the work.
 */
export function StepFlowDiagram({
  hasInstruction = true,
  hasCommand,
  hasOutput,
  deliverable,
}: StepFlowDiagramProps) {
  const nodes: Node[] = [];
  if (hasInstruction)
    nodes.push({ key: 'do', label: 'Do', Icon: ClipboardList, tone: 'text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20' });
  if (hasCommand)
    nodes.push({ key: 'run', label: 'Run', Icon: Terminal, tone: 'text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20' });
  if (hasOutput)
    nodes.push({ key: 'observe', label: 'Observe', Icon: Eye, tone: 'text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-900/20' });
  nodes.push({ key: 'understand', label: 'Understand', Icon: Lightbulb, tone: 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20' });
  if (deliverable)
    nodes.push({ key: 'evidence', label: 'Evidence', Icon: FileCheck2, tone: 'text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20' });

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="img"
      aria-label={`Step flow: ${nodes.map((n) => n.label).join(' then ')}`}
    >
      {nodes.map((n, i) => (
        <div key={n.key} className="flex items-center gap-1.5">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.06 }}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${n.tone}`}
          >
            <n.Icon className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">{n.label}</span>
          </motion.div>
          {i < nodes.length - 1 && (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-600" aria-hidden />
          )}
        </div>
      ))}
    </div>
  );
}
