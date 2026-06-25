'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Circle, FileSpreadsheet, FileText, Info, Printer, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { FrameworkBadge } from '@/components/TaskComponents';
import { InfoTip } from '@/components/InfoTip';
import { Collapsible } from '@/components/ui/Button';
import { DeliverableForm } from '@/components/docs/DeliverableForm';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { docsRepo } from '@/lib/data';
import { useClientStore, notifyStore, EMPTY_OBJECT } from '@/lib/useClientStore';
import { DeliverableData, emptyData } from '@/lib/docs/types';
import { DELIVERABLES, deliverablesForRole, seedDeliverable } from '@/lib/docs/definitions';
import { toDeliverableCSV, toDeliverableHTML, toDeliverableMarkdown } from '@/lib/docs/report';

type DocsMap = Record<string, DeliverableData>;

function download(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function printHTML(html: string) {
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

export default function DeliverablesPage() {
  const course = useCourse();
  const { member, loading } = useMember(course.id);
  const saved = useClientStore<DocsMap>(
    () => (member ? docsRepo.get(course.id, member.teamId) ?? EMPTY_OBJECT : EMPTY_OBJECT),
    EMPTY_OBJECT
  );

  const roleDefaultWeek = member ? deliverablesForRole(member.role)[0]?.weeks[0] ?? 1 : 1;
  const [week, setWeek] = useState<number | null>(null);
  const selectedWeek = week ?? roleDefaultWeek;

  if (loading) return <div className="py-12 text-center text-gray-500">Loading…</div>;
  if (!member) {
    return (
      <EmptyState
        title="Enrol first"
        message="Join this course (pick a team and role) to work on your deliverables."
        href={`/courses/${course.id}`}
        cta="Go to course"
      />
    );
  }

  const teamId = member.teamId;
  const meta = { team: teamId, cohort: member.cohort, date: new Date().toISOString().slice(0, 10) };

  const setDoc = (id: string, data: DeliverableData) => {
    const current = docsRepo.get(course.id, teamId) ?? {};
    docsRepo.save(course.id, teamId, { ...current, [id]: data });
    notifyStore();
  };

  const weeks = [...course.weeks].map((w) => w.number).sort((a, b) => a - b);
  const myDefs = deliverablesForRole(member.role);
  const dueThisWeek = myDefs.filter((d) => d.weeks.includes(selectedWeek));

  return (
    <div className="space-y-8">
      <Link
        href={`/courses/${course.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
      >
        <ArrowLeft className="h-4 w-4" /> Back to course
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Deliverables · Team {teamId}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your graded documents, built from guided forms. Fill them in, then{' '}
          <strong>Generate → Print / Save as PDF</strong>. One clear flow:{' '}
          <em>run the tool → read the output → enter what you found, the proof, and why it matters → export.</em>
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Your entries are saved in <strong>this browser</strong> only. Generate and save the PDF as soon
          as a deliverable is done — shared, multi-device storage arrives with accounts.
        </p>
      </div>

      {/* Index of the 8 deliverables */}
      <div className="rounded-lg border border-gray-200 bg-white px-5 dark:border-gray-700 dark:bg-gray-800">
        <Collapsible title="The 8 deliverables — who owns what, and when" defaultOpen={false}>
          <div className="overflow-x-auto pb-2">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Deliverable</th>
                  <th className="py-2 pr-3">Owner</th>
                  <th className="py-2 pr-3">Week</th>
                  <th className="py-2 pr-3">Gate</th>
                  <th className="py-2 pr-3">Standard</th>
                </tr>
              </thead>
              <tbody>
                {DELIVERABLES.map((d) => (
                  <tr key={d.id} className="border-b border-gray-100 dark:border-gray-700/60">
                    <td className="py-1.5 pr-3 text-gray-500">{d.num}</td>
                    <td className="py-1.5 pr-3 font-medium text-gray-900 dark:text-white">{d.title}</td>
                    <td className="py-1.5 pr-3 uppercase">{d.owner}</td>
                    <td className="py-1.5 pr-3">{d.weeks.join(', ')}</td>
                    <td className="py-1.5 pr-3">{d.gate ?? '—'}</td>
                    <td className="py-1.5 pr-3 text-gray-500 dark:text-gray-400">{d.standard}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Naming: deliverables <span className="font-mono">NN_Name.ext</span>; evidence{' '}
              <span className="font-mono">YYYYMMDD_TeamXX_Tool_Action.png</span>. Graded on process,
              documentation, evidence and ethics — not speed.
            </p>
          </div>
        </Collapsible>
      </div>

      {/* Week selector */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Week:</span>
        {weeks.map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWeek(w)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              w === selectedWeek
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {w === 0 ? 'Setup' : `Week ${w}`}
          </button>
        ))}
      </div>

      {(() => {
        const gate = course.gates.find((g) => g.week === selectedWeek);
        const gateDefs = gate ? DELIVERABLES.filter((d) => d.gate === gate.id && d.dod?.length) : [];
        if (!gate || gateDefs.length === 0) return null;
        return (
          <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Gate {gate.id} readiness — what this week is graded on
            </h2>
            <ul className="mt-3 space-y-2">
              {gateDefs.flatMap((d) =>
                (d.dod ?? []).map((check, ci) => {
                  const pass = check.test(saved[d.id] ?? emptyData());
                  return (
                    <li key={`${d.id}-${ci}`} className="flex items-start gap-2 text-sm">
                      {pass ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      ) : (
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" />
                      )}
                      <span className={pass ? 'text-gray-500 line-through dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}>
                        {check.label}
                      </span>
                      <span className="text-[11px] uppercase text-gray-400">{d.owner}</span>
                    </li>
                  );
                })
              )}
            </ul>
            <p className="mt-2 text-[11px] text-gray-400">
              Checks read your team&apos;s saved deliverables on this device.
            </p>
          </div>
        );
      })()}

      {dueThisWeek.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          Nothing graded for <strong>{member.role.toUpperCase()}</strong> in{' '}
          {selectedWeek === 0 ? 'Setup' : `Week ${selectedWeek}`}. Your work this week feeds your
          teammates&apos; deliverables — check the course tasks.
        </div>
      ) : (
        dueThisWeek.map((def) => {
          const isExample = !saved[def.id];
          const data = saved[def.id] ?? seedDeliverable(def);
          return (
            <section
              key={def.id}
              className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                    {def.num}. {def.title}
                    {def.framework && <FrameworkBadge framework={def.framework} />}
                    <InfoTip label={def.howTo} />
                    {isExample && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                        Example
                      </span>
                    )}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{def.purpose}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
                    <span className="font-mono">{def.folder}/{def.file}</span> · {def.standard}
                    {def.source ? ` · ${def.source}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {isExample ? (
                    <button
                      type="button"
                      onClick={() => setDoc(def.id, emptyData())}
                      className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      Start blank
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDoc(def.id, seedDeliverable(def))}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Restore example
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => printHTML(toDeliverableHTML(def, data, meta))}
                    className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    <Printer className="h-3.5 w-3.5" /> Generate PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => download(def.file.replace(/\.\w+$/, '.md'), toDeliverableMarkdown(def, data, meta))}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <FileText className="h-3.5 w-3.5" /> .md
                  </button>
                  {def.exportFormat === 'csv' && (
                    <button
                      type="button"
                      onClick={() => download(def.file, toDeliverableCSV(def, data))}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" /> .csv
                    </button>
                  )}
                </div>
              </div>

              <DeliverableForm def={def} data={data} onChange={(next) => setDoc(def.id, next)} />
            </section>
          );
        })
      )}
    </div>
  );
}
