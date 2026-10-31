'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { LabNetworkPanel } from '@/components/diagrams/LabNetworkPanel';
import { useArchBuilt } from '@/components/course/useArchBuilt';
import { Chip, type ChipTone } from '@/components/ui/Chip';
import { useCourseDocument } from '@/lib/useCourse';
import { networkOf } from '@/lib/content/read';
import {
  ATTACK_CATALOGUE,
  catalogueUses,
  lanComponents,
  portRows,
  toolRows,
  weekTaskActions,
  type ActionKind,
  type LabNetwork,
  type LanComponent,
  type NetHost,
} from '@/lib/docs/labNetwork';
import type { Course, Member } from '@/lib/types';

/**
 * R156 — the full lab-network reference (the Network tab's body).
 *
 * Six sections, each read from the course document's network (`networkOf`), never typed here:
 *  1. the week's picture — the same `LabNetworkPanel` the Tasks tab shows, full size, with a week picker;
 *  2. the LAN map — an HTML layout (it reflows on a phone, unlike the SVG): the hypervisor, its adapter
 *     (the gateway), the segment, each VM with OS, adapter, address and ports, and the Docker engine
 *     nested inside the host that runs it, with the container's bridge address and published port;
 *  3. every component in a table; 4. every port, with whether the LAN can reach it and what is behind it;
 *  5. the tools on each host and the task that uses each; 6. the attack catalogue in exam vocabulary;
 *  7. what every task of the week does on the network (attacks and controls through `builtBy`, the rest
 *     through the week's `actions`), each line placed on the components it touches.
 * Prose comes from `net.copy.reference`; this file holds labels only (R75-B).
 */
const ACTION_TONE: Record<ActionKind, ChipTone> = { setup: 'neutral', attack: 'warn', control: 'info', evidence: 'ok', governance: 'muted' };
const ACTION_LABEL: Record<ActionKind, string> = { setup: 'set-up', attack: 'attack', control: 'control', evidence: 'evidence', governance: 'governance' };

const TH = 'px-3 py-2';
const TD = 'px-3 py-2 align-top';

function roleTone(role?: string): ChipTone {
  return role === 'red' ? 'warn' : role === 'blue' ? 'info' : role ? 'accent' : 'muted';
}

