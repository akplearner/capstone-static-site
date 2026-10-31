'use client';

import { useId } from 'react';
import { useCourseDocument } from '@/lib/useCourse';
import { networkOf } from '@/lib/content/read';
import { useReducedMotionSafe } from '@/lib/useReducedMotionSafe';
import { attackSteps, controlsAt, serviceId, servicesAt, type ComponentKind, type ControlKind, type NetHost, type Phase } from '@/lib/docs/labNetwork';

/**
 * R152/R153 — the lab network as a picture (Security+ today, any course with a network tomorrow).
 *
 * Pure and controlled: the panel owns the week, the Before|After phase, the attack step and the clicked
 * component; this draws them. Each host is a card of its open ports and the controls on it at (week,
 * phase); the week's attacks are numbered Kali→target arrows, the current one lit, each with the Blue
 * response beside its control; a self-test is a badge on the host. Hosts, ports and controls are
 * keyboard-and-pointer selectable (`onSelect`) so the panel can show a description — the picture stays
 * clean until asked. Colours are tokens only — attacks `--color-danger`, Blue responses `--color-info`,
 * controls by kind. No reserved `data-*`; the aria-label never contains "week N". R156: a port that only
 * answers inside its host or container (`scope: 'internal'`) is drawn muted and marked, so the picture never
 * claims the LAN sees it.
 */
const CTRL_COLOR: Record<ControlKind, string> = {
  harden: 'var(--color-ok)',
  detect: 'var(--color-info)',
  contain: 'var(--color-danger)',
  recover: 'var(--color-w1)',
};
const CARD_W = 200;
const HEAD = 42;
const ROW = 17;

function cardHeight(nServices: number, nControls: number): number {
  return HEAD + (nServices + nControls) * ROW + 12;
}

