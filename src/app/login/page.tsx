'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { AuthForm } from '@/components/auth/AuthForm';
import { safeNextPath } from '@/lib/safeRedirect';
import { Skeleton } from '@/components/ui/Spinner';

// The dedicated sign-in route. The proxy redirects here with `?next=` when a
// signed-out visitor asks for a gated page, so landing here is usually the result
// of trying to go somewhere specific — we send them back there afterwards.
//
// `next` arrives from the URL and is sanitised with the same `safeNextPath` the
// auth callback routes use, so a crafted link can't bounce someone off-site.
function LoginInner() {
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'));

  return (
    <div className="mx-auto max-w-md py-10">
      <div className="mb-6 text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-accent-soft p-3 text-accent">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink">Sign in</h1>
        <p className="mt-1 text-sm text-muted">
          Your capstones, verification record and evidence live in your account.
        </p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-line bg-panel p-6 shadow-[var(--shadow-card)]">
        <AuthForm mode="signin" next={next} />
      </div>

      <p className="mt-4 text-center text-xs text-muted">
        By continuing you agree to our{' '}
        <Link href="/legal/terms" className="underline hover:text-ink">Terms</Link> and{' '}
        <Link href="/legal/privacy" className="underline hover:text-ink">Privacy Policy</Link>.
      </p>
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary to avoid opting the whole route
  // into client-side rendering at build time.
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 w-full max-w-md" />}>
      <LoginInner />
    </Suspense>
  );
}
