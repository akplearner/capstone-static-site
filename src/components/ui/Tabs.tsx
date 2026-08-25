'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TabsProps {
  /** `label` is a ReactNode so a tab can carry state — a done tick, a lock — next
   *  to its text. The Deliverables form switcher needs that; plain strings still
   *  work unchanged. */
  tabs: Array<{ label: React.ReactNode; value: string }>;
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
}

export function Tabs({ tabs, activeTab, onTabChange, children }: TabsProps) {
  // Arrow-key navigation across the tablist (WAI-ARIA tabs pattern).
  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = tabs.findIndex((t) => t.value === activeTab);
    if (idx < 0) return;
    let next = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (idx + 1) % tabs.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    onTabChange(tabs[next].value);
  };
  return (
    <div>
      {/* flex-wrap because a week can own five deliverables, and five tabs
          overflowed the viewport on a phone. */}
      <div role="tablist" className="flex flex-wrap border-b border-line" onKeyDown={onKeyDown}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.value;
          return (
            <motion.button
              key={tab.value}
              role="tab"
              id={`tab-${tab.value}`}
              aria-selected={selected}
              aria-controls={`tabpanel-${tab.value}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onTabChange(tab.value)}
              whileHover={{ opacity: 0.8 }}
              className={`px-4 py-2 font-medium transition-colors ${
                selected
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </motion.button>
          );
        })}
      </div>
      <motion.div
        key={activeTab}
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
