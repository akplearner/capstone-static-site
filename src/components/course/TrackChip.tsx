import { Sparkles, ShieldCheck } from 'lucide-react';
import { Chip } from '@/components/ui/Chip';
import { TRACK_LABEL } from '@/lib/course-helpers';
import type { Track } from '@/lib/types';

/**
 * R142 — the premium label, once. An advanced week on the AI or the Cyber
 * track, and the AI extension task of a graded week, wear this chip on the
 * week rail, the week index and the task row, so a member can tell the
 * certification from the content priced beyond it at a glance, and the words
 * come from one registry (`TRACK_LABEL`). `optional` adds the word that says
 * the work never blocks the course. Props only.
 */
export function TrackChip({ track, optional = false, className = '' }: { track: Track; optional?: boolean; className?: string }) {
  return (
    <Chip tone={track === 'ai' ? 'info' : 'accent'} icon={track === 'ai' ? <Sparkles /> : <ShieldCheck />} className={className} title={`Premium content: the ${TRACK_LABEL[track]}${optional ? ', optional' : ''}`} data-track={track}>
      {TRACK_LABEL[track]}
      {optional ? ' · optional' : ''}
    </Chip>
  );
}
