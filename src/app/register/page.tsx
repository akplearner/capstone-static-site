'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, UserPlus } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';
import { needsEmailField } from '@/lib/supabase/config';
import { safeNextPath } from '@/lib/safeRedirect';
import { Skeleton } from '@/components/ui/Spinner';

// Registration. Kept as its own route rather than a tab on /login so it can be
// linked to directly from the landing CTA and indexed as the signup entry point.
function RegisterInner() {
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'));
  // With only single-sign-on enabled there is no separate "create an account"
  // step — the first Google sign-in makes the account. The page stays (the
  // landing CTA and demo banner both link here, and it carries its own metadata
  // and sitemap entry) but it shouldn't promise a form that doesn't exist.
  const hasSignupStep = needsEmailField();

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-accent-soft p-3 text-accent">
          <UserPlus className="h-7 w-7" />
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-muted">
          {hasSignupStep ? 'Free. Takes a minute.' : 'Free. Sign in with Google and your account is made.'}
        </p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-line bg-panel p-6 shadow-[var(--shadow-card)]">
        <AuthForm mode="register" next={next} />
      </div>

      <ul className="mt-5 space-y-1.5 text-sm text-muted">
        {[
          'Your progress follows you across devices',
          'Verified steps are hashed and timestamped into your evidence ledger',
          'Export a portfolio of what you actually built',
        ].map((line) => (
          <li key={line} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            {line}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-center text-xs text-muted">
        By continuing you agree to our{' '}
        <Link href="/legal/terms" className="underline hover:text-ink">Terms</Link> and{' '}
        <Link href="/legal/privacy" className="underline hover:text-ink">Privacy Policy</Link>.
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 w-full max-w-md" />}>
      <RegisterInner />
    </Suspense>
  );
}
