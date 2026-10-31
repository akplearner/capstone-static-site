'use client';

import { Chip } from '@/components/ui/Chip';
import { allHosts, segmentTree, type LabNetwork, type NetHost, type NetSegment } from '@/lib/docs/labNetwork';

/**
 * R156/R157 — the LAN as an HTML map that reflows on a phone: what everything runs under (the hypervisor,
 * the cloud account, the simulator) with its adapter, then every segment in tree order — nested when a
 * segment sits inside another — with the hosts on it, each a card of OS, address, ports, apps, forwarded
 * ports and the Docker engine inside it. Hosts on no segment follow in their own band. Everything is read
 * from the network; this file holds labels only.
 */
const ROLE_NAME: Record<string, string> = { red: 'Red', blue: 'Blue', grc: 'GRC' };
const roleName = (r: string) => ROLE_NAME[r] ?? r;

/** One host card: what it is, where it sits, what it exposes, and the Docker engine inside it. */
export function HostCard({ h, net }: { h: NetHost; net: LabNetwork }) {
  const lan = h.services.filter((s) => (s.scope ?? 'lan') === 'lan');
  const quiet = h.services.filter((s) => s.scope === 'internal' || s.scope === 'segment');
  const nameOf = (id: string) => allHosts(net).find((x) => x.id === id)?.label ?? id;
  const meta = [h.os, h.nic, h.role ? `${roleName(h.role)} operates it` : undefined, h.arrives ? `from week ${h.arrives}` : undefined].filter(Boolean).join(' · ');
  return (
    <div className={`rounded-lg border bg-panel p-3 ${h.role === 'red' || h.kind === 'attacker' ? 'border-danger-line' : 'border-line'} ${h.external ? 'border-dashed' : ''}`} data-lan-host={h.id}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div>
          <span className="font-semibold text-ink">{h.label}</span>
          {h.optional && <span className="ml-2 text-2xs uppercase tracking-wide text-muted">optional</span>}
          {h.external && <span className="ml-2 text-2xs uppercase tracking-wide text-muted">outside</span>}
        </div>
        {h.addr && <span className="font-mono text-xs text-body">{h.addr}</span>}
      </div>
      {meta && <p className="mt-0.5 text-xs text-muted">{meta}</p>}
      <p className="mt-1 text-sm text-body">{h.description}</p>
      {(lan.length > 0 || quiet.length > 0) && (
        <ul className="mt-2 space-y-0.5 text-xs" aria-label={`${h.label} ports`}>
          {lan.map((s) => (
            <li key={`${s.port}/${s.proto}`} className="font-mono text-body" data-lan-port={s.port}>
              {s.port}/{s.proto} <span className="font-sans">{s.name}</span>
            </li>
          ))}
          {quiet.map((s) => (
            <li key={`${s.port}/${s.proto}`} className="font-mono text-muted" data-lan-port={s.port} data-lan-internal={s.scope === 'internal' ? '' : undefined} data-lan-via={s.via}>
              {s.port}/{s.proto} <span className="font-sans">{s.name} · {s.scope === 'internal' ? 'internal only' : `from ${s.via ?? 'one segment'} only`}</span>
            </li>
          ))}
        </ul>
      )}
      {h.apps && h.apps.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" data-lan-apps>
          {h.apps.map((a) => (
            <Chip key={a} tone="neutral">{a}</Chip>
          ))}
        </div>
      )}
      {h.publishes && h.publishes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5" data-lan-publishes>
          {h.publishes.map((p) => (
            <Chip key={`${p.host}-${p.to}-${p.port}`} tone="accent" className="font-mono" data-lan-publish>
              :{p.host} → {nameOf(p.to)}:{p.port}/{p.proto}
            </Chip>
          ))}
        </div>
      )}
      {h.docker && (
        <div className="mt-3 rounded-md border border-dashed border-line bg-panel-2 p-2.5" data-lan-docker={h.id}>
          <p className="text-xs font-semibold text-ink">
            Docker <span className="ml-1 font-mono font-normal text-muted">{h.docker.bridge} · {h.docker.subnet}</span>
          </p>
          {h.docker.containers.map((c) => (
            <div key={c.id} className="mt-2 rounded-md border border-line bg-panel p-2" data-lan-container={c.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-sm font-medium text-ink">{c.label}</span>
                {c.addr && <span className="font-mono text-xs text-body">{c.addr}</span>}
              </div>
              <p className="font-mono text-2xs text-muted">{c.image}</p>
              <p className="mt-1 text-xs text-body">{c.description}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {c.ports.map((p) => (
                  <Chip key={`${p.host}-${p.container}`} tone="accent" className="font-mono" data-lan-portmap>
                    {h.addr ? `${h.addr}:` : ''}{p.host} → {c.label.split(' ')[0]}:{p.container}/{p.proto}
                  </Chip>
                ))}
                {c.apps.map((a) => (
                  <Chip key={a} tone="neutral">{a}</Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SegmentBand({ seg, depth, hosts, net }: { seg?: NetSegment; depth: number; hosts: NetHost[]; net: LabNetwork }) {
  return (
    <div className={`border-l-2 border-dashed border-line ${depth > 0 ? 'ml-2 sm:ml-4' : ''} pl-3 sm:pl-4`} data-lan-segment={seg?.id ?? 'unplaced'} data-lan-depth={depth}>
      <p className="text-xs font-semibold text-muted">
        {seg ? seg.label : 'Not on a segment'}
        {seg?.note && <span className="ml-1 font-mono font-normal">{seg.note}</span>}
        {seg?.kind && <span className="ml-2 font-normal uppercase tracking-wide text-3xs">{seg.kind}</span>}
      </p>
      {hosts.length > 0 && (
        <div className="mt-2 grid gap-3 lg:grid-cols-3">
          {hosts.map((h) => (
            <HostCard key={h.id} h={h} net={net} />
          ))}
        </div>
      )}
    </div>
  );
}

export function LanMap({ net }: { net: LabNetwork }) {
  const hv = net.fabric.hypervisor;
  const { branches, unplaced } = segmentTree(net);
  return (
    <div className="rounded-xl border border-line bg-panel-2 p-3 sm:p-4" data-lan-map>
      {hv && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1" data-lan-hypervisor={hv.id}>
          <div>
            <span className="font-semibold text-ink">{hv.label}</span>
            {hv.os && <span className="ml-2 text-xs text-muted">{hv.os}</span>}
            {hv.addr && <span className="ml-2 font-mono text-xs text-body">{hv.addr}</span>}
          </div>
          <span className="text-xs text-muted">{hv.description}</span>
          {(hv.services.length > 0 || (hv.publishes?.length ?? 0) > 0 || hv.controls.length > 0) && (
            <div className="flex w-full flex-wrap items-center gap-1.5 pt-1">
              {hv.services.map((s) => (
                <Chip key={`${s.port}/${s.proto}`} tone="neutral" className="font-mono" data-lan-port={s.port}>:{s.port} {s.name}</Chip>
              ))}
              {hv.publishes?.map((p) => (
                <Chip key={`${p.host}-${p.to}-${p.port}`} tone="accent" className="font-mono" data-lan-publish>
                  :{p.host} → {allHosts(net).find((x) => x.id === p.to)?.label ?? p.to}:{p.port}/{p.proto}
                </Chip>
              ))}
              {hv.controls.map((c) => (
                <Chip key={c.id} tone="info" data-lan-control={c.id}>{c.label}</Chip>
              ))}
            </div>
          )}
        </div>
      )}
      {net.fabric.adapter && (
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-md border border-line bg-panel px-3 py-2 text-sm" data-lan-adapter>
          <span className="font-medium text-ink">{net.fabric.adapter.label}</span>
          <span className="font-mono text-xs text-body">{net.fabric.adapter.addr}</span>
          <span className="text-xs text-muted">{net.fabric.adapter.description}</span>
        </div>
      )}
      <div className={`space-y-3 ${hv || net.fabric.adapter ? 'mt-3' : ''}`}>
        {branches.map((b) => (
          <SegmentBand key={b.seg.id} seg={b.seg} depth={b.depth} hosts={b.hosts} net={net} />
        ))}
        {unplaced.length > 0 && <SegmentBand depth={0} hosts={unplaced} net={net} />}
      </div>
    </div>
  );
}
