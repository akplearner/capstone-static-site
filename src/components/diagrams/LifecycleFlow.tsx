'use client';

import { motion } from 'framer-motion';
import { Gate, GateStatus, WeekDef } from '@/lib/types';

interface LifecycleFlowProps {
  weeks: WeekDef[];
  gates: Gate[];
  weekProgress?: Record<number, number>;
  gateStatus?: Record<number, GateStatus>;
  currentWeek?: number;
  /** Engagement-framed courses label nodes by phase (Week.runs) instead of "WEEK N". */
  engagement?: boolean;
}

const gateFill: Record<GateStatus, string> = {
  locked: '#9ca3af',
  ready: '#f59e0b',
  passed: '#16a34a',
};

type Slot = { type: 'week'; week: WeekDef } | { type: 'gate'; gate: Gate };

/**
 * Custom SVG diagram of a course lifecycle. Week nodes fill with the viewer's
 * progress; gates (placed after their week) color by status. Layout is computed
 * from the actual week/gate counts so it works for any course shape.
 */
export function LifecycleFlow({
  weeks,
  gates,
  weekProgress = {},
  gateStatus = {},
  currentWeek,
  engagement = false,
}: LifecycleFlowProps) {
  const ordered = [...weeks].sort((a, b) => a.number - b.number);

  const slots: Slot[] = [];
  ordered.forEach((w, i) => {
    slots.push({ type: 'week', week: w });
    const gate = gates.find((g) => g.week === w.number);
    if (gate && i < ordered.length - 1) slots.push({ type: 'gate', gate });
  });

  const slotW = 200;
  const width = Math.max(slots.length * slotW, slotW);
  const height = 170;
  const midY = 70;
  const nodeW = 150;
  const nodeH = 84;
  const centerX = (i: number) => i * slotW + slotW / 2;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        style={{ minWidth: Math.min(width, 640) }}
        role="img"
        aria-label={`Course lifecycle: ${ordered.length} weeks`}
      >
        <line
          x1={centerX(0)}
          y1={midY}
          x2={centerX(slots.length - 1)}
          y2={midY}
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-700"
          strokeWidth="3"
        />

        {slots.map((slot, i) => {
          const cx = centerX(i);
          if (slot.type === 'gate') {
            const status = gateStatus[slot.gate.id] || 'locked';
            return (
              <g key={`gate-${slot.gate.id}`}>
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
                  transition={{ delay: 0.2 + i * 0.05 }}
                />
                <text x={cx} y={midY + 1} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="700" fill="#fff">
                  G{slot.gate.id}
                </text>
                <text x={cx} y={midY + 34} textAnchor="middle" fontSize="10" className="fill-gray-500 dark:fill-gray-400">
                  {status === 'passed' ? 'Passed' : status === 'ready' ? 'In progress' : 'Locked'}
                </text>
              </g>
            );
          }

          const w = slot.week;
          const pct = weekProgress[w.number] || 0;
          const isCurrent = currentWeek === w.number;
          const x = cx - nodeW / 2;
          const y = midY - nodeH / 2;
          return (
            <g key={`week-${w.number}`}>
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
                transition={{ delay: i * 0.05 }}
              />
              {isCurrent && <rect x={x} y={y} width={nodeW} height={nodeH} rx={12} fill="none" stroke="#2563eb" strokeWidth={2.5} />}
              <rect x={x + 12} y={y + nodeH - 18} width={nodeW - 24} height={6} rx={3} className="fill-gray-200 dark:fill-gray-700" />
              <motion.rect
                x={x + 12}
                y={y + nodeH - 18}
                height={6}
                rx={3}
                fill={pct === 100 ? '#16a34a' : '#2563eb'}
                initial={{ width: 0 }}
                animate={{ width: ((nodeW - 24) * pct) / 100 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
              />
              <text x={cx} y={y + 22} textAnchor="middle" fontSize="11" fontWeight="700" className="fill-blue-600 dark:fill-blue-400">
                {engagement && w.runs ? w.runs.toUpperCase() : `WEEK ${w.number}`}
              </text>
              <text x={cx} y={y + 40} textAnchor="middle" fontSize="12" fontWeight="600" className="fill-gray-900 dark:fill-white">
                {truncate(w.title, 18)}
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

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
