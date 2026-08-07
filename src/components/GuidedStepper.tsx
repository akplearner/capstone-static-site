'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Lock, MapPin } from 'lucide-react';

export type StepperStatus = 'done' | 'current' | 'upcoming' | 'locked';

export interface StepperItem {
  label: string;
  sublabel?: string;
  status: StepperStatus;
}

interface GuidedStepperProps {
  items: StepperItem[];
  /** Optional click handler (e.g. jump to a week). Index is passed back. */
  onSelect?: (index: number) => void;
  className?: string;
}

const dotStyles: Record<StepperStatus, string> = {
  done: 'bg-green-600 text-white border-green-600',
  current: 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-200 dark:ring-blue-900/50',
  upcoming: 'bg-white text-gray-400 border-gray-300 dark:bg-gray-800 dark:border-gray-600',
  locked: 'bg-gray-100 text-gray-400 border-gray-300 dark:bg-gray-700 dark:border-gray-600',
};

function StepIcon({ status }: { status: StepperStatus }) {
  if (status === 'done') return <CheckCircle2 className="h-5 w-5" />;
  if (status === 'current') return <MapPin className="h-5 w-5" />;
  if (status === 'locked') return <Lock className="h-4 w-4" />;
  return <Circle className="h-4 w-4" />;
}

/**
 * A horizontal "you are here" stepper. Used for the 4-week journey and for the
 * steps within a single task.
 */
export function GuidedStepper({ items, onSelect, className = '' }: GuidedStepperProps) {
  return (
    <div className={`flex w-full items-start ${className}`}>
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const connectorActive = item.status === 'done';
        const clickable = !!onSelect && item.status !== 'locked';
        return (
          <div key={idx} className="flex min-w-0 flex-1 items-start">
            <div className="flex min-w-0 flex-col items-center">
              <motion.button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onSelect?.(idx)}
                whileHover={clickable ? { scale: 1.08 } : undefined}
                whileTap={clickable ? { scale: 0.95 } : undefined}
                aria-current={item.status === 'current' ? 'step' : undefined}
                aria-label={`${item.label}${item.sublabel ? ` — ${item.sublabel}` : ''}`}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${dotStyles[item.status]} ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <StepIcon status={item.status} />
              </motion.button>
              <div className="mt-2 max-w-[7rem] text-center">
                <div
                  className={`truncate text-xs font-medium ${
                    item.status === 'current'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-muted'
                  }`}
                  title={item.label}
                >
                  {item.label}
                </div>
                {item.sublabel && (
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">{item.sublabel}</div>
                )}
              </div>
            </div>
            {!isLast && (
              <div className="mt-5 h-0.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <motion.div
                  className="h-full rounded-full bg-green-600"
                  initial={{ width: 0 }}
                  animate={{ width: connectorActive ? '100%' : '0%' }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
