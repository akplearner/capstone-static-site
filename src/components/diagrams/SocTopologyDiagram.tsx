'use client';

import { motion } from 'framer-motion';
import { SocTopology } from '@/lib/labTopology';

/**
 * The SOC lab "one picture" — a shared Wazuh SOC on one flat network, N team
 * pods (Ubuntu+DVWA / Windows) each reporting via an agent, a Kali attacker, and
 * the analyst's browser. A data-driven port of the course-overview topology:
 * a dark console panel with the SVG, a legend, and a spec table. Fed by
 * `SOC_TOPOLOGY_BY_COURSE` (src/lib/labTopology.ts).
 */
export function SocTopologyDiagram({ topo }: { topo: SocTopology }) {
  // 16 team chips laid out along the bottom of the host boundary.
  const chips = Array.from({ length: topo.teamCount }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-[var(--color-panel)] bg-[linear-gradient(180deg,var(--color-panel-2),var(--color-panel))] p-2 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2.5 px-3.5 pb-1 pt-3 font-mono text-xs text-[var(--color-ink)]">
          TOPOLOGY · {topo.subnet} · bridged
          <span className="ml-auto flex items-center gap-1.5 text-[var(--color-w3)]">
            <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full bg-[var(--color-w3)]" /> agents reporting
          </span>
        </div>

        <div className="overflow-x-auto">
          <svg
            viewBox="0 0 960 372"
            className="block h-auto w-full min-w-[680px]"
            role="img"
            aria-label={`All VMs run on a Proxmox host at ${topo.proxmoxHost}, bridged to one flat ${topo.subnet} network. Kali attacks each team pod (Ubuntu ${topo.pod.ubuntu.ip} and Windows ${topo.pod.windows.ip}); both run a Wazuh agent that reports to the ${topo.soc.name} at ${topo.soc.ip}, which students open in a browser.`}
          >
            <defs>
              <marker id="soc-ag" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                <path d="M0,0 L7,3 L0,6 Z" fill="var(--color-line)" />
              </marker>
              <marker id="soc-agn" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                <path d="M0,0 L7,3 L0,6 Z" fill="var(--color-w3)" />
              </marker>
              <marker id="soc-agr" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                <path d="M0,0 L7,3 L0,6 Z" fill="var(--color-w4)" />
              </marker>
              <linearGradient id="soc-sg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--color-accent)" />
                <stop offset="1" stopColor="var(--color-accent-strong)" />
              </linearGradient>
            </defs>

            <text x="44" y="34" fill="var(--color-muted)" fontFamily="var(--font-mono)" fontSize="10.5" letterSpacing="1.5">
              PROXMOX HOST · {topo.proxmoxHost} · all VMs on one bridged network
            </text>
            <rect x="40" y="44" width="880" height="246" rx="12" fill="none" stroke="var(--color-line)" strokeWidth="1" strokeDasharray="6 5" />

            {/* Kali attacker */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <rect x="64" y="72" width="160" height="54" rx="10" fill="var(--color-panel-2)" stroke="var(--color-w4)" strokeWidth="1" />
              <text x="80" y="95" fill="var(--color-w4)" fontFamily="var(--font-sans)" fontSize="13" fontWeight="600">{topo.attacker.name}</text>
              <text x="80" y="113" fill="var(--color-w4)" fontFamily="var(--font-mono)" fontSize="9">{topo.attacker.note}</text>
            </motion.g>

            {/* Analyst browser */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.05 }}>
              <rect x="64" y="150" width="160" height="54" rx="10" fill="var(--color-panel-2)" stroke="var(--color-line)" strokeWidth="1" />
              <text x="80" y="173" fill="var(--color-ink)" fontFamily="var(--font-sans)" fontSize="13" fontWeight="600">{topo.browser.name}</text>
              <text x="80" y="191" fill="var(--color-muted)" fontFamily="var(--font-mono)" fontSize="9">{topo.browser.note}</text>
            </motion.g>

            {/* Team pod */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <rect x="250" y="62" width="290" height="172" rx="12" fill="none" stroke="var(--color-line)" strokeWidth="1" strokeDasharray="5 4" />
              <text x="262" y="82" fill="var(--color-muted)" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.4">YOUR TEAM POD (×{topo.teamCount})</text>
              <rect x="262" y="92" width="266" height="54" rx="9" fill="var(--color-panel)" stroke="var(--color-w2)" strokeWidth="1" />
              <text x="276" y="114" fill="var(--color-ink)" fontFamily="var(--font-sans)" fontSize="12.5" fontWeight="600">{topo.pod.ubuntu.name}</text>
              <text x="276" y="132" fill="var(--color-accent)" fontFamily="var(--font-mono)" fontSize="10">{topo.pod.ubuntu.ip}</text>
              <circle cx="514" cy="105" r="3" fill="var(--color-w3)" />
              <rect x="262" y="160" width="266" height="54" rx="9" fill="var(--color-panel)" stroke="var(--color-w2)" strokeWidth="1" />
              <text x="276" y="182" fill="var(--color-ink)" fontFamily="var(--font-sans)" fontSize="12.5" fontWeight="600">{topo.pod.windows.name}</text>
              <text x="276" y="200" fill="var(--color-accent)" fontFamily="var(--font-mono)" fontSize="10">{topo.pod.windows.ip}</text>
              <circle cx="514" cy="173" r="3" fill="var(--color-w3)" />
            </motion.g>

            {/* Wazuh SOC hub */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.15 }}>
              <rect x="570" y="62" width="330" height="164" rx="13" fill="url(#soc-sg)" stroke="var(--color-accent)" strokeWidth="1.3" />
              <text x="590" y="90" fill="#fff" fontFamily="var(--font-sans)" fontSize="15.5" fontWeight="700">{topo.soc.name}</text>
              <text x="590" y="110" fill="var(--color-accent)" fontFamily="var(--font-mono)" fontSize="12" fontWeight="600">{topo.soc.ip}</text>
              <line x1="590" y1="121" x2="880" y2="121" stroke="var(--color-accent)" strokeWidth="1" />
              {topo.soc.lines.map((line, i) => (
                <text key={i} x="590" y={139 + i * 16} fill={i === topo.soc.lines.length - 1 ? 'var(--color-w3)' : 'var(--color-ink)'} fontFamily="var(--font-mono)" fontSize="9.5">
                  {line}
                </text>
              ))}
            </motion.g>

            {/* Edges */}
            <path d="M224,99 H258" fill="none" stroke="var(--color-w4)" strokeWidth="1.6" markerEnd="url(#soc-agr)" />
            <text x="226" y="92" fill="var(--color-w4)" fontFamily="var(--font-mono)" fontSize="8.5">attack</text>
            <path d="M528,112 H566" fill="none" stroke="var(--color-w3)" strokeWidth="1.6" strokeDasharray="4 4" markerEnd="url(#soc-agn)" />
            <path d="M528,180 C550,180 552,158 566,146" fill="none" stroke="var(--color-w3)" strokeWidth="1.6" strokeDasharray="4 4" markerEnd="url(#soc-agn)" />
            <text x="533" y="105" fill="var(--color-w3)" fontFamily="var(--font-mono)" fontSize="8.5">agent</text>
            <path d="M224,181 C282,252 520,266 686,230" fill="none" stroke="var(--color-line)" strokeWidth="1.6" markerEnd="url(#soc-ag)" />
            <text x="368" y="278" fill="var(--color-muted)" fontFamily="var(--font-mono)" fontSize="9.5">https://{topo.soc.ip} · you investigate here</text>
            <text x="40" y="314" fill="var(--color-muted)" fontFamily="var(--font-mono)" fontSize="9.5">
              Team N owns {topo.pod.ubuntu.ip} (Ubuntu) and {topo.pod.windows.ip} (Windows)
            </text>

            {/* Team chips */}
            <g>
              {chips.map((n, i) => {
                const x = 40 + i * 52;
                return (
                  <g key={n}>
                    <rect x={x} y={326} width={47} height={28} rx={7} fill="var(--color-panel)" stroke="var(--color-w2)" strokeWidth={1} />
                    <text x={x + 23.5} y={326 + 18} fill="var(--color-ink)" fontFamily="var(--font-mono)" fontSize={11} fontWeight={600} textAnchor="middle">
                      {n}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 px-3.5 pb-3 pt-1.5 font-mono text-xs text-[var(--color-muted)]">
          <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-5 border-t-2 border-[var(--color-w4)]" /> attack</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-5 border-t-2 border-dashed border-[var(--color-w3)]" /> agent sends data to SOC</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-5 border-t-2 border-[var(--color-line)]" /> your browser</span>
          <span className="text-[var(--color-accent)]">■ the SOC (one Ubuntu VM)</span>
        </div>
      </div>

      {/* Reference spec table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {['Component', 'Address', 'What runs on it', 'Who touches it'].map((h) => (
                <th key={h} className="border-b border-line bg-panel-2 px-2.5 py-2 text-left font-mono text-2xs uppercase tracking-wide text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topo.spec.map((row) => (
              <tr key={row.component}>
                <td className="whitespace-nowrap border-b border-line px-2.5 py-2 font-semibold text-ink">{row.component}</td>
                <td className="border-b border-line px-2.5 py-2 align-top"><span className="ip">{row.address}</span></td>
                <td className="border-b border-line px-2.5 py-2 align-top text-muted">{row.runs}</td>
                <td className="border-b border-line px-2.5 py-2 align-top text-muted">{row.who}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
