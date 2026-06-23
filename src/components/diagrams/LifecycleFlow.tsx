'use client';

import { motion } from 'framer-motion';
import { WEEKS, GATES } from '@/lib/content-data';
import { GateStatus } from '@/lib/types';

interface LifecycleFlowProps {
  /** week number -> completion percent (0-100) */
  weekProgress?: Record<number, number>;
  /** gate id -> status */
  gateStatus?: Record<number, GateStatus>;
  currentWeek?: number;
}

const gateFill: Record<GateStatus, string> = {
  locked: '#9ca3af',
  ready: '#f59e0b',
  passed: '#16a34a',
};

/**
 * Custom SVG diagram of the 4-week capstone lifecycle:
 * Week 1 →◇ Gate 1 → Week 2 →◇ Gate 2 → Week 3 →◇ Gate 3 → Week 4.
 * Week nodes fill with the viewer's progress; gates color by status.
 */
export function LifecycleFlow({
  weekProgress = {},
  gateStatus = {},
  currentWeek,
}: LifecycleFlowProps) {
  const weeks = [1, 2, 3, 4];
  // Layout in a 1020 x 170 viewBox.
  const weekX = [90, 370, 650, 930];
  const gateX = [230, 510, 790];
  const midY = 70;
  const nodeW = 150;
  const nodeH = 84;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 1020 170" className="h-auto w-full min-w-[640px]" role="img" aria-label="Four-week capstone lifecycle">
        {/* Base connector line */}
        <line x1="90" y1={midY} x2="930" y2={midY} stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="3" />

        {/* Gates */}
        {GATES.map((gate, i) => {
          const status = gateStatus[gate.id] || 'locked';
          const cx = gateX[i];
          return (
            <g key={gate.id}>
              <motion.rect
                x={cx - 16}
                y={midY - 16}
                width={32}
                height={32}
                rx={6}
                transform={`rotate(45 ${cx} ${midY})`}
                fill={gateFill[status]}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              />
              <text x={cx} y={midY + 1} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#fff">
                G{gate.id}
              </text>
              <text x={cx} y={midY + 34} textAnchor="middle" fontSize="10" className="fill-gray-500 dark:fill-gray-400">
                {status === 'passed' ? 'Passed' : status === 'ready' ? 'In progress' : 'Locked'}
              </text>
            </g>
          );
        })}

        {/* Week nodes */}
        {weeks.map((w, i) => {
          const cx = weekX[i];
          const pct = weekProgress[w] || 0;
          const isCurrent = currentWeek === w;
          const x = cx - nodeW / 2;
          const y = midY - nodeH / 2;
          return (
            <g key={w}>
              <motion.rect
                x={x}
                y={y}
                width={nodeW}
                height={nodeH}
                rx={12}
                className="fill-white stroke-gray-200 dark:fill-gray-800 dark:stroke-gray-700"
                strokeWidth={isCurrent ? 0 : 1.5}
                initial={{ opacity: 0, y: y + 8 }}
                animate={{ opacity: 1, y }}
                transition={{ delay: i * 0.1 }}
              />
              {isCurrent && (
                <rect x={x} y={y} width={nodeW} height={nodeH} rx={12} fill="none" stroke="#2563eb" strokeWidth={2.5} />
              )}
              {/* progress bar inside node */}
              <rect x={x + 12} y={y + nodeH - 18} width={nodeW - 24} height={6} rx={3} className="fill-gray-200 dark:fill-gray-700" />
              <motion.rect
                x={x + 12}
                y={y + nodeH - 18}
                height={6}
                rx={3}
                fill={pct === 100 ? '#16a34a' : '#2563eb'}
                initial={{ width: 0 }}
                animate={{ width: ((nodeW - 24) * pct) / 100 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              />
              <text x={cx} y={y + 22} textAnchor="middle" fontSize="11" fontWeight="700" className="fill-blue-600 dark:fill-blue-400">
                WEEK {w}
              </text>
              <text x={cx} y={y + 40} textAnchor="middle" fontSize="12" fontWeight="600" className="fill-gray-900 dark:fill-white">
                {WEEKS[w].title}
              </text>
              <text x={cx} y={y + 56} textAnchor="middle" fontSize="10" className="fill-gray-500 dark:fill-gray-400">
                {pct}% complete
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
