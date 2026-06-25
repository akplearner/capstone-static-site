'use client';

import { motion } from 'framer-motion';
import { RoleDef } from '@/lib/types';

interface NetworkDiagramProps {
  /** Roles defined on the course — used to know which nodes to draw and their colors. */
  roles: RoleDef[];
  /** The viewer's role id, brightened in the diagram. */
  highlightRole?: string;
  /** Week number, used to label what crosses the wire this week. */
  week?: number;
  className?: string;
}

// What the attacker→target link carries each week, and the week's focus line.
const WEEK_FLOW: Record<number, { wire: string; focus: string }> = {
  1: { wire: 'OSINT · passive recon', focus: 'Map the target and harden the baseline before anyone is loud.' },
  2: { wire: 'port & web scanning', focus: 'Find weaknesses while the SOC learns what normal traffic looks like.' },
  3: { wire: 'live exploits', focus: 'Attack for real while Blue detects, contains, and preserves evidence.' },
  4: { wire: 'findings & report', focus: 'No new traffic — compile the evidence into findings and recommendations.' },
};

const DEFAULT_HEX: Record<string, string> = { red: '#dc2626', blue: '#2563eb', grc: '#16a34a' };

function hexFor(roles: RoleDef[], id: string): string {
  return roles.find((r) => r.id === id)?.color || DEFAULT_HEX[id] || '#6b7280';
}

/**
 * A lab-network topology: the attacker box, the network, the target server (with
 * its exposed services), the SOC that watches it, and the governance layer over
 * the whole engagement. The viewer's role is brightened so they can see where
 * their work sits on the wire. Built for the Red/Blue/GRC model and hides any
 * node whose role the course doesn't define.
 */
export function NetworkDiagram({ roles, highlightRole, week, className = '' }: NetworkDiagramProps) {
  const has = (id: string) => roles.some((r) => r.id === id) || ['red', 'blue', 'grc'].includes(id);
  const dim = (id: string) => (highlightRole && highlightRole !== id ? 0.45 : 1);
  const red = hexFor(roles, 'red');
  const blue = hexFor(roles, 'blue');
  const grc = hexFor(roles, 'grc');
  const flow = (week && WEEK_FLOW[week]) || undefined;

  return (
    <div className={className}>
      <svg viewBox="0 0 520 300" className="h-auto w-full" role="img" aria-label="Lab network diagram showing where each role operates">
        <defs>
          <marker id="nd-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" className="fill-gray-500 dark:fill-gray-400" />
          </marker>
        </defs>

        {/* Network cloud between attacker and target */}
        <ellipse cx="260" cy="115" rx="58" ry="30" className="fill-gray-100 stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600" strokeWidth="1.5" />
        <text x="260" y="111" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-gray-600 dark:fill-gray-300">Network</text>
        <text x="260" y="125" textAnchor="middle" fontSize="9" className="fill-gray-400 dark:fill-gray-500">10.10.10.0/24</text>

        {/* Attacker (Red) */}
        {has('red') && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: dim('red') }} transition={{ duration: 0.3 }}>
            <rect x="20" y="85" width="120" height="60" rx="10" fill={red} fillOpacity={0.12} stroke={red} strokeWidth={highlightRole === 'red' ? 3 : 2} />
            <text x="80" y="110" textAnchor="middle" fontSize="12" fontWeight="700" fill={red}>Attacker</text>
            <text x="80" y="126" textAnchor="middle" fontSize="9" className="fill-gray-500 dark:fill-gray-400">Kali · Red</text>
          </motion.g>
        )}

        {/* Target server */}
        <g>
          <rect x="380" y="70" width="120" height="90" rx="10" className="fill-white stroke-gray-400 dark:fill-gray-800 dark:stroke-gray-500" strokeWidth="2" />
          <text x="440" y="90" textAnchor="middle" fontSize="12" fontWeight="700" className="fill-gray-800 dark:fill-gray-100">Target server</text>
          <text x="440" y="103" textAnchor="middle" fontSize="9" className="fill-gray-400 dark:fill-gray-500">DVWA · 10.10.10.5</text>
          {['SSH', 'HTTP', 'DNS'].map((svc, i) => (
            <g key={svc}>
              <rect x={392 + i * 36} y="118" width="32" height="18" rx="4" className="fill-gray-100 stroke-gray-300 dark:fill-gray-700 dark:stroke-gray-600" />
              <text x={392 + i * 36 + 16} y="131" textAnchor="middle" fontSize="8.5" className="fill-gray-600 dark:fill-gray-300">{svc}</text>
            </g>
          ))}
        </g>

        {/* Attacker → network → target wire */}
        {has('red') && (
          <>
            <line x1="140" y1="115" x2="204" y2="115" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="2" />
            <line x1="316" y1="115" x2="378" y2="115" className="stroke-gray-400 dark:stroke-gray-500" strokeWidth="2" markerEnd="url(#nd-arrow)" />
            {flow && (
              <text x="347" y="107" textAnchor="middle" fontSize="9" fontWeight="600" fill={red}>{flow.wire}</text>
            )}
          </>
        )}

        {/* Defender / SOC (Blue) watching the target */}
        {has('blue') && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: dim('blue') }} transition={{ duration: 0.3 }}>
            <rect x="380" y="205" width="120" height="60" rx="10" fill={blue} fillOpacity={0.12} stroke={blue} strokeWidth={highlightRole === 'blue' ? 3 : 2} />
            <text x="440" y="230" textAnchor="middle" fontSize="12" fontWeight="700" fill={blue}>SOC / Defender</text>
            <text x="440" y="246" textAnchor="middle" fontSize="9" className="fill-gray-500 dark:fill-gray-400">Blue · monitors</text>
            <line x1="440" y1="205" x2="440" y2="162" stroke={blue} strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#nd-arrow)" />
            <text x="450" y="186" fontSize="8.5" fill={blue}>logs/pcap</text>
          </motion.g>
        )}

        {/* Governance (GRC) layer across the bottom-left */}
        {has('grc') && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: dim('grc') }} transition={{ duration: 0.3 }}>
            <rect x="20" y="205" width="300" height="60" rx="10" fill={grc} fillOpacity={0.1} stroke={grc} strokeWidth={highlightRole === 'grc' ? 3 : 2} strokeDasharray="6 4" />
            <text x="170" y="229" textAnchor="middle" fontSize="12" fontWeight="700" fill={grc}>Governance · Risk · Compliance</text>
            <text x="170" y="246" textAnchor="middle" fontSize="9" className="fill-gray-500 dark:fill-gray-400">GRC · policy, risk scoring & evidence over the whole engagement</text>
          </motion.g>
        )}
      </svg>

      {flow && (
        <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-300">This week: </span>
          {flow.focus}
        </p>
      )}
    </div>
  );
}
