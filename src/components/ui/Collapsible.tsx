'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Disclosure is for tools and actions, never for reading material — prose either
 * fits on the page or moves to the Reference route, where it renders open.
 * `src/lib/page-shape.test.ts` enforces that the Guide and Reference pages never
 * import this component.
 */
interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Collapsible({ title, children, defaultOpen = false }: CollapsibleProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const panelId = React.useId();

  return (
    <div className="border-b border-line">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center justify-between py-3 text-left font-medium hover:text-accent"
      >
        {title}
        <motion.span aria-hidden animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          ▼
        </motion.span>
      </motion.button>
      <motion.div
        id={panelId}
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden"
        hidden={!isOpen}
      >
        <div className="pb-3 pl-4">{children}</div>
      </motion.div>
    </div>
  );
}
