'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { BookOpen, CheckCircle2, Circle, Download, FileDown, FileSpreadsheet, FileText, Lock, Package, Printer, ShieldCheck, Sparkles, Upload, Users } from 'lucide-react';
import { CourseEnrolGate } from '@/components/CourseEnrolGate';
import { CourseSubNav } from '@/components/CourseSubNav';
import { FrameworkBadge } from '@/components/TaskComponents';
import { Collapsible, Tabs } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { LoadingBlock } from '@/components/ui/Spinner';
import { toast } from '@/components/ui/Toast';
import { Alert } from '@/components/ui/Alert';
import { DeliverableForm } from '@/components/docs/DeliverableForm';
import { EvidenceHasher } from '@/components/docs/EvidenceHasher';
import { WeekEvidencePackager } from '@/components/docs/WeekEvidencePackager';
import { GlossaryText } from '@/components/GlossaryText';
import { TriageDecisionTree } from '@/components/diagrams/TriageDecisionTree';
import { RiskMatrix } from '@/components/diagrams/RiskMatrix';
import { IncidentTimelineDiagram } from '@/components/diagrams/IncidentTimelineDiagram';
import { useCourse } from '@/lib/useCourse';
import { useMember } from '@/lib/useMember';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { useSupabaseSync } from '@/lib/useSupabaseSync';
import { docsRepo } from '@/lib/data';
import { useClientStore, notifyStore, EMPTY_OBJECT } from '@/lib/useClientStore';
import { DeliverableData, emptyData } from '@/lib/docs/types';
import { deliverablesForCourse, deliverablesForRole, isTeamAuthorized, seedDeliverable } from '@/lib/docs/definitions';
import type { DeliverableDef } from '@/lib/docs/types';
import { unitWord } from '@/lib/course-helpers';
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

/**
 * A week's deliverables — and, deliberately, almost nothing else.
 *
 * The page used to open on its tools: the week selector was the *tenth* of
 * thirteen blocks, so a student scrolled past the file hasher, a "New here?"
 * explainer, a whole-course export panel, a storage warning and a Guide
 * cross-link before they could even pick a week, and the forms came after that.
 * It was organised around what the page can do rather than what you came to do.
 *
 * Now the week is the page. The rail is first and sticky, the header is one line,
 * every tool collapses into a single row that opens in a dialog instead of taking
 * scroll, and the form follows immediately. When a week owns more than one form
 * (Security+ GRC Week 1 owns five) they become tabs rather than a 10-screen stack.
 *
 * `data-block` attributes mark the four regions; `src/lib/page-shape.test.ts`
 * asserts their order, which is what stops the rail drifting back down the page.
 */

/** Which forms get a shape diagram, keyed by deliverable id.
 *
 *  This used to key on week number with no course guard — so Security+, whose Risk
 *  Register is Week 2, got the risk matrix in Week 3, and MSSP got all three
 *  diagrams for forms it doesn't have. Keying on the form itself is both the fix
 *  and the compaction: the diagram now sits inside the form it describes instead
 *  of floating above the page as its own card. */
const FORM_DIAGRAM: Record<string, () => React.ReactElement> = {
  cysa_alert_triage: TriageDecisionTree,
  risk_register: RiskMatrix,
  cysa_incident_response: IncidentTimelineDiagram,
  incident_report: IncidentTimelineDiagram,
};

type ToolPanel = 'evidence' | 'package' | 'handoff' | null;

