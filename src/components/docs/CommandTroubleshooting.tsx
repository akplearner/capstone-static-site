'use client';

import { Terminal, AlertTriangle, ClipboardPaste } from 'lucide-react';
import { hasLabAccess, labProfile } from '@/lib/labAccess';

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
 * So the rows are composed from what the course actually has, read from
 * `labAccess.ts` rather than from a course-id list: `hasLabAccess` says whether
 * there is a Lab access panel to send anyone to, and an ATTACKER_IP field says
 * whether this is an attack-and-defend lab where nmap/hydra are the tools in
 * hand. A course with neither still gets every generic terminal fix — which is
 * the whole point of the section — and never an instruction it cannot follow.
 */

const TERMINAL_BASICS: { label: string; body: string }[] = [
  // Named generically, not "on Kali": this component renders on every course,
  // and a deployment course has no attacker box — its terminals are the
  // hypervisor host's shell, the Proxmox console and the servers themselves.
  { label: 'Open a terminal', body: 'On a Linux desktop, click the black terminal icon or press Ctrl+Alt+T. On a server you reach over SSH, the terminal is the session itself. You type commands here and press Enter to run them.' },
  { label: 'The prompt', body: 'A line ending in $ (or #) is the prompt — it means the terminal is waiting for you. You don’t type the $ itself.' },
  { label: 'Paste a command', body: 'Copy from this site, then in the terminal press Ctrl+Shift+V (plain Ctrl+V often does nothing in a terminal). Right-click → Paste also works.' },
  { label: 'Run one line at a time', body: 'When a step shows several numbered commands, run them one by one — paste one, press Enter, wait for it to finish, then the next.' },
  { label: 'sudo = run as admin', body: 'sudo runs a command with admin rights (it may ask for your password — typing shows nothing, that’s normal). On Windows/PowerShell, instead right-click PowerShell → “Run as administrator”.' },
  { label: 'Stop a stuck command', body: 'Press Ctrl+C to cancel a command that hangs or runs forever (e.g. a ping with no -c limit).' },
];

interface ErrorRow {
  symptom: string;
  meaning: string;
  fix: string;
}

/** What this course's lab gives a student, so a fix never names something they
 *  do not have. Derived from the course's own lab profile — a course that drops
 *  the attacker or the whole panel loses the matching sentences automatically. */
function labShape(courseId: string): { panel: boolean; attackTools: boolean } {
  return {
    panel: hasLabAccess(courseId),
    attackTools: labProfile(courseId).fields.some((f) => f.key === 'ATTACKER_IP'),
  };
}

function commonErrors(courseId: string): ErrorRow[] {
  const { panel, attackTools } = labShape(courseId);
  const rows: ErrorRow[] = [
    {
      symptom: 'command not found',
      meaning: 'The terminal doesn’t recognise the program — usually a typo or the tool isn’t installed.',
      fix:
        'Check the spelling. If it’s really missing, install it: sudo apt update && sudo apt install <tool>' +
        (attackTools ? ' (e.g. nmap, nikto, hydra).' : ' — the step that first uses a tool says how to install it.'),
    },
    {
      symptom: 'Permission denied / Operation not permitted',
      meaning: 'The command needs admin rights.',
      fix: 'Add sudo in front on Linux (sudo <command>). On Windows/PowerShell, close it and reopen with “Run as administrator”.',
    },
    {
      symptom: 'Connection refused / No route to host / host seems down',
      meaning: 'You can’t reach the target — it’s off, the IP is wrong, or you’re not on the right network.',
      fix:
        'ping the address first. Confirm the machine is powered on and that you are on the same subnet as it' +
        (panel ? ', and that you set the right IP in Lab access.' : ' — a host in another zone only answers once the route between them exists.') +
        (attackTools ? ' For nmap, add -Pn to scan a host that blocks ping.' : ''),
    },
    {
      symptom: 'No such file or directory',
      meaning: 'You’re in the wrong folder, or the path/filename is wrong.',
      fix:
        'Run pwd to see where you are and cd ~ to go home.' +
        (attackTools
          ? ' For hydra, rockyou is gzipped by default — unzip it once: sudo gunzip /usr/share/wordlists/rockyou.txt.gz'
          : ' Check the file really exists with ls before you edit it — a config path is easy to mistype.'),
    },
  ];

  // Only a course with a Lab access panel can be told to open one. Without the
  // panel there is no placeholder substitution either, so the row has no subject.
  if (panel) {
    rows.push({
      symptom: 'The command still shows 10.10.100.X or <YOUR_TARGET_IP>',
      meaning: 'That’s a placeholder, not a real address — you copied it literally.',
      fix: 'Open the Lab access panel (Week 0) and enter your target IP; the site then fills it into every command automatically.',
    });
  }

  rows.push(
    {
      symptom: 'It just hangs / never finishes',
      meaning: 'Some commands (a bare ping, a large download, a package install) run until you stop them, or they’re waiting on a slow or unreachable host.',
      fix:
        'Press Ctrl+C to stop it. Re-check reachability (ping), and give a genuinely long job a minute' +
        (attackTools ? ' — an all-port nmap is slow.' : ' — an OS install or a big apt upgrade takes minutes, not seconds.'),
    },
    {
      symptom: 'Read the last line first',
      meaning: 'When anything fails, the error’s last line usually names the real problem.',
      fix: 'Match that line to the rows above. Also double-check you’re on the machine the step’s WHERE chip names — running the right command on the wrong host is the most common cause.',
    }
  );

  return rows;
}

/** The "terminal basics" reference on its own — reused inline on command steps
 *  (a collapsed "New to the terminal?" toggle) as well as here on the Guide.
 *  Course-independent by construction: everything it says is true of any shell,
 *  which is why it takes no courseId. */
export function TerminalBasics() {
  return (
    <div className="rounded-lg border border-line bg-panel p-5">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
        <Terminal className="h-4 w-4 text-accent" /> Terminal basics
      </h3>
      <p className="mt-1 text-sm text-muted">
        New to the command line? These are the only things you need to know to run every command in this course.
      </p>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {TERMINAL_BASICS.map((b) => (
          <div key={b.label} className="rounded-md border border-line bg-panel-2 p-3">
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
          <AlertTriangle className="h-4 w-4 text-danger" /> When a command won’t run
        </h3>
        <p className="mt-1 text-sm text-muted">
          The errors almost everyone hits, and the one-line fix for each. Match the message you see to a row.
        </p>
        <ul className="mt-3 space-y-2.5">
          {errors.map((e) => (
            <li key={e.symptom} className="rounded-md border border-danger-line bg-panel p-3">
              <p className="font-mono text-xs font-semibold text-danger">{e.symptom}</p>
              <p className="mt-0.5 text-sm text-muted">{e.meaning}</p>
              <p className="mt-1 text-sm text-body">
                <span className="font-semibold">Fix: </span>
                {e.fix}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
