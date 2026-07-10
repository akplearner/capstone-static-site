// Framework-free toast event bus. Lives outside the React component so plain
// modules (the data repos, safeStorage, Supabase write handlers) can raise a
// toast without pulling in React/framer-motion. The <ToastProvider> subscribes.

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';
export interface ToastInput {
  message: string;
  variant?: ToastVariant;
  duration?: number; // ms; 0 = sticky until dismissed
}

type Listener = (t: ToastInput) => void;
const listeners = new Set<Listener>();

/** Raise a toast from anywhere (components or plain modules). */
export function toast(input: ToastInput | string): void {
  const t = typeof input === 'string' ? { message: input } : input;
  listeners.forEach((l) => l(t));
}

/** Provider-side subscription. Returns an unsubscribe fn. */
export function subscribeToasts(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
