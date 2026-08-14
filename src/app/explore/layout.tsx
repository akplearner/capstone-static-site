import type { Metadata } from 'next';

// `explore/page.tsx` is a client component and therefore cannot export metadata.
// This server wrapper supplies it while the page stays the child — the standard
// way to keep an interactive page indexable.
export const metadata: Metadata = {
  title: 'Explore certifications',
  description:
    'Browse hands-on capstones across CompTIA, Cisco, ISC2, Microsoft, AWS and Linux — from entry-level first cuts to expert-level builds.',
  alternates: { canonical: '/explore' },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
