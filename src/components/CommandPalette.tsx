'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, CornerDownLeft } from 'lucide-react';
import { DUR } from '@/lib/motion';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { groupByKind, search, type SearchItem } from '@/lib/search';
import { surfaceVariants } from '@/components/ui/Surface';

/**
 * The command palette — ⌘K / Ctrl-K from anywhere.
 *
 * Every week, task, step (with its commands), Server+ guide procedure, form
 * and glossary term is a few keystrokes away, and choosing a step lands ON the
 * step: the hrefs carry `?tab=tasks&week=N&task=…&step=…`, which the course
 * page honours (R68). Until now the only way to reach a step was to know its
 * week, open the tab, find the task, open it, find the row.
 *
 * Router-free by design: the parent decides how to navigate (same-page URLs
 * go through pushState so the course page does not remount), and the test
 * renders it without Next.
 */
export function CommandPalette({
  open,
  onClose,
  items,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  items: SearchItem[];
  onNavigate: (href: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // Closing resets the query, so the next open starts blank. Done in the
  // handler rather than an effect: state changes belong to events.
  const close = useCallback(() => {
    setQuery('');
    setActive(0);
    onClose();
  }, [onClose]);

  useFocusTrap(open, panelRef, close, { autoFocusFirst: false });

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
  }, [open]);

  const results = useMemo(() => search(items, query, 14), [items, query]);
  const groups = useMemo(() => groupByKind(results), [results]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    document.getElementById(`${listId}-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, listId]);

  const choose = (item: SearchItem | undefined) => {
    if (!item) return;
    onNavigate(item.href);
    close();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (flat.length === 0 ? 0 : (a + 1) % flat.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (flat.length === 0 ? 0 : (a - 1 + flat.length) % flat.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(flat[active]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="palette"
          className="fixed inset-0 z-[95] flex items-start justify-center bg-black/40 px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DUR.swap }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: DUR.swap }}
            className={`w-full max-w-xl overflow-hidden shadow-[var(--shadow-3)] ${surfaceVariants({ variant: 'glass', padding: 'none' })}`}
          >
            <div className="flex items-center gap-2 border-b border-line px-3">
              <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <input
                ref={inputRef}
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-activedescendant={flat.length ? `${listId}-opt-${active}` : undefined}
                aria-autocomplete="list"
                aria-label="Search the course"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onKey}
                placeholder="Jump to a week, task, step, command, procedure, form or term…"
                className="w-full border-0 bg-transparent px-1 py-3 text-base text-ink placeholder:text-muted focus:shadow-none focus:outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="kbd hidden sm:inline-flex">Esc</kbd>
            </div>
            <ul id={listId} role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto py-1">
              {flat.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-muted" role="presentation">
                  Nothing matches “{query}”.
                </li>
              )}
              {groups.map((g) => (
                <li key={g.kind} role="presentation">
                  <div className="px-4 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-muted">{g.label}</div>
                  <ul role="group" aria-label={g.label}>
                    {g.items.map((item) => {
                      const idx = flat.indexOf(item);
                      const on = idx === active;
                      return (
                        <li
                          key={item.id}
                          id={`${listId}-opt-${idx}`}
                          role="option"
                          aria-selected={on}
                          onMouseEnter={() => setActive(idx)}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => choose(item)}
                          className={`flex cursor-pointer items-center gap-3 px-4 py-2 ${on ? 'bg-accent-soft text-accent-ink' : 'text-ink'}`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{item.title}</span>
                            {item.subtitle && <span className="block truncate text-xs text-muted">{item.subtitle}</span>}
                          </span>
                          {on && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />}
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
