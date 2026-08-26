'use client';

import { DiagramFrame } from './DiagramFrame';

/**
 * The Server+ picture: a physical 24U rack elevation beside the small virtual
 * layer that runs inside the one server.
 *
 * This course is a hands-on, documented build — rack the server, wire the patch
 * panel, install a hypervisor — not a traffic-flow story. So the reference
 * picture is the rack itself: what sits at each U, how the patch panel feeds the
 * switch, and what the one server virtualises. It mirrors the seed rows in the
 * Rack & Cabling Record and the Topology & IP Plan so the diagram and the forms
 * agree.
 *
 * The virtual side draws the three bridges: vmbr0 management on the campus
 * LAN (each team's host at 10.10.30.<team#>), vmbr1 the DMZ zone carrying the
 * website, and vmbr2 the private network with the Windows server and the
 * Linux database — later mapped to a physical NIC into a Cisco router +
 * switch, the servers' only internet path. DMZ/private subnets are worked
 * examples; the 10.10.30.T rule is the real classroom rule.
 *
 * The generic `ArchitectureDiagram` draws a red/blue/grc attack lab and hardcodes
 * those role ids, which describes nothing about a rack build — hence this own
 * picture.
 */

// Bottom-up is how a rack is actually counted, but we render top-down, so the
// array is ordered high U → low U. `span` is how many U the device occupies.
type RackKind = 'panel' | 'switch' | 'server' | 'pdu' | 'blank';
const RACK: { u: string; label: string; sub?: string; kind: RackKind; span: number }[] = [
  { u: 'U24', label: '24-port patch panel', sub: 'Cat6 terminations from the office drops', kind: 'panel', span: 1 },
  { u: 'U23', label: 'Access switch', sub: 'Uplink to the office LAN on port 24', kind: 'switch', span: 1 },
  { u: 'U22', label: '', kind: 'blank', span: 1 },
  { u: 'U20–U21', label: 'The server — Proxmox host', sub: '2U, on sliding rails · the one machine you build', kind: 'server', span: 2 },
  { u: 'U2–U19', label: 'Expansion reserve — ≥20% kept free for growth', kind: 'blank', span: 1 },
  { u: 'U1', label: 'Rack PDU', sub: '8-outlet · feeds every device above', kind: 'pdu', span: 1 },
];

const KIND_COLOR: Record<RackKind, string> = {
  panel: 'var(--color-w3)',
  switch: 'var(--color-w2)',
  server: 'var(--color-accent)',
  pdu: 'var(--color-w1)',
  blank: 'var(--color-line)',
};

const ZONES: {
  bridge: string;
  name: string;
  subnet: string;
  color: string;
  vms: { name: string; runs: string; addr: string }[];
}[] = [
  {
    bridge: 'vmbr1',
    name: 'DMZ',
    subnet: '172.16.0.0/24',
    color: 'var(--color-w3)',
    vms: [{ name: 'websrv', runs: 'The website — public-facing', addr: '172.16.0.10' }],
  },
  {
    bridge: 'vmbr2',
    name: 'Private',
    subnet: '192.168.0.0/24',
    color: 'var(--color-w1)',
    vms: [
      { name: 'winserver', runs: 'Windows Server — directory · DNS · DHCP', addr: '192.168.0.2' },
      { name: 'linuxsrv', runs: 'Ubuntu Server — the database', addr: '192.168.0.3' },
    ],
  },
];

