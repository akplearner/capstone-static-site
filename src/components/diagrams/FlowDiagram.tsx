'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Flag, Lock, Users } from 'lucide-react';
import { meter } from '@/lib/motion';
import { DiagramFrame } from './DiagramFrame';

/** `other` is a teammate's part of the week — shown so the story reads whole,
 *  not clickable, because it is not this student's to open. */
export type FlowStatus = 'done' | 'current' | 'upcoming' | 'locked' | 'other';

export interface FlowNode {
  id: string;
  /** The short name on the node — "Task 2", "Step 4". */
  label: string;
  /** The title under it. */
  sublabel?: string;
  /** A small fact — "6 steps", "2 files". */
  meta?: string;
  status: FlowStatus;
}

/**
 * The clickable workflow — one component, two levels.
 *
 * Students said they lost sight of the week's flow and objectives. Every
 * course authors the week as two to four objectives (`WeekDef.objectives`,
 * R79) and the app rendered nothing of the kind; the steps of a task were a
 * row of unlabelled dots. This is the one picture for both: at week level the
 * nodes are the objectives, at task level the nodes are the steps. Same shape
 * at both levels, so a student learns it once.
 *
 * Every node is a real `<button>`: click opens the task or jumps to the step,
 * the current node carries `aria-current="step"`, a locked one is `disabled`
 * with a lock, and the arrow keys walk the row (roving tabindex). Depth comes
 * from the recipe classes, never a spelled token, so the "one tier per
 * element" law holds here as everywhere.
 *
 * Mobile: the row scrolls sideways rather than wrapping — a workflow that
 * wraps stops reading as a sequence — and the current node scrolls itself
 * into view, so the student always lands on where they are.
 */
export function FlowDiagram({
  nodes,
  onSelect,
  flow,
  title,
  howToRead,
  caption,
  ariaLabel = 'Workflow',
}: {
  nodes: FlowNode[];
  onSelect: (id: string) => void;
  /** A stage chain, rendered as the subtitle: "Plan → Build → Verify". */
  flow?: string[];
  title?: string;
  howToRead?: string;
  /** One line under the last node — the week's "done when". */
  caption?: string;
  ariaLabel?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const currentIdx = Math.max(0, nodes.findIndex((n) => n.status === 'current'));
  const [focusIdx, setFocusIdx] = useState(currentIdx);
  // When the current node moves (a step is ticked, a task opens), the roving
  // tab stop follows it. Adjusted during render — React's own pattern for
  // state that derives from a prop change — rather than in an effect.
  const [seenIdx, setSeenIdx] = useState(currentIdx);
  if (seenIdx !== currentIdx) {
    setSeenIdx(currentIdx);
    setFocusIdx(currentIdx);
  }

  // Where you are, on screen. `scrollIntoView` is absent in jsdom, hence the
  // optional call; `inline: 'center'` is what keeps a phone from landing on the
  // first node of a nine-node week when the student is on the seventh.
  useEffect(() => {
    refs.current[currentIdx]?.scrollIntoView?.({ inline: 'center', block: 'nearest' });
  }, [currentIdx]);

  const onKeyDown = (e: KeyboardEvent<HTMLOListElement>) => {
    const keys: Record<string, number> = { ArrowRight: focusIdx + 1, ArrowLeft: focusIdx - 1, Home: 0, End: nodes.length - 1 };
    const next = keys[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const clamped = Math.max(0, Math.min(nodes.length - 1, next));
    setFocusIdx(clamped);
    refs.current[clamped]?.focus();
  };

  const tone: Record<FlowStatus, string> = {
    done: 'depth-edge bg-ok-soft text-ink',
    current: 'depth-lift bg-accent-soft text-ink',
    upcoming: 'depth-edge depth-hover bg-panel text-body',
    locked: 'depth-edge bg-panel-2 text-muted',
    other: 'depth-edge bg-panel-2 text-muted',
  };

  return (
    <DiagramFrame
      title={title}
      subtitle={flow && flow.length > 0 ? flow.join(' → ') : undefined}
      howToRead={howToRead}
      scroll={false}
      legend={[
        { label: 'done', color: 'var(--color-ok)' },
        { label: 'you are here', color: 'var(--color-accent)' },
        ...(nodes.some((n) => n.status === 'other') ? [{ label: "a teammate's", dashed: true }] : []),
        ...(nodes.some((n) => n.status === 'locked') ? [{ label: 'locked', dashed: true }] : []),
      ]}
    >
      <ol
        aria-label={ariaLabel}
        onKeyDown={onKeyDown}
        className="flex snap-x snap-mandatory items-stretch gap-1.5 overflow-x-auto pb-1"
      >
        {nodes.map((n, i) => {
          const locked = n.status === 'locked';
          const other = n.status === 'other';
          const current = n.status === 'current';
          return (
            <li key={n.id} className="flex shrink-0 snap-start items-center gap-1.5">
              <button
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                disabled={locked || other}
                tabIndex={i === focusIdx ? 0 : -1}
                aria-current={current ? 'step' : undefined}
                onClick={() => onSelect(n.id)}
                onFocus={() => setFocusIdx(i)}
                className={`flex min-w-[9.5rem] max-w-[13rem] flex-col rounded-[var(--radius-control)] px-3 py-2 text-left transition-colors ${tone[n.status]} ${
                  locked ? 'cursor-not-allowed' : other ? 'cursor-default' : ''
                }`}
              >
                <span className="flex items-center gap-1.5 font-mono text-2xs font-semibold uppercase tracking-wider">
                  {n.status === 'done' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-ok" aria-hidden />}
                  {locked && <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                  {other && <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                  <span className={current ? 'text-accent' : 'text-muted'}>{n.label}</span>
                </span>
                {n.sublabel && <span className="mt-0.5 line-clamp-2 text-sm font-medium">{n.sublabel}</span>}
                {n.meta && <span className="mt-0.5 text-2xs text-muted">{n.meta}</span>}
              </button>
              {i < nodes.length - 1 && (
                <motion.span
                  aria-hidden
                  className="shrink-0"
                  initial={false}
                  animate={{ color: n.status === 'done' ? 'var(--color-ok)' : 'var(--color-line)' }}
                  transition={meter}
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.span>
              )}
            </li>
          );
        })}
      </ol>
      {caption && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
          <Flag className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{caption}</span>
        </p>
      )}
    </DiagramFrame>
  );
}
