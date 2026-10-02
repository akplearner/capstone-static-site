'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';
import { RoleDef } from '@/lib/types';
import { LAB_SUBNET, labHost, WEEK_WIRE } from '@/lib/labTopology';
import type { WeekProcess } from '@/lib/weekVisual';
import { DiagramFrame } from './DiagramFrame';
import { ProcessArrows, type Anchor } from './ProcessArrows';
import { DUR } from '@/lib/motion';

interface ArchitectureDiagramProps {
  roles: RoleDef[];
  /** Viewer's role id — brightened; others dimmed. */
  highlightRole?: string;
  /** Optional week number — labels what crosses the wire this week. */
  week?: number;
  /** R99: parts that arrive after this week are faded and tagged. Omitted = the finished lab. */
  builtThrough?: number;
  /** R99: the parts that arrive this week — they glow. */
  glow?: string[];
  /** R99: the week's process, drawn over the picture. */
  process?: WeekProcess;
}

const DEFAULT_HEX: Record<string, string> = { red: '#dc2626', blue: '#2563eb', grc: '#16a34a' };
function hexFor(roles: RoleDef[], id: string): string {
  return roles.find((r) => r.id === id)?.color || DEFAULT_HEX[id] || '#6b7280';
}

/** Where each part of the lab sits — the one table the boxes AND the arrows are drawn from. */
const ANCHORS: Record<string, Anchor> = {
  attacker: { x: 94, y: 156, r: 44 },
  network: { x: 290, y: 150, r: 40 },
  ubuntu: { x: 490, y: 108, r: 48 },
  windows: { x: 490, y: 203, r: 48 },
  soc: { x: 385, y: 333, r: 60 },
  grc: { x: 149, y: 333, r: 70 },
  hardened: { x: 490, y: 56, r: 14 },
  custody: { x: 460, y: 379, r: 14 },
  report: { x: 149, y: 384, r: 14 },
};
/** The week each part arrives in — the same numbers `LAB_BUILD` ships; here only for the dimming. */
const ARRIVES: Record<string, number> = { attacker: 0, network: 0, ubuntu: 0, windows: 0, grc: 1, hardened: 1, soc: 2, custody: 3, report: 4 };

/**
 * The lab architecture for one company: a Kali attacker (Red), the two defended
 * hosts (Ubuntu web server + an optional Windows host, Blue), the SOC that
 * monitors them (Blue), and the GRC governance layer over the whole engagement.
 * Solid red = attack path; dashed blue = monitoring; dashed green = governance.
 *
 * R99: week-scoped. `builtThrough` fades what has not arrived yet, `glow` rings
 * what arrives this week, `process` draws the week's arrows over it.
 */
