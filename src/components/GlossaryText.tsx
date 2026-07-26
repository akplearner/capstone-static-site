'use client';

import React from 'react';
import { findTerms } from '@/lib/glossary';
import { GlossaryTerm } from './GlossaryTerm';

/** Renders a plain string with known glossary terms auto-wrapped in a hover-to-define
 *  GlossaryTerm (first occurrence of each term only). Use for EXPLANATORY prose
 *  (a step's "Why:", a deliverable's purpose/how-to) — never for commands or IPs. */
export function GlossaryText({ text }: { text: string }) {
  const matches = findTerms(text);
  if (matches.length === 0) return <>{text}</>;

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.start > cursor) nodes.push(text.slice(cursor, m.start));
    nodes.push(<GlossaryTerm key={i} term={m.term} definition={m.definition} />);
    cursor = m.end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return <>{nodes}</>;
}