export function ServerTopologyDiagram() {
  return (
    <DiagramFrame
      title="What you build — one server in a 24U rack"
      howToRead="Left is the physical 24U rack, counted in U from the bottom up. Right is what the one server virtualises: management on the campus LAN, a DMZ zone for the website, and a private zone for the Windows server and the database."
      legend={[
        { label: 'Patch panel — structured cabling', color: 'var(--color-w3)' },
        { label: 'Switch — the network', color: 'var(--color-w2)' },
        { label: 'Server — the Proxmox host', color: 'var(--color-accent)' },
        { label: 'PDU — power', color: 'var(--color-w1)' },
        { label: 'vmbr1 — DMZ zone', color: 'var(--color-w3)' },
        { label: 'vmbr2 — private zone', color: 'var(--color-w1)' },
      ]}
    >
      <div className="grid min-w-[560px] gap-4 sm:grid-cols-[minmax(220px,1fr)_minmax(240px,1.2fr)]">
        {/* The physical rack elevation */}
        <div className="rounded-lg border border-line bg-panel-2 p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="eyebrow-muted">Rack A · 24U</span>
            <span className="text-[11px] text-muted">front elevation</span>
          </div>
          <div className="space-y-1">
            {RACK.map((r) => {
              const color = KIND_COLOR[r.kind];
              const isBlank = r.kind === 'blank';
              return (
                <div
                  key={r.u}
                  className={`flex items-stretch gap-2 rounded-md ${
                    isBlank ? '' : 'border-2 bg-panel'
                  }`}
                  style={{
                    borderColor: isBlank ? undefined : color,
                    minHeight: r.span > 1 ? `${r.span * 2.2}rem` : undefined,
                  }}
                >
                  <span
                    className={`flex w-14 shrink-0 items-center justify-center rounded-l-md font-mono text-[10px] ${
                      isBlank ? 'text-muted/60' : 'text-ink'
                    }`}
                    style={isBlank ? undefined : { backgroundColor: color, color: '#fff' }}
                  >
                    {r.u}
                  </span>
                  {isBlank ? (
                    <span className="flex flex-1 items-center border border-dashed border-line/60 px-2 py-1 text-[10px] italic text-muted/70">
                      {r.label}
                    </span>
                  ) : (
                    <span className="flex-1 px-2 py-1">
                      <span className="block text-xs font-semibold text-ink">{r.label}</span>
                      {r.sub && <span className="block text-[10px] text-muted">{r.sub}</span>}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-center text-[10px] text-muted">
            Patch panel → switch → server NIC. Every lead is labelled and logged in the Rack &amp; Cabling Record.
          </div>
        </div>

        {/* The virtual layer: vmbr0 management on the LAN, then the two zones */}
        <div className="space-y-3">
          <div className="rounded-lg border-2 border-accent bg-accent-soft px-3 py-2">
            <div className="text-sm font-bold text-ink">Proxmox host — the one server (U20–U21)</div>
            <div className="font-mono text-[11px] text-muted">
              vmbr0 management · 10.10.30.<span className="font-bold text-ink">T</span> on the 10.10.0.0/16 LAN · web console :8006
            </div>
            <div className="text-[10px] text-muted">T is your team number — Team 1 is 10.10.30.1, Team 2 is .2</div>
          </div>

          <div className="text-center text-xs text-muted" aria-hidden>
            ↓ runs two zones
          </div>

          <div className="space-y-2">
            {ZONES.map((z) => (
              <div key={z.bridge} className="rounded-lg border-2 bg-panel px-3 py-2" style={{ borderColor: z.color }}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="font-mono text-xs font-bold" style={{ color: z.color }}>
                    {z.bridge} · {z.name}
                  </span>
                  <span className="font-mono text-[11px] text-muted">{z.subnet}</span>
                </div>
                <div className="mt-1.5 space-y-1">
                  {z.vms.map((vm) => (
                    <div key={vm.name} className="rounded-md border border-line bg-panel-2 px-2 py-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <span className="font-mono text-[11px] font-bold text-ink">{vm.name}</span>
                        <span className="font-mono text-[10px] text-muted">{vm.addr}</span>
                      </div>
                      <div className="text-[10px] text-muted">{vm.runs}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-dashed border-line px-3 py-2 text-[11px] text-muted">
            <span className="font-semibold text-ink">Later phase:</span> vmbr2 maps to a physical NIC
            attached to a <span className="font-semibold text-ink">Cisco router + switch</span> — that
            becomes the servers&rsquo; only path to the internet. Zone subnets are worked examples;
            record yours in the Architecture &amp; IP Plan.
          </div>
        </div>
      </div>
    </DiagramFrame>
  );
}