export function LabNetworkDiagram({
  week,
  phase,
  step,
  built,
  selected,
  onSelect,
  compact = false,
}: {
  week: number;
  phase: Phase;
  /** The 1-based attack step currently lit (0 = none). */
  step: number;
  built?: Record<string, number>;
  selected?: { kind: ComponentKind; id: string } | null;
  onSelect?: (kind: ComponentKind, id: string) => void;
  /** Thumbnail: cap height, drop the spec table and footer. */
  compact?: boolean;
}) {
  const net = networkOf(useCourseDocument());
  const mid = useId().replace(/:/g, '');
  const reduce = useReducedMotionSafe();
  if (!net.hosts.length) return null;

  const steps = attackSteps(net, week);
  const at = new Map(net.hosts.map((h) => [h.id, h] as const));
  const lit = (id: string) => (built ? built[id] ?? undefined : undefined);
  const isSel = (kind: ComponentKind, id: string) => selected?.kind === kind && selected?.id === id;
  // A keyboard-and-pointer handler for an SVG element acting as a button.
  const pick = (kind: ComponentKind, id: string, label: string) => ({
    role: 'button' as const,
    tabIndex: 0,
    'aria-label': label,
    style: { cursor: onSelect ? 'pointer' : 'default' },
    onClick: () => onSelect?.(kind, id),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onSelect(kind, id);
      }
    },
  });

  const rightOf = (h: NetHost) => ({ x: h.x + CARD_W / 2, y: h.y + HEAD / 2 });
  const leftOf = (h: NetHost) => ({ x: h.x - CARD_W / 2, y: h.y + HEAD / 2 });
  const realAttacks = steps.filter((s) => !s.selfTest);

  return (
    <figure className="min-w-0" data-net-root>
      <p className="mb-1 text-sm font-semibold text-ink">{net.copy.title}</p>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${net.view.w} ${net.view.h}`}
          preserveAspectRatio="xMidYMid meet"
          className={`h-auto w-full min-w-0 sm:min-w-[640px] ${compact ? 'max-h-60' : 'lg:max-h-[30rem]'}`}
          role="img"
          aria-label={`${net.copy.title} — run ${week}, ${phase}`}
          data-net-phase={phase}
          data-net-week={week}
          data-net-step={step}
        >
          <defs>
            <marker id={`${mid}-atk`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0 10 5 0 10z" fill="var(--color-danger)" />
            </marker>
          </defs>

          <line x1={40} y1={net.fabric.segment.y - 6} x2={net.view.w - 40} y2={net.fabric.segment.y - 6} stroke="var(--color-line)" strokeWidth={1.2} strokeDasharray="6 4" />
          <text x={48} y={net.fabric.segment.y - 12} fontSize="10.5" fontWeight="700" style={{ fill: 'var(--color-muted)' }}>{net.fabric.segment.label}</text>
          <text x={net.view.w - 48} y={net.fabric.segment.y - 12} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" style={{ fill: 'var(--color-muted)' }}>{net.fabric.segment.note}</text>

          {(() => {
            const h = net.fabric.hypervisor;
            return (
              <g data-net-host={h.id} {...pick('host', h.id, `${h.label}: ${h.description}`)}>
                <rect x={h.x - CARD_W / 2} y={h.y} width={CARD_W} height={HEAD} rx={8} fill="var(--color-panel-2)" stroke={isSel('host', h.id) ? 'var(--color-accent)' : 'var(--color-line)'} strokeWidth={isSel('host', h.id) ? 2 : 1.2} />
                <text x={h.x} y={h.y + 18} textAnchor="middle" fontSize="11" fontWeight="700" style={{ fill: 'var(--color-ink)' }}>{h.label}</text>
                <text x={h.x} y={h.y + 32} textAnchor="middle" fontSize="8" style={{ fill: 'var(--color-muted)' }}>VirtualBox · VMware · UTM</text>
              </g>
            );
          })()}

          {realAttacks.map((a) => {
            const from = at.get(a.from);
            const to = at.get(a.to);
            if (!from || !to) return null;
            const p1 = rightOf(from);
            const p2 = leftOf(to);
            const idx = realAttacks.indexOf(a);
            const dy = (idx - (realAttacks.length - 1) / 2) * 26;
            const y1 = p1.y + dy;
            const y2 = p2.y + dy;
            const on = a.n === step;
            const v = lit(`atk:w${week}:${a.n}`);
            const mxx = (p1.x + p2.x) / 2;
            const myy = (y1 + y2) / 2;
            return (
              <g key={a.n} data-net-attack={a.n} data-net-attack-on={on ? 'true' : undefined} data-net-built={v !== undefined && v >= 1 ? 'true' : undefined} opacity={on ? 1 : 0.4} pointerEvents="none">
                <line x1={p1.x} y1={y1} x2={p2.x - 3} y2={y2} stroke="var(--color-danger)" strokeWidth={on ? 2.4 : 1.6} strokeDasharray="6 3" className={reduce ? undefined : 'qa-dash'} markerEnd={`url(#${mid}-atk)`} />
                <circle cx={mxx} cy={myy} r={10} fill={v !== undefined && v >= 1 ? 'var(--color-danger)' : 'var(--color-panel)'} stroke="var(--color-danger)" strokeWidth={1.6} />
                <text x={mxx} y={myy + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" style={{ fill: v !== undefined && v >= 1 ? 'var(--color-panel)' : 'var(--color-danger)' }}>{a.n}</text>
              </g>
            );
          })}

          {net.hosts.map((h) => {
            const svc = servicesAt(h, week, phase);
            const ctl = controlsAt(h, week, phase);
            const height = cardHeight(svc.length, ctl.length);
            const selfTest = steps.find((a) => a.selfTest && a.to === h.id);
            const selfOn = steps.find((a) => a.selfTest && a.to === h.id && a.n === step);
            return (
              <g key={h.id} data-net-host={h.id} data-net-role={h.role}>
                <rect x={h.x - CARD_W / 2} y={h.y} width={CARD_W} height={height} rx={10} fill="var(--color-panel)" stroke={isSel('host', h.id) ? 'var(--color-accent)' : h.role === 'red' ? 'var(--color-danger)' : 'var(--color-w2)'} strokeWidth={isSel('host', h.id) ? 2.4 : 1.4} strokeDasharray={h.optional ? '5 3' : undefined} />
                <g {...pick('host', h.id, `${h.label}: ${h.description}`)}>
                  <rect x={h.x - CARD_W / 2} y={h.y} width={CARD_W} height={HEAD} rx={10} fill="transparent" />
                  <text x={h.x} y={h.y + 17} textAnchor="middle" fontSize="11" fontWeight="700" style={{ fill: 'var(--color-ink)' }}>{h.label}</text>
                  {h.addr && <text x={h.x} y={h.y + 31} textAnchor="middle" fontSize="8.5" fontFamily="var(--font-mono)" style={{ fill: 'var(--color-muted)' }}>{h.addr}</text>}
                </g>
                {svc.map((s, i) => {
                  const y = h.y + HEAD + i * ROW;
                  return (
                    <g key={`s${s.port}`} data-net-service={s.port} {...pick('service', serviceId(h.id, s.port), `${s.port}/${s.proto} ${s.name}: ${s.description}`)}>
                      <rect x={h.x - CARD_W / 2 + 6} y={y - 9} width={CARD_W - 12} height={ROW - 2} rx={4} fill={isSel('service', serviceId(h.id, s.port)) ? 'var(--color-accent-soft)' : 'transparent'} />
                      <text x={h.x - CARD_W / 2 + 12} y={y + 4} fontSize="9" fontFamily="var(--font-mono)" style={{ fill: s.scope === 'internal' ? 'var(--color-muted)' : 'var(--color-body)' }} data-net-scope={s.scope ?? 'lan'}>{`${s.port}/${s.proto} ${s.name}${s.scope === 'internal' ? ' · internal' : ''}`}</text>
                    </g>
                  );
                })}
                {ctl.map((c, i) => {
                  const v = lit(c.id);
                  const y = h.y + HEAD + (svc.length + i) * ROW;
                  return (
                    <g key={c.id} data-net-control={c.id} data-net-control-kind={c.kind} data-net-built={v !== undefined && v >= 1 ? 'true' : undefined} {...pick('control', c.id, `${c.label}: ${c.description}`)}>
                      <rect x={h.x - CARD_W / 2 + 6} y={y - 9} width={CARD_W - 12} height={ROW - 2} rx={4} fill={isSel('control', c.id) ? 'var(--color-accent-soft)' : 'transparent'} />
                      <circle cx={h.x - CARD_W / 2 + 14} cy={y - 2} r={4} fill={CTRL_COLOR[c.kind]} opacity={v === undefined || v >= 1 ? 1 : 0.4} />
                      <text x={h.x - CARD_W / 2 + 24} y={y + 4} fontSize="9" style={{ fill: 'var(--color-body)' }}>{c.label}{v !== undefined && v >= 1 ? ' ✓' : ''}</text>
                    </g>
                  );
                })}
                {selfTest && (
                  <g data-net-selftest={h.id} opacity={selfOn ? 1 : 0.5} pointerEvents="none">
                    <rect x={h.x - CARD_W / 2} y={h.y + height + 4} width={CARD_W} height={18} rx={6} fill="var(--color-info-soft)" stroke="var(--color-info)" strokeWidth={1} />
                    <text x={h.x} y={h.y + height + 16} textAnchor="middle" fontSize="8.5" style={{ fill: 'var(--color-info)' }}>Blue’s own test logons (4625)</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-danger)' }} />attack</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-info)' }} />Blue response / detection</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-ok)' }} />hardening</span>
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: 'var(--color-w1)' }} />recovery</span>
      </div>

      {!compact && (
        <>
          <table className="mt-2 w-full text-left text-2xs text-muted" data-net-spec>
            <thead><tr>{net.spec.columns.map((c) => <th key={c} className="pr-3 font-semibold text-ink">{c}</th>)}</tr></thead>
            <tbody>{net.spec.rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j} className="pr-3 align-top">{cell}</td>)}</tr>)}</tbody>
          </table>
          <p className="mt-2 text-3xs text-muted">{net.copy.footer}</p>
        </>
      )}
    </figure>
  );
}
