import { PageSkeleton } from '@/components/ui/Skeletons';

/**
 * The fallback for every route without its own `loading.tsx` — landing,
 * explore, dashboard, portfolio, account, login, legal. They do not share a
 * layout, so this draws only what they do share. See `PageSkeleton`.
 */
export default function Loading() {
  return <PageSkeleton />;
}
