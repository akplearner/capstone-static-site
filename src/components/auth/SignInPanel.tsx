'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AuthForm } from './AuthForm';

// The contextual sign-in surface: rendered inline wherever a signed-out visitor
// hits something that needs an account, so they don't lose their place.
//
// It is now a thin wrapper around `AuthForm` — the providers, the password rules
// and the copy all live there. Before this, the panel and the /login page would
// have been two independent implementations, which is exactly how one of them
// ends up quietly offering a provider the other doesn't.
export function SignInPanel({
  title = 'Sign in to save your progress',
  subtitle = 'Your progress and evidence are saved to your account so you can pick up on any device.',
  next,
}: {
  title?: string;
  subtitle?: string;
  /** Path to return to after auth (defaults to the current location). */
  next?: string;
}) {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[var(--radius-card)] border border-line bg-panel-2 p-5"
    >
      <h3 className="text-base font-semibold text-ink">
        {mode === 'register' ? 'Create an account' : title}
      </h3>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
      <div className="mt-4">
        <AuthForm mode={mode} next={next} onSwitchMode={setMode} />
      </div>
    </motion.div>
  );
}
