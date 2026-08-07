'use client';

import { Terminal, Eye, ListChecks, PencilLine, Sparkles, FileDown } from 'lucide-react';

/**
 * The one universal loop every deliverable follows. Surfacing it as a scannable
 * strip (instead of a buried sentence) is the core "make it clear for students"
 * fix — they should always know the same six moves apply to every form.
 */
const STEPS = [
  { icon: Terminal, label: 'Run the tool', hint: 'nmap, sqlmap, ufw…' },
  { icon: Eye, label: 'Read the output', hint: "what actually happened" },
  { icon: ListChecks, label: 'Pull the 3 things', hint: 'see below', highlight: true },
  { icon: PencilLine, label: 'Enter in the form', hint: 'one field at a time' },
  { icon: Sparkles, label: 'Generate', hint: 'industry format' },
  { icon: FileDown, label: 'Save as PDF', hint: 'your durable proof' },
];

const THREE_THINGS = [
  { n: '1', label: 'What you found', desc: 'the result / the vulnerability' },
  { n: '2', label: 'The proof', desc: 'the command + the output / screenshot' },
  { n: '3', label: 'Why it matters', desc: 'the impact and the fix' },
];

export function WorkflowFlow() {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-sm font-semibold text-ink">
        Every deliverable follows the same flow
      </h2>
      <p className="mt-1 text-sm text-muted">
        Don&apos;t memorise eight different documents — memorise these six moves. They apply to all of them.
      </p>

      <ol className="mt-4 flex flex-wrap items-stretch gap-2">
        {STEPS.map((s, i) => (
          <li key={s.label} className="flex items-stretch gap-2">
            <div
              className={`flex w-32 flex-col rounded-lg border p-3 ${
                s.highlight
                  ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
                  : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40'
              }`}
            >
              <s.icon
                className={`h-4 w-4 ${
                  s.highlight ? 'text-blue-600 dark:text-blue-400' : 'text-muted'
                }`}
              />
              <span className="mt-1.5 text-xs font-semibold text-ink">{s.label}</span>
              <span className="mt-0.5 text-[11px] text-muted">{s.hint}</span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="hidden self-center text-gray-300 dark:text-gray-600 sm:inline" aria-hidden>
                →
              </span>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
          The 3 things to pull from every output
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {THREE_THINGS.map((t) => (
            <div key={t.n} className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white">
                {t.n}
              </span>
              <div>
                <div className="text-sm font-medium text-ink">{t.label}</div>
                <div className="text-xs text-muted">{t.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
