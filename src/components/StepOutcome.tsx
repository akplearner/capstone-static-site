'use client';

import * as React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CheckCircle2, Image as ImageIcon, Target } from 'lucide-react';
import { GlossaryText } from './GlossaryText';
import { locateTargets, type OutputTarget } from '@/lib/stepOutcome';
import type { Step } from '@/lib/types';

/**
 * "What you should see."
 *
 * This used to be a single component that wrapped `expectedOutput` in the same
 * dark terminal chrome as the command block — same palette, same highlighter,
 * same Copy button in the same corner — so it read as *another thing to paste*.
 * It was also wrong most of the time: the majority of authored `expectedOutput`
 * is an English sentence describing a result ("Your agent shows Active"), not
 * captured console text, and a sentence in green monospace with a blinking
 * caret is just noise.
 *
 * So the outcome is now rendered by *kind*:
 *   - real console text  → AnnotatedTerminal, with numbered markers on the exact
 *                          tokens that prove it worked (no Copy button)
 *   - a result statement → OutcomeCard, plain readable prose
 *   - a GUI screen       → the caller renders Step.walkthrough instead
 *
 * The numbered markers are the answer to "which component are we targeting":
 * every `verify` token is highlighted automatically, because those are already
 * the substrings that must appear in the student's real output.
 */

/** The numbered badge that ties a highlight to its caption. */
function MarkerBadge({ n }: { n: number }) {
  return (
    <span
      className="mr-1 inline-flex h-4 w-4 shrink-0 translate-y-[-1px] items-center justify-center rounded-[3px] align-middle text-[10px] font-bold text-white"
      style={{ background: 'var(--color-danger)' }}
      aria-hidden
    >
      {n}
    </span>
  );
}

/** Console output with the meaningful tokens boxed, numbered and explained. */
export function AnnotatedTerminal({
  text,
  targets,
}: {
  text: string;
  targets: OutputTarget[];
}) {
  const { hits, missing } = React.useMemo(
    () => locateTargets(text, targets),
    [text, targets]
  );

  // Slice the output around the hits so each match can be wrapped in place.
  const pieces: React.ReactNode[] = [];
  let cursor = 0;
  hits.forEach((h) => {
    if (h.start > cursor) pieces.push(text.slice(cursor, h.start));
    pieces.push(
      <mark
        key={`${h.n}-${h.start}`}
        className="rounded-[3px] px-1 py-[1px] font-semibold"
        style={{
          background: 'color-mix(in srgb, var(--color-term-ip) 28%, transparent)',
          color: 'var(--color-term-ip)',
          outline: '1px solid color-mix(in srgb, var(--color-term-ip) 55%, transparent)',
        }}
      >
        <MarkerBadge n={h.n} />
        {text.slice(h.start, h.end)}
      </mark>
    );
    cursor = h.end;
  });
  if (cursor < text.length) pieces.push(text.slice(cursor));

  return (
    <figure className="mt-1">
      <div
        className="overflow-x-auto rounded-lg p-3 font-mono text-sm"
        style={{ background: 'var(--color-term-bg)', color: 'var(--color-term-tx)' }}
      >
        <div
          className="mb-1.5 select-none text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: 'var(--color-term-dim)' }}
        >
          your screen should look like this
        </div>
        <div className="whitespace-pre-wrap break-words leading-relaxed">{pieces}</div>
      </div>

      {(hits.length > 0 || missing.length > 0) && (
        <figcaption className="mt-2">
          <div className="mb-1 flex items-center gap-1.5 eyebrow-muted">
            <Target className="h-3.5 w-3.5" /> What to look for
          </div>
          <ol className="space-y-1">
            {hits.map((h, i) => (
              <motion.li
                key={h.n}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="flex gap-2 text-sm text-muted"
              >
                <MarkerBadge n={h.n} />
                <span>
                  <code className="rounded bg-panel-2 px-1 py-0.5 font-mono text-[0.85em] text-ink">
                    {h.text}
                  </code>{' '}
                  — <GlossaryText text={h.label} />
                </span>
              </motion.li>
            ))}
            {/* A target we couldn't find in the sample is still worth stating —
                the sample is illustrative, the student's real output is not. */}
            {missing.map((m) => (
              <li
                key={m.text}
                className="flex gap-2 text-sm text-muted"
              >
                <span aria-hidden className="mt-0.5 text-gray-400">
                  •
                </span>
                <span>
                  <code className="rounded bg-panel-2 px-1 py-0.5 font-mono text-[0.85em] text-ink">
                    {m.text}
                  </code>{' '}
                  — <GlossaryText text={m.label} />
                </span>
              </li>
            ))}
          </ol>
        </figcaption>
      )}
    </figure>
  );
}

/**
 * A described result rather than captured text. Deliberately *not* terminal
 * chrome: there is nothing here to copy and nothing that came off a console.
 */
export function OutcomeCard({
  text,
  targets,
  explanation,
}: {
  text: string;
  targets: OutputTarget[];
  explanation?: string;
}) {
  return (
    <div className="mt-1 rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2.5 dark:border-emerald-900 dark:bg-emerald-900/15">
      <div className="flex gap-2">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-emerald-900 dark:text-emerald-100">
            <GlossaryText text={text} />
          </p>
          {explanation && (
            <p className="mt-1 text-sm text-emerald-800/80 dark:text-emerald-200/70">
              <GlossaryText text={explanation} />
            </p>
          )}
          {targets.length > 0 && (
            <div className="mt-2 border-t border-emerald-200/70 pt-2 dark:border-emerald-800/60">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                <Target className="h-3.5 w-3.5" /> The bit that proves it
              </div>
              <ul className="space-y-1">
                {targets.map((t, i) => (
                  <motion.li
                    key={t.text}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                    className="flex gap-2 text-sm text-emerald-900 dark:text-emerald-100"
                  >
                    <MarkerBadge n={i + 1} />
                    <span>
                      <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[0.85em] dark:bg-black/25">
                        {t.text}
                      </code>{' '}
                      — <GlossaryText text={t.label} />
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Real screenshots. Until an asset is actually in public/screenshots/ the slot
 * renders as a labelled dashed box naming the file to drop in, so a step with
 * planned imagery looks intentional rather than broken.
 */
export function StepImages({ images }: { images: NonNullable<Step['images']> }) {
  return (
    <div className="mt-2 space-y-3">
      {images.map((img) =>
        img.placeholder ? (
          <figure
            key={img.src}
            className="rounded-lg border-2 border-dashed border-line bg-panel-2 px-4 py-6 text-center"
          >
            <ImageIcon className="mx-auto h-6 w-6 text-muted" aria-hidden />
            <figcaption className="mt-2 text-sm text-muted">
              <span className="font-medium text-ink">{img.caption ?? img.alt}</span>
              <br />
              <span className="font-mono text-xs">{img.src}</span>
            </figcaption>
          </figure>
        ) : (
          <figure key={img.src}>
            <Image
              src={img.src}
              alt={img.alt}
              width={1280}
              height={720}
              className="h-auto w-full rounded-lg border border-line"
            />
            {img.caption && (
              <figcaption className="mt-1 text-sm text-muted">{img.caption}</figcaption>
            )}
          </figure>
        )
      )}
    </div>
  );
}
