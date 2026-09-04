'use client';

import { useState } from 'react';
import { Package, Trash2, AlertTriangle, CheckCircle2, FileCheck2 } from 'lucide-react';
import { validateEvidenceFileName } from '@/lib/utils';
import { evidenceRepo } from '@/lib/data';
import { toast } from '@/lib/toastBus';
import { buildWeekPackage, weekPackageFileName, WeekAttachment } from '@/lib/docs/package';
import { DeliverableData } from '@/lib/docs/types';
import { DocMeta } from '@/lib/docs/report';
import { RoleDef } from '@/lib/types';

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
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

interface Attached extends WeekAttachment {
  nameOk: boolean;
  nameMsg: string;
}

/**
 * Per-week evidence packager. Students attach their screenshots/captures for the
 * week; each is hashed (SHA-256) in-browser, then "Download this week's package"
 * bundles the week's filled deliverable(s) + the attachments + a populated
 * chain-of-custody log into one zip. Attachments live only in memory (no upload,
 * no localStorage) — they're bundled on download and cleared on refresh.
 *
 * Each attachment's SHA-256 is recorded to the evidence ledger when `memberId` is
 * supplied. The file still never leaves the device; the hash is what makes the
 * custody claim durable rather than existing only inside a zip the student
 * downloaded once.
 */
export function WeekEvidencePackager({
  week,
  courseId,
  saved,
  meta,
  roles,
  memberId,
}: {
  week: number;
  courseId: string;
  saved: Record<string, DeliverableData>;
  meta: DocMeta;
  roles?: RoleDef[];
  memberId?: string;
}) {
  const [items, setItems] = useState<Attached[]>([]);
  const [busy, setBusy] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const added: Attached[] = [];
      for (const file of Array.from(files)) {
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const sha256 = await sha256Hex(buf);
        const check = validateEvidenceFileName(file.name);
        added.push({ name: file.name, bytes, size: file.size, sha256, nameOk: check.valid, nameMsg: check.message });
        // The bytes stay in memory and go only into the downloaded zip, but the
        // hash is worth keeping: it is the custody record proving this artifact
        // existed, unchanged, at this moment.
        if (memberId) {
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
      setItems((prev) => [...added, ...prev]);
    } catch {
      toast({ message: 'Could not read that file in this browser.', variant: 'error' });
    } finally {
      setBusy(false);
    }
  }

  function removeAt(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function downloadPackage() {
    try {
      const bytes = buildWeekPackage(
        saved,
        meta,
        courseId,
        week,
        items.map(({ name, bytes, sha256, size }) => ({ name, bytes, sha256, size })),
        roles
      );
      const blob = new Blob([bytes as BlobPart], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = weekPackageFileName(meta, week);
      a.click();
      URL.revokeObjectURL(url);
      toast({ message: `Week ${week} package downloaded.`, variant: 'success' });
    } catch {
      toast({ message: 'Could not build the package in this browser.', variant: 'error' });
    }
  }

  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
        <Package className="h-5 w-5 text-accent" />
        This week&apos;s evidence package
      </h2>
      <p className="mt-1 text-sm text-muted">
        Fill your form(s) above, then attach your screenshots and captures here. Each file is hashed in your
        browser (<span className="font-mono text-xs">SHA-256</span>). <strong>Download this week&apos;s package</strong>{' '}
        bundles the filled report, your evidence, and a chain-of-custody log into one zip — a clean, week-numbered
        folder you can hand in.
      </p>

      <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-line bg-panel-2 px-4 py-6 text-center transition-colors hover:border-accent hover:bg-accent-soft/50">
        <FileCheck2 className="h-6 w-6 text-muted" />
        <span className="text-sm font-medium text-body">
          {busy ? 'Hashing…' : 'Choose or drop this week’s evidence files'}
        </span>
        <span className="text-xs text-muted">Hashed in-browser · nothing is uploaded</span>
        <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
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
                  onClick={() => removeAt(i)}
                  className="flex items-center gap-1 rounded border border-line px-2 py-0.5 text-xs text-muted hover:bg-panel-2"
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </div>
              <div className="mt-1 break-all font-mono text-2xs text-muted">
                SHA-256: {it.sha256}
              </div>
              {!it.nameOk && <div className="mt-0.5 text-2xs text-warn">{it.nameMsg}</div>}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={downloadPackage}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-contrast hover:bg-accent-strong"
        >
          <Package className="h-4 w-4" /> Download this week&apos;s package (.zip)
        </button>
        <span className="text-xs text-muted">
          {items.length > 0
            ? `${items.length} file(s) attached`
            : 'You can download now (form only) and re-download after attaching evidence.'}
        </span>
      </div>

      <p className="mt-2 text-xs text-warn">
        Attachments are held in this page only and are bundled when you download — they are <strong>not saved</strong>
        {' '}after a refresh. Your typed form answers are saved as usual.
      </p>
    </section>
  );
}
