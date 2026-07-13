'use client';

import { useState } from 'react';
import { FileCheck2, Copy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { validateEvidenceFileName } from '@/lib/utils';
import { toast } from '@/lib/toastBus';

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
 */
export function EvidenceHasher() {
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
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
        <FileCheck2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        Hash &amp; log evidence
      </h3>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Drop a screenshot, log or capture below. Your browser computes its{' '}
        <span className="font-mono text-xs">SHA-256</span> locally — <strong>the file never leaves your
        device</strong> — then copy the row into your Evidence Log. This is the real chain-of-custody hash step.
      </p>

      <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/50 dark:border-gray-600 dark:bg-gray-900/40 dark:hover:border-indigo-500">
        <FileCheck2 className="h-6 w-6 text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {busy ? 'Hashing…' : 'Choose or drop evidence files'}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Hashed in-browser · nothing uploaded</span>
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
            <li key={`${it.name}-${i}`} className="rounded-md border border-gray-200 p-2.5 dark:border-gray-700">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-mono text-xs text-gray-800 dark:text-gray-200">
                  {it.nameOk ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                  {it.name}
                  <span className="text-gray-400">· {humanSize(it.size)}</span>
                </span>
                <button
                  onClick={() => copyRow(it)}
                  className="flex items-center gap-1 rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Copy className="h-3 w-3" /> Copy row
                </button>
              </div>
              <div className="mt-1 break-all font-mono text-[11px] text-gray-500 dark:text-gray-400">
                SHA-256: {it.sha256}
              </div>
              {!it.nameOk && (
                <div className="mt-0.5 text-[11px] text-amber-600 dark:text-amber-400">{it.nameMsg}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