function Table({ columns, children, hook }: { columns: string[]; children: React.ReactNode; hook: string }) {
  return (
    <div className="overflow-x-auto rounded-lg depth-edge" data-lan-table={hook}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
            {columns.map((c) => (
              <th key={c} scope="col" className={TH}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`lan-${id}`} className="space-y-3" data-lan-section={id}>
      <div>
        <h2 id={`lan-${id}`} className="text-base font-semibold text-ink">{title}</h2>
        {intro && <p className="mt-0.5 text-sm text-muted">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

/** One VM card on the map: what it is, where it sits, what it exposes, and the Docker engine inside it. */
function HostCard({ h, net }: { h: NetHost; net: LabNetwork }) {
  const lan = h.services.filter((s) => (s.scope ?? 'lan') === 'lan');
  const internal = h.services.filter((s) => s.scope === 'internal');
  return (
    <div className={`rounded-lg border bg-panel p-3 ${h.role === 'red' ? 'border-danger-line' : 'border-line'}`} data-lan-host={h.id}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div>
          <span className="font-semibold text-ink">{h.label}</span>
          {h.optional && <span className="ml-2 text-2xs uppercase tracking-wide text-muted">optional</span>}
        </div>
        {h.addr && <span className="font-mono text-xs text-body">{h.addr}</span>}
      </div>
      <p className="mt-0.5 text-xs text-muted">
        {[h.os, h.nic, h.role ? `${roleName(h.role)} operates it` : undefined].filter(Boolean).join(' · ')}
      </p>
      <p className="mt-1 text-sm text-body">{h.description}</p>
      {(lan.length > 0 || internal.length > 0) && (
        <ul className="mt-2 space-y-0.5 text-xs" aria-label={`${h.label} ports`}>
          {lan.map((s) => (
            <li key={`${s.port}/${s.proto}`} className="font-mono text-body" data-lan-port={s.port}>
              {s.port}/{s.proto} <span className="font-sans">{s.name}</span>
            </li>
          ))}
          {internal.map((s) => (
            <li key={`${s.port}/${s.proto}`} className="font-mono text-muted" data-lan-port={s.port} data-lan-internal>
              {s.port}/{s.proto} <span className="font-sans">{s.name} · internal only</span>
            </li>
          ))}
        </ul>
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
      <span className="sr-only">{net.subnet}</span>
    </div>
  );
}

const ROLE_NAME: Record<string, string> = { red: 'Red', blue: 'Blue', grc: 'GRC' };
const roleName = (r: string) => ROLE_NAME[r] ?? r;

export function LabNetworkReference({ course, member }: { course: Course; member: Member | null }) {
  const net = networkOf(useCourseDocument());
  const built = useArchBuilt(course, member);
  const params = useSearchParams();
  const weeks = net.weeks.map((w) => w.week);
  const asked = Number(params?.get('week'));
  const [week, setWeek] = useState<number>(weeks.includes(asked) ? asked : weeks.includes(1) ? 1 : weeks[0] ?? 0);
  if (!net.hosts.length) return null;

  const components = lanComponents(net);
  const nameOf = (id: string) => components.find((c) => c.id === id)?.label ?? id;
  const ports = portRows(net);
  const tools = toolRows(net);
  const taskById = new Map(course.tasks.map((t) => [t.id, t] as const));
  const titleOfKey = (key: string) => {
    const [tid, sid] = key.split('::');
    const t = taskById.get(tid);
    if (!t) return key;
    const step = sid ? t.steps.find((s) => s.id === sid) : undefined;
    return step ? `${t.title} — ${step.title}` : t.title;
  };
  const weekTasks = course.tasks.filter((t) => t.week === week).map((t) => ({ id: t.id, role: t.role }));
  const actions = weekTaskActions(net, week, weekTasks);
  const wk = net.weeks.find((w) => w.week === week);
  const ref = net.copy.reference;
  const whoRuns = (c: LanComponent) => (c.kind === 'hypervisor' || c.kind === 'adapter' ? 'Everyone' : c.role ? roleName(c.role) : '—');

  return (
    <div className="space-y-10" data-lan-reference>
      {/* 1. The week's picture, full size */}
      <Section id="picture" title={`Week ${week}${wk ? ` — ${wk.wire}` : ''}`} intro={wk?.focus}>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Week">
          {weeks.map((w) => (
            <Chip key={w} as="button" tone={w === week ? 'accent' : 'link'} aria-pressed={w === week} onClick={() => setWeek(w)} data-lan-week-pick={w}>
              W{w}
            </Chip>
          ))}
        </div>
        <LabNetworkPanel week={week} built={built} />
      </Section>

      {/* 2. The LAN map */}
      <Section id="map" title="The LAN" intro={ref?.lan}>
        <div className="rounded-xl border border-line bg-panel-2 p-3 sm:p-4" data-lan-map>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <div>
              <span className="font-semibold text-ink">{net.fabric.hypervisor.label}</span>
              {net.fabric.hypervisor.os && <span className="ml-2 text-xs text-muted">{net.fabric.hypervisor.os}</span>}
            </div>
            <span className="text-xs text-muted">{net.fabric.hypervisor.description}</span>
          </div>
          {net.fabric.adapter && (
            <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-md border border-line bg-panel px-3 py-2 text-sm" data-lan-adapter>
              <span className="font-medium text-ink">{net.fabric.adapter.label}</span>
              <span className="font-mono text-xs text-body">{net.fabric.adapter.addr}</span>
              <span className="text-xs text-muted">{net.fabric.adapter.description}</span>
            </div>
          )}
          <div className="mt-3 border-l-2 border-dashed border-line pl-3 sm:pl-4" data-lan-segment>
            <p className="text-xs font-semibold text-muted">
              {net.fabric.segment.label} <span className="ml-1 font-mono font-normal">{net.subnet}</span>
            </p>
            <div className="mt-2 grid gap-3 lg:grid-cols-3">
              {net.hosts.map((h) => (
                <HostCard key={h.id} h={h} net={net} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Components */}
      <Section id="components" title="Components and addresses">
        <Table hook="components" columns={['Component', 'Address', 'Runs', 'Who', 'Purpose']}>
          {components.map((c) => (
            <tr key={c.id} className="border-b border-line last:border-0" data-lan-component={c.id}>
              <td className={`${TD} font-medium text-ink`}>
                {c.label}
                {c.on && <span className="block text-2xs font-normal text-muted">on {nameOf(c.on)}</span>}
                {c.optional && <span className="block text-2xs font-normal uppercase tracking-wide text-muted">optional</span>}
              </td>
              <td className={`${TD} font-mono text-xs text-body`}>{c.addr ?? '—'}</td>
              <td className={`${TD} text-body`}>{c.os ?? '—'}</td>
              <td className={`${TD} text-body`}>{whoRuns(c)}</td>
              <td className={`${TD} text-muted`}>{c.description}</td>
            </tr>
          ))}
        </Table>
      </Section>

      {/* 4. Ports */}
      <Section id="ports" title="Apps and ports" intro={ref?.ports}>
        <Table hook="ports" columns={['Host', 'Port', 'App', 'Reach', 'Behind', 'Since']}>
          {ports.map((r) => (
            <tr key={`${r.hostId}-${r.port}-${r.proto}`} className="border-b border-line last:border-0" data-lan-port-row={`${r.hostId}:${r.port}`}>
              <td className={`${TD} font-medium text-ink`}>{r.host}</td>
              <td className={`${TD} font-mono text-xs text-body`}>{r.port}/{r.proto}</td>
              <td className={`${TD} text-body`}>
                {r.name}
                <span className="hidden text-2xs text-muted md:block">{r.description}</span>
              </td>
              <td className={TD}>
                <Chip tone={r.scope === 'lan' ? 'ok' : 'muted'}>{r.scope === 'lan' ? 'LAN' : 'internal'}</Chip>
              </td>
              <td className={`${TD} font-mono text-xs text-body`}>{r.behind ?? '—'}</td>
              <td className={`${TD} text-body`}>W{r.from}</td>
            </tr>
          ))}
        </Table>
      </Section>

      {/* 5. Tools */}
      <Section id="tools" title="Tools, by host" intro={ref?.tools}>
        <Table hook="tools" columns={['Host', 'Tool', 'Purpose', 'Used in']}>
          {tools.map(({ hostId, host, tool }) => (
            <tr key={`${hostId}-${tool.name}`} className="border-b border-line last:border-0" data-lan-tool={tool.name}>
              <td className={`${TD} font-medium text-ink`}>{host}</td>
              <td className={`${TD} font-mono text-xs text-body`}>{tool.name}</td>
              <td className={`${TD} text-body`}>{tool.purpose}</td>
              <td className={`${TD} text-xs text-muted`}>
                {(tool.usedIn ?? []).map((k) => (
                  <span key={k} className="block">{titleOfKey(k)}</span>
                ))}
              </td>
            </tr>
          ))}
        </Table>
      </Section>

      {/* 6. Attack catalogue */}
      <Section id="attacks" title="Types of attack" intro={ref?.attacks}>
        <div className="grid gap-3 md:grid-cols-2">
          {ATTACK_CATALOGUE.map((e) => {
            const uses = catalogueUses(net, e.kind);
            return (
              <article key={e.kind} className="rounded-lg border border-line bg-panel p-3" data-lan-attack-kind={e.kind}>
                <h3 className="font-semibold text-ink">{e.label}</h3>
                <p className="text-2xs uppercase tracking-wide text-muted">{e.domain}</p>
                <p className="mt-1 text-sm text-body">{e.definition}</p>
                <p className="mt-1 text-sm text-body">
                  <span className="font-medium text-info">Blue: </span>
                  {e.answer}
                </p>
                <p className="mt-1.5 text-xs text-muted" data-lan-attack-uses>
                  {uses.length
                    ? uses.map((u) => `W${u.week} #${u.n} → ${nameOf(u.to)}${u.port ? `:${u.port}` : ''}`).join(' · ')
                    : 'Not used in this lab'}
                </p>
              </article>
            );
          })}
        </div>
      </Section>

      {/* 7. Actions on tasks, this week */}
      <Section id="actions" title={`What each task does on the network — week ${week}`} intro={ref?.actions}>
        {actions.length === 0 ? (
          <p className="text-sm text-muted" data-lan-no-tasks>No tasks this week.</p>
        ) : (
          <div className="space-y-3">
            {actions.map((t) => {
              const task = taskById.get(t.taskId);
              return (
                <article key={t.taskId} className="rounded-lg border border-line bg-panel p-3" data-lan-task={t.taskId}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip tone={roleTone(task?.role ?? t.role)}>{roleName(task?.role ?? t.role ?? '')}</Chip>
                    <h3 className="font-semibold text-ink">{task?.title ?? t.taskId}</h3>
                  </div>
                  {t.lines.length === 0 ? (
                    <p className="mt-1.5 text-sm text-muted" data-lan-task-off>Off the network this week.</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {t.lines.map((l, i) => (
                        <li key={i} className="flex flex-wrap items-start gap-2 text-sm" data-lan-action={l.kind}>
                          <Chip tone={ACTION_TONE[l.kind]}>{ACTION_LABEL[l.kind]}</Chip>
                          <span className="min-w-0 flex-1 text-body">
                            {l.text}
                            <span className="block text-2xs text-muted">{l.at.length ? `at ${l.at.map(nameOf).join(', ')}` : 'whole lab'}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </Section>

      <p className="text-3xs text-muted">{net.copy.footer}</p>
    </div>
  );
}
