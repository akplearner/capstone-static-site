'use client';

import { DiagramFrame } from './DiagramFrame';
import { useCourseDocument } from '@/lib/useCourse';
import { ccnaDiagramsOf, fillCopy } from '@/lib/content/read';
import type { DeviceClass } from '@/lib/ccnaTopology';

/**
 * The CCNA picture: two sites, the devices in each from the top of the network
 * down, and the VLANs their trunks carry.
 *
 * WHY ITS OWN PICTURE. `ArchitectureDiagram` draws a red/blue/grc attack lab and
 * hardcodes those role ids; `ServerTopologyDiagram` draws one rack and the three
 * bridges inside it. Neither describes a switched, routed, two-site network, and
 * a course whose whole subject is that network cannot borrow somebody else's
 * drawing.
 *
 * Every row, address and caption comes from `lib/docs/ccnaDiagrams.ts`, which
 * reads `ccnaTopology.ts`. Not one address is typed here. What this file owns is
 * the layout, the colour per device class, and the dimming — a part that arrives
 * in a later week renders faded with the week it shows up, so the picture fills
 * in as the build does instead of showing a finished network in Week 1.
 */

/** Device class → colour. The words are content; this is not. */
const TONE: Record<DeviceClass, string> = {
  router: 'var(--color-w3)',
  'l3-switch': 'var(--color-w2)',
  'l2-switch': 'var(--color-w1)',
  ap: 'var(--color-w4)',
  wlc: 'var(--color-w4)',
  firewall: 'var(--color-w8)',
  server: 'var(--color-w6)',
  workstation: 'var(--color-muted)',
};

export function CcnaTopologyDiagram({
  builtThrough,
  /** True when the team's kit has no switch that routes, from the Week-0
   *  register. The design does not change; the sentence under it does. */
  routerOnAStick,
}: {
  builtThrough?: number;
  routerOnAStick?: boolean;
} = {}) {
  const { ARRIVES, CCNA_DIAGRAM_COPY: COPY, SITE_COLUMNS, SPOKEN, TRUNK_LOAD, VLAN_ROWS } = ccnaDiagramsOf(useCourseDocument());
  const built = (week: number) => builtThrough == null || builtThrough >= week;
  const dim = (on: boolean) => (on ? '' : 'opacity-40');
  if (!SITE_COLUMNS) return null;
  const weekTag = (week: number) =>
    built(week) ? null : (
      <span className="ml-1 rounded-full depth-edge px-1 py-px font-mono text-3xs text-muted">
        Week {week}
      </span>
    );

  return (
    <DiagramFrame
      title={COPY.title}
      howToRead={COPY.howToRead}
      legend={COPY.legend.map((l) => ({
        label: l.label,
        color: TONE[l.kind as DeviceClass],
      }))}
    >
      <div className="min-w-[560px] space-y-3">
        {/* The internet, then the WAN: what is above both sites. */}
        <div className={`rounded-lg border border-dashed border-line bg-panel-2 px-3 py-1.5 text-center ${dim(built(ARRIVES.internet))}`}>
          <span className="text-xs font-semibold text-ink">{COPY.internetHeading}</span>
          {weekTag(ARRIVES.internet)}
          <span className="mt-0.5 block text-3xs text-muted">{COPY.internetNote}</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SITE_COLUMNS.map(({ site, devices }) => (
            <div key={site.id} className={`flex flex-col rounded-lg depth-edge bg-panel p-3 ${dim(built(ARRIVES.site[site.id]))}`}>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2">
                <span className="text-sm font-bold text-ink">
                  {fillCopy(COPY.siteHeading, { name: site.name })}
                  {weekTag(ARRIVES.site[site.id])}
                </span>
                <span className="text-3xs text-muted">{fillCopy(COPY.siteRooms, { rooms: site.rooms })}</span>
              </div>

              {/* The devices, top of the network downwards. */}
              <div className="space-y-1">
                {devices.map((d) => (
                  <div
                    key={d.name}
                    className={`rounded-md border-l-2 depth-edge bg-panel-2 px-2 py-1 ${dim(built(d.arrives))}`}
                    style={{ borderLeftColor: TONE[d.class] }}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                      <span className="font-mono text-2xs font-bold text-ink">
                        {d.name}
                        {d.optional && (
                          <span className="ml-1 font-sans text-3xs font-normal text-muted">· advanced</span>
                        )}
                      </span>
                      {weekTag(d.arrives)}
                    </div>
                    <span className="block text-3xs text-muted">{d.runs}</span>
                  </div>
                ))}
              </div>

              {/* What the trunks at this site carry. */}
              <div className={`mt-2 rounded-md border border-dashed border-line px-2 py-1.5 ${dim(built(ARRIVES.vlans))}`}>
                <span className="block text-3xs font-semibold uppercase tracking-wide text-muted">
                  {fillCopy(COPY.vlanStripHeading, { count: TRUNK_LOAD[site.id] })}
                  {weekTag(ARRIVES.vlans)}
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {VLAN_ROWS.filter((v) => v.site === site.id).map((v) => (
                    <span
                      key={v.id}
                      title={`${v.prefix} · gateway ${v.gateway} — ${v.purpose}`}
                      className="rounded depth-edge bg-panel px-1 py-px font-mono text-3xs text-body"
                    >
                      {v.id} {v.name}
                      {v.wireless && <span className="text-muted"> ·wifi</span>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* The link between the buildings sits under both columns, because it
            belongs to neither. */}
        <div className={`rounded-lg border border-dashed px-3 py-1.5 text-center ${dim(built(ARRIVES.wan))}`} style={{ borderColor: TONE.router }}>
          <span className="text-xs font-semibold" style={{ color: TONE.router }}>
            {COPY.wanHeading}
          </span>
          {weekTag(ARRIVES.wan)}
          <span className="mt-0.5 block text-3xs text-muted">{COPY.wanNote}</span>
        </div>

        <div className={`rounded-lg depth-edge bg-panel-2 px-3 py-1.5 text-3xs text-muted ${dim(built(ARRIVES.policy))}`}>
          <span className="font-semibold text-ink">Policy</span> — {COPY.policyNote}
          {weekTag(ARRIVES.policy)}
          <span className="mt-0.5 block">{COPY.wirelessNote}</span>
        </div>

        {routerOnAStick && (
          <div className="rounded-lg border border-warn-line bg-warn-soft px-3 py-1.5 text-3xs text-warn">
            {COPY.routerOnAStick}
          </div>
        )}

        <p className="text-center text-3xs text-muted">{COPY.footer}</p>
      </div>

      <ul className="sr-only">
        {SPOKEN.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </DiagramFrame>
  );
}
