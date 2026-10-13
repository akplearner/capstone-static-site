import type { ProfileRow } from '@/lib/skillProfile';
import type { SkillLevel } from '@/lib/docs/skillsCopy';
import { LEVEL_TONE } from './LevelPill';

/**
 * R107: one pill per exam domain in the level the member has reached, on the
 * dashboard card. Props only; the page reads the words off the document.
 */
export function DomainStrip({
  rows,
  levelLabel,
  heading,
  trailing,
}: {
  rows: ProfileRow[];
  levelLabel: Record<SkillLevel, string>;
  heading: string;
  /** "n/m skills verified", already worded by the page. */
  trailing?: string;
}) {
  if (!rows.length) return null;
  return (
    <div data-domain-strip className="flex flex-wrap items-center gap-1.5 text-2xs">
      <span className="eyebrow-muted mr-1">{heading}</span>
      {rows.map((r) => (
        <span key={r.id} data-domain={r.id} data-level={r.level} title={`${r.label}: ${levelLabel[r.level]}`} className={`rounded-full px-2 py-0.5 ${LEVEL_TONE[r.level]}`}>
          {r.label}
        </span>
      ))}
      {trailing && <span className="ml-auto tabular-nums text-muted">{trailing}</span>}
    </div>
  );
}
