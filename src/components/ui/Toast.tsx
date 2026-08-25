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

// Semantic tokens, not raw palette classes: `info` is the accent (it used to be
// hardcoded blue, which made every toast a different brand from the buttons
// beside it), and success/warn/error are the ok/warn/danger tokens the theme
// already defines for exactly this.
const styles: Record<ToastVariant, { ring: string; icon: typeof Info }> = {
  success: { ring: 'border-ok-line', icon: CheckCircle2 },
  error: { ring: 'border-danger-line', icon: XCircle },
  info: { ring: 'border-accent/40', icon: Info },
  warning: { ring: 'border-warn-line', icon: AlertTriangle },
};
const iconColor: Record<ToastVariant, string> = {
  success: 'text-ok',
  error: 'text-danger',
  info: 'text-accent',
  warning: 'text-warn',
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
                className={`pointer-events-auto flex items-start gap-2 rounded-lg border bg-panel p-3 shadow-lg ${s.ring}`}
                role={t.variant === 'error' ? 'alert' : 'status'}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor[t.variant]}`} aria-hidden />
                <span className="flex-1 text-sm text-ink">{t.message}</span>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="rounded p-0.5 text-muted hover:bg-panel-2 hover:text-ink"
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
