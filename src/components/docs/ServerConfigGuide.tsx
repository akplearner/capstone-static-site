'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { CopyButton } from '@/components/TaskComponents';
import {
  CAMPUS_LAN,
  HOST,
  HOST_CONSOLE_URL,
  MONITORING_HOST,
  TEAM_VM_START,
  ZONE_BRIDGES,
  baseVmsOn,
  bridge,
} from '@/lib/serverTopology';
import { PROCEDURES, WEEKS, procedureById } from '@/lib/docs/serverProcedures';

/**
 * The Server+ build procedures, in the platform.
 *
 * This replaces an instructor PDF that students had to open beside the site to
 * get anything done. A hosted file cannot be corrected when the topology moves,
 * and the ODT it came from still describes the old design — a 10.10.10.x host, a
 * jump box on vmbr1, the website on IIS. Everything below is the corrected
 * procedure for the *current* topology, so the guide and the lab can never
 * disagree again.
 *
 * Grouped by week rather than by machine because that is the order a student
 * meets them. Week 1 now runs the whole bring-up — receive, POST, document,
 * array, install — because that is one continuous job and splitting it across a
 * week boundary left students waiting to act on what they had just found.
 *
 * The read-then-change discipline that split bought is kept WITHIN the week
 * instead: the BIOS and RAID inventory trips are still read-only and still exit
 * without saving, and creating the array is still a separate procedure carrying
 * its own warning. Running the ODT's combined section walks a student from
 * "view the virtual disks" straight into deleting them, which is the thing the
 * ordering exists to prevent.
 *
 * The `updatedFromOriginal` rationale behind each correction is authoring
 * history and is deliberately not rendered; a student needs the procedure, not
 * the diff against a document they never saw.
 *
 * The addressing table below is DERIVED from `@/lib/serverTopology`, the module
 * the topology diagram reads as well. Hand-typing it here is what produced the
 * drift this guide was meant to end. Command bodies keep their literal addresses
 * inline on purpose: a copy button has to hand the student the line they will
 * actually type.
 */

// The addressing rule, stated once at the top of the guide and read straight out
// of the topology module — not retyped. Every procedure below assumes it, and
// Team 1 is the worked example throughout because a guide full of substitution
// markers is unreadable.
const ADDRESSING: { zone: string; net: string; hosts: string; note?: string }[] = [
  {
    zone: 'Campus LAN',
    net: `${CAMPUS_LAN.cidr} · gateway ${CAMPUS_LAN.gateway}`,
    hosts: 'The school network your management interface sits on.',
  },
  {
    zone: `${bridge('vmbr0').id} — ${bridge('vmbr0').zone}`,
    net: `${HOST.rule} (${HOST.teamMarker} = your team number)`,
    hosts: `The Proxmox host. Web console ${HOST_CONSOLE_URL} — Team ${HOST.exampleTeam} is ${HOST.exampleAddress}.`,
  },
  ...ZONE_BRIDGES.map((b) => ({
    zone: `${b.id} — ${b.zone}`,
    net: `${b.cidr} · gateway ${b.gateway}`,
    hosts: baseVmsOn(b.id)
      .map((v) => `${v.hostname} ${v.address} — ${v.os} + ${v.services.join(', ')}`)
      .join(' · '),
    note: b.note,
  })),
];


/** One typed line, with the same terminal chrome a task step uses so a command
 *  reads as a command everywhere on the platform. */
function CommandLine({ cmd }: { cmd: string }) {
  return (
    <div
      className="relative rounded-lg p-3 pr-20 font-mono text-xs"
      style={{ background: 'var(--color-term-bg)', color: 'var(--color-term-tx)' }}
    >
      <div className="absolute right-2 top-2">
        <CopyButton text={cmd} />
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap break-words">{cmd}</pre>
    </div>
  );
}

