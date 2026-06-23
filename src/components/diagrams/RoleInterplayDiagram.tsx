'use client';

import { motion } from 'framer-motion';
import { ROLE_COLORS } from '@/lib/utils';

interface RoleInterplayDiagramProps {
  /** Optionally highlight one role (the viewer's). */
  highlightRole?: 'red' | 'blue' | 'grc';
}

/**
 * Custom SVG showing how the three roles hand off work:
 * Red attacks → Blue defends/detects → both feed evidence to GRC, who governs
 * and compiles the final report.
 */
export function RoleInterplayDiagram({ highlightRole }: RoleInterplayDiagramProps) {
  // Positions in a 480 x 320 viewBox.
  const red = { x: 110, y: 90 };
  const blue = { x: 370, y: 90 };
  const grc = { x: 240, y: 250 };
  const r = 52;

  const node = (
    role: 'red' | 'blue' | 'grc',
    pos: { x: number; y: number },
    title: string,
    subtitle: string,
    delay: number
  ) => {
    const c = ROLE_COLORS[role];
    const dim = highlightRole && highlightRole !== role;
    return (
      <motion.g
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: dim ? 0.45 : 1 }}
        transition={{ delay }}
      >
        <circle cx={pos.x} cy={pos.y} r={r} fill={c.hex} opacity={0.15} />
        <circle cx={pos.x} cy={pos.y} r={r} fill="none" stroke={c.hex} strokeWidth={highlightRole === role ? 4 : 2.5} />
        <text x={pos.x} y={pos.y - 6} textAnchor="middle" fontSize="15" fontWeight="700" fill={c.hex}>
          {title}
        </text>
        <text x={pos.x} y={pos.y + 14} textAnchor="middle" fontSize="9.5" className="fill-gray-600 dark:fill-gray-300">
          {subtitle}
        </text>
      </motion.g>
    );
  };

  return (
    <div className="w-full">
      <svg viewBox="0 0 480 320" className="h-auto w-full" role="img" aria-label="How Red, Blue, and GRC roles interact">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" className="fill-gray-400 dark:fill-gray-500" />
          </marker>
        </defs>

        {/* Red <-> Blue: attack / defend */}
        <line x1={red.x + r} y1={red.y - 10} x2={blue.x - r} y2={blue.y - 10} className="stroke-gray-300 dark:stroke-gray-600" strokeWidth={2} markerEnd="url(#arrow)" />
        <line x1={blue.x - r} y1={blue.y + 14} x2={red.x + r} y2={red.y + 14} className="stroke-gray-300 dark:stroke-gray-600" strokeWidth={2} markerEnd="url(#arrow)" />
        <text x={240} y={72} textAnchor="middle" fontSize="10" className="fill-gray-500 dark:fill-gray-400">attacks →</text>
        <text x={240} y={120} textAnchor="middle" fontSize="10" className="fill-gray-500 dark:fill-gray-400">← detects &amp; responds</text>

        {/* Red -> GRC */}
        <line x1={red.x + 18} y1={red.y + r - 6} x2={grc.x - 40} y2={grc.y - r + 6} className="stroke-gray-300 dark:stroke-gray-600" strokeWidth={2} markerEnd="url(#arrow)" />
        {/* Blue -> GRC */}
        <line x1={blue.x - 18} y1={blue.y + r - 6} x2={grc.x + 40} y2={grc.y - r + 6} className="stroke-gray-300 dark:stroke-gray-600" strokeWidth={2} markerEnd="url(#arrow)" />
        <text x={130} y={200} textAnchor="middle" fontSize="10" className="fill-gray-500 dark:fill-gray-400">evidence</text>
        <text x={350} y={200} textAnchor="middle" fontSize="10" className="fill-gray-500 dark:fill-gray-400">logs &amp; IR</text>

        {node('red', red, 'Red', 'Recon · Exploit', 0.1)}
        {node('blue', blue, 'Blue', 'Harden · Detect', 0.2)}
        {node('grc', grc, 'GRC', 'Govern · Report', 0.3)}
      </svg>
    </div>
  );
}
