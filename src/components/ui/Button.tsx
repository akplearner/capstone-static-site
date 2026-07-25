'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: 'bg-accent text-white hover:bg-accent-strong active:bg-accent-strong',
  secondary: 'bg-panel-2 text-ink border border-line hover:bg-surface',
  ghost: 'text-accent hover:bg-accent-soft',
  destructive: 'bg-danger text-white hover:opacity-90 active:opacity-80',
};

const sizeStyles = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${variantStyles[variant]} ${sizeStyles[size]} rounded-lg font-medium transition-colors ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-[var(--radius-card)] border border-line bg-panel p-6 shadow-[var(--shadow-card)] ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline';
}

export function Badge({ variant = 'default', className = '', children, ...props }: BadgeProps) {
  const variantClasses = {
    default: 'bg-accent-soft text-accent-ink',
    secondary: 'bg-panel-2 text-muted',
    outline: 'border border-line text-muted',
  };

  return (
    <span className={`inline-block rounded-full px-3 py-1 font-mono text-sm font-medium ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}

interface TabsProps {
  tabs: Array<{ label: string; value: string }>;
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
      <div role="tablist" className="flex border-b border-line" onKeyDown={onKeyDown}>
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
