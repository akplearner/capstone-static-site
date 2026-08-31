'use client';

import React from 'react';
import { findTerms } from '@/lib/glossary';
import { GlossaryTerm } from './GlossaryTerm';
import { format as formatKeys } from './ui/Keycap';

/** Renders a plain string with known glossary terms auto-wrapped in a hover-to-define
 *  GlossaryTerm (first occurrence of each term only). Use for EXPLANATORY prose
 *  (a step's "Why:", a deliverable's purpose/how-to) — never for commands or IPs.
 *
 *  With `keys`, the segments BETWEEN glossary terms are additionally run through
 *  the keycap/menu-path formatter. Opt-in rather than automatic: it belongs on
 *  step instructions, where a student is reading to act, and not on the prose of
 *  a deliverable, where a stray `Enter` should stay a word. */
export function GlossaryText({ text, keys = false }: { text: string; keys?: boolean }) {
  const fmt = (s: string): React.ReactNode => (keys ? formatKeys(s) : s);
  const matches = findTerms(text);
  if (matches.length === 0) return <>{fmt(text)}</>;

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.start > cursor) nodes.push(<React.Fragment key={`t${i}`}>{fmt(text.slice(cursor, m.start))}</React.Fragment>);
    nodes.push(<GlossaryTerm key={i} term={m.term} definition={m.definition} />);
    cursor = m.end;
  });
  if (cursor < text.length) nodes.push(<React.Fragment key="tail">{fmt(text.slice(cursor))}</React.Fragment>);
  return <>{nodes}</>;
}
