'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Hammer, FolderGit2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CapstoneStone } from '@/components/quarry/CapstoneStone';
import { QuarryScene } from '@/components/quarry/QuarryScene';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { useAuth } from '@/lib/useAuth';
import { VENDORS, catalogSummary } from '@/lib/catalog/helpers';

// The platform landing. It sells one idea — you cut a real capstone, you don't
// memorise an exam — in the quarry's own language. Signed-in users don't need the
// pitch, so they're sent straight to their dashboard (a no-op in demo mode, where
// Supabase isn't configured and `user` is always null, so the page still renders).
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  const summary = catalogSummary();

  return (
    <div className="space-y-16">
      <AuthErrorBanner />

      {/* Hero */}
      <section className="grid items-center gap-8 md:grid-cols-[1.05fr_1fr]">
        <div className="space-y-5">
          <p className="eyebrow">Build it · Prove it · Keep it</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            Cut the stone.<br />Don’t cram for the exam.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Each certification becomes a hands-on build you run in your own home lab. You stand up
            the environment, work the real process week by week, and prove each step against the
            output your machine actually printed.
          </p>
          <p className="max-w-xl text-muted">
            Every verified step is hashed and timestamped into your evidence ledger, so what you
            finish with is a portfolio an employer can inspect — not a claim that you passed
            something.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/explore">
              <Button size="lg" className="flex items-center gap-2">
                <Compass className="h-5 w-5" /> Explore certs
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg" className="flex items-center gap-2">
                Your dashboard <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="font-mono text-xs text-muted">
            {summary.available} live capstones · {summary.total} certs on the map · {summary.vendors} vendors
          </p>
        </div>

        {/* aspect-video, not 4/3: the pixel scene's logical grid is 256×144 and
            any other ratio stretches the pixels. */}
        <QuarryScene className="aspect-video w-full shadow-[var(--shadow-card)]" />
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-ink">How a capstone works</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-[var(--radius-card)] border border-line bg-panel p-5"
            >
              <div className="inline-flex rounded-xl bg-accent-soft p-2.5 text-accent">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-semibold text-ink">
                {i + 1}. {s.title}
              </h3>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Vendor teaser — every region is themed rock. */}
      <section className="space-y-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-ink">Pick your region</h2>
            <p className="text-muted">Each vendor is its own quarry, with its own stone to cut.</p>
          </div>
          <Link href="/explore" className="hidden shrink-0 sm:block">
            <Button variant="secondary" className="flex items-center gap-2">
              Explore all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VENDORS.map((v, i) => (
            <motion.div
              key={v.id}
              data-region={v.region}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
            >
              <Link
                href="/explore"
                className="flex h-full items-center gap-3 rounded-[var(--radius-card)] border border-line bg-panel p-4 hover:border-accent"
              >
                <CapstoneStone stage={3} size={44} className="shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-ink">{v.name}</div>
                  <p className="truncate text-sm text-muted">{v.blurb}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

const STEPS = [
  {
    icon: Compass,
    title: 'Pick a cert',
    body: 'Choose a vendor and level from the map, or follow a career path from first cuts to expert rock.',
  },
  {
    icon: Hammer,
    title: 'Build it at home',
    body: 'Stand up the real environment on your own hardware and work the week-by-week process.',
  },
  {
    icon: ShieldCheck,
    title: 'Verify each step',
    body: 'Paste what your terminal printed. Match the expected output and the step is recorded as verified, hashed and timestamped.',
  },
  {
    icon: FolderGit2,
    title: 'Keep the evidence',
    body: 'Hash your captures into a chain of custody and export a portfolio that shows exactly what you proved.',
  },
];
