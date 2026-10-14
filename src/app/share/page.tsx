import type { Metadata } from 'next';
import { SharedProfile } from '@/components/share/SharedProfile';

/**
 * R114 — a candidate link's public page. The token is in the URL's fragment
 * (`/share#<token>`), which the browser never sends to this server, so the
 * page is the same static shell for every link and reads the token on the
 * client. Never indexed, never in the sitemap; robots.ts disallows it.
 */
export const metadata: Metadata = {
  title: 'Shared portfolio',
  robots: { index: false, follow: false },
};

export default function SharePage() {
  return <SharedProfile />;
}
