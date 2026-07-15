'use client';

import { Terminal, AlertTriangle, ClipboardPaste } from 'lucide-react';

/**
 * Two beginner references that live on the Guide and are linked from every step
 * and the Lab access panel:
 *   1. Terminal basics — how to open a terminal, paste, and run.
 *   2. "When a command won't run" — the universal errors a beginner hits and the
 *      one-line fix for each, so a stuck student always has somewhere to look.
 */

const TERMINAL_BASICS: { label: string; body: string }[] = [
  { label: 'Open a terminal', body: 'On Kali, click the black terminal icon in the top bar (or press Ctrl+Alt+T). You type commands here and press Enter to run them.' },
  { label: 'The prompt', body: 'A line ending in $ (or #) is the prompt — it means the terminal is waiting for you. You don’t type the $ itself.' },
  { label: 'Paste a command', body: 'Copy from this site, then in the terminal press Ctrl+Shift+V (plain Ctrl+V often does nothing in a terminal). Right-click → Paste also works.' },
  { label: 'Run one line at a time', body: 'When a step shows several numbered commands, run them one by one — paste one, press Enter, wait for it to finish, then the next.' },
  { label: 'sudo = run as admin', body: 'sudo runs a command with admin rights (it may ask for your password — typing shows nothing, that’s normal). On Windows/PowerShell, instead right-click PowerShell → “Run as administrator”.' },
  { label: 'Stop a stuck command', body: 'Press Ctrl+C to cancel a command that hangs or runs forever (e.g. a ping with no -c limit).' },
];

const COMMON_ERRORS: { symptom: string; meaning: string; fix: string }[] = [
  {
    symptom: 'command not found',
    meaning: 'The terminal doesn’t recognise the program — usually a typo or the tool isn’t installed.',
    fix: 'Check the spelling. If it’s really missing, install it: sudo apt update && sudo apt install <tool> (e.g. nmap, nikto, hydra).',
  },
  {
    symptom: 'Permission denied / Operation not permitted',
    meaning: 'The command needs admin rights.',
    fix: 'Add sudo in front on Linux (sudo <command>). On Windows/PowerShell, close it and reopen with “Run as administrator”.',
  },
  {
    symptom: 'Connection refused / No route to host / host seems down',
    meaning: 'You can’t reach the target — it’s off, the IP is wrong, or you’re not on the lab network.',
    fix: 'ping your target first. Confirm the target VM is powered on and on the same lab subnet, and that you set the right IP in Lab access. For nmap, add -Pn to scan a host that blocks ping.',
  },
  {
    symptom: 'No such file or directory',
    meaning: 'You’re in the wrong folder, or the path/filename is wrong.',
    fix: 'Run pwd to see where you are and cd ~ to go home. For hydra, rockyou is gzipped by default — unzip it once: sudo gunzip /usr/share/wordlists/rockyou.txt.gz',
  },
  {
    symptom: 'The command still shows 10.10.100.X or <YOUR_TARGET_IP>',
    meaning: 'That’s a placeholder, not a real address — you copied it literally.',
    fix: 'Open the Lab access panel (Week 0) and enter your target IP; the site then fills it into every command automatically.',
  },
  {
    symptom: 'It just hangs / never finishes',
    meaning: 'Some commands (a bare ping, a big scan) run until you stop them, or they’re waiting on a slow/unreachable host.',
    fix: 'Press Ctrl+C to stop it. Re-check reachability (ping), and for scans give it a minute — all-port nmap is slow.',
  },
  {
    symptom: 'Read the last line first',
    meaning: 'When anything fails, the error’s last line usually names the real problem.',
    fix: 'Match that line to the rows above. Also double-check you’re on the right machine (Kali for attacks, Ubuntu/Windows for defending).',
  },
];

export function CommandTroubleshooting() {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <Terminal className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Terminal basics
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          New to the command line? These are the only things you need to know to run every command in this course.
        </p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {TERMINAL_BASICS.map((b) => (
            <div key={b.label} className="rounded-md border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/40">
              <dt className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200">
                <ClipboardPaste className="h-3.5 w-3.5 text-blue-500" /> {b.label}
              </dt>
              <dd className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{b.body}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-5 dark:border-rose-900 dark:bg-rose-900/10">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
          <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" /> When a command won’t run
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          The errors almost everyone hits, and the one-line fix for each. Match the message you see to a row.
        </p>
        <ul className="mt-3 space-y-2.5">
          {COMMON_ERRORS.map((e) => (
            <li key={e.symptom} className="rounded-md border border-rose-100 bg-white p-3 dark:border-rose-900/50 dark:bg-gray-800">
              <p className="font-mono text-xs font-semibold text-rose-700 dark:text-rose-300">{e.symptom}</p>
              <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{e.meaning}</p>
              <p className="mt-1 text-sm text-gray-800 dark:text-gray-200">
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
