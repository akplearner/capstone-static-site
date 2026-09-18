'use client';

import { DiagramFrame } from './DiagramFrame';
import {
  CAMPUS_LAN,
  HOST,
  MACHINES,
  REMOTE_ADMIN,
  TEAM_VM_START,
  ZONE_BRIDGES,
  baseVmsOn,
  type MachineId,
} from '@/lib/serverTopology';
import {
  ARRIVES,
  CROSS_ZONE_LABEL,
  PUBLISHED_BY_VM,
  RACK_ELEVATION,
  RACK_LEGEND,
  SERVER_DIAGRAM_COPY as COPY,
  fillCopy,
  type RackKind,
} from '@/lib/docs/serverDiagrams';
import { ZONE_COLOR } from './topologyStyle';

/**
 * The Server+ picture: a physical 24U rack elevation beside the small virtual
 * layer that runs inside the one server.
 *
 * This course is a hands-on, documented build — rack the server, wire the patch
 * panel, install a hypervisor — not a traffic-flow story. So the reference
 * picture is the rack itself: what sits at each U, how the patch panel feeds the
 * switch, and what the one server virtualises. It mirrors the seed rows in the
 * Rack, Power & Asset Register and the IP Plan & Connectivity Proof so the
 * diagram and the forms agree.
 *
 * The virtual side draws the three bridges: vmbr0 management on the campus
 * LAN (each team's host at the 10.10.30.<team#> rule), vmbr1 the DMZ zone
 * carrying the website, and vmbr2 the private network with the Windows server
 * and the Linux database — later mapped to a physical NIC into a Cisco router +
 * switch, the servers' only internet path.
 *
 * Not one address below is typed here: every subnet, gateway, hostname and
 * address is read from `@/lib/serverTopology`, which the configuration guide
 * reads too. That module exists because this picture and that guide had already
 * drifted apart once.
 *
 * The generic `ArchitectureDiagram` draws a red/blue/grc attack lab and hardcodes
 * those role ids, which describes nothing about a rack build — hence this own
 * picture.
 */

const KIND_COLOR: Record<RackKind, string> = {
  panel: 'var(--color-w3)',
  switch: 'var(--color-w2)',
  server: 'var(--color-accent)',
  pdu: 'var(--color-w1)',
  blank: 'var(--color-line)',
};

const ZONES = ZONE_BRIDGES.map((b) => ({
  bridge: b,
  color: ZONE_COLOR[b.id],
  vms: baseVmsOn(b.id),
  /** Where this team numbers the VMs it adds for its own business. */
  teamStart: TEAM_VM_START[b.id],
}));

