'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AlertTriangle, Check, ChevronDown, ChevronUp, Copy, CornerDownRight, Eye } from 'lucide-react';
import { useLabAccess, useIacTool, fillPlaceholders, hasLabAccess, hasUnfilled, labProfile } from '@/lib/labAccess';
import { commandFor } from '@/lib/iacTool';
import { splitCommand } from '@/lib/commands';
import { toast } from '@/components/ui/Toast';
import { MachineChip } from '@/components/MachineChip';
import { MACHINES, shellPrompt, type MachineId } from '@/lib/serverTopology';

/**
 * A step's command(s). With structured `commands` (preferred), each shell
 * statement gets its own copyable line + a one-line explanation; a single
 * `command` string is auto-split for visual clarity. A "Copy all" appears for
 * multi-statement commands so students can still paste the whole sequence.
 *
 * R78-C1: split out of `TaskComponents.tsx` (1,149 lines) so the command
 * rendering, the step body and the checklist row are three files a reader can
 * find by name. Nothing here changed.
 */
export type CommandEntry = {
  cmd: string;
  explain?: string;
  flags?: { flag: string; meaning: string }[];
  /** Which machine this line is typed into — see `MACHINES`. */
  on?: string;
  /** What it prints when it worked, behind one press. */
  sample?: string;
};

