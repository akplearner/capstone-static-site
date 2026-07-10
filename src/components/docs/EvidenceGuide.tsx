'use client';

import { Download, FileText, ShieldCheck } from 'lucide-react';
import { CommandBlock } from '@/components/TaskComponents';
import { CUSTODY_COLUMNS, CUSTODY_RULES, custodyLogCSV, custodyLogMarkdown } from '@/lib/docs/custodyTemplate';
import { EVIDENCE_LOCATION_RULE, EVIDENCE_FILE_TYPES, EVIDENCE_HANDLING } from '@/lib/evidence';

function downloadText(filename: string, text: string, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Local-first evidence handling + chain of custody. The student keeps files on their
// own machine and documents them like a real case; this teaches the method and hands
// them a ready-to-fill custody log. No upload — guidance + a template.
export function EvidenceGuide() {
  return (
    <div className="space-y-5">
      <p className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
        Your proof stays on your machine — handle it like a real case so it would hold up under scrutiny.
        Hash it, log every artifact and hand-off, and keep it in one place.
      </p>

      <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
        <span className="font-semibold">Where it lives (one rule): </span>
        {EVIDENCE_LOCATION_RULE}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">1. Name it consistently</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Every artifact: <span className="font-mono text-xs">YYYYMMDD_TeamXX_Tool_Action.ext</span> — e.g.{' '}
          <span className="font-mono text-xs">20260627_Team01_sqlmap_dbdump.png</span>. Dated, attributed,
          self-describing.
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          {EVIDENCE_FILE_TYPES.map((t) => (
            <li key={t.ext}>
              <span className="font-mono text-gray-700 dark:text-gray-300">{t.ext}</span> — {t.use}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">2. Hash on collection, verify on receipt</h3>
        <p className="mt-1 mb-2 text-sm text-gray-600 dark:text-gray-400">
          A SHA-256 fingerprint proves nothing changed. Create hashes when you collect; re-verify before you
          report or after a hand-off.
        </p>
        <CommandBlock
          commands={[
            { cmd: 'sha256sum *.png *.pcap *.txt > Evidence_Hashes.txt', explain: 'Fingerprint every artifact and save the digests beside them.' },
            { cmd: 'sha256sum -c Evidence_Hashes.txt', explain: 'Re-check the files against the saved hashes — "OK" means untampered.' },
          ]}
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">3. Log every artifact &amp; hand-off</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Record one row per artifact in a chain-of-custody log, and a line for each transfer (Red/Blue → GRC).
          Columns: {CUSTODY_COLUMNS.join(' · ')}.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => downloadText('CHAIN_OF_CUSTODY.md', custodyLogMarkdown())}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" /> Chain-of-custody log (.md)
          </button>
          <button
            onClick={() => downloadText('CHAIN_OF_CUSTODY.csv', custodyLogCSV(), 'text/csv;charset=utf-8')}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <FileText className="h-4 w-4" /> .csv version
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Handling rules</h3>
        <ul className="mt-2 space-y-1.5">
          {CUSTODY_RULES.map((r) => (
            <li key={r} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-400">
          Aligned with NIST SP 800-61 (incident handling) and ISO/IEC 27037 (digital evidence).
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Redaction, large captures &amp; recordings</h3>
        <ul className="mt-2 space-y-1.5">
          {EVIDENCE_HANDLING.map((r) => (
            <li key={r} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
