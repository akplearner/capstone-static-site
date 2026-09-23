'use client';

import { Terminal, AlertTriangle, ClipboardPaste } from 'lucide-react';
import { hasLabAccess, labProfile } from '@/lib/labAccess';
import {
  TERMINAL_BASICS,
  TERMINAL_COPY as COPY,
  errorRowsFor,
  type LabCapability,
} from '@/lib/docs/troubleshooting';

/**
 * Two beginner references that live on the Guide and are linked from every step
 * and the Lab access panel:
 *   1. Terminal basics — how to open a terminal, paste, and run.
 *   2. "When a command won't run" — the universal errors a beginner hits and the
 *      one-line fix for each, so a stuck student always has somewhere to look.
 *
 * Both render on every course, so neither may assume the SECURITY lab. This
 * section used to be reachable only from the security courses, and the fixes it
 * gives were written for them: "open the Lab access panel and enter your target
 * IP", plus nmap/nikto/hydra and rockyou. Then Server+ inlined its configuration
 * guide, gained ~150 commands, and the Reference page's `hasCommands` gate
 * switched the section on for a course that has an EMPTY lab profile — so the
 * panel those fixes point at does not exist there, and neither do the tools.
 *
 * The rows themselves — and the two-way sentences they grow or drop — are
 * content, in `lib/docs/troubleshooting.ts`. They are composed from what the
 * course actually has, read from `labAccess.ts` rather than from a course-id
 * list: `hasLabAccess` says whether
 * there is a Lab access panel to send anyone to, and an ATTACKER_IP field says
 * whether this is an attack-and-defend lab where nmap/hydra are the tools in
 * hand. A course with neither still gets every generic terminal fix — which is
 * the whole point of the section — and never an instruction it cannot follow.
 */

/** What this course's lab gives a student, so a fix never names something they
 *  do not have. Derived from the course's own lab profile — a course that drops
 *  the attacker or the whole panel loses the matching sentences automatically. */
function labShape(courseId: string): Record<LabCapability, boolean> {
  const fields = labProfile(courseId).fields;
  return {
    panel: hasLabAccess(courseId),
    attackTools: fields.some((f) => f.key === 'ATTACKER_IP'),
    // A course whose lab is a server it reaches from off campus. Sniffing the
    // field key rather than the course id is this file's own convention: drop
    // the field and the remote-access rows go with it.
    remote: fields.some((f) => f.key === 'PVE_TAILSCALE'),
    // Week 6's shared ops network — the same convention.
    ops: fields.some((f) => f.key === 'OPS_SUBNET'),
  };
}

/** "Your Proxmox host address" → "your Proxmox host address": these labels start
 *  with "Your", and lower-casing the whole string mangles the product name. */
const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

function commonErrors(courseId: string) {
  const first = labProfile(courseId).fields[0];
  return errorRowsFor(labShape(courseId), {
    token: first?.tokens[0] ?? '<YOUR_TARGET_IP>',
    label: lowerFirst(first?.label ?? 'Your target IP'),
  });
}

/** The "terminal basics" reference on its own — reused inline on command steps
 *  (a collapsed "New to the terminal?" toggle) as well as here on the Guide.
 *  Course-independent by construction: everything it says is true of any shell,
 *  which is why it takes no courseId. */
export function TerminalBasics() {
  return (
    <div className="rounded-lg depth-edge bg-panel p-5">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        <Terminal className="h-4 w-4 text-accent" /> {COPY.title}
      </h3>
      <p className="mt-1 text-sm text-muted">{COPY.intro}</p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {TERMINAL_BASICS.map((b) => (
          <div key={b.label} className="rounded-md depth-edge bg-panel-2 p-3">
            <dt className="flex items-center gap-1.5 text-sm font-semibold text-body">
              <ClipboardPaste className="h-3.5 w-3.5 text-accent" /> {b.label}
            </dt>
            <dd className="mt-0.5 text-sm text-muted">{b.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function CommandTroubleshooting({ courseId }: { courseId: string }) {
  const errors = commonErrors(courseId);

  return (
    <div className="space-y-4">
      <TerminalBasics />

      <div className="rounded-lg border border-danger-line bg-danger-soft p-5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <AlertTriangle className="h-4 w-4 text-danger" /> {COPY.errorsTitle}
        </h3>
        <p className="mt-1 text-sm text-muted">{COPY.errorsIntro}</p>
        <ul className="mt-3 space-y-2.5">
          {errors.map((e) => (
            <li key={e.symptom} className="rounded-md border border-danger-line bg-panel p-3">
              <p className="font-mono text-xs font-semibold text-danger">{e.symptom}</p>
              <p className="mt-0.5 text-sm text-muted">{e.meaning}</p>
              <p className="mt-1 text-sm text-body">
                <span className="font-semibold">{COPY.fixLabel}</span>
                {e.fix}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
