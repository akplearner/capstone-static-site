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
      <div className="rounded-2xl border border-[#1e2a3d] bg-[linear-gradient(180deg,#0d1420,#111a29)] p-2 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2.5 px-3.5 pb-1 pt-3 font-mono text-[12.5px] text-[#cdd8e6]">
          TOPOLOGY · {topo.subnet} · bridged
          <span className="ml-auto flex items-center gap-1.5 text-[#8ee6a0]">
            <span className="inline-block h-[7px] w-[7px] animate-pulse rounded-full bg-[#8ee6a0]" /> agents reporting
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
                <path d="M0,0 L7,3 L0,6 Z" fill="#7d93ab" />
              </marker>
              <marker id="soc-agn" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                <path d="M0,0 L7,3 L0,6 Z" fill="#8ee6a0" />
              </marker>
              <marker id="soc-agr" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto">
                <path d="M0,0 L7,3 L0,6 Z" fill="#e8836f" />
              </marker>
              <linearGradient id="soc-sg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#127a99" />
                <stop offset="1" stopColor="#0c5d74" />
              </linearGradient>
            </defs>

            <text x="44" y="34" fill="#6f8398" fontFamily="var(--font-mono)" fontSize="10.5" letterSpacing="1.5">
              PROXMOX HOST · {topo.proxmoxHost} · all VMs on one bridged network
            </text>
            <rect x="40" y="44" width="880" height="246" rx="12" fill="none" stroke="#33455c" strokeWidth="1" strokeDasharray="6 5" />

            {/* Kali attacker */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <rect x="64" y="72" width="160" height="54" rx="10" fill="#2a1c22" stroke="#7d4a48" strokeWidth="1" />
              <text x="80" y="95" fill="#f2dcd8" fontFamily="var(--font-sans)" fontSize="13" fontWeight="600">{topo.attacker.name}</text>
              <text x="80" y="113" fill="#c99e95" fontFamily="var(--font-mono)" fontSize="9">{topo.attacker.note}</text>
            </motion.g>

            {/* Analyst browser */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.05 }}>
              <rect x="64" y="150" width="160" height="54" rx="10" fill="#182333" stroke="#334b66" strokeWidth="1" />
              <text x="80" y="173" fill="#e6edf5" fontFamily="var(--font-sans)" fontSize="13" fontWeight="600">{topo.browser.name}</text>
              <text x="80" y="191" fill="#8ea6bf" fontFamily="var(--font-mono)" fontSize="9">{topo.browser.note}</text>
            </motion.g>

            {/* Team pod */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <rect x="250" y="62" width="290" height="172" rx="12" fill="none" stroke="#3d5570" strokeWidth="1" strokeDasharray="5 4" />
              <text x="262" y="82" fill="#7f93a8" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="1.4">YOUR TEAM POD (×{topo.teamCount})</text>
              <rect x="262" y="92" width="266" height="54" rx="9" fill="#152033" stroke="#2e618f" strokeWidth="1" />
              <text x="276" y="114" fill="#dbe7f2" fontFamily="var(--font-sans)" fontSize="12.5" fontWeight="600">{topo.pod.ubuntu.name}</text>
              <text x="276" y="132" fill="#7fd8ef" fontFamily="var(--font-mono)" fontSize="10">{topo.pod.ubuntu.ip}</text>
              <circle cx="514" cy="105" r="3" fill="#8ee6a0" />
              <rect x="262" y="160" width="266" height="54" rx="9" fill="#152033" stroke="#2e618f" strokeWidth="1" />
              <text x="276" y="182" fill="#dbe7f2" fontFamily="var(--font-sans)" fontSize="12.5" fontWeight="600">{topo.pod.windows.name}</text>
              <text x="276" y="200" fill="#7fd8ef" fontFamily="var(--font-mono)" fontSize="10">{topo.pod.windows.ip}</text>
              <circle cx="514" cy="173" r="3" fill="#8ee6a0" />
            </motion.g>

            {/* Wazuh SOC hub */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.15 }}>
              <rect x="570" y="62" width="330" height="164" rx="13" fill="url(#soc-sg)" stroke="#1fb6d6" strokeWidth="1.3" />
              <text x="590" y="90" fill="#fff" fontFamily="var(--font-sans)" fontSize="15.5" fontWeight="700">{topo.soc.name}</text>
              <text x="590" y="110" fill="#bfeefc" fontFamily="var(--font-mono)" fontSize="12" fontWeight="600">{topo.soc.ip}</text>
              <line x1="590" y1="121" x2="880" y2="121" stroke="#1e93b0" strokeWidth="1" />
              {topo.soc.lines.map((line, i) => (
                <text key={i} x="590" y={139 + i * 16} fill={i === topo.soc.lines.length - 1 ? '#8ee6a0' : '#e4f8ff'} fontFamily="var(--font-mono)" fontSize="9.5">
                  {line}
                </text>
              ))}
            </motion.g>

            {/* Edges */}
            <path d="M224,99 H258" fill="none" stroke="#e8836f" strokeWidth="1.6" markerEnd="url(#soc-agr)" />
            <text x="226" y="92" fill="#d99180" fontFamily="var(--font-mono)" fontSize="8.5">attack</text>
            <path d="M528,112 H566" fill="none" stroke="#3f8f6d" strokeWidth="1.6" strokeDasharray="4 4" markerEnd="url(#soc-agn)" />
            <path d="M528,180 C550,180 552,158 566,146" fill="none" stroke="#3f8f6d" strokeWidth="1.6" strokeDasharray="4 4" markerEnd="url(#soc-agn)" />
            <text x="533" y="105" fill="#8ee6a0" fontFamily="var(--font-mono)" fontSize="8.5">agent</text>
            <path d="M224,181 C282,252 520,266 686,230" fill="none" stroke="#7d93ab" strokeWidth="1.6" markerEnd="url(#soc-ag)" />
            <text x="368" y="278" fill="#8ea6bf" fontFamily="var(--font-mono)" fontSize="9.5">https://{topo.soc.ip} · you investigate here</text>
            <text x="40" y="314" fill="#8ea6bf" fontFamily="var(--font-mono)" fontSize="9.5">
              Team N owns {topo.pod.ubuntu.ip} (Ubuntu) and {topo.pod.windows.ip} (Windows)
            </text>

            {/* Team chips */}
            <g>
              {chips.map((n, i) => {
                const x = 40 + i * 52;
                return (
                  <g key={n}>
                    <rect x={x} y={326} width={47} height={28} rx={7} fill="#152033" stroke="#2e618f" strokeWidth={1} />
                    <text x={x + 23.5} y={326 + 18} fill="#dbe7f2" fontFamily="var(--font-mono)" fontSize={11} fontWeight={600} textAnchor="middle">
                      {n}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 px-3.5 pb-3 pt-1.5 font-mono text-xs text-[#9fb0c4]">
          <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-5 border-t-2 border-[#e8836f]" /> attack</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-5 border-t-2 border-dashed border-[#8ee6a0]" /> agent sends data to SOC</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-5 border-t-2 border-[#7d93ab]" /> your browser</span>
          <span className="text-[#bfeefc]">■ the SOC (one Ubuntu VM)</span>
        </div>
      </div>

      {/* Reference spec table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {['Component', 'Address', 'What runs on it', 'Who touches it'].map((h) => (
                <th key={h} className="border-b border-line bg-panel-2 px-2.5 py-2 text-left font-mono text-[11.5px] uppercase tracking-wide text-muted">
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
