'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Compass,
  FileCheck2,
  FolderGit2,
  Hammer,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CapstoneStone } from '@/components/quarry/CapstoneStone';
import { QuarryScene } from '@/components/quarry/QuarryScene';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { useAuth } from '@/lib/useAuth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { catalogByVendor, catalogSummary } from '@/lib/catalog/helpers';

// The platform landing. It sells one idea — you cut a real capstone, you don't
// memorise an exam — in the quarry's own language. Signed-in users don't need the
// pitch, so they're sent straight to their dashboard (a no-op in demo mode, where
// Supabase isn't configured and `user` is always null, so the page still renders).
//
// Everything here is theme tokens, never raw palette classes: the page renders in
// light and dark, and `page-shape.test.ts` fails the build on `gray-*`/`bg-white`.
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  // Honour the OS setting rather than animating regardless. With motion reduced
  // every reveal below becomes a no-op offset, so content still renders in place.
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  const summary = catalogSummary();
  const regions = catalogByVendor();

  /**
   * One reveal, reused — a mount animation, and always the same prop shape.
   *
   * Two things here are deliberate, both learned the hard way:
   *
   *  - It animates on mount, not `whileInView`. A scroll reveal makes every
   *    section's visibility depend on an IntersectionObserver firing, and
   *    anything it misses stays at `opacity: 0` — invisible rather than merely
   *    un-animated.
   *  - Reduced motion changes the VALUES, never whether the props exist.
   *    `useReducedMotion` resolves to false on the first render and flips after
   *    hydration; dropping the props on that second render leaves the element
   *    stranded at the `opacity: 0` the first render applied, with no animation
   *    left to carry it back. Keeping `animate` mounted and setting the
   *    duration to zero gets the same stillness and cannot strand anything.
   */
  const reveal = (i = 0) => ({
    initial: { opacity: 0, y: reduce ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: reduce
      ? { duration: 0 }
      : { duration: 0.45, delay: Math.min(i * 0.06, 0.4) },
  });

  return (
    // overflow-x-clip, not hidden: the hero's decorative bloom deliberately
    // bleeds past its box, and on a narrow viewport that bleed was pushing the
    // document wider than the screen. `clip` stops the sideways scroll without
    // turning this into a scroll container (which `hidden` would, breaking
    // sticky positioning further down the tree).
    <div className="space-y-20 overflow-x-clip sm:space-y-28">
      <AuthErrorBanner />

      {/* ── Hero ──────────────────────────────────────────────────────────
          Two columns on desktop, but the type carries it: an eyebrow, a
          display heading that breaks where the idea breaks, one lead
          paragraph, the actions, then the catalog as a stat band rather than
          the mono one-liner it used to be. */}
      <section className="grid items-center gap-10 md:grid-cols-[1.05fr_1fr]">
        <div className="space-y-6">
          <motion.p {...reveal(0)} className="eyebrow">
            Build it · Prove it · Keep it
          </motion.p>

          <motion.h1
            {...reveal(1)}
            className="text-[2.6rem] font-bold leading-[1.05] tracking-[-0.02em] text-ink sm:text-6xl"
          >
            Cut the stone.
            <br />
            <span className="text-muted">Don&rsquo;t cram for the exam.</span>
          </motion.h1>

          <motion.p {...reveal(2)} className="max-w-xl text-lg leading-relaxed text-body">
            Each certification becomes a hands-on build you run in your own lab. You stand up the
            environment, work the real process week by week, and prove each step against what your
            machine actually printed.
          </motion.p>

          <motion.div {...reveal(3)} className="flex flex-wrap gap-3">
            <Link href="/explore">
              <Button size="lg" className="flex items-center gap-2">
                <Compass className="h-5 w-5" /> Explore certs
              </Button>
            </Link>
            {/* Signed-in visitors are redirected to /dashboard above, so this
                button is only ever seen signed out. In cloud mode that makes
                "Your dashboard" a mislabelled sign-up button — it worked solely
                because the proxy bounced it to /login. Name it what it does, and
                point it at the page written for it. In demo mode there is no
                account to create, so the original link is still the right one. */}
            {isSupabaseConfigured() ? (
              <Link href="/register?next=/dashboard">
                <Button variant="secondary" size="lg" className="flex items-center gap-2">
                  Get started <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/dashboard">
                <Button variant="secondary" size="lg" className="flex items-center gap-2">
                  Your dashboard <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </motion.div>

          <motion.dl
            {...reveal(4)}
            className="grid max-w-lg grid-cols-3 divide-x divide-line rounded-[var(--radius-card)] border border-line bg-panel"
          >
            {[
              { n: summary.available, label: 'live capstones' },
              { n: summary.total, label: 'certs on the map' },
              { n: summary.vendors, label: 'vendors' },
            ].map((s) => (
              <div key={s.label} className="px-4 py-3">
                <dt className="sr-only">{s.label}</dt>
                <dd>
                  <span className="block text-2xl font-bold tabular-nums text-ink">{s.n}</span>
                  <span className="block text-xs text-muted">{s.label}</span>
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* The scene, seated rather than floating: a soft accent bloom behind
            it and a hairline ring give it somewhere to sit on the page.
            aspect-video, not 4/3 — the pixel scene's logical grid is 256×144
            and any other ratio stretches the pixels. */}
        <motion.div {...reveal(2)} className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-6 rounded-[calc(var(--radius-card)+1rem)] bg-accent-soft opacity-60 blur-2xl"
          />
          <QuarryScene className="relative aspect-video w-full rounded-[var(--radius-card)] ring-1 ring-line shadow-[var(--shadow-card)]" />
        </motion.div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────
          Numbered as a sequence, not four unrelated cards: the number is the
          visual anchor and the rule under the row reads as a path. */}
      <section className="space-y-8">
        <motion.div {...reveal(0)} className="max-w-2xl space-y-2">
          <p className="eyebrow">The loop</p>
          <h2 className="text-3xl font-bold tracking-tight text-ink">How a capstone works</h2>
          <p className="text-muted">
            The same four moves every week, on every cert. Nothing is multiple choice.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              {...reveal(i)}
              whileHover={reduce ? undefined : { y: -3 }}
              className="group relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-panel p-5 transition-colors hover:border-accent"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-2 -top-3 text-6xl font-bold leading-none text-line/60 transition-colors group-hover:text-accent-soft"
              >
                {i + 1}
              </span>
              <div className="relative inline-flex rounded-xl bg-accent-soft p-2.5 text-accent">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="relative mt-3 font-semibold text-ink">{s.title}</h3>
              <p className="relative mt-1 text-sm leading-relaxed text-muted">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── The proof ─────────────────────────────────────────────────────
          The actual differentiator over a cram app, so it gets a section
          rather than a clause in the hero. The ledger beside it is a composed
          illustration of the real artifact, drawn in tokens. */}
      <section className="grid items-center gap-10 md:grid-cols-[1fr_1.05fr]">
        <motion.div {...reveal(0)} className="space-y-4">
          <p className="eyebrow">The proof</p>
          <h2 className="text-3xl font-bold tracking-tight text-ink">
            What you walk away with
          </h2>
          <p className="max-w-xl text-body">
            Every verified step is hashed and timestamped into your evidence ledger as you work.
            What you finish with is a portfolio an employer can inspect — the commands you ran, the
            output they printed, and the documents you filed — not a claim that you passed
            something.
          </p>
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
          >
            See the portfolio it builds <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

        <motion.div
          {...reveal(1)}
          className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-panel shadow-[var(--shadow-card)]"
        >
          <div className="flex items-center justify-between border-b border-line bg-panel-2 px-4 py-2.5">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <FileCheck2 className="h-4 w-4 text-accent" /> Evidence ledger
            </span>
            <span className="font-mono text-[11px] text-muted">3 of 3 verified</span>
          </div>
          <ul className="divide-y divide-line">
            {LEDGER.map((row) => (
              <li key={row.step} className="flex items-start gap-3 px-4 py-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="text-sm font-medium text-ink">{row.step}</span>
                    <span className="font-mono text-[11px] text-muted">{row.at}</span>
                  </div>
                  <span className="mt-0.5 block truncate font-mono text-[11px] text-muted">
                    sha256 {row.hash}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-line bg-panel-2 px-4 py-2.5 text-[11px] text-muted">
            Exported as <span className="font-mono text-body">portfolio.pdf</span> · every entry
            traceable to the artifact that produced it
          </div>
        </motion.div>
      </section>

      {/* ── Regions ───────────────────────────────────────────────────────
          Each vendor is its own themed rock, now carrying the live count of
          what is actually buildable there rather than a bare blurb. */}
      <section className="space-y-8">
        <motion.div {...reveal(0)} className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <p className="eyebrow">The map</p>
            <h2 className="text-3xl font-bold tracking-tight text-ink">Pick your region</h2>
            <p className="text-muted">Each vendor is its own quarry, with its own stone to cut.</p>
          </div>
          <Link href="/explore" className="hidden shrink-0 sm:block">
            <Button variant="secondary" className="flex items-center gap-2">
              Explore all <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {regions.map((g, i) => (
            <motion.div key={g.vendor.id} data-region={g.vendor.region} {...reveal(i)}>
              <Link
                href="/explore"
                className="flex h-full flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-panel p-5 transition-colors hover:border-accent"
              >
                <div className="flex items-start gap-3">
                  <CapstoneStone stage={3} size={44} className="shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold text-ink">{g.vendor.name}</div>
                    <p className="text-sm leading-snug text-muted">{g.vendor.blurb}</p>
                  </div>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-line pt-3 text-xs">
                  <span className="text-muted">
                    <span className="font-semibold tabular-nums text-ink">{g.availableCount}</span>{' '}
                    of {g.totalCount} live
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {g.cells.map((c) => (
                      <span
                        key={c.level.id}
                        className="rounded border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted"
                      >
                        {c.level.id}
                      </span>
                    ))}
                  </span>
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
    title: 'Build it for real',
    body: 'Stand up the real environment on your own hardware and work the week-by-week process.',
  },
  {
    icon: ShieldCheck,
    title: 'Verify each step',
    body: 'Paste what your terminal printed. Match the expected output and the step is recorded as verified.',
  },
  {
    icon: FolderGit2,
    title: 'Keep the evidence',
    body: 'Hash your captures into a chain of custody and export a portfolio that shows what you proved.',
  },
];

/** A composed illustration of the real ledger — not a student's actual data. */
const LEDGER = [
  { step: 'Sensor reporting to the SOC', at: '09:14', hash: '9f2c4e1a7b83…c4b7' },
  { step: 'Attacker IP traced in the packet capture', at: '11:02', hash: '4d81be05f2a9…10de' },
  { step: 'Restore tested — 11 min against a 2 h RTO', at: '15:38', hash: 'ac70d3915e6b…88f1' },
];
