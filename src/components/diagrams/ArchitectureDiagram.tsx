'use client';

import { motion } from 'framer-motion';
import { RoleDef } from '@/lib/types';
import { LAB_SUBNET, labHost, WEEK_WIRE } from '@/lib/labTopology';
import { DiagramFrame } from './DiagramFrame';

interface ArchitectureDiagramProps {
  roles: RoleDef[];
  /** Viewer's role id — brightened; others dimmed. */
  highlightRole?: string;
  /** Optional week number — labels what crosses the wire this week. */
  week?: number;
}

const DEFAULT_HEX: Record<string, string> = { red: '#dc2626', blue: '#2563eb', grc: '#16a34a' };
function hexFor(roles: RoleDef[], id: string): string {
  return roles.find((r) => r.id === id)?.color || DEFAULT_HEX[id] || '#6b7280';
}

/**
 * The lab architecture for one company: a Kali attacker (Red), the two defended
 * hosts (Ubuntu web server + an optional Windows host, Blue), the SOC that
 * monitors them (Blue), and the GRC governance layer over the whole engagement.
 * Solid red = attack path; dashed blue = monitoring; dashed green = governance.
 */
export function ArchitectureDiagram({ roles, highlightRole, week }: ArchitectureDiagramProps) {
  const has = (id: string) => roles.some((r) => r.id === id) || ['red', 'blue', 'grc'].includes(id);
  const dim = (id: string) => (highlightRole && highlightRole !== id ? 0.4 : 1);
  const red = hexFor(roles, 'red');
  const blue = hexFor(roles, 'blue');
  const grc = hexFor(roles, 'grc');
  const ubuntu = labHost('ubuntu');
  const windows = labHost('windows');
  // The Windows host is a Blue-defended optional track — only draw it when Blue plays.
  const showWindows = has('blue');
  const flow = week ? WEEK_WIRE[week] : undefined;

  return (
    <DiagramFrame
      title="Lab architecture"
      subtitle="Where each role works in your company's environment."
      howToRead="Red drives the attack path (solid). Blue defends the hosts and watches them from the SOC (dashed). GRC governs the whole engagement. The Windows host is an optional track."
      legend={[
        { label: 'Attacker (Red)', color: red },
        { label: 'Defended host', color: '#9ca3af' },
        { label: 'SOC / monitoring (Blue)', color: blue, dashed: true },
        { label: 'Governance (GRC)', color: grc, dashed: true },
      ]}
    >
      <svg
        viewBox="0 0 580 400"
        className="h-auto w-full min-w-[360px]"
        role="img"
        aria-label="Lab architecture diagram"
      >
        <defs>
          <marker id="arch-arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill={red} />
          </marker>
          <marker id="arch-mon" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill={blue} />
          </marker>
        </defs>

        {/* Network cloud */}
        <ellipse cx="290" cy="150" rx="56" ry="30" className="fill-gray-100 stroke-gray-300 dark:fill-gray-800 dark:stroke-gray-600" strokeWidth="1.5" />
        <text x="290" y="146" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-gray-600 dark:fill-gray-300">Network</text>
        <text x="290" y="160" textAnchor="middle" fontSize="9" className="fill-gray-400 dark:fill-gray-500">{LAB_SUBNET}</text>

        {/* Attacker (Red) */}
        {has('red') && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: dim('red') }} transition={{ duration: 0.3 }}>
            <rect x="24" y="120" width="140" height="72" rx="10" fill={red} fillOpacity={0.12} stroke={red} strokeWidth={highlightRole === 'red' ? 3 : 2} />
            <text x="94" y="148" textAnchor="middle" fontSize="12" fontWeight="700" fill={red}>Attacker</text>
            <text x="94" y="164" textAnchor="middle" fontSize="9" className="fill-gray-500 dark:fill-gray-400">Kali · Red</text>
            <text x="94" y="178" textAnchor="middle" fontSize="9" className="fill-gray-500 dark:fill-gray-400">recon → exploit</text>
          </motion.g>
        )}

        {/* Attack path: attacker → network → hosts */}
        {has('red') && (
          <>
            <line x1="164" y1="156" x2="232" y2="152" stroke={red} strokeWidth="2" />
            <line x1="346" y1="140" x2="418" y2="108" stroke={red} strokeWidth="2" markerEnd="url(#arch-arrow)" />
            {showWindows && (
              <line x1="346" y1="162" x2="418" y2="202" stroke={red} strokeWidth="2" markerEnd="url(#arch-arrow)" />
            )}
            {flow && (
              <text x="384" y="120" textAnchor="middle" fontSize="9" fontWeight="600" fill={red}>
                {flow.wire}
              </text>
            )}
          </>
        )}

        {/* Ubuntu host */}
        <g>
          <rect x="420" y="70" width="140" height="76" rx="10" className="fill-white stroke-gray-400 dark:fill-gray-800 dark:stroke-gray-500" strokeWidth="2" />
          <text x="490" y="92" textAnchor="middle" fontSize="11.5" fontWeight="700" className="fill-gray-800 dark:fill-gray-100">{ubuntu.name}</text>
          <text x="490" y="106" textAnchor="middle" fontSize="9" className="fill-gray-400 dark:fill-gray-500">Blue defends · {ubuntu.ip}</text>
          {ubuntu.services.map((svc, i) => (
            <g key={svc}>
              <rect x={432 + i * 40} y="118" width="34" height="18" rx="4" className="fill-gray-100 stroke-gray-300 dark:fill-gray-700 dark:stroke-gray-600" />
              <text x={432 + i * 40 + 17} y="131" textAnchor="middle" fontSize="8.5" className="fill-gray-600 dark:fill-gray-300">{svc}</text>
            </g>
          ))}
        </g>

        {/* Windows host (optional Blue track) */}
        {showWindows && (
          <g>
            <rect x="420" y="165" width="140" height="76" rx="10" className="fill-white stroke-violet-400 dark:fill-gray-800 dark:stroke-violet-500" strokeWidth="2" strokeDasharray="6 4" />
            <text x="490" y="187" textAnchor="middle" fontSize="11.5" fontWeight="700" className="fill-gray-800 dark:fill-gray-100">{windows.name}</text>
            <text x="490" y="201" textAnchor="middle" fontSize="9" className="fill-gray-400 dark:fill-gray-500">Blue defends · optional · {windows.ip}</text>
            <rect x="452" y="213" width="76" height="18" rx="4" className="fill-violet-100 stroke-violet-300 dark:fill-violet-900/40 dark:stroke-violet-700" />
            <text x="490" y="226" textAnchor="middle" fontSize="8.5" className="fill-violet-700 dark:fill-violet-300">Defender · RDP</text>
          </g>
        )}

        {/* SOC / monitoring (Blue) */}
        {has('blue') && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: dim('blue') }} transition={{ duration: 0.3 }}>
            <rect x="300" y="300" width="170" height="66" rx="10" fill={blue} fillOpacity={0.12} stroke={blue} strokeWidth={highlightRole === 'blue' ? 3 : 2} />
            <text x="385" y="328" textAnchor="middle" fontSize="12" fontWeight="700" fill={blue}>SOC / Monitoring</text>
            <text x="385" y="344" textAnchor="middle" fontSize="9" className="fill-gray-500 dark:fill-gray-400">Blue · logs, pcap, alerts</text>
            {/* monitoring up to the host(s) */}
            <line x1="430" y1="300" x2="470" y2="148" stroke={blue} strokeWidth="1.8" strokeDasharray="4 3" markerEnd="url(#arch-mon)" />
            {showWindows && (
              <line x1="450" y1="300" x2="478" y2="243" stroke={blue} strokeWidth="1.8" strokeDasharray="4 3" markerEnd="url(#arch-mon)" />
            )}
          </motion.g>
        )}

        {/* GRC governance band */}
        {has('grc') && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: dim('grc') }} transition={{ duration: 0.3 }}>
            <rect x="24" y="300" width="250" height="66" rx="10" fill={grc} fillOpacity={0.1} stroke={grc} strokeWidth={highlightRole === 'grc' ? 3 : 2} strokeDasharray="6 4" />
            <text x="149" y="326" textAnchor="middle" fontSize="11.5" fontWeight="700" fill={grc}>Governance · Risk · Compliance</text>
            <text x="149" y="343" textAnchor="middle" fontSize="9" className="fill-gray-500 dark:fill-gray-400">GRC · policy, SOPs, risk & evidence</text>
          </motion.g>
        )}
      </svg>
      {flow && (
        <p className="mt-2 text-center text-xs text-muted">
          <span className="font-semibold text-body">This week: </span>
          {flow.focus}
        </p>
      )}
    </DiagramFrame>
  );
}
