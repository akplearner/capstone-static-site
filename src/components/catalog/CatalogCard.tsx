'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';
import { CapstoneStone } from '@/components/quarry/CapstoneStone';
import { courseHref, type CatalogEntry } from '@/lib/catalog';
import { levelDef } from '@/lib/catalog/levels';

/**
 * One credential in the catalog, drawn as a stone card.
 *
 * Available certs are cut, lit stones that link into their capstone; coming-soon
 * certs are rough, uncut rock with no link — the visual difference IS the status,
 * so a beginner can read the map at a glance. Theming (rock + mineral) is
 * inherited from the enclosing `data-region` section, not set here.
 */
export function CatalogCard({ entry, index = 0 }: { entry: CatalogEntry; index?: number }) {
  const available = entry.status === 'available';
  const href = courseHref(entry);
  const level = levelDef(entry.level);

  const body = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className={`group relative flex h-full flex-col rounded-[var(--radius-card)] border p-4 ${
        available
          ? 'border-line bg-panel shadow-[var(--shadow-card)] hover:border-accent'
          : 'border-dashed border-line bg-panel-2/40'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Cut, lit stone for available; rough blob for coming-soon. */}
        <CapstoneStone
          stage={available ? 3 : 0}
          size={48}
          className={`shrink-0 ${available ? '' : 'opacity-60'}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className={`truncate font-semibold ${available ? 'text-ink' : 'text-muted'}`}>
              {entry.certName}
            </h3>
          </div>
          <p className="eyebrow mt-0.5">{level.name}</p>
        </div>
      </div>

      <p className="mt-3 flex-1 text-sm text-muted">{entry.blurb}</p>

      <div className="mt-3 flex items-center justify-between">
        {available ? (
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
            Start the capstone
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-panel-2 px-2 py-0.5 font-mono text-xs font-medium text-muted">
            <Lock className="h-3 w-3" /> Coming soon
          </span>
        )}
      </div>
    </motion.div>
  );

  if (available && href) {
    return (
      <Link href={href} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        {body}
      </Link>
    );
  }
  // Coming-soon: never a link, so a dead /courses/* route can't be reached.
  return <div className="h-full" aria-disabled>{body}</div>;
}
