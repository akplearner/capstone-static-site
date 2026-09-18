/**
 * Terminal basics and "when a command won't run", as DATA.
 *
 * Both render on every course, so neither may assume the security lab. The error
 * rows used to be built by concatenating conditional strings inside
 * `CommandTroubleshooting.tsx` — `fix: base + (attackTools ? … : …) + (panel ? …
 * : '')` — which is why they could not be exported, translated or edited: half of
 * each sentence only existed at render time.
 *
 * They are rows now. A row states which lab capabilities it needs (`when`), and
 * the two-way sentences it grows or drops (`variants`). The capabilities are read
 * from the course's own lab profile in `labAccess.ts`, exactly as before: a
 * course with no Lab access panel is never told to open one, and a course with no
 * attacker box is never told to add `-Pn` to nmap.
 */
import { HOST, OPS } from '../serverTopology';

/** What a course's lab gives a student. Every one is sniffed from the lab
 *  profile rather than a course-id list — drop the field and the rows that
 *  depend on it go with it. */
export type LabCapability = 'panel' | 'attackTools' | 'remote' | 'ops';

export interface TerminalBasic {
  label: string;
  body: string;
}

/**
 * Named generically, not "on Kali": this renders on every course, and a
 * deployment course has no attacker box — its terminals are the hypervisor
 * host's shell, the Proxmox console and the servers themselves.
 */
export const TERMINAL_BASICS: TerminalBasic[] = [
  { label: 'Open a terminal', body: 'On a Linux desktop, click the black terminal icon or press Ctrl+Alt+T. On a server you reach over SSH, the terminal is the session itself. You type commands here and press Enter to run them.' },
  { label: 'The prompt', body: 'A line ending in $ (or #) is the prompt — it means the terminal is waiting for you. You don’t type the $ itself.' },
  { label: 'Paste a command', body: 'Copy from this site, then in the terminal press Ctrl+Shift+V (plain Ctrl+V often does nothing in a terminal). Right-click → Paste also works.' },
  { label: 'Run one line at a time', body: 'When a step shows several numbered commands, run them one by one — paste one, press Enter, wait for it to finish, then the next.' },
  { label: 'sudo = run as admin', body: 'sudo runs a command with admin rights (it may ask for your password — typing shows nothing, that’s normal). On Windows/PowerShell, instead right-click PowerShell → “Run as administrator”.' },
  { label: 'Stop a stuck command', body: 'Press Ctrl+C to cancel a command that hangs or runs forever (e.g. a ping with no -c limit).' },
];

export const TERMINAL_COPY = {
  title: 'Terminal basics',
  intro:
    'New to the command line? These are the only things you need to know to run every command in this course.',
  errorsTitle: 'When a command won’t run',
  errorsIntro:
    'The errors almost everyone hits, and the one-line fix for each. Match the message you see to a row.',
  fixLabel: 'Fix: ',
} as const;

/** A sentence a fix grows or loses depending on what the course's lab has. */
export interface FixVariant {
  when: LabCapability;
  /** Appended when the capability holds. */
  then?: string;
  /** Appended when it does not. */
  otherwise?: string;
}

export interface ErrorRow {
  symptom: string;
  meaning: string;
  fix: string;
  /** Every capability this row needs. Omitted = shown on every course. */
  needs?: LabCapability[];
  /** Applied to `fix`, in order. */
  variants?: FixVariant[];
}

/**
 * The rows, in the order they are read.
 *
 * `{token}` and `{label}` in the Lab access row are filled from the course's own
 * first lab field, because the example and the thing to go and set are the
 * course's own — that row used to name the attack lab's target IP on every
 * course, including one whose panel never offered such a field.
 */
