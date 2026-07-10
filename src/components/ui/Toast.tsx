'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from 'lucide-react';
import { toast, subscribeToasts, type ToastInput, type ToastVariant } from '@/lib/toastBus';

export { toast };
export type { ToastInput, ToastVariant };

interface Toast extends Required<Omit<ToastInput, 'duration'>> {
  id: number;
  duration: number;
}

const ToastCtx = createContext<(t: ToastInput | string) => void>(() => {});
/** Hook form; identical to the module `toast()` but convenient inside components. */
export function useToast() {
  return useContext(ToastCtx);
}

const styles: Record<ToastVariant, { ring: string; icon: typeof Info }> = {
  success: { ring: 'border-green-300 dark:border-green-800', icon: CheckCircle2 },
  error: { ring: 'border-red-300 dark:border-red-800', icon: XCircle },
  info: { ring: 'border-blue-300 dark:border-blue-800', icon: Info },
  warning: { ring: 'border-amber-300 dark:border-amber-800', icon: AlertTriangle },
};
const iconColor: Record<ToastVariant, string> = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  info: 'text-blue-600 dark:text-blue-400',
  warning: 'text-amber-600 dark:text-amber-400',
};

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = (input: ToastInput | string) => {
    const t = typeof input === 'string' ? { message: input } : input;
    const id = nextId++;
    const item: Toast = { id, message: t.message, variant: t.variant ?? 'info', duration: t.duration ?? 4000 };
    setToasts((prev) => [...prev, item]);
    if (item.duration > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), item.duration);
    }
  };

  // Bridge the module bus to this provider instance.
  useEffect(() => subscribeToasts(push), []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((x) => x.id !== id));

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const s = styles[t.variant];
            const Icon = s.icon;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.18 }}
                className={`pointer-events-auto flex items-start gap-2 rounded-lg border bg-white p-3 shadow-lg dark:bg-gray-800 ${s.ring}`}
                role={t.variant === 'error' ? 'alert' : 'status'}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor[t.variant]}`} aria-hidden />
                <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{t.message}</span>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
