'use client';

import { AlertTriangle, Download } from 'lucide-react';
import type { Step } from '@/lib/types';
import { StepFlow } from '@/components/diagrams/StepFlow';
import { TreeNode } from '@/components/docs/FolderTree';
import { GlossaryText } from '@/components/GlossaryText';
import { CopyButton } from './CommandBlock';

/** A file `source` that reads as a shell command (so we render a copyable line)
 *  rather than prose or a URL. Matches common lab CLI verbs at the start. */
function isCommandLike(source: string): boolean {
  return /^(git|sudo|curl|wget|apt|apt-get|dnf|yum|docker|python3?|pip3?|npm|ssh|scp|tar|unzip|chmod|mkdir|cd|cp|mv|cat|echo|bash|sh|powershell|msiexec|choco|Invoke-)\b/.test(
    source.trim()
  );
}

function isUrl(source: string): boolean {
  // Root-relative paths count too: course downloads (starter packs, guide
  // PDFs) are served from /downloads/ on this same host, and rendering them
  // as plain text instead of a link made the file unreachable from the step.
  const s = source.trim();
  return /^https?:\/\//i.test(s) || s.startsWith('/');
}

/** Does this step have a third tier at all? */
export function hasWhy(step: Step): boolean {
  return !!(step.whatItMeans || step.troubleshooting || step.fixes?.length || step.path?.length || step.tree || step.files?.length);
}

/** What the closed bar says the tier holds. */
export function whyHint(step: Step): string {
  return [
    step.whatItMeans ? 'why this works' : '',
    step.path?.length ? 'the path' : '',
    step.files?.length || step.tree ? 'your files' : '',
    step.troubleshooting || step.fixes?.length ? 'if it breaks' : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * Tier 2 of a step — why it works, the path, the files, and what to do when it
 * does not work. For the student who wants to know, or who is stuck; never in
 * the way of the one who is doing it.
 */
export function StepWhy({ step }: { step: Step }) {
  const { whatItMeans, troubleshooting, fixes, path, files, tree } = step;
  return (
    <div className="space-y-3 pr-2">
      {/* A tiny node→arrow→node "follow the path" for this step. */}
      {path && path.length > 0 && <StepFlow path={path} />}
      {/* Pre-setup the step silently depends on: the files/downloads/configs
          that have to exist first. A `source` that looks like a shell command
          is copyable. */}
      {files && files.length > 0 && (
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-muted">
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Files this step needs
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {files.map((f) => (
              <li key={f.name} className="text-sm text-ink">
                <span className="font-semibold">{f.name}</span>
                <span className="text-body"> — {f.purpose}</span>
                {f.source &&
                  (isCommandLike(f.source) ? (
                    <div className="mt-1">
                      <CopyButton text={f.source} label={f.source} />
                    </div>
                  ) : isUrl(f.source) ? (
                    <a href={f.source} target="_blank" rel="noreferrer" className="mt-0.5 block break-all text-xs font-medium text-accent underline">
                      {f.source}
                    </a>
                  ) : (
                    <div className="mt-0.5 text-xs text-accent">{f.source}</div>
                  ))}
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* What the step should leave on disk — a small example tree. */}
      {tree && (
        <div>
          <div className="text-xs font-semibold text-muted">What your files should look like</div>
          <ul className="mt-1.5 space-y-1 rounded-md depth-edge bg-panel-2 p-3">
            <TreeNode node={tree} />
          </ul>
        </div>
      )}
      {whatItMeans && (
        <p className="text-sm text-muted">
          <span className="font-semibold text-body">Why: </span>
          <GlossaryText text={whatItMeans} />
        </p>
      )}
      {troubleshooting && (
        <p className="flex gap-2 text-sm text-ink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <span>
            <span className="font-medium">If it doesn&apos;t work:</span> {troubleshooting}
          </span>
        </p>
      )}
      {/* Independent failure modes, one row each — a student scanning for
          their symptom has to be able to find it. */}
      {fixes && fixes.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-medium text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
            If it doesn&apos;t work
          </div>
          <ul className="space-y-1.5">
            {fixes.map((f, i) => (
              <li key={i} className="text-sm text-ink">
                <span className="font-medium">{f.symptom}</span>{' '}
                <span className="text-body">
                  <GlossaryText text={f.fix} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