// IP-like tokens (incl. lab placeholders such as 10.10.100.N / .X / .<#>).
const IP_TOKEN = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.[0-9A-Za-z<>#/.N-]*)/g;
const IP_ONE = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.[0-9A-Za-z<>#/.N-]*$/;

/** Terminal syntax highlight matching the course-overview look: comment lines
 *  (starting with #) are dimmed, IP addresses are tinted. Everything else is the
 *  base terminal green. Purely visual; the copied text is always the raw command. */
function HighlightedCommand({ cmd }: { cmd: string }) {
  const lines = cmd.split('\n');
  return (
    <span className="whitespace-pre-wrap [overflow-wrap:anywhere]">
      {lines.map((line, li) => {
        const prefix = li > 0 ? '\n' : '';
        if (line.trimStart().startsWith('#')) {
          return (
            <span key={li} style={{ color: 'var(--color-term-dim)' }}>
              {prefix}
              {line}
            </span>
          );
        }
        const parts = line.split(IP_TOKEN);
        return (
          <span key={li}>
            {prefix}
            {parts.map((part, pi) =>
              IP_ONE.test(part) ? (
                <span key={pi} style={{ color: 'var(--color-term-ip)' }}>
                  {part}
                </span>
              ) : (
                <span key={pi}>{part}</span>
              )
            )}
          </span>
        );
      })}
    </span>
  );
}

export function CommandBlock({
  command,
  commands,
  compact = false,
}: {
  command?: string;
  commands?: CommandEntry[];
  /** The key-points view. It does NOT hide the reason a command exists — that
   *  was R71's mistake and the first thing students noticed. It hides the
   *  sample output and the flag breakdowns, which are reference, not reading. */
  compact?: boolean;
}) {
  const params = useParams();
  const courseId = typeof params?.courseId === 'string' ? params.courseId : Array.isArray(params?.courseId) ? params.courseId[0] : '';
  const lab = useLabAccess(courseId);
  const tool = useIacTool(courseId);

  const raw: CommandEntry[] =
    commands && commands.length > 0
      ? commands
      : command
        ? splitCommand(command).map((c) => ({ cmd: c }))
        : [];
  if (raw.length === 0) return null;
  // Substitute the student's lab values (target IPs, etc.) into the commands.
  // The student's IaC tool first (terraform → tofu where the binary is invoked,
  // or the authored OpenTofu install line), then their lab values.
  const list = raw.map((c) => ({ ...c, cmd: fillPlaceholders(commandFor(c, tool), lab.values) }));
  const multi = list.length > 1;
  const allText = list.map((c) => c.cmd).join('\n');
  // Warn when a command still carries an unfilled placeholder (e.g. <YOUR_TARGET_IP>,
  // 10.10.100.X) — a beginner would otherwise copy the literal token and hit a
  // confusing failure. Points them at the Lab access panel that fills it in, so
  // it is gated on the course HAVING one: a course with an empty lab profile
  // renders no panel (LabAccessPanel returns null), and the #lab-access anchor
  // it links to does not exist there. Same rule CommandTroubleshooting applies
  // to its "still shows 10.10.100.X" row.
  const stillUnfilled = hasLabAccess(courseId) && list.some((c) => hasUnfilled(c.cmd));
  // Name the placeholder THIS course uses. Hardcoding the attack lab's
  // 10.10.100.X told a Server+ student to go and set a "target IP" that their
  // course does not have and their panel never offered.
  const exampleToken = labProfile(courseId).fields[0]?.tokens[0] ?? '<YOUR_TARGET_IP>';
  // Lower-case only the first letter: the labels start with "Your …", and
  // lower-casing the lot turned "Your Proxmox host address" into "proxmox".
  const rawLabel = labProfile(courseId).fields[0]?.label ?? 'Your target IP';
  const exampleLabel = rawLabel.charAt(0).toLowerCase() + rawLabel.slice(1);
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-muted">
          {multi ? `Commands · run one at a time` : 'Command'}
        </div>
        {multi && <CopyButton text={allText} label="Copy all" />}
      </div>
      {stillUnfilled && (
        <Link
          href={`/courses/${courseId}#lab-access`}
          className="mt-1 flex items-start gap-1.5 rounded-md border border-warn-line bg-warn-soft px-2.5 py-1.5 text-xs text-ink transition-colors hover:opacity-80"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            This still shows a placeholder like <span className="font-mono">{exampleToken}</span>. Set{' '}
            {exampleLabel} in <span className="font-semibold underline">Lab access</span> and it fills in
            automatically.
          </span>
        </Link>
      )}
      <div className="mt-1 space-y-2">
        {list.map((c, i) => (
          <CommandRow key={i} c={c} index={i} multi={multi} compact={compact} />
        ))}
      </div>
    </div>
  );
}

/**
 * One command, with the three things a student needs before they type it:
 * WHICH MACHINE (the chip on top), WHAT IT DOES (`explain`, always visible),
 * and WHAT IT SHOULD PRINT (`sample`, one press away).
 *
 * The chip is not decoration. Steps span machines, and a PowerShell line and a
 * bash line are the same green text without it — which is exactly how a student
 * ends up running the Windows DNS cmdlet on the Proxmox host.
 *
 * `compact` (the key-points view) hides the sample and the flag breakdown. It
 * never hides `explain`: a command with no reason beside it is the thing this
 * course was criticised for.
 */
function CommandRow({ c, index, multi, compact = false }: { c: CommandEntry; index: number; multi: boolean; compact?: boolean }) {
  const [showFlags, setShowFlags] = React.useState(false);
  const [showSample, setShowSample] = React.useState(false);
  // Key points keeps the reason and the sample; the flag-by-flag breakdown is
  // reference material, so that is what it folds away.
  const hasFlags = !compact && !!(c.flags && c.flags.length > 0);
  const on = c.on && c.on in MACHINES ? (c.on as MachineId) : undefined;
  return (
    <div>
      {on && <MachineChip on={on} />}
      <div
        className={`relative p-3 pr-20 font-mono text-sm ${on ? 'rounded-b-lg rounded-tr-lg' : 'rounded-lg'}`}
        style={{ background: 'var(--color-term-bg)', color: 'var(--color-term-tx)' }}
      >
        <div className="absolute right-2 top-2">
          <CopyButton text={c.cmd} />
        </div>
        {multi && (
          <span className="mr-2 select-none" style={{ color: 'var(--color-term-dim)' }}>{index + 1}</span>
        )}
        <HighlightedCommand cmd={c.cmd} />
      </div>
      {c.explain && (
        <p className="mt-1 flex gap-1.5 pl-1 text-xs text-muted">
          <CornerDownRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
          <span>{c.explain}</span>
        </p>
      )}
      {/* What the screen should show. A beginner cannot tell a working command
          from a broken one without this, and pasting the whole expected screen
          under every line would bury the commands — so it is one press. */}
      {c.sample && (
        <div className="mt-1 pl-6">
          <button
            type="button"
            onClick={() => setShowSample((v) => !v)}
            aria-expanded={showSample}
            className="inline-flex items-center gap-1 text-2xs font-medium text-ok hover:opacity-80"
          >
            <Eye className="h-3 w-3" />
            {showSample ? 'Hide what it prints' : 'What it prints'}
          </button>
          {showSample && (
            <pre
              className="mt-1 overflow-x-auto rounded-md p-2.5 font-mono text-2xs leading-relaxed"
              style={{ background: 'var(--color-term-bg)', color: 'var(--color-term-dim)' }}
            >
              {on && (
                <span className="select-none" style={{ color: 'var(--color-term-ip)' }}>
                  {shellPrompt(on)}{' '}
                </span>
              )}
              <span className="select-none">{c.cmd.split('\n')[0]}</span>
              {'\n'}
              <span style={{ color: 'var(--color-term-tx)' }}>{c.sample}</span>
            </pre>
          )}
        </div>
      )}
      {hasFlags && (
        <div className="mt-1 pl-6">
          <button
            type="button"
            onClick={() => setShowFlags((v) => !v)}
            aria-expanded={showFlags}
            className="inline-flex items-center gap-1 text-2xs font-medium text-ok hover:opacity-80"
          >
            {showFlags ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showFlags ? 'Hide the parts' : 'What each part means'}
          </button>
          {showFlags && (
            <ul className="mt-1 space-y-0.5">
              {c.flags!.map((f) => (
                <li key={f.flag} className="flex gap-2 text-xs text-muted">
                  <code className="shrink-0 font-mono font-semibold text-ok">
                    {f.flag}
                  </code>
                  <span>{f.meaning}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ message: 'Could not copy — select the text and copy manually.', variant: 'error' });
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied to clipboard' : label}
      className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-xs text-accent-contrast hover:bg-accent-strong"
    >
      {copied ? <Check className="h-3 w-3" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
      <span aria-hidden>{copied ? 'Copied' : label}</span>
      <span role="status" className="sr-only">
        {copied ? 'Copied to clipboard' : ''}
      </span>
    </button>
  );
}
