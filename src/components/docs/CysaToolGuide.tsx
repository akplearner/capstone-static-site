'use client';

import { ExternalLink, LayoutDashboard, Network, MonitorCheck } from 'lucide-react';
import type { ToolPanel } from '@/lib/docs/cysaContent';
import { useCourseDocument } from '@/lib/useCourse';
import { cysaOf } from '@/lib/content/read';

/**
 * CySA+ "how to actually use the tools" reference.
 *
 * The step-by-step commands live in each week's task; this is the one place that
 * explains the tools as components — what they are, how they're configured,
 * where their data shows up in the Wazuh dashboard, and the exact searches and
 * event IDs students reuse all course. Every panel links out to the official
 * documentation.
 *
 * All of that is content, and it now lives in `lib/docs/cysaContent.ts`. What is
 * left here is the rendering: three cards, two tables, and the one thing a data
 * file cannot hold — the glyph each panel is drawn with.
 */

const ICON: Record<ToolPanel['icon'], typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  network: Network,
  monitor: MonitorCheck,
};

export function CysaToolGuide() {
  const { DASHBOARD_HOWTO, FILTER_FIELDS, SIGNATURES, TOOL_GUIDE_COPY: COPY, TOOL_PANELS } = cysaOf(useCourseDocument());
  if (!TOOL_PANELS) return null;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        {COPY.intro}
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        {TOOL_PANELS.map((p) => {
          const Icon = ICON[p.icon];
          return (
            <div key={p.name} className="flex flex-col rounded-lg depth-edge bg-panel p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <Icon className="h-4 w-4 text-accent" /> {p.name}
                </h3>
                <span className="text-2xs text-muted">{p.where}</span>
              </div>

              <p className="mt-2 text-sm text-muted">{p.what}</p>

              <div className="mt-3 text-xs font-semibold text-muted">{COPY.configLabel}</div>
              <p className="mt-1 text-sm text-muted">{p.config}</p>

              <div className="mt-3 text-xs font-semibold text-muted">{p.rowsTitle}</div>
              <ul className="mt-1 space-y-1.5">
                {p.rows.map((r) => (
                  <li key={r.k} className="text-sm">
                    <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-xs text-ink">
                      {r.k}
                    </code>
                    <span className="mt-0.5 block text-muted">{r.v}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 text-xs font-semibold text-muted">{COPY.docsLabel}</div>
              <ul className="mt-1 space-y-1">
                {p.refs.map((ref) => (
                  <li key={ref.href}>
                    <a
                      href={ref.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                    >
                      {ref.label} <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg depth-edge bg-panel p-4">
        <h3 className="text-sm font-semibold text-ink">{COPY.signaturesTitle}</h3>
        <p className="mt-1 text-sm text-muted">
          In Security events, type a <code className="rounded bg-panel-2 px-1 font-mono text-xs">field:value</code>{' '}
          query in the search bar. Start with <code className="rounded bg-panel-2 px-1 font-mono text-xs">rule.level:&gt;=7</code>{' '}
          to cut the noise, then match the shape of the attack:
        </p>
        <div className="mt-3 overflow-x-auto rounded-lg depth-edge">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                {COPY.signaturesColumns.map((c) => (
                  <th key={c} scope="col" className="px-3 py-2">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SIGNATURES.map((s) => (
                <tr key={s.behaviour} className="border-b border-line/60 last:border-0">
                  <td className="px-3 py-2 font-medium text-ink">{s.behaviour}</td>
                  <td className="px-3 py-2">
                    <code className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-xs text-ink">
                      {s.query}
                    </code>
                  </td>
                  <td className="px-3 py-2 text-muted">{s.tell}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          <span className="font-semibold">{COPY.filterFieldsLabel}</span>{' '}
          <code className="rounded bg-panel-2 px-1 font-mono text-2xs text-body">{FILTER_FIELDS}</code>
        </p>
      </div>

      <div className="rounded-lg depth-edge bg-panel p-4">
        <h3 className="text-sm font-semibold text-ink">{COPY.howToTitle}</h3>
        <p className="mt-1 text-sm text-muted">{COPY.howToIntro}</p>
        <div className="mt-3 overflow-x-auto rounded-lg depth-edge">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                {COPY.howToColumns.map((c) => (
                  <th key={c} scope="col" className="px-3 py-2">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DASHBOARD_HOWTO.map((h) => (
                <tr key={h.action} className="border-b border-line/60 last:border-0">
                  <td className="px-3 py-2 font-medium text-ink">{h.action}</td>
                  <td className="px-3 py-2 text-muted">{h.how}</td>
                  <td className="px-3 py-2">
                    {h.ref && (
                      <a
                        href={h.ref.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                      >
                        {h.ref.label} <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
