'use client';

import { useState } from 'react';
import { FileCheck2, Copy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { validateEvidenceFileName } from '@/lib/utils';
import { toast } from '@/lib/toastBus';
import { evidenceRepo } from '@/lib/data';

interface Hashed {
  name: string;
  size: number;
  sha256: string;
  nameOk: boolean;
  nameMsg: string;
}

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function humanSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Real chain-of-custody tooling with no backend: the student drops an evidence
 * file (screenshot / log / pcap) and the browser computes its SHA-256 locally —
 * the file never leaves the device. They copy the ready Evidence-Log row (name,
 * size, hash) into their Evidence Log / Audit Evidence Packet. This is the actual
 * `sha256sum` step, performed in-app, instead of only being described.
 *
 * Each hash is also RECORDED to the evidence ledger when the caller supplies a
 * course and member. Previously the hash existed only in component state and on
 * the clipboard, so the platform had no record that the student ever produced the
 * artifact — the file's own hash is the custody record worth keeping, per
 * docs/adr/0004-content-addressed-evidence.md. The file itself is still never
 * uploaded.
 */
export function EvidenceHasher({
  courseId,
  memberId,
  week,
}: {
  courseId?: string;
  memberId?: string;
  week?: number;
} = {}) {
  const [items, setItems] = useState<Hashed[]>([]);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const hashed: Hashed[] = [];
      for (const file of Array.from(files)) {
        const sha256 = await sha256Hex(file);
        const check = validateEvidenceFileName(file.name);
        hashed.push({ name: file.name, size: file.size, sha256, nameOk: check.valid, nameMsg: check.message });
        if (courseId && memberId) {
          evidenceRepo.saveArtifact(memberId, {
            courseId,
            sha256,
            filename: file.name,
            sizeBytes: file.size,
            week,
            nameOk: check.valid,
            hashedAt: Date.now(),
          });
        }
      }
      setItems((prev) => [...hashed, ...prev]);
    } catch {
      toast({ message: 'Could not hash that file in this browser.', variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  function copyRow(it: Hashed) {
    const date = new Date().toISOString().slice(0, 16).replace('T', ' ');
    // Evidence-Log-shaped row: filename, collected date/time, size, SHA-256.
    const row = `${it.name},${date},${humanSize(it.size)},${it.sha256}`;
    navigator.clipboard?.writeText(row).then(
      () => toast({ message: 'Evidence row copied — paste it into your Evidence Log.', variant: 'success' }),
      () => toast({ message: 'Copy failed.', variant: 'error' })
    );
  }

  return (
    <div className="rounded-lg border border-line bg-panel p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
        <FileCheck2 className="h-4 w-4 text-accent" />
        Hash &amp; log evidence
      </h3>
      <p className="mt-1 text-sm text-muted">
        Drop a screenshot, log or capture below. Your browser computes its{' '}
        <span className="font-mono text-xs">SHA-256</span> locally — <strong>the file never leaves your
        device</strong> — then copy the row into your Evidence Log. This is the real chain-of-custody hash step.
      </p>

      <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line bg-panel-2 px-4 py-6 text-center transition-colors hover:border-accent hover:bg-accent-soft/50">
        <FileCheck2 className="h-6 w-6 text-muted" />
        <span className="text-sm font-medium text-body">
          {busy ? 'Hashing…' : 'Choose or drop evidence files'}
        </span>
        <span className="text-xs text-muted">Hashed in-browser · nothing uploaded</span>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>

      {items.length > 0 && (
        <ul className="mt-3 space-y-2">
          {items.map((it, i) => (
            <li key={`${it.name}-${i}`} className="rounded-md border border-line p-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-mono text-xs text-ink">
                  {it.nameOk ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-ok" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-warn" />
                  )}
                  {it.name}
                  <span className="text-muted">· {humanSize(it.size)}</span>
                </span>
                <button
                  onClick={() => copyRow(it)}
                  className="flex items-center gap-1 rounded border border-line px-2 py-0.5 text-xs text-muted hover:bg-panel-2"
                >
                  <Copy className="h-3 w-3" /> Copy row
                </button>
              </div>
              <div className="mt-1 break-all font-mono text-[11px] text-muted">
                SHA-256: {it.sha256}
              </div>
              {!it.nameOk && (
                <div className="mt-0.5 text-[11px] text-warn">{it.nameMsg}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
