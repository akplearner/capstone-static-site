import type { KitLink, KitSpec } from '@/lib/diagrams/kitSpec';
import { kitTone } from './tones';

/**
 * A zoned topology: each zone a column, devices top of the network downwards,
 * and the cabling as a list that PRINTS BOTH PORTS of every link. The port
 * list is the point — `show interfaces` output is verified against exactly
 * these names, and the CCNA `LINKS` model carried them for months with
 * nothing rendering them.
 */
export function Topology({ spec, highlight }: { spec: KitSpec; highlight?: string[] }) {
  const zones = spec.zones ?? [];
  const nodes = spec.nodes ?? [];
  const links = spec.links ?? [];
  const hi = new Set(highlight ?? []);
  const loose = nodes.filter((n) => !n.zone || !zones.some((z) => z.id === n.zone));

  return (
    <div className="min-w-[480px] space-y-3">
      <div className={`grid gap-3 ${zones.length > 1 ? 'sm:grid-cols-2' : ''}`}>
        {zones.map((z) => (
          <div key={z.id} className="rounded-lg depth-edge bg-panel p-3">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2">
              <span className="text-sm font-bold text-ink">{z.label}</span>
              {z.note && <span className="text-3xs text-muted">{z.note}</span>}
            </div>
            <div className="space-y-1">
              {nodes.filter((n) => n.zone === z.id).map((n) => (
                <div
                  key={n.id}
                  className={`rounded-md border-l-2 depth-edge bg-panel-2 px-2 py-1 ${
                    hi.has(n.id) ? 'ring-2 ring-[var(--acc,var(--color-accent))]' : ''
                  }`}
                  style={{ borderLeftColor: kitTone(n.kind) }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                    <span className="font-mono text-2xs font-bold text-ink">
                      {n.label}
                      {n.optional && <span className="ml-1 font-sans text-3xs font-normal text-muted">· optional</span>}
                    </span>
                    {n.addr && <span className="font-mono text-3xs text-muted">{n.addr}</span>}
                  </div>
                  {n.sub && <span className="block text-3xs text-muted">{n.sub}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {loose.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {loose.map((n) => (
            <span key={n.id} className="rounded-md depth-edge bg-panel-2 px-2 py-1 font-mono text-3xs text-body">
              {n.label}
              {n.addr && <span className="text-muted"> · {n.addr}</span>}
            </span>
          ))}
        </div>
      )}

      {links.length > 0 && (
        <div className="rounded-lg border border-dashed border-line px-3 py-2">
          <div className="text-3xs font-semibold uppercase tracking-wide text-muted">Cabling &amp; paths — both ends, by port</div>
          <ul className="mt-1.5 space-y-1">
            {links.map((l, i) => (
              <LinkRow key={i} link={l} />
            ))}
          </ul>
        </div>
      )}

      {spec.footer && <p className="text-3xs text-muted">{spec.footer}</p>}
    </div>
  );
}

function LinkRow({ link }: { link: KitLink }) {
  return (
    <li className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-2xs text-body">
      <span className="font-mono font-semibold text-ink">{link.from}</span>
      {link.fromPort && <PortChip label={link.fromPort} />}
      <span aria-hidden className="text-muted">
        ——
      </span>
      {link.toPort && <PortChip label={link.toPort} />}
      <span className="font-mono font-semibold text-ink">{link.to}</span>
      {link.label && <span className="text-3xs text-muted">· {link.label}</span>}
    </li>
  );
}

function PortChip({ label }: { label: string }) {
  return <span className="rounded depth-edge bg-panel-2 px-1 py-px font-mono text-3xs text-body">{label}</span>;
}
