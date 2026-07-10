import { EmptyState } from '@/components/EmptyState';

export default function NotFound() {
  return (
    <EmptyState
      title="Page not found"
      message="That page doesn’t exist or has moved. Head back to the courses list to find your way."
      href="/"
      cta="Browse courses"
    />
  );
}
