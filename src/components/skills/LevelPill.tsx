import type { SkillLevel } from '@/lib/docs/skillsCopy';

/** R107: the tone of each level; the words come from the document's LEVEL_LABEL. */
export const LEVEL_TONE: Record<SkillLevel, string> = {
  'not-started': 'bg-panel-2 text-muted',
  practised: 'bg-info-soft text-info',
  verified: 'bg-ok-soft text-ok',
  reviewed: 'bg-accent-soft text-accent-ink',
};

export function LevelPill({ level, label }: { level: SkillLevel; label: string }) {
  return (
    <span data-level={level} className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-medium ${LEVEL_TONE[level]}`}>
      {label}
    </span>
  );
}
