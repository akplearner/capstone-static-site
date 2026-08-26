'use client';

import { DiagramFrame } from './DiagramFrame';

/**
 * The Server+ deployment topology: one blade server running a hypervisor, with
 * four virtual bridges that keep the zones apart.
 *
 * This course needs its own picture. The generic `ArchitectureDiagram` draws a
 * red/blue/grc attack-and-defend lab and hardcodes those three role ids, which
 * describes nothing about a four-bridge MSP deployment — an environment whose
 * whole point is that the DMZ and the private LAN cannot reach each other.
 *
 * Addresses are the handbook's worked examples. A team uses whatever the
 * instructor assigned; the shape is what matters here.
 */

const ZONES = [
  {
    bridge: 'vmbr1',
    name: 'DMZ',
    subnet: '172.16.0.0/24',
    color: 'var(--color-w3)',
    hosts: ['Jump box 172.16.0.10', 'Public-facing web', 'Monitoring UI'],
    trust: 'Semi-trusted',
  },
  {
    bridge: 'vmbr2',
    name: 'Private LAN',
    subnet: '192.168.0.0/24',
    color: 'var(--color-w1)',
    hosts: ['winserver 192.168.0.2', 'linuxsrv 192.168.0.3', 'DHCP pool .100–.200'],
    trust: 'Trusted core',
  },
];

const SPEC: { component: string; address: string; runs: string; who: string }[] = [
  { component: 'Proxmox host', address: '10.10.10.x (vmbr0)', runs: 'The hypervisor and every VM below', who: 'Network Engineer' },
  { component: 'Jump box', address: '172.16.0.10 (vmbr1)', runs: 'Hardened SSH gateway — the only way in', who: 'Network Engineer' },
  { component: 'Windows Server', address: '192.168.0.2 (vmbr2)', runs: 'DNS · DHCP · IIS portal · file shares', who: 'Windows Engineer' },
  { component: 'Ubuntu Server', address: '192.168.0.3 (vmbr2)', runs: 'NGINX site · MariaDB dispatch database', who: 'Linux Engineer' },
  { component: 'Client workstation', address: 'DHCP .100–.200 (vmbr2)', runs: 'Proves the services from a user seat', who: 'Whole team' },
];

export function ServerTopologyDiagram() {
  return (
    <DiagramFrame
      title="The environment you build — four bridges, three zones"
      howToRead="Everything runs inside one blade server. Each bridge is a virtual switch: traffic on one cannot reach another unless a rule you wrote allows it. Admin access enters through the jump box only."
      legend={[
        { label: 'Management — no user services', color: 'var(--color-muted)' },
        { label: 'DMZ — semi-trusted', color: 'var(--color-w3)' },
        { label: 'Private LAN — trusted core', color: 'var(--color-w1)' },
        { label: 'Physical uplink', color: 'var(--color-line)', dashed: true },
      ]}
    >
      <div className="min-w-[540px] space-y-3">
        {/* Office LAN + management bridge */}
        <div className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-center">
          <div className="eyebrow-muted">Office / school LAN — 10.10.10.0/24</div>
          <div className="mt-1 text-xs text-muted">
            vmbr0 · management only · Proxmox console at{' '}
            <span className="font-mono text-ink">https://10.10.10.x:8006</span>
          </div>
        </div>

        <div className="text-center text-xs text-muted" aria-hidden>
          ↓
        </div>

        {/* The host */}
        <div className="rounded-lg border-2 border-accent bg-accent-soft px-3 py-2 text-center">
          <div className="text-sm font-bold text-ink">Proxmox host — the one blade server</div>
          <div className="text-xs text-muted">Every VM below runs inside this machine</div>
        </div>

        <div className="text-center text-xs text-muted" aria-hidden>
          ↓
        </div>

        {/* The two service zones side by side */}
        <div className="grid gap-3 sm:grid-cols-2">
          {ZONES.map((z) => (
            <div
              key={z.bridge}
              className="rounded-lg border-2 bg-panel px-3 py-2"
              style={{ borderColor: z.color }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="font-mono text-xs font-bold" style={{ color: z.color }}>
                  {z.bridge} · {z.name}
                </span>
                <span className="text-[11px] text-muted">{z.trust}</span>
              </div>
              <div className="font-mono text-[11px] text-muted">{z.subnet}</div>
              <ul className="mt-1.5 space-y-0.5">
                {z.hosts.map((h) => (
                  <li key={h} className="text-xs text-ink">
                    · {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* The rule that makes the zones mean something */}
        <div className="rounded-lg border border-dashed border-line px-3 py-2 text-center text-xs text-muted">
          <span className="font-semibold text-ink">DMZ → Private LAN is blocked</span> except the one
          SSH path the firewall rule base allows. Proving that block is a Week&nbsp;3 deliverable.
          <span className="mt-1 block">vmbr3 · physical uplink to the office switch</span>
        </div>

        {/* What is what */}
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-left uppercase tracking-wide text-muted">
                <th className="px-2 py-1.5">Component</th>
                <th className="px-2 py-1.5">Address</th>
                <th className="px-2 py-1.5">What runs on it</th>
                <th className="px-2 py-1.5">Who owns it</th>
              </tr>
            </thead>
            <tbody>
              {SPEC.map((s) => (
                <tr key={s.component} className="border-b border-line/60 last:border-0">
                  <td className="px-2 py-1.5 font-medium text-ink">{s.component}</td>
                  <td className="px-2 py-1.5 font-mono text-[11px] text-body">{s.address}</td>
                  <td className="px-2 py-1.5 text-muted">{s.runs}</td>
                  <td className="px-2 py-1.5 text-muted">{s.who}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DiagramFrame>
  );
}
