'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
  ghost: 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20',
  destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
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
      className={`rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
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
    default: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    outline: 'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300',
  };

  return (
    <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${variantClasses[variant]} ${className}`} {...props}>
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
      <div role="tablist" className="flex border-b border-gray-200 dark:border-gray-700" onKeyDown={onKeyDown}>
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
                  ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300'
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
    <div className="border-b border-gray-200 dark:border-gray-700">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center justify-between py-3 text-left font-medium hover:text-blue-600 dark:hover:text-blue-400"
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
