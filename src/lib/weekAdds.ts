/**
 * R103 — "This week adds": the weekly breakdown of the course's picture.
 *
 * One row per part that arrives in the selected week (week 0: the parts the
 * course starts with), each with what it is for and the form that records
 * it. Derived from the picture's part catalogue and the week visual, so it
 * needs no prose of its own and can never disagree with the picture. The
 * Tasks tab, the Guide and the generated build sheets all read it.
 */
import type { CourseDto } from './content/dto';
import { deliverablesOf, partsOf, weekVisualsOf } from './content/read';

export interface WeekAdd {
  id: string;
  label: string;
  purpose: string;
  /** The form that records this part, when the picture names one. */
  records?: { id: string; title: string; week: number };
}

export interface WeekAdds {
  week: number;
  /** "You start with" (week 0) or "This week adds". */
  starting: boolean;
  rows: WeekAdd[];
}

export function weekAdds(doc: CourseDto, week: number): WeekAdds {
  const visual = weekVisualsOf(doc).find((v) => v.week === week);
  const parts = partsOf(doc);
  const forms = new Map(deliverablesOf(doc).map((d) => [d.id, d]));
  const starting = week === 0;
  const picked = !visual ? [] : starting ? parts.filter((p) => p.arrives <= visual.builtThrough) : parts.filter((p) => visual.highlight.includes(p.id));
  return {
    week,
    starting,
    rows: picked.map((p) => {
      const form = p.records ? forms.get(p.records) : undefined;
      return {
        id: p.id,
        label: p.label,
        purpose: p.purpose,
        records: form ? { id: form.id, title: form.title, week: Math.min(...form.weeks) } : undefined,
      };
    }),
  };
}
