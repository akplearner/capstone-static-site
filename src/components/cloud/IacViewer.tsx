'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import type { IacBundle, IacFile } from '@/lib/cloud/model';
import { CopyButton } from '@/components/step/CommandBlock';
import { downloadText } from '@/lib/download';

/**
 * The cloud capstones' template reader (R87). Tabs: the starter (the file
 * students complete, with its FILL-ME blanks), the full template, the
 * parameter files, the outputs and the deploy commands. The week filter fades
 * every resource that arrives after that week; a selected resource (clicked
 * in the diagram) is highlighted and scrolled into view.
 */

type Tab = 'starter' | 'full' | 'parameters' | 'outputs' | 'commands';

const TABS: { id: Tab; label: string }[] = [
  { id: 'starter', label: 'Starter' },
  { id: 'full', label: 'Full template' },
  { id: 'parameters', label: 'Parameters' },
  { id: 'outputs', label: 'Outputs' },
  { id: 'commands', label: 'Commands' },
];

export function IacViewer({
  iac,
  selected,
  week,
  onWeekChange,
}: {
  iac: IacBundle;
  /** A resource id to highlight (switches to the full template). */
  selected?: string | null;
  /** Fade resources that arrive after this week. Omitted = show all. */
  week?: number;
  onWeekChange?: (week: number) => void;
}) {
  const [tab, setTab] = useState<Tab>('starter');
  const [paramIdx, setParamIdx] = useState(0);
  const [lastSelected, setLastSelected] = useState(selected);
  // A new selection from the diagram opens the full template (the only view
  // with resource line ranges) — adjusted during render, not in an effect.
  if (selected !== lastSelected) {
    setLastSelected(selected);
    if (selected) setTab('full');
  }

  const range = selected ? iac.resources.find((r) => r.id === selected) : undefined;
  const file: IacFile | null =
    tab === 'starter' ? iac.starter : tab === 'full' ? iac.full : tab === 'parameters' ? iac.parameters[paramIdx] ?? null : null;

  return (
    <div className="rounded-xl border border-line bg-panel">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <div role="tablist" aria-label={`${iac.tool} files`} className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                tab === t.id ? 'bg-accent-soft text-accent-ink' : 'text-muted hover:bg-panel-2 hover:text-ink'
              }`}
            >
              {t.label}
              {t.id === 'starter' ? ` · ${iac.fillCount} blanks` : ''}
            </button>
          ))}
        </div>
        {week != null && onWeekChange && (tab === 'full' || tab === 'starter') && (
          <label className="ml-auto flex items-center gap-2 text-xs text-muted">
            Resources through week
            <select
              value={week}
              onChange={(e) => onWeekChange(Number(e.target.value))}
              className="rounded-md border border-line bg-panel px-1.5 py-0.5 text-ink"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {tab === 'parameters' && iac.parameters.length > 1 && (
        <div className="flex gap-1 border-b border-line px-3 py-1.5">
          {iac.parameters.map((p, i) => (
            <button
              key={p.name}
              type="button"
              onClick={() => setParamIdx(i)}
              className={`rounded px-2 py-0.5 font-mono text-2xs ${
                i === paramIdx ? 'bg-panel-2 text-ink' : 'text-muted hover:text-ink'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {file && (
        <>
          <div className="flex items-center gap-2 px-3 pt-2 text-xs">
            <span className="font-mono text-ink">{file.name}</span>
            {tab === 'starter' && <span className="text-muted">Replace each FILL-ME with the value its hint asks for.</span>}
            {range && tab === 'full' && (
              <span className="text-muted">
                {range.id} · <span className="font-mono">{range.type}</span> · lines {range.start}–{range.end} · week {range.week}
              </span>
            )}
            <span className="ml-auto flex items-center gap-1">
              <CopyButton text={file.text} />
              <button
                type="button"
                onClick={() => downloadText(file.name, file.text, file.lang === 'json' ? 'application/json' : 'text/yaml')}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted hover:bg-panel-2 hover:text-ink"
              >
                <Download className="h-3.5 w-3.5" aria-hidden />
                Download
              </button>
            </span>
          </div>
          <CodeLines
            text={file.text}
            highlight={tab === 'full' && range ? [range.start, range.end] : null}
            fadeAfter={tab === 'full' && week != null ? { week, resources: iac.resources } : null}
          />
        </>
      )}

      {tab === 'outputs' && (
        <dl className="divide-y divide-line px-3 py-2 text-sm">
          {iac.outputs.map((o) => (
            <div key={o.name} className="grid gap-1 py-2 sm:grid-cols-[12rem_1fr]">
              <dt className="font-mono text-xs text-ink">{o.name}</dt>
              <dd className="text-muted">{o.description}</dd>
            </div>
          ))}
        </dl>
      )}

      {tab === 'commands' && (
        <div className="space-y-3 px-3 py-3">
          <ol className="space-y-3">
            {iac.commands.map((c, i) => (
              <li key={c.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">
                    {i + 1}. {c.label}
                  </span>
                  <CopyButton text={c.cmd} />
                </div>
                <pre className="overflow-x-auto rounded-md bg-panel-2 px-3 py-2 font-mono text-xs text-ink">{c.cmd}</pre>
              </li>
            ))}
          </ol>
          {iac.notes.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
              {iac.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CodeLines({
  text,
  highlight,
  fadeAfter,
}: {
  text: string;
  highlight: [number, number] | null;
  fadeAfter: { week: number; resources: IacBundle['resources'] } | null;
}) {
  const lines = useMemo(() => text.split('\n'), [text]);
  const faded = useMemo(() => {
    const s = new Set<number>();
    if (!fadeAfter) return s;
    for (const r of fadeAfter.resources) {
      if (r.week > fadeAfter.week) for (let l = r.start; l <= r.end; l++) s.add(l);
    }
    return s;
  }, [fadeAfter]);
  const box = useRef<HTMLDivElement>(null);
  const start = highlight?.[0];

  useEffect(() => {
    if (start == null || !box.current) return;
    const row = box.current.querySelector<HTMLElement>(`[data-line="${start}"]`);
    if (row) box.current.scrollTop = row.offsetTop - 24;
  }, [start]);

  const digits = String(lines.length).length;
  return (
    <div ref={box} className="relative mt-2 max-h-[28rem] overflow-auto border-t border-line">
      <pre className="min-w-max py-2 font-mono text-xs leading-5">
        {lines.map((line, i) => {
          const n = i + 1;
          const on = highlight != null && n >= highlight[0] && n <= highlight[1];
          const fill = line.includes('FILL-ME');
          return (
            <div
              key={n}
              data-line={n}
              className={`flex pr-4 ${on ? 'bg-accent-soft' : fill ? 'bg-warn-soft' : ''} ${faded.has(n) && !on ? 'opacity-40' : ''}`}
            >
              <span
                aria-hidden
                className="sticky left-0 select-none bg-panel pl-3 pr-3 text-right text-muted"
                style={{ minWidth: `${digits + 2}ch` }}
              >
                {n}
              </span>
              <span className={fill ? 'font-semibold text-warn' : 'text-ink'}>{line || ' '}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