export function ArchitectureDiagram({ roles, highlightRole, week, builtThrough, glow = [], process }: ArchitectureDiagramProps) {
  const has = (id: string) => roles.some((r) => r.id === id) || ['red', 'blue', 'grc'].includes(id);
  const built = (id: string) => builtThrough == null || (ARRIVES[id] ?? 0) <= builtThrough;
  const dim = (id: string) => (highlightRole && highlightRole !== id ? 0.4 : 1);
  const fade = (id: string) => (built(id) ? 1 : 0.28);
  const red = hexFor(roles, 'red');
  const blue = hexFor(roles, 'blue');
  const grc = hexFor(roles, 'grc');
  const ubuntu = labHost('ubuntu');
  const windows = labHost('windows');
  // The Windows host is a Blue-defended optional track — only draw it when Blue plays.
  const showWindows = has('blue');
  const flow = week ? WEEK_WIRE[week] : undefined;
  const mid = useId().replace(/:/g, '');
  const lit = new Set(glow);
  const ring = (id: string) => {
    if (!lit.has(id)) return null;
    const a = ANCHORS[id];
    return <circle cx={a.x} cy={a.y} r={a.r + 4} fill="none" stroke="var(--week, var(--color-accent))" strokeWidth={2.5} opacity={0.85} data-glow="true" />;
  };
  const tag = (id: string, dx = 0, dy = 0) =>
    built(id) ? null : (
      <text x={ANCHORS[id].x + dx} y={ANCHORS[id].y + dy} textAnchor="middle" fontSize="8" fontWeight="700" className="fill-[var(--color-muted)]">
        Week {ARRIVES[id]}
      </text>
    );
  const part = (id: string) => ({ 'data-node': id, 'data-later': built(id) ? undefined : 'true', 'data-glow': lit.has(id) ? 'true' : undefined });

  return (
    <DiagramFrame
      title="Lab architecture"
      subtitle="Where each role works in your company's environment."
      howToRead="Red drives the attack path (solid). Blue defends the hosts and watches them from the SOC (dashed). GRC governs the whole engagement. The Windows host is an optional track."
      legend={[
        { label: 'Attacker (Red)', color: red },
        { label: 'Defended host', color: 'var(--color-muted)' },
        { label: 'SOC / monitoring (Blue)', color: blue, dashed: true },
        { label: 'Governance (GRC)', color: grc, dashed: true },
      ]}
    >
      <svg
        viewBox="0 0 580 400"
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full min-w-0 sm:min-w-[360px] lg:max-h-[28rem]"
        role="img"
        aria-label={`Lab architecture diagram${builtThrough != null ? `, week ${builtThrough}` : ''}`}
      >
        <defs>
          <marker id={`${mid}-arrow`} markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill={red} />
          </marker>
          <marker id={`${mid}-mon`} markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
            <path d="M0,0 L7,3 L0,6 Z" fill={blue} />
          </marker>
        </defs>

        {/* Network cloud */}
        <g {...part('network')}>
          <ellipse cx="290" cy="150" rx="56" ry="30" className="fill-[var(--color-panel-2)] stroke-[var(--color-line)]" strokeWidth="1.5" />
          <text x="290" y="146" textAnchor="middle" fontSize="11" fontWeight="700" className="fill-[var(--color-body)]">Network</text>
          <text x="290" y="160" textAnchor="middle" fontSize="9" className="fill-[var(--color-muted)]">{LAB_SUBNET}</text>
          {ring('network')}
        </g>

        {/* Attacker (Red) */}
        {has('red') && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: dim('red') * fade('attacker') }} transition={{ duration: DUR.reveal }} {...part('attacker')}>
            <rect x="24" y="120" width="140" height="72" rx="10" fill={red} fillOpacity={0.12} stroke={red} strokeWidth={highlightRole === 'red' ? 3 : 2} />
            <text x="94" y="148" textAnchor="middle" fontSize="12" fontWeight="700" fill={red}>Attacker</text>
            <text x="94" y="164" textAnchor="middle" fontSize="9" className="fill-[var(--color-muted)]">Kali · Red</text>
            <text x="94" y="178" textAnchor="middle" fontSize="9" className="fill-[var(--color-muted)]">recon → exploit</text>
            {ring('attacker')}
          </motion.g>
        )}

        {/* Attack path: attacker → network → hosts */}
        {has('red') && !process && (
          <>
            <line x1="164" y1="156" x2="232" y2="152" stroke={red} strokeWidth="2" />
            <line x1="346" y1="140" x2="418" y2="108" stroke={red} strokeWidth="2" markerEnd={`url(#${mid}-arrow)`} />
            {showWindows && (
              <line x1="346" y1="162" x2="418" y2="202" stroke={red} strokeWidth="2" markerEnd={`url(#${mid}-arrow)`} />
            )}
            {flow && (
              <text x="384" y="120" textAnchor="middle" fontSize="9" fontWeight="600" fill={red}>
                {flow.wire}
              </text>
            )}
          </>
        )}

        {/* Ubuntu host, with the hardening baseline chip above it from Week 1 */}
        <g {...part('ubuntu')}>
          <rect x="420" y="70" width="140" height="76" rx="10" className="fill-[var(--color-panel)] stroke-[var(--color-line)]" strokeWidth="2" />
          <text x="490" y="92" textAnchor="middle" fontSize="11.5" fontWeight="700" className="fill-[var(--color-ink)]">{ubuntu.name}</text>
          <text x="490" y="106" textAnchor="middle" fontSize="9" className="fill-[var(--color-muted)]">Blue defends · {ubuntu.ip}</text>
          {ubuntu.services.map((svc, i) => (
            <g key={svc}>
              <rect x={432 + i * 40} y="118" width="34" height="18" rx="4" className="fill-[var(--color-panel-2)] stroke-[var(--color-line)]" />
              <text x={432 + i * 40 + 17} y="131" textAnchor="middle" fontSize="8.5" className="fill-[var(--color-body)]">{svc}</text>
            </g>
          ))}
          {ring('ubuntu')}
        </g>
        <g opacity={fade('hardened')} {...part('hardened')}>
          <rect x="446" y="46" width="88" height="18" rx="9" fill={blue} fillOpacity={0.12} stroke={blue} strokeWidth="1" strokeDasharray="3 2" />
          <text x="490" y="58" textAnchor="middle" fontSize="8.5" fontWeight="600" fill={blue}>hardened baseline</text>
          {ring('hardened')}
          {tag('hardened', -62, 4)}
        </g>

        {/* Windows host (optional Blue track) */}
        {showWindows && (
          <g {...part('windows')}>
            <rect x="420" y="165" width="140" height="76" rx="10" className="fill-[var(--color-panel)] stroke-[var(--color-info)]" strokeWidth="2" strokeDasharray="6 4" />
            <text x="490" y="187" textAnchor="middle" fontSize="11.5" fontWeight="700" className="fill-[var(--color-ink)]">{windows.name}</text>
            <text x="490" y="201" textAnchor="middle" fontSize="9" className="fill-[var(--color-muted)]">Blue defends · optional · {windows.ip}</text>
            <rect x="452" y="213" width="76" height="18" rx="4" className="fill-[var(--color-info-soft)] stroke-[var(--color-info-line)]" />
            <text x="490" y="226" textAnchor="middle" fontSize="8.5" className="fill-[var(--color-info)]">Defender · RDP</text>
            {ring('windows')}
          </g>
        )}

        {/* SOC / monitoring (Blue), with the evidence-custody chip from Week 3 */}
        {has('blue') && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: dim('blue') * fade('soc') }} transition={{ duration: DUR.reveal }} {...part('soc')}>
            <rect x="300" y="300" width="170" height="66" rx="10" fill={blue} fillOpacity={0.12} stroke={blue} strokeWidth={highlightRole === 'blue' ? 3 : 2} />
            <text x="385" y="328" textAnchor="middle" fontSize="12" fontWeight="700" fill={blue}>SOC / Monitoring</text>
            <text x="385" y="344" textAnchor="middle" fontSize="9" className="fill-[var(--color-muted)]">Blue · logs, pcap, alerts</text>
            {/* monitoring up to the host(s) */}
            {!process && (
              <>
                <line x1="430" y1="300" x2="470" y2="148" stroke={blue} strokeWidth="1.8" strokeDasharray="4 3" markerEnd={`url(#${mid}-mon)`} />
                {showWindows && (
                  <line x1="450" y1="300" x2="478" y2="243" stroke={blue} strokeWidth="1.8" strokeDasharray="4 3" markerEnd={`url(#${mid}-mon)`} />
                )}
              </>
            )}
            {ring('soc')}
            {tag('soc', 0, 44)}
          </motion.g>
        )}
        <g opacity={fade('custody')} {...part('custody')}>
          <rect x="414" y="370" width="92" height="18" rx="9" fill={blue} fillOpacity={0.12} stroke={blue} strokeWidth="1" strokeDasharray="3 2" />
          <text x="460" y="382" textAnchor="middle" fontSize="8.5" fontWeight="600" fill={blue}>evidence · custody</text>
          {ring('custody')}
          {tag('custody', 72, 4)}
        </g>

        {/* GRC governance band, with the final report chip from Week 4 */}
        {has('grc') && (
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: dim('grc') * fade('grc') }} transition={{ duration: DUR.reveal }} {...part('grc')}>
            <rect x="24" y="300" width="250" height="66" rx="10" fill={grc} fillOpacity={0.1} stroke={grc} strokeWidth={highlightRole === 'grc' ? 3 : 2} strokeDasharray="6 4" />
            <text x="149" y="326" textAnchor="middle" fontSize="11.5" fontWeight="700" fill={grc}>Governance · Risk · Compliance</text>
            <text x="149" y="343" textAnchor="middle" fontSize="9" className="fill-[var(--color-muted)]">GRC · policy, SOPs, risk & evidence</text>
            {ring('grc')}
            {tag('grc', 0, 44)}
          </motion.g>
        )}
        <g opacity={fade('report')} {...part('report')}>
          <rect x="99" y="375" width="100" height="18" rx="9" fill={grc} fillOpacity={0.12} stroke={grc} strokeWidth="1" strokeDasharray="3 2" />
          <text x="149" y="387" textAnchor="middle" fontSize="8.5" fontWeight="600" fill={grc}>final report → client</text>
          {ring('report')}
          {tag('report', 78, 4)}
        </g>

        {/* R99: the week's process, over the same picture. */}
        {process && <ProcessArrows process={process} anchors={(id) => ANCHORS[id] ?? null} markerId={`${mid}-p`} fontSize={9} />}
      </svg>
      {flow && !process && (
        <p className="mt-2 text-center text-xs text-muted">
          <span className="font-semibold text-body">This week: </span>
          {flow.focus}
        </p>
      )}
    </DiagramFrame>
  );
}
