'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Hammer, FileCheck2, FolderGit2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { QuarryMiner } from '@/components/quarry/QuarryMiner';
import { CapstoneStone } from '@/components/quarry/CapstoneStone';
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
      <section className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-5">
          <p className="eyebrow">Build it · Prove it · Keep it</p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
            Cut the stone.<br />Don’t cram for the exam.
          </h1>
          <p className="max-w-xl text-lg text-muted">
            Capstone Quarry turns each certification into a hands-on, home-lab build. You stand up
            the environment, work the real process, and walk away with evidence for your
            portfolio — not a memorised objectives list.
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

        {/* The miner at work on a stone. */}
        <div className="flex items-center justify-center gap-2 rounded-[var(--radius-card)] border border-line bg-panel p-8 shadow-[var(--shadow-card)]">
          <QuarryMiner size={120} />
          <CapstoneStone stage={4} size={140} />
        </div>
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
  { icon: Compass, title: 'Pick a cert', body: 'Choose a vendor and level from the map — from first cuts to deep, expert rock.' },
  { icon: Hammer, title: 'Build the lab', body: 'Stand up the environment at home and work the real week-by-week process.' },
  { icon: FileCheck2, title: 'File the evidence', body: 'Capture and hash your work into deliverables — proof the task was really done.' },
  { icon: FolderGit2, title: 'Keep the portfolio', body: 'Walk away with a defensible capstone you can show, not just a passing score.' },
];