export const ERROR_ROWS: ErrorRow[] = [
  {
    symptom: 'command not found',
    meaning: 'The terminal doesn’t recognise the program — usually a typo or the tool isn’t installed.',
    fix: 'Check the spelling. If it’s really missing, install it: sudo apt update && sudo apt install <tool>',
    variants: [
      {
        when: 'attackTools',
        then: ' (e.g. nmap, nikto, hydra).',
        otherwise: ' — the step that first uses a tool says how to install it.',
      },
    ],
  },
  {
    symptom: 'Permission denied / Operation not permitted',
    meaning: 'The command needs admin rights.',
    fix: 'Add sudo in front on Linux (sudo <command>). On Windows/PowerShell, close it and reopen with “Run as administrator”.',
  },
  {
    symptom: 'Connection refused / No route to host / host seems down',
    meaning: 'You can’t reach the target — it’s off, the IP is wrong, or you’re not on the right network.',
    fix: 'ping the address first. Confirm the machine is powered on and that you are on the same subnet as it',
    variants: [
      {
        when: 'panel',
        then: ', and that you set the right IP in Lab access.',
        otherwise: ' — a host in another zone only answers once the route between them exists.',
      },
      { when: 'attackTools', then: ' For nmap, add -Pn to scan a host that blocks ping.' },
    ],
  },
  {
    symptom: 'No such file or directory',
    meaning: 'You’re in the wrong folder, or the path/filename is wrong.',
    fix: 'Run pwd to see where you are and cd ~ to go home.',
    variants: [
      {
        when: 'attackTools',
        then: ' For hydra, rockyou is gzipped by default — unzip it once: sudo gunzip /usr/share/wordlists/rockyou.txt.gz',
        otherwise: ' Check the file really exists with ls before you edit it — a config path is easy to mistype.',
      },
    ],
  },
  {
    // Only a course with a Lab access panel can be told to open one. Without the
    // panel there is no placeholder substitution either, so the row has no subject.
    needs: ['panel'],
    symptom: 'The command still shows {token}',
    meaning: 'That’s a placeholder, not a real address — you copied it literally.',
    fix: 'Open the Lab access panel at the top of the Tasks tab and enter {label}; the site then fills it into every command automatically.',
  },
  // Remote administration: the host is reachable from off campus, so "I cannot
  // reach my server" is a different problem from "this host is on the wrong
  // network", and the answers are not the ones above.
  {
    needs: ['remote'],
    symptom: 'ssh: connect to host … Operation timed out (from home)',
    meaning: 'Your laptop is not on the tailnet, or the host is not.',
    fix: `Check the Tailscale client is signed in and connected on your laptop, then run tailscale status on the host — it must list the host as online. On campus you can still reach it on its ${HOST.rule} address while you sort this out.`,
  },
  {
    needs: ['remote'],
    symptom: 'The Proxmox console times out but SSH works',
    meaning: 'The path is fine; the web service or the port is not.',
    fix: 'Run systemctl status pveproxy --no-pager over SSH. Remember the console is on port 8006 and https, not http — a plain http:// URL simply hangs.',
  },
  {
    needs: ['remote'],
    symptom: 'It worked yesterday and not today',
    meaning: 'The host rebooted and something did not come back, or your address changed.',
    fix: 'systemctl is-active tailscaled on the host must read active. The host keeps the same Tailscale address across reboots, so if the address you saved has changed, you are looking at a rebuilt host that was re-authorised as a new device.',
  },
  {
    needs: ['remote'],
    symptom: 'Permission denied (publickey) after setting up keys',
    meaning: 'The key is not where the server expects it, or the account is wrong.',
    fix: 'Run ssh -v to see which key is offered, and confirm you are connecting as the right user. Password login is still enabled until Week 4 hardens it, so you have a way back in — use it rather than locking yourself out further.',
  },
  {
    needs: ['ops'],
    symptom: `ping ${OPS.core.obs} fails from a VM (Week 6)`,
    meaning: 'The VM cannot reach the Core over the ops network — the second NIC, the VLAN tag or the bridge is wrong.',
    fix: `On the host, ip -br a must show ${OPS.bridge} UP with the team’s ${OPS.team.node} address. Inside the VM, the second interface needs its ${OPS.team.rule}.x address and no gateway. Still nothing: the switch port is not trunking VLAN ${OPS.vlan} — the Networking deep-dive owns that.`,
  },
  {
    symptom: 'It just hangs / never finishes',
    meaning: 'Some commands (a bare ping, a large download, a package install) run until you stop them, or they’re waiting on a slow or unreachable host.',
    fix: 'Press Ctrl+C to stop it. Re-check reachability (ping), and give a genuinely long job a minute',
    variants: [
      {
        when: 'attackTools',
        then: ' — an all-port nmap is slow.',
        otherwise: ' — an OS install or a big apt upgrade takes minutes, not seconds.',
      },
    ],
  },
  {
    symptom: 'Read the last line first',
    meaning: 'When anything fails, the error’s last line usually names the real problem.',
    fix: 'Match that line to the rows above. Also double-check you’re on the machine the step’s WHERE chip names — running the right command on the wrong host is the most common cause.',
  },
];

/** The rows this course gets, with their variant sentences resolved and their
 *  placeholders filled. */
export function errorRowsFor(
  has: Record<LabCapability, boolean>,
  values: Record<string, string> = {}
): { symptom: string; meaning: string; fix: string }[] {
  const fill = (t: string) => t.replace(/\{(\w+)\}/g, (m, k) => values[k] ?? m);
  return ERROR_ROWS.filter((r) => (r.needs ?? []).every((c) => has[c])).map((r) => ({
    symptom: fill(r.symptom),
    meaning: r.meaning,
    fix: fill(
      (r.variants ?? []).reduce(
        (text, v) => text + ((has[v.when] ? v.then : v.otherwise) ?? ''),
        r.fix
      )
    ),
  }));
}
