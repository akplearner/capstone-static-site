'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

/**
 * One clipboard button for every surface (moved out of `CommandBlock` in R109
 * so the DTO chip could use it without pulling the lab-access graph into the
 * dashboard chunk). `text` may be a thunk: a large document is then built at
 * the click, never at render.
 */
export function CopyButton({ text, label = 'Copy' }: { text: string | (() => string); label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(typeof text === 'function' ? text() : text);
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