export function ServerTopologyDiagram({
  business,
  highlight,
  builtThrough,
}: {
  /** The team's chosen business, from the Business Requirements record — the
   *  topology is generic until a team says who it is building for. */
  business?: { name?: string; industry?: string };
  /** Machines to keep at full contrast; everything else fades back. The guide
   *  passes the week's machines, so each week block shows the whole design with
   *  that week's part lit. Omitted = nothing dimmed. */
  highlight?: MachineId[];
  /** The furthest week this student has finished. Parts that arrive later are
   *  dimmed and tagged `Week N`. Omitted = the finished design. */
  builtThrough?: number;
} = {}) {
  const businessLabel = [business?.name, business?.industry].filter(Boolean).join(' · ');
  // Highlight and build-through are two different kinds of "not now": one is
  // "not this week's subject", the other is "you have not built this yet".
  // Both resolve to the same visual — reduced contrast — so they compose.
  const lit = highlight?.length
    ? new Set(highlight.map((m) => MACHINES[m]?.node).filter(Boolean) as string[])
    : null;
  const built = (week: number) => builtThrough == null || builtThrough >= week;
  const dim = (on: boolean) => (on ? '' : 'opacity-40');
  const vmDim = (hostname: string) =>
    dim(built(ARRIVES.vms) && (!lit || lit.has(hostname)));
  const weekTag = (week: number) =>
    built(week) ? null : (
      <span className="ml-1 rounded-full border border-line px-1 py-px font-mono text-3xs text-muted">
        Week {week}
      </span>
    );
  return (
    <DiagramFrame
      title={COPY.title}
      howToRead={COPY.howToRead}
      legend={[
        ...RACK_LEGEND.map((l) => ({ label: l.label, color: KIND_COLOR[l.kind] })),
        ...ZONES.map((z) => ({
          label: fillCopy(COPY.zoneLegend, { bridge: z.bridge.id, zone: z.bridge.zone }),
          color: z.color,
        })),
      ]}
    >
      <div className="grid min-w-[560px] gap-4 sm:grid-cols-[minmax(220px,1fr)_minmax(240px,1.2fr)]">
        {/* The physical rack elevation */}
        <div className="rounded-lg border border-line bg-panel-2 p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="eyebrow-muted">{COPY.rackHeading}</span>
            <span className="text-2xs text-muted">{COPY.rackAspect}</span>
          </div>
          <div className="space-y-1">
            {RACK_ELEVATION.map((r) => {
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
                    className={`flex w-14 shrink-0 items-center justify-center rounded-l-md font-mono text-3xs ${
                      isBlank ? 'text-muted/60' : 'text-ink'
                    }`}
                    style={isBlank ? undefined : { backgroundColor: color, color: '#fff' }}
                  >
                    {r.u}
                  </span>
                  {isBlank ? (
                    <span className="flex flex-1 items-center border border-dashed border-line/60 px-2 py-1 text-3xs italic text-muted/70">
                      {r.label}
                    </span>
                  ) : (
                    <span className="flex-1 px-2 py-1">
                      <span className="block text-xs font-semibold text-ink">{r.label}</span>
                      {r.sub && <span className="block text-3xs text-muted">{r.sub}</span>}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-center text-3xs text-muted">{COPY.rackCaption}</div>
        </div>

        {/* The virtual side, drawn as a topology: LAN → host → the two zones,
            each with its base VMs and a dashed slot for the VMs the team adds
            for its business. Connector lines are bordered spacers — no SVG. */}
        <div className="flex flex-col">
          {businessLabel && (
            <div className="mb-2 self-start rounded-full bg-accent-soft px-3 py-1 text-2xs font-semibold text-accent-ink">
              {fillCopy(COPY.buildingFor, { business: businessLabel })}
            </div>
          )}

          {/* Campus LAN */}
          <div className="rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-center">
            <span className="text-xs font-semibold text-ink">{COPY.campusLan}</span>
            <span className="ml-2 font-mono text-2xs text-muted">{CAMPUS_LAN.cidr}</span>
          </div>
          <div className="mx-auto h-3 w-px bg-line" aria-hidden />

          {/* What the campus reaches THROUGH the host: the published ports, from
              the same model the host's rules file is rendered from. */}
          <div className={`rounded-lg border border-dashed border-accent/60 bg-panel px-3 py-1.5 text-center text-3xs text-muted ${dim(built(ARRIVES.published))}`}>
            <span className="font-semibold text-ink">
              {fillCopy(COPY.publishedHeading, { host: HOST.rule })}
            </span>
            {weekTag(ARRIVES.published)}
            {PUBLISHED_BY_VM.map((r) => (
              <span key={r.to} className="ml-2 whitespace-nowrap font-mono">
                {r.ports.map((p) => `:${p}`).join(' ')} → {r.to}
              </span>
            ))}
          </div>
          <div className="mx-auto h-3 w-px bg-line" aria-hidden />

          {/* The host */}
          <div className={`rounded-lg border-2 border-accent bg-accent-soft px-3 py-2 text-center ${dim(built(ARRIVES.host) && (!lit || lit.has('host')))}`}>
            <div className="text-sm font-bold text-ink">{COPY.hostHeading}</div>
            <div className="font-mono text-2xs text-muted">
              vmbr0 · {HOST.rule.slice(0, -HOST.teamMarker.length)}
              <span className="font-bold text-ink">{HOST.teamMarker}</span> ({HOST.teamMarker} = team #,
              Team {HOST.exampleTeam} = {HOST.exampleAddress}) · console :{HOST.consolePort}
            </div>
          </div>

          {/* Fork into the two zones */}
          <div className="mx-auto h-3 w-px bg-line" aria-hidden />
          <div className="mx-[12%] h-px bg-line" aria-hidden />
          <div className="mx-[12%] flex justify-between" aria-hidden>
            <div className="h-3 w-px bg-line" />
            <div className="h-3 w-px bg-line" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {ZONES.map((z) => (
              <div
                key={z.bridge.id}
                className={`flex flex-col rounded-lg border-2 bg-panel px-2.5 py-2 ${dim(built(ARRIVES.zones))}`}
                style={{ borderColor: z.color }}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="font-mono text-xs font-bold" style={{ color: z.color }}>
                    {z.bridge.id} · {z.bridge.zone}
                    {weekTag(ARRIVES.zones)}
                  </span>
                  <span className="font-mono text-3xs text-muted">
                    {z.bridge.cidr} · gw {z.bridge.gateway}
                  </span>
                </div>
                <div className="mt-1.5 space-y-1">
                  {z.vms.map((vm) => (
                    <div key={vm.hostname} className={`rounded-md border bg-panel-2 px-2 py-1 ${vmDim(vm.hostname)} ${lit?.has(vm.hostname) ? 'border-2' : 'border-line'}`} style={lit?.has(vm.hostname) ? { borderColor: z.color } : undefined}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <span className="font-mono text-2xs font-bold text-ink">{vm.hostname}</span>
                        <span className="font-mono text-3xs text-muted">{vm.address}</span>
                      </div>
                      <div className="text-3xs text-muted">{vm.runs} · base build</div>
                    </div>
                  ))}
                  {/* The room the design leaves on purpose: the VMs that make
                      this YOUR business, planned in the Architecture Brief. */}
                  <div className="rounded-md border border-dashed border-line px-2 py-1.5 text-center">
                    <span className="block text-2xs font-semibold text-muted">
                      {fillCopy(COPY.teamSlotHeading, {
                        business: businessLabel ? (business?.name ?? 'your business') : 'your business',
                      })}
                    </span>
                    <span className="block text-3xs text-muted/80">
                      {COPY.teamSlotBlurb[z.bridge.zone] ?? COPY.teamSlotBlurb.Private}{' '}
                      {COPY.teamSlotWhere.before}
                      <span className="font-mono">{z.teamStart}</span>
                      {COPY.teamSlotWhere.after}
                    </span>
                  </div>
                </div>
                {z.bridge.id === 'vmbr1' && (
                  <div className={`mt-2 border-t border-dashed border-line pt-1.5 text-center text-3xs text-muted ${dim(built(ARRIVES.crossZone))}`}>
                    {COPY.crossZone.before}
                    <span className="font-semibold text-ink">{CROSS_ZONE_LABEL}</span>
                    {COPY.crossZone.after}
                    {weekTag(ARRIVES.crossZone)}
                  </div>
                )}
                {z.bridge.id === 'vmbr2' && (
                  <div className="mt-2 border-t border-dashed border-line pt-1.5 text-center text-3xs text-muted">
                    {COPY.vmbr2Later.before}
                    <span className="font-semibold text-ink">{COPY.vmbr2Later.strong}</span>
                    {COPY.vmbr2Later.after}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* The tailnet. It has been in the model since the host became a
              subnet router, but it was never in the picture — so the one path
              that reaches every zone was the one path students could not see. */}
          <div className={`mt-3 rounded-lg border border-dashed px-3 py-1.5 text-3xs ${dim(built(ARRIVES.tailnet))}`} style={{ borderColor: 'var(--color-w4)' }}>
            <div className="text-center">
              <span className="font-semibold" style={{ color: 'var(--color-w4)' }}>
                {MACHINES.laptop.label}, off campus
              </span>
              <span className="text-muted">{COPY.tailnetPath.after}</span>
              {weekTag(ARRIVES.tailnet)}
            </div>
            <div className="mt-0.5 text-center text-muted">
              {fillCopy(COPY.tailnetNote, {
                allow: REMOTE_ADMIN.allow.map((a) => a.purpose).join(' · '),
              })}
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-dashed border-line px-3 py-1.5 text-center text-3xs text-muted">
            {COPY.footer}
          </div>
        </div>
      </div>
    </DiagramFrame>
  );
}
