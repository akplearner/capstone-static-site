import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create your account',
  description:
    'Create a free Capstone Quarry account to save your progress, build your evidence ledger and export a portfolio of what you actually built.',
  alternates: { canonical: '/register' },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