export default function DeliverablesPage() {
  const course = useCourse();
  useSupabaseSync(course.id);
  const { member, loading } = useMember(course.id);
  const { guard } = useRequireAuth();
  const saved = useClientStore<DocsMap>(
    () => (member ? docsRepo.get(course.id, member.teamId) ?? EMPTY_OBJECT : EMPTY_OBJECT),
    EMPTY_OBJECT
  );

  const courseDefs = deliverablesForCourse(course.id);
  const roleDefaultWeek = member ? deliverablesForRole(member.role, course.id)[0]?.weeks[0] ?? 1 : 1;
  const searchParams = useSearchParams();
  const formParam = searchParams.get('form');
  const toolParam = searchParams.get('tool');
  const weekParam = searchParams.get('week');
  const formWeek = formParam ? courseDefs.find((d) => d.id === formParam)?.weeks[0] : undefined;

  // The week lives in the URL now. It used to be useState, so a week was never
  // shareable or bookmarkable and was lost on reload and on back — which matters
  // most for the student who is told "look at your Week 3 form".
  const weekFromUrl = weekParam !== null && weekParam !== '' ? Number(weekParam) : undefined;
  const selectedWeek = Number.isFinite(weekFromUrl) ? (weekFromUrl as number) : formWeek ?? roleDefaultWeek;

  const [activeForm, setActiveForm] = useState<string | null>(null);
  // Seeded from the param so a ?tool=evidence deep link opens the hasher on the
  // first paint, not one render later.
  const [tool, setTool] = useState<ToolPanel>(toolParam === 'evidence' ? 'evidence' : null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Every evidence step deep-links here as ?tool=evidence, and that has to open
  // the hasher. Adjusting state during render (React's documented pattern for
  // "derive state from a changing prop") rather than in an effect: an effect here
  // would open the panel a frame late and trips react-hooks/set-state-in-effect.
  const [seenToolParam, setSeenToolParam] = useState<string | null>(toolParam);
  if (toolParam !== seenToolParam) {
    setSeenToolParam(toolParam);
    setTool(toolParam === 'evidence' ? 'evidence' : null);
  }

  /** Select a week without an RSC round-trip.
   *
   *  replaceState, not router.replace: the latter re-runs the server component and
   *  resets scroll on every chip click. And `form` is dropped deliberately — left
   *  in place it points at a form that is no longer in this week, and the tab
   *  selection below would keep snapping back to it. */
  const pickWeek = (w: number) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('week', String(w));
    next.delete('form');
    window.history.replaceState(null, '', `?${next.toString()}`);
    setActiveForm(null);
    notifyStore();
  };

  if (loading) return <LoadingBlock />;
  if (!member) return <CourseEnrolGate courseId={course.id} what="your deliverables" />;

  const teamId = member.teamId;
  const meta = { team: teamId, cohort: member.cohort, date: new Date().toISOString().slice(0, 10), courseId: course.id };

  const setDoc = (id: string, data: DeliverableData) => {
    // Deliverables are the team's shared documents — they have to belong to an
    // account or a teammate can never see them.
    guard('save your team’s deliverables', () => {
      const current = docsRepo.get(course.id, teamId) ?? {};
      docsRepo.save(course.id, teamId, { ...current, [id]: data });
      notifyStore();
    });
  };

  const weeks = [...course.weeks].map((w) => w.number).sort((a, b) => a - b);
  const myDefs = deliverablesForRole(member.role, course.id);
  const dueThisWeek = myDefs.filter((d) => d.weeks.includes(selectedWeek));
  const authorized = isTeamAuthorized(saved);
  const roleName = course.roles.find((r) => r.id === member.role)?.name ?? member.role.toUpperCase();
  const isDone = (def: (typeof courseDefs)[number]) =>
    (def.dod ?? []).length > 0 && (def.dod ?? []).every((c) => c.test(saved[def.id] ?? emptyData()));

  // Which form is showing. A ?form= deep-link wins, then the student's own click,
  // then the first form they haven't finished — so opening the page mid-week lands
  // on the work rather than on something already done.
  const currentId =
    (formParam && dueThisWeek.some((d) => d.id === formParam) ? formParam : null) ??
    (activeForm && dueThisWeek.some((d) => d.id === activeForm) ? activeForm : null) ??
    dueThisWeek.find((d) => !isDone(d))?.id ??
    dueThisWeek[0]?.id ??
    null;
  const currentDef = dueThisWeek.find((d) => d.id === currentId) ?? null;

  const gate = course.noGatekeeping ? undefined : course.gates.find((g) => g.week === selectedWeek);
  const gateDefs = gate ? courseDefs.filter((d) => d.gate === gate.id && d.dod?.length) : [];
  const gateChecks = gateDefs.flatMap((d) =>
    (d.dod ?? []).map((check) => ({ label: check.label, owner: d.owner, pass: check.test(saved[d.id] ?? emptyData()) }))
  );

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

  const weekWord = selectedWeek === 0 ? 'Setup' : `${unitWord(course)} ${selectedWeek}`;

  return (
    <div className="space-y-5">
      <CourseSubNav courseId={course.id} active="deliverables" teamId={teamId} />

      {/* ── the week rail ───────────────────────────────────────────────────
          First, and sticky under the sub-nav: once you are deep inside a long
          form the rail is still the way back out to another week. */}
      <div
        data-block="week-rail"
        className="sticky top-12 z-20 -mx-4 flex flex-wrap items-center gap-1.5 border-b border-line bg-surface/95 px-4 py-2 backdrop-blur"
      >
        {weeks.map((w) => {
          const owned = myDefs.filter((d) => d.weeks.includes(w));
          const allDone = owned.length > 0 && owned.every(isDone);
          return (
            <button
              key={w}
              type="button"
              onClick={() => pickWeek(w)}
              aria-current={w === selectedWeek ? 'true' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                w === selectedWeek
                  ? 'bg-accent text-accent-contrast'
                  : 'text-muted hover:bg-panel-2 hover:text-ink'
              }`}
            >
              {w === 0 ? 'Setup' : `${unitWord(course)} ${w}`}
              {allDone && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
            </button>
          );
        })}
      </div>

      {/* ── the header: one line saying what this week asks of you ───────── */}
      <header data-block="week-head" className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          {weekWord} · {dueThisWeek.length === 0 ? 'no form of your own' : `${dueThisWeek.length} form${dueThisWeek.length === 1 ? '' : 's'} for you`}
        </h1>
        <p className="text-sm text-muted">
          {roleName} · Team {teamId} · fill the form, then generate the PDF. Evidence goes in{' '}
          <span className="font-mono text-xs">~/team-artifacts/week-{selectedWeek}/</span>
          {/* Same JSX whitespace trap as on the Guide: the text node after this
              element spans a newline, so its leading space is trimmed away. */}
          {' '}
          and this week&apos;s zip is built at the bottom.
        </p>
      </header>

      {/* ── the toolbar: everything that is not this week's form ──────────
          These were five stacked blocks above the week selector. They are tools,
          not reading, so they belong behind a control — which is the one place
          disclosure is the right answer. */}
      <div data-block="week-tools" className="flex flex-wrap items-center gap-2">
        <ToolButton icon={ShieldCheck} label="Hash & log evidence" active={tool === 'evidence'} onClick={() => setTool(tool === 'evidence' ? null : 'evidence')} />
        <ToolButton icon={Package} label="Team package" active={tool === 'package'} onClick={() => setTool(tool === 'package' ? null : 'package')} />
        <ToolButton icon={Users} label="Export & hand-off" active={tool === 'handoff'} onClick={() => setTool(tool === 'handoff' ? null : 'handoff')} />
        <Link
          href={`/courses/${course.id}/guide/reference#forms`}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-panel-2 hover:text-ink"
        >
          <BookOpen className="h-4 w-4" /> How the forms work
        </Link>
      </div>

      {/* The evidence tool keeps its id: every evidence step deep-links ?tool=evidence. */}
      <span id="evidence-tool" className="sr-only" />

      <Dialog open={tool === 'evidence'} onClose={() => setTool(null)} title="Hash & log evidence">
        <div className="space-y-3">
          <EvidenceHasher courseId={course.id} memberId={member.memberId} week={selectedWeek} />
          {/* The custody doctrine — the NIST/ISO line, the six handling rules and the
              "the package includes a custody log" note — used to be restated here,
              and again forty lines below, and again inside the packager. It lives
              once now, on Reference, where EvidenceGuide renders all of it. */}
          <p className="text-xs text-muted">
            Naming, hashing and hand-off rules:{' '}
            <Link href={`/courses/${course.id}/guide/reference#evidence`} className="font-medium text-accent hover:underline">
              Evidence &amp; chain of custody →
            </Link>
          </p>
        </div>
      </Dialog>

      <Dialog open={tool === 'package'} onClose={() => setTool(null)} title="Team package">
        <div className="space-y-3 text-sm text-body">
          <p>
            Bundles every deliverable into one zip in the submission folder structure (
            <span className="font-mono text-xs">{packageFileName(meta)}</span>), with a ready-to-fill
            chain-of-custody log.
          </p>
          <button
            type="button"
            onClick={() => downloadBytes(packageFileName(meta), buildTeamPackage(saved, meta), 'application/zip')}
            className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-contrast hover:bg-accent-strong"
          >
            <Package className="h-4 w-4" /> Download team package (.zip)
          </button>
        </div>
      </Dialog>

      <Dialog open={tool === 'handoff'} onClose={() => setTool(null)} title="Export & hand-off">
        <div className="space-y-3 text-sm text-body">
          <p className="text-muted">
            Everyone fills their own deliverables on their own device — you never need a teammate to finish
            yours. Export a <span className="font-mono text-xs">.json</span> backup, then restore it on another
            device, or send it to whoever is assembling the combined package.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => printHTML(toRoleReportHTML(myDefs, saved, meta, `${roleName} — Full Report`))}
              className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-contrast hover:bg-accent-strong"
            >
              <FileDown className="h-4 w-4" /> My full report (PDF)
            </button>
            <button
              type="button"
              onClick={handleExportMyWork}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm font-medium text-body hover:bg-panel-2"
            >
              <Download className="h-4 w-4" /> Export my work (.json)
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm font-medium text-body hover:bg-panel-2"
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
          {importMsg && <Alert variant={importMsg.ok ? 'success' : 'error'}>{importMsg.text}</Alert>}
        </div>
      </Dialog>

      {/* Gate readiness, when the course has gates. One compact strip, not a card. */}
      {gate && gateChecks.length > 0 && (
        <div className="rounded-lg border border-line bg-panel px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-semibold text-ink">Gate {gate.id} readiness</span>
            <span className="font-mono text-xs text-muted">
              {gateChecks.filter((c) => c.pass).length}/{gateChecks.length} checks
            </span>
          </div>
          <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {gateChecks.map((c, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs">
                {c.pass ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                ) : (
                  <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted" />
                )}
                <span className={c.pass ? 'text-muted line-through' : 'text-body'}>{c.label}</span>
                <span className="text-[10px] uppercase text-muted">{c.owner}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── this week's form(s) ─────────────────────────────────────────── */}
      <div data-block="week-forms">
        {dueThisWeek.length === 0 ? (
          // ONE empty state. There used to be two, rendering simultaneously — a
          // blue box at the top of the page and a grey card further down.
          <div className="rounded-lg border border-line bg-panel p-6 text-sm text-muted">
            No form of your own in {weekWord}. This {unitWord(course).toLowerCase()} your work is evidence —
            screenshots and findings you collect and file with the week package below.{' '}
            <Link href={`/courses/${course.id}?tab=weeks`} className="font-medium text-accent underline">
              Go to this {unitWord(course).toLowerCase()}&apos;s tasks
            </Link>
            , or pick another {unitWord(course).toLowerCase()} above.
          </div>
        ) : dueThisWeek.length === 1 && currentDef ? (
          <FormSection
            def={currentDef}
            saved={saved}
            authorized={authorized}
            noGatekeeping={course.noGatekeeping}
            meta={meta}
            onChange={setDoc}
          />
        ) : (
          // More than one form this week — Security+ GRC Week 1 owns five, which
          // stacked to roughly ten screens. Tabs make the week one page.
          //
          // Unmounting the inactive form is safe because DeliverableForm is fully
          // controlled: every keystroke goes straight to docsRepo via onChange, so
          // there is no local draft state to lose. Adding any would break this.
          <Tabs
            tabs={dueThisWeek.map((d) => ({
              value: d.id,
              label: (
                <span className="flex items-center gap-1.5">
                  {isDone(d) && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                  {!course.noGatekeeping && d.requiresAuth && !authorized && <Lock className="h-3.5 w-3.5 text-amber-600" />}
                  <span className="text-sm">{d.num}. {d.title}</span>
                </span>
              ),
            }))}
            activeTab={currentId ?? dueThisWeek[0].id}
            onTabChange={setActiveForm}
          >
            {currentDef && (
              <div className="pt-4">
                <FormSection
                  def={currentDef}
                  saved={saved}
                  authorized={authorized}
                  noGatekeeping={course.noGatekeeping}
                  meta={meta}
                  onChange={setDoc}
                />
              </div>
            )}
          </Tabs>
        )}
      </div>

      {/* Package THIS week: filled form(s) + attached evidence → one zip with a
          populated chain-of-custody log. */}
      <WeekEvidencePackager week={selectedWeek} courseId={course.id} saved={saved} meta={meta} roles={course.roles} memberId={member.memberId} />
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof ShieldCheck;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={active}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line text-body hover:bg-panel-2'
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

/** One deliverable: title row, the shape diagram if it has one, guidance, form. */
function FormSection({
  def,
  saved,
  authorized,
  noGatekeeping,
  meta,
  onChange,
}: {
  def: DeliverableDef;
  saved: DocsMap;
  authorized: boolean;
  noGatekeeping?: boolean;
  meta: { team: string; cohort: string; date: string; courseId: string };
  onChange: (id: string, data: DeliverableData) => void;
}) {
  // A form only has a "worked example" when a group carries seed rows; field-only
  // forms (e.g. Detection Record) have none, so no badge/toggle.
  const hasExample = def.sections.some((s) => s.kind === 'group' && (s.group.seed?.length ?? 0) > 0);
  const isExample = hasExample && !saved[def.id];
  const data = saved[def.id] ?? seedDeliverable(def);
  const locked = !noGatekeeping && !!def.requiresAuth && !authorized;
  const hasGuidance = !!(def.buildSteps || def.meaning || def.useIt || def.pitfalls);
  const Diagram = FORM_DIAGRAM[def.id];

  return (
    <section id={`form-${def.id}`} className="scroll-mt-24 space-y-4 rounded-lg border border-line bg-panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-bold text-ink">
            {def.num}. {def.title}
            {def.framework && <FrameworkBadge framework={def.framework} />}
            {isExample && !locked && (
              <span className="rounded-full bg-panel-2 px-2 py-0.5 text-[11px] font-medium text-muted">
                Example
              </span>
            )}
            {locked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-panel-2 px-2 py-0.5 text-[11px] font-medium text-muted">
                <Lock className="h-3 w-3" /> Locked
              </span>
            )}
            {def.id === 'scope_roe' && data.fields.authorization && (
              <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-medium text-ok">
                <CheckCircle2 className="h-3 w-3" /> Signed
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-sm text-muted"><GlossaryText text={def.purpose} /></p>
          <p className="mt-0.5 text-xs text-muted">
            <span className="font-mono">{def.folder}/{def.file}</span> · {def.standard}
            {def.source ? ` · ${def.source}` : ''}
          </p>
        </div>
        {!locked && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {/* A text link, not a fourth bordered button: switching the
                worked example on and off is a preference, not an export. */}
            {hasExample && (isExample ? (
              <button
                type="button"
                onClick={() => onChange(def.id, emptyData())}
                className="text-xs font-medium text-muted underline-offset-2 hover:text-accent hover:underline"
              >
                Start blank
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onChange(def.id, seedDeliverable(def))}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted underline-offset-2 hover:text-accent hover:underline"
              >
                <Sparkles className="h-3.5 w-3.5" /> Restore example
              </button>
            ))}
            <button
              type="button"
              onClick={() => printHTML(toDeliverableHTML(def, data, meta))}
              className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-contrast hover:bg-accent-strong"
            >
              <Printer className="h-3.5 w-3.5" /> Generate PDF
            </button>
            <button
              type="button"
              onClick={() => download(def.file.replace(/\.\w+$/, '.md'), toDeliverableMarkdown(def, data, meta))}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted hover:bg-panel-2 hover:text-body"
            >
              <FileText className="h-3.5 w-3.5" /> .md
            </button>
            {def.exportFormat === 'csv' && (
              <button
                type="button"
                onClick={() => download(def.file, toDeliverableCSV(def, data))}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted hover:bg-panel-2 hover:text-body"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> .csv
              </button>
            )}
          </div>
        )}
      </div>

      {/* The shape of the answer, beside the form it describes. */}
      {!locked && Diagram && <Diagram />}

      {!locked && hasGuidance && (
        <div className="rounded-lg border border-line bg-panel-2 px-4">
          <Collapsible title="How to build this — and what it means" defaultOpen={false}>
            <div className="space-y-3 pb-2 text-sm text-body">
              <p><GlossaryText text={def.howTo} /></p>
              {def.buildSteps && (
                <div>
                  <div className="eyebrow-muted">Build it — where each value comes from</div>
                  <ol className="mt-1 list-decimal space-y-1 pl-5">
                    {def.buildSteps.map((s, i) => <li key={i}><GlossaryText text={s} /></li>)}
                  </ol>
                </div>
              )}
              {def.meaning && (
                <div>
                  <div className="eyebrow-muted">What it means &amp; what a good one looks like</div>
                  <p className="mt-1"><GlossaryText text={def.meaning} /></p>
                </div>
              )}
              {def.useIt && (
                <div>
                  <div className="eyebrow-muted">What it feeds next</div>
                  <p className="mt-1"><GlossaryText text={def.useIt} /></p>
                </div>
              )}
              {def.pitfalls && (
                <div>
                  <div className="eyebrow-muted">Common mistakes to avoid</div>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {def.pitfalls.map((s, i) => <li key={i}><GlossaryText text={s} /></li>)}
                  </ul>
                </div>
              )}
            </div>
          </Collapsible>
        </div>
      )}

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
        <DeliverableForm def={def} data={data} onChange={(next) => onChange(def.id, next)} />
      )}
    </section>
  );
}
