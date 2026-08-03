'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Circle, Download, FileDown, FileSpreadsheet, FileText, Lock, Package, Printer, ShieldCheck, Sparkles, Upload, Users } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { CourseSubNav } from '@/components/CourseSubNav';
import { FrameworkBadge } from '@/components/TaskComponents';
import { InfoTip } from '@/components/InfoTip';
import { Collapsible } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { Alert } from '@/components/ui/Alert';
import { DeliverableForm } from '@/components/docs/DeliverableForm';
import { RoleExtractionGuide } from '@/components/docs/RoleExtractionGuide';
import { EvidenceHasher } from '@/components/docs/EvidenceHasher';
import { WeekEvidencePackager } from '@/components/docs/WeekEvidencePackager';
import { FolderTree } from '@/components/docs/FolderTree';
import { GlossaryText } from '@/components/GlossaryText';
import { EVIDENCE_NAMING } from '@/lib/evidence';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { useSupabaseSync } from '@/lib/useSupabaseSync';
import { docsRepo } from '@/lib/data';
import { useClientStore, notifyStore, EMPTY_OBJECT } from '@/lib/useClientStore';
import { DeliverableData, emptyData } from '@/lib/docs/types';
import { deliverablesForCourse, deliverablesForRole, isTeamAuthorized, seedDeliverable } from '@/lib/docs/definitions';
import { toDeliverableCSV, toDeliverableHTML, toDeliverableMarkdown, toRoleReportHTML } from '@/lib/docs/report';
import { buildTeamPackage, packageFileName, packageRoot } from '@/lib/docs/package';
import { exportTeamData, mergeTeamData, parseTeamData } from '@/lib/docs/handoff';
import { CUSTODY_RULES } from '@/lib/docs/custodyTemplate';

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

  const courseDefs = deliverablesForCourse(course.id);
  const roleDefaultWeek = member ? deliverablesForRole(member.role, course.id)[0]?.weeks[0] ?? 1 : 1;
  const [week, setWeek] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const formParam = searchParams.get('form');
  const toolParam = searchParams.get('tool');
  const formWeek = formParam ? courseDefs.find((d) => d.id === formParam)?.weeks[0] : undefined;
  // A ?form= deep-link picks that form's week (until the user changes the week).
  const selectedWeek = week ?? formWeek ?? roleDefaultWeek;

  const importInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Deep-link from a task step (/docs?form=<id>): the week is derived above so the
  // form is on-screen; this effect only performs the DOM scroll (no state writes).
  useEffect(() => {
    if (!formParam) return;
    const el = document.getElementById(`form-${formParam}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [formParam, selectedWeek]);

  // Deep-link from an evidence step (/docs?tool=evidence): scroll to the always-
  // visible hash & chain-of-custody tool. DOM-only, mirrors the ?form= effect.
  useEffect(() => {
    if (toolParam !== 'evidence') return;
    const el = document.getElementById('evidence-tool');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [toolParam]);

  if (loading) return <LoadingBlock />;
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
  const meta = { team: teamId, cohort: member.cohort, date: new Date().toISOString().slice(0, 10), courseId: course.id };

  const setDoc = (id: string, data: DeliverableData) => {
    const current = docsRepo.get(course.id, teamId) ?? {};
    docsRepo.save(course.id, teamId, { ...current, [id]: data });
    notifyStore();
  };

  const weeks = [...course.weeks].map((w) => w.number).sort((a, b) => a - b);
  const myDefs = deliverablesForRole(member.role, course.id);
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
      const merged = mergeTeamData(current, incoming);
      docsRepo.save(course.id, teamId, merged);
      notifyStore();
      const added = Object.keys(incoming)
        .map((id) => courseDefs.find((d) => d.id === id)?.title ?? id)
        .sort();
      const missing = courseDefs.filter((d) => !merged[d.id]).map((d) => `${d.num}. ${d.title}`);
      const addedText = added.length ? `Added: ${added.join(', ')}.` : 'No new deliverables in that file.';
      const missingText = missing.length
        ? ` Still needed for a complete package: ${missing.join('; ')}.`
        : ' All deliverables are now present — ready to download the package.';
      setImportMsg({ ok: true, text: addedText + missingText });
      toast({ message: added.length ? `Restored ${added.length} deliverable${added.length === 1 ? '' : 's'}.` : 'Nothing new in that file.', variant: 'success' });
    } catch (err) {
      const text = err instanceof Error ? err.message : 'Could not read that file.';
      setImportMsg({ ok: false, text });
      toast({ message: text, variant: 'error', duration: 6000 });
    }
  };

  return (
    <div className="space-y-8">
      <CourseSubNav courseId={course.id} active="deliverables" teamId={teamId} />

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Deliverables · Team {teamId}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Your graded documents, built from guided forms. Fill them in, then{' '}
          <strong>Generate → Print / Save as PDF</strong>.
        </p>
      </div>

      {/* Do now — the single clearest thing: which forms this role fills this week. */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          This week, you ({roleName}) fill {dueThisWeek.length} form{dueThisWeek.length === 1 ? '' : 's'}
        </h2>
        {dueThisWeek.length === 0 ? (
          <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
            Nothing graded for your role in {selectedWeek === 0 ? 'Setup' : `Week ${selectedWeek}`}. Your work this
            week feeds your teammates&apos; deliverables —{' '}
            <Link href={`/courses/${course.id}?tab=weeks`} className="font-medium underline">
              go to this week&apos;s tasks
            </Link>
            . Change the week below to see other forms.
          </p>
        ) : (
          <ul className="mt-2 space-y-3">
            {dueThisWeek.map((def) => {
              const done = (def.dod ?? []).length > 0 && (def.dod ?? []).every((c) => c.test(saved[def.id] ?? emptyData()));
              const evName = def.sections
                .flatMap((s) => (s.kind === 'fields' ? s.fields : []))
                .find((f) => f.type === 'fileref' && f.placeholder)?.placeholder;
              return (
                <li key={def.id} className="text-sm">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-blue-400" />
                    )}
                    <a href={`#form-${def.id}`} className="font-medium text-blue-800 underline dark:text-blue-200">
                      {def.num}. {def.title}
                    </a>
                    <span className="font-mono text-[11px] text-blue-700/80 dark:text-blue-300/80">
                      {def.folder}/{def.file}
                    </span>
                    {def.requiresAuth && !authorized && (
                      <span className="inline-flex items-center gap-0.5 text-xs text-amber-700 dark:text-amber-400">
                        <Lock className="h-3 w-3" /> needs scope sign-off
                      </span>
                    )}
                  </div>
                  <p className="ml-6 mt-0.5 text-[13px] text-blue-800/90 dark:text-blue-200/90">{def.howTo}</p>
                  {evName && (
                    <p className="ml-6 mt-0.5 text-[11px] text-blue-700/70 dark:text-blue-300/70">
                      Evidence to attach, e.g. <span className="font-mono">{evName}</span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {courseDefs.some((d) => d.weeks.includes(selectedWeek)) && (
          <div className="mt-4 border-t border-blue-200 pt-3 dark:border-blue-800">
            <p className="text-[12px] text-blue-800 dark:text-blue-200">
              Name evidence <span className="font-mono">{EVIDENCE_NAMING}</span> and keep it in{' '}
              <span className="font-mono">~/team-artifacts/week-{selectedWeek}/</span> while you work. Your
              submission zip for this week will look like this:
            </p>
            <div className="mt-2">
              <FolderTree courseId={course.id} variant="week" week={selectedWeek} roles={course.roles} />
            </div>
          </div>
        )}
      </div>

      {/* Evidence & chain of custody — a stable, always-visible deep-link target
          (?tool=evidence, linked from every evidence step). Hash a file locally,
          then log it with the handling rules in view. */}
      <section
        id="evidence-tool"
        className={`scroll-mt-24 rounded-lg border p-4 transition-shadow ${
          toolParam === 'evidence'
            ? 'border-indigo-400 ring-2 ring-indigo-400/60 dark:border-indigo-500'
            : 'border-gray-200 dark:border-gray-700'
        } bg-white dark:bg-gray-800`}
      >
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
          <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          Evidence &amp; chain of custody
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Handle evidence like a real case: hash every artifact on collection, log it, and record each
          hand-off so the chain is unbroken. Aligned with <strong>NIST SP 800-61</strong> and{' '}
          <strong>ISO/IEC 27037</strong>.
        </p>
        <div className="mt-3">
          <EvidenceHasher />
        </div>
        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Handling rules
          </div>
          <ul className="mt-1.5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {CUSTODY_RULES.map((r, i) => (
              <li key={i} className="flex gap-1.5">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            The team package includes a ready-to-fill chain-of-custody log in{' '}
            <span className="font-mono">Evidence/</span>; the forms below carry the same custody columns.
          </p>
        </div>
      </section>

      <div className="rounded-lg border border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
        <Collapsible title="New here? How documentation works" defaultOpen={false}>
          <div className="space-y-4 pb-2">
            <RoleExtractionGuide role={member.role} roleLabel={roleName} courseId={course.id} />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              See the full weekly flow (task → evidence → form → report) on the{' '}
              <Link href={`/courses/${course.id}/guide`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                Guide
              </Link>
              . Hash evidence and log the chain of custody in the{' '}
              <a href="#evidence-tool" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                Evidence &amp; chain of custody
              </a>{' '}
              tool above.
            </p>
          </div>
        </Collapsible>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800">
        <Collapsible title="Advanced — whole-course export & team hand-off" defaultOpen={false}>
          <div className="space-y-3 pb-2">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="flex items-start gap-2 text-sm text-blue-900 dark:text-blue-200">
          <Package className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <p>
            <strong>Download team package</strong> — bundles every deliverable into one zip, in the
            submission folder structure (<span className="font-mono text-xs">{packageFileName(meta)}</span>),
            with a ready-to-fill chain-of-custody log in <span className="font-mono text-xs">Evidence/</span>.{' '}
            <Link href={`/courses/${course.id}/guide`} className="font-medium underline">
              Evidence handling &amp; chain of custody →
            </Link>
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
            <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              {course.roles.map((r, i) => (
                <span key={r.id} className="flex items-center gap-1.5">
                  {i > 0 && <span aria-hidden>+</span>}
                  <span className="rounded-full px-2 py-0.5 font-medium" style={{ backgroundColor: `${r.color}22`, color: r.color }}>
                    {r.name}
                  </span>
                </span>
              ))}
              <span aria-hidden>→ export .json → one teammate restores all &amp; downloads the package</span>
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
          <Alert variant={importMsg.ok ? 'success' : 'error'}>{importMsg.text}</Alert>
        )}
      </div>
          </div>
        </Collapsible>
      </div>

      <Alert variant="warning">
        Your entries are saved in <strong>this browser</strong> only. Generate and save the PDF as soon
        as a deliverable is done — shared, multi-device storage arrives with accounts.
      </Alert>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Need the reference tables (all deliverables, weekly flow, folder layout, tools)?{' '}
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
            aria-current={w === selectedWeek ? 'true' : undefined}
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
        if (course.noGatekeeping) return null;
        const gate = course.gates.find((g) => g.week === selectedWeek);
        const gateDefs = gate ? courseDefs.filter((d) => d.gate === gate.id && d.dod?.length) : [];
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
          Nothing graded for <strong>{roleName}</strong> in{' '}
          {selectedWeek === 0 ? 'Setup' : `Week ${selectedWeek}`}. Your work this week feeds your
          teammates&apos; deliverables —{' '}
          <Link href={`/courses/${course.id}?tab=weeks`} className="font-medium text-blue-600 underline dark:text-blue-400">
            go to this week&apos;s tasks
          </Link>
          .
        </div>
      ) : (
        dueThisWeek.map((def) => {
          const isExample = !saved[def.id];
          const data = saved[def.id] ?? seedDeliverable(def);
          const locked = !course.noGatekeeping && !!def.requiresAuth && !authorized;
          return (
            <section
              key={def.id}
              id={`form-${def.id}`}
              className={`scroll-mt-24 space-y-4 rounded-lg border bg-white p-5 transition-colors dark:bg-gray-800 ${
                formParam === def.id
                  ? 'border-blue-400 ring-2 ring-blue-300 dark:border-blue-500 dark:ring-blue-700'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
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
                  <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400"><GlossaryText text={def.purpose} /></p>
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

      {/* Package THIS week: filled form(s) + attached evidence → one zip with a
          populated chain-of-custody log. */}
      <WeekEvidencePackager week={selectedWeek} courseId={course.id} saved={saved} meta={meta} roles={course.roles} />
    </div>
  );
}
