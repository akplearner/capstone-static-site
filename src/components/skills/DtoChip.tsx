'use client';

import { Award, Download, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CopyButton } from '@/components/ui/CopyButton';
import { downloadText } from '@/lib/download';
import type { BoardCopy } from '@/lib/docs/skillsCopy';

/**
 * R109 — the DTO chip row: the schema id and the ontology version a document
 * carries, as one code chip, then the two ways to take the document away
 * (clipboard, file) and, where a page offers it, the credential export. The
 * JSON is built at the click, never printed inline. Props only.
 */
interface DtoChipProps {
  schema: string;
  version: string;
  /** Called at click, never at render. */
  json: () => string;
  filename: string;
  /** The published-shape note: the chip's title and its text for readers. */
  caption: string;
  copy: Pick<BoardCopy, 'copyJson' | 'download' | 'exportCredential'> & Partial<Pick<BoardCopy, 'createLink'>>;
  onCredential?: () => void | Promise<void>;
  /** R114: opens the candidate-link dialog; passed only in cloud mode. */
  onShare?: () => void;
}

export function DtoChip({ schema, version, json, filename, caption, copy, onCredential, onShare }: DtoChipProps) {
  return (
    <div data-dto-chip={schema} className="flex flex-wrap items-center gap-2">
      <code data-dto-schema title={caption} className="rounded-[var(--radius-pill)] bg-panel-2 px-2 py-0.5 font-mono text-3xs text-muted">
        {schema} · v{version}
      </code>
      <span className="sr-only">{caption}</span>
      <CopyButton text={json} label={copy.copyJson} />
      <Button variant="ghost" size="sm" className="flex items-center gap-1" data-dto-download onClick={() => downloadText(filename, json(), 'application/json')}>
        <Download className="h-3.5 w-3.5" aria-hidden /> {copy.download}
      </Button>
      {onCredential && (
        <Button variant="ghost" size="sm" className="flex items-center gap-1" data-export-credential onClick={() => void onCredential()}>
          <Award className="h-3.5 w-3.5" aria-hidden /> {copy.exportCredential}
        </Button>
      )}
      {onShare && (
        <Button variant="ghost" size="sm" className="flex items-center gap-1" data-share-link onClick={onShare}>
          <Link2 className="h-3.5 w-3.5" aria-hidden /> {copy.createLink ?? 'Create link'}
        </Button>
      )}
    </div>
  );
}
