import { getFrameworkColor, getFrameworkLabel } from '@/lib/utils';

export function FrameworkBadge({ framework }: { framework: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getFrameworkColor(framework)}`}>
      {getFrameworkLabel(framework)}
    </span>
  );
}
