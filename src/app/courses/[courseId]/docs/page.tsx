'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Circle, Download, FileDown, FileSpreadsheet, FileText, Info, Lock, Package, Printer, Sparkles, Upload, Users } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { FrameworkBadge } from '@/components/TaskComponents';
import { InfoTip } from '@/components/InfoTip';
import { DeliverableForm } from '@/components/docs/DeliverableForm';
import { RoleExtractionGuide } from '@/components/docs/RoleExtractionGuide';
import { WorkflowFlow } from '@/components/docs/WorkflowFlow';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { useSupabaseSync } from '@/lib/useSupabaseSync';
import { docsRepo } from '@/lib/data';
import { useClientStore, notifyStore, EMPTY_OBJECT } from '@/lib/useClientStore';
import { DeliverableData, emptyData } from '@/lib/docs/types';
import { DELIVERABLES, deliverablesForRole, isTeamAuthorized, seedDeliverable } from '@/lib/docs/definitions';
import { toDeliverableCSV, toDeliverableHTML, toDeliverableMarkdown, toRoleReportHTML } from '@/lib/docs/report';
import { buildTeamPackage, packageFileName, packageRoot } from '@/lib/docs/package';
import { exportTeamData, mergeTeamData, parseTeamData } from '@/lib/docs/handoff';

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

function downloadBytes(filename: string, bytes: Uint8Array, type: string) {
  const blob = new Blob([bytes as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Print a standalone HTML document via a hidden, same-origin iframe. This is
 * popup-blocker proof and fires print reliably once the iframe has loaded —
 * unlike window.open()+document.write(), where the blank window's load event
 * has already passed so an inline onload="window.print()" never runs.
 */
function printHTML(html: string) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
    // Remove after the print dialog has had time to open (it blocks the
    // afterprint cleanup in some browsers, so use a timeout fallback).
    const cleanup = () => setTimeout(() => iframe.remove(), 500);
    win.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 60000);
  };
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
}

export default function DeliverablesPage() {
  const course = useCourse();
  useSupabaseSync(course.id);
  const { member, loading } = useMember(course.id);
  const saved = useClientStore<DocsMap>(
    () => (member ? docsRepo.get(course.id, member.teamId) ?? EMPTY_OBJECT : EMPTY_OBJECT),
    EMPTY_OBJECT
  );

  const roleDefaultWeek = member ? deliverablesForRole(member.role)[0]?.weeks[0] ?? 1 : 1;
  const [week, setWeek] = useState<number | null>(null);
  const selectedWeek = week ?? roleDefaultWeek;

  const importInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

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
  const authorized = isTeamAuthorized(saved);
  const roleName = course.roles.find((r) => r.id === member.role)?.name ?? member.role.toUpperCase();

  const handleExportMyWork = () => {
    const json = exportTeamData(saved, { ...meta, course: course.id }, member.role);
    download(`${packageRoot(meta)}_${member.role}.json`, json);
  };

  const handleImportFile = async (file: File) => {
    try {
      const incoming = parseTeamData(await file.text());
      const current = docsRepo.get(course.id, teamId) ?? {};
      docsRepo.save(course.id, teamId, mergeTeamData(current, incoming));
      notifyStore();
      const n = Object.keys(incoming).length;
      setImportMsg({ ok: true, text: `Merged ${n} deliverable${n === 1 ? '' : 's'} from ${file.name}.` });
    } catch (err) {
      setImportMsg({ ok: false, text: err instanceof Error ? err.message : 'Could not read that file.' });
    }
  };

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
          <strong>Generate → Print / Save as PDF</strong>.
        </p>
      </div>

      <WorkflowFlow />
      <RoleExtractionGuide role={member.role} roleLabel={roleName} />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex items-start gap-2 text-sm text-blue-900 dark:text-blue-200">
          <Package className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <p>
            <strong>Download team package</strong> — bundles all 8 deliverables into one zip, in the
            submission folder structure (<span className="font-mono text-xs">{packageFileName(meta)}</span>).
          </p>
        </div>
        <button
          type="button"
          onClick={() => downloadBytes(packageFileName(meta), buildTeamPackage(saved, meta), 'application/zip')}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Package className="h-4 w-4" /> Download team package (.zip)
        </button>
      </div>

      {/* Cross-role handoff: each role works on their own device, so hand off a
          JSON file that GRC gathers before building the complete team package. */}
      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start gap-2">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              Team handoff &amp; your report
            </h2>
            <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
              Everyone fills their own deliverables on their own device. <strong>Export your work</strong>{' '}
              as a <span className="font-mono text-xs">.json</span> backup, then <strong>Restore from file</strong>{' '}
              to repopulate the forms on another device — or send it to your team&apos;s GRC, who restores each
              teammate&apos;s file and downloads the complete package above.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => printHTML(toRoleReportHTML(myDefs, saved, meta, `${roleName} — Full Report`))}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <FileDown className="h-4 w-4" /> Generate my full report (PDF)
          </button>
          <button
            type="button"
            onClick={handleExportMyWork}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4" /> Export my work (.json)
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <Upload className="h-4 w-4" /> Restore from file (.json)
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
        {importMsg && (
          <div
            className={`flex items-start gap-2 rounded-md border p-2.5 text-sm ${
              importMsg.ok
                ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            {importMsg.ok ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{importMsg.text}</span>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Your entries are saved in <strong>this browser</strong> only. Generate and save the PDF as soon
          as a deliverable is done — shared, multi-device storage arrives with accounts.
        </p>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Need the reference tables (the 8 deliverables, weekly flow, folder layout, tools)?{' '}
        <Link href={`/courses/${course.id}/guide`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
          See the Guide →
        </Link>
      </p>

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
          const locked = !!def.requiresAuth && !authorized;
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
                    {isExample && !locked && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
                        Example
                      </span>
                    )}
                    {locked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{def.purpose}</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-500">
                    <span className="font-mono">{def.folder}/{def.file}</span> · {def.standard}
                    {def.source ? ` · ${def.source}` : ''}
                  </p>
                </div>
                {!locked && (
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
                )}
              </div>

              {locked ? (
                <div className="flex items-start gap-3 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
                  <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-semibold">Locked until scope is authorized</p>
                    <p className="mt-1">
                      No scanning or testing begins until your team&apos;s <strong>Scope &amp; Rules of
                      Engagement</strong> is signed off. Ask your team&apos;s GRC (Fixers) to complete deliverable{' '}
                      <strong>1. Scope &amp; Rules of Engagement</strong> and fill in the{' '}
                      <em>Authorization / sign-off</em> field. This form unlocks automatically once that is saved
                      on this device — staying in scope is the rule that keeps the work ethical and legal.
                    </p>
                  </div>
                </div>
              ) : (
                <DeliverableForm def={def} data={data} onChange={(next) => setDoc(def.id, next)} />
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
