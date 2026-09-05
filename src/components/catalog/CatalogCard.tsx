'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, Route } from 'lucide-react';
import { CapstoneStone } from '@/components/quarry/CapstoneStone';
import { courseHref, type CatalogEntry } from '@/lib/catalog';
import { levelDef } from '@/lib/catalog/levels';
import { DUR, EASE } from '@/lib/motion';

/**
 * One credential in the catalog, drawn as a stone card.
 *
 * Available certs are cut, lit stones that link into their capstone; coming-soon
 * certs are rough, uncut rock with no link — the visual difference IS the status,
 * so a beginner can read the map at a glance. Theming (rock + mineral) is
 * inherited from the enclosing `data-region` section, not set here.
 */
export function CatalogCard({
  entry,
  index = 0,
  onPath,
  enrolled,
  verificationRate,
}: {
  entry: CatalogEntry;
  index?: number;
  /** This cert is a rung on the student's chosen career path. */
  onPath?: boolean;
  /** The student has already started this capstone. */
  enrolled?: boolean;
  /** Their verification rate for it, when started. */
  verificationRate?: number;
}) {
  const available = entry.status === 'available';
  const href = courseHref(entry);
  const level = levelDef(entry.level);

  const body = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: DUR.reveal, ease: EASE.out }}
      className={`group relative flex h-full flex-col rounded-[var(--radius-card)] border p-4 transition-colors ${
        available
          ? `bg-panel shadow-[var(--shadow-card)] hover:border-accent ${
              onPath ? 'border-accent/60 ring-1 ring-accent/25' : 'border-line'
            }`
          : `border-dashed bg-panel-2/40 ${onPath ? 'border-accent/40' : 'border-line'}`
      }`}
    >
      {onPath && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 font-mono text-3xs font-semibold uppercase tracking-wider text-accent-ink">
          <Route className="h-3 w-3" /> Your path
        </span>
      )}
      <div className="flex items-start gap-3">
        {/* Cut, lit stone for available; rough blob for coming-soon. An enrolled
            capstone shows its real cut so the map doubles as a progress view. */}
        <CapstoneStone
          stage={enrolled ? 4 : available ? 3 : 0}
          size={44}
          className={`shrink-0 ${available ? '' : 'opacity-60'}`}
        />
        <div className="min-w-0 flex-1 pr-16">
          <h3 className={`truncate font-semibold ${available ? 'text-ink' : 'text-muted'}`}>
            {entry.certName}
          </h3>
          <p className="eyebrow mt-0.5">{level.name}</p>
        </div>
      </div>

      <p className="mt-2.5 flex-1 text-sm text-muted">{entry.blurb}</p>

      <div className="mt-3 flex items-center justify-between gap-2">
        {available ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
            {enrolled ? 'Continue' : 'Start the capstone'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-panel-2 px-2 py-0.5 font-mono text-xs font-medium text-muted">
            <Lock className="h-3 w-3" /> Coming soon
          </span>
        )}
        {enrolled && verificationRate !== undefined && (
          <span className="shrink-0 font-mono text-2xs text-muted" title="Steps verified from your pasted output">
            {verificationRate}% verified
          </span>
        )}
      </div>
    </motion.div>
  );

  if (available && href) {
    return (
      // `min-w-0`: a grid item's automatic minimum size is its content's
      // min-content width, and the card's title is `truncate` (white-space:
      // nowrap), so a long certificate name — "SOC 2 + ISO 27001" — pushed the
      // card 26px past its track and gave /explore a horizontal scrollbar at
      // 390px. The title can only shrink if its grid item is allowed to.
      <Link href={href} className="block h-full min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        {body}
      </Link>
    );
  }
  // Coming-soon: never a link, so a dead /courses/* route can't be reached.
  return <div className="h-full min-w-0" aria-disabled>{body}</div>;
}