export function ServerConfigGuide() {
  // One week at a time. Rendering all 28 procedures at once put ~9,000 words on
  // the Reference page — 84% of everything the page said — and a manual that
  // long is not read, it is scrolled past. The week is the unit a student is
  // actually working in, so that is the unit shown. This is the same week
  // selector the Deliverables page uses, and for the same reason.
  //
  // Every week keeps a real anchor: `#config-week-N` selects that week on load
  // and on hash change, so the deep links in the task steps still land on the
  // procedure they promise rather than on a panel that is closed.
  const [week, setWeek] = useState(1);

  //
  // A procedure anchor (`#create-raid-virtual-disk`) works the same way, because
  // that is what a step's "Exact clicks →" link carries: select the procedure's
  // week, then scroll to its article once that week has rendered — the article
  // is not in the DOM until the week is, so the browser's own hash jump misses.
  useEffect(() => {
    const fromHash = () => {
      const hash = window.location.hash.slice(1);
      const m = /^config-week-(\d)$/.exec(hash);
      if (m) {
        setWeek(Number(m[1]));
        return;
      }
      const proc = procedureById(hash);
      if (!proc) return;
      setWeek(proc.week);
      requestAnimationFrame(() =>
        document.getElementById(proc.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      );
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  const active = WEEKS.find((w) => w.number === week) ?? WEEKS[1];
  const procs = PROCEDURES.filter((p) => p.week === week);
  const steps = procs.reduce((n, p) => n + p.steps.length, 0);

  return (
    <div className="space-y-5">
      {/* The addressing rule leads, because every command below is written
          against it and a student who skips it will type the wrong subnet into
          the installer — the one mistake that is expensive to undo. A table,
          not prose: four zones with the same three facts each is a table. */}
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line">
        <div className="flex flex-wrap items-baseline gap-x-3 border-b border-line bg-panel-2 px-4 py-2">
          <h3 className="text-sm font-semibold text-ink">The addressing rule</h3>
          <span className="text-xs text-muted">Worked examples use Team 1 — substitute your own team number for T.</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-panel">
                <th className="px-4 py-2 eyebrow-muted font-semibold">Zone</th>
                <th className="px-4 py-2 eyebrow-muted font-semibold">Network</th>
                <th className="px-4 py-2 eyebrow-muted font-semibold">What lives there</th>
              </tr>
            </thead>
            <tbody>
              {ADDRESSING.map((a) => (
                <tr key={a.zone} className="border-b border-line last:border-0 odd:bg-panel even:bg-panel-2">
                  <td className="px-4 py-2 align-top text-xs font-semibold text-accent-ink">{a.zone}</td>
                  <td className="px-4 py-2 align-top font-mono text-xs text-ink">{a.net}</td>
                  <td className="px-4 py-2 align-top text-xs text-muted">
                    {a.hosts}
                    {a.note && <span className="block text-muted/80">{a.note}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line bg-panel px-4 py-2 text-xs text-muted">
          <span className="font-mono">{MONITORING_HOST.address}</span> is reserved for the optional{' '}
          {MONITORING_HOST.hostname} monitoring host. Your own business VMs start at{' '}
          <span className="font-mono">{TEAM_VM_START.vmbr2}</span> in the private zone and{' '}
          <span className="font-mono">{TEAM_VM_START.vmbr1}</span> in the DMZ.
        </p>
      </div>

      {/* Week switcher. Buttons rather than anchors: the anchor still exists on
          the section below for deep links, but clicking here should swap the
          week in place instead of jumping the page. */}
      <nav aria-label="Configuration guide weeks" className="flex flex-wrap gap-2">
        {WEEKS.map((w) => {
          const on = w.number === week;
          return (
            <button
              key={w.number}
              type="button"
              onClick={() => {
                setWeek(w.number);
                history.replaceState(null, '', `#config-week-${w.number}`);
              }}
              aria-current={on ? 'true' : undefined}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                on
                  ? 'border-accent bg-accent text-accent-contrast'
                  : 'border-line bg-panel text-body hover:border-accent hover:text-accent'
              }`}
            >
              Week {w.number}
              <span className="ml-1.5 opacity-70">{w.title}</span>
            </button>
          );
        })}
      </nav>

      <section id={`config-week-${active.number}`} className="scroll-mt-16 space-y-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line pb-2">
          <h3 className="text-base font-bold text-ink">
            Week {active.number} · {active.title}
          </h3>
          {/* Week 0 is Preparation — not the first week of the arc, so it must
              not wear Week 1's colour. w1–w4 are the four phases. */}
          <span
            className="font-mono text-[10px] font-semibold uppercase leading-none tracking-wider"
            style={{ color: active.number === 0 ? 'var(--color-muted)' : `var(--color-w${Math.min(4, active.number)})` }}
          >
            {active.phase}
          </span>
          <span className="ml-auto font-mono text-[11px] text-muted">
            {procs.length} {procs.length === 1 ? 'procedure' : 'procedures'} · {steps} steps
          </span>
        </div>
        <p className="text-sm text-muted">{active.lead}</p>

        {/* A jump table, so you can find the one procedure you came for without
            reading past the others. */}
        {procs.length > 1 && (
          <ol className="grid gap-1 sm:grid-cols-2">
            {procs.map((p, i) => (
              <li key={p.id}>
                <a
                  href={`#${p.id}`}
                  className="flex items-baseline gap-2 rounded-md border border-line bg-panel-2 px-3 py-1.5 text-xs text-body transition-colors hover:border-accent hover:text-accent"
                >
                  <span className="font-mono text-[10px] text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1">{p.title}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted">{p.steps.length}</span>
                </a>
              </li>
            ))}
          </ol>
        )}

        {procs.map((p) => (
          <article
            key={p.id}
            id={p.id}
            className="scroll-mt-16 overflow-hidden rounded-[var(--radius-card)] border border-line"
          >
            <div className="border-b border-line bg-panel-2 px-4 py-2.5">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <h4 className="text-sm font-semibold text-ink">{p.title}</h4>
                {p.optional && (
                  <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
                    {p.optionalLabel ?? 'Advanced · optional'}
                  </span>
                )}
                <span className="ml-auto eyebrow-muted">{p.where}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{p.summary}</p>
            </div>

            {/* Two columns: what you do, and what it does. A procedure is a
                table — the old shape put every explanation in a paragraph under
                its command, which reads as prose and scans as a wall. */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] border-collapse text-left">
                <thead className="sr-only">
                  <tr>
                    <th>Step</th>
                    <th>Do this</th>
                    <th>What it does</th>
                  </tr>
                </thead>
                <tbody>
                  {p.steps.map((s, i) => (
                    <tr key={i} className="border-b border-line last:border-0 align-top odd:bg-panel even:bg-panel-2">
                      <td className="w-8 py-2 pl-4 pr-1 font-mono text-[10px] leading-6 text-muted">{i + 1}</td>
                      <td className="w-[55%] py-2 pr-3">
                        {s.cmd ? <CommandLine cmd={s.cmd} /> : <span className="text-sm text-body">{s.gui}</span>}
                        {s.doc && (
                          <a
                            href={s.doc.href}
                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                          >
                            {s.doc.label} <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted">{s.explain}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
