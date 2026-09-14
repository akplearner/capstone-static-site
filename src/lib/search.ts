/**
 * The command palette's index and scorer. Pure: no React, no router.
 *
 * Everything a student can reach is in memory already — the courses with their
 * weeks, tasks, steps and commands, the Server+ guide procedures, the glossary,
 * the deliverable forms — so the index is built from those, once, and searched
 * with a small subsequence scorer. No dependency: the whole thing is a few
 * dozen lines and the corpus is a few thousand short strings.
 *
 * The hrefs are the deep links the app already honours plus the two R68 adds:
 * `?tab=tasks&week=N&task=<id>` and `…&step=<id>`.
 */
import type { Course } from './types';
import { PROCEDURES } from './docs/serverProcedures';
import { GLOSSARY } from './glossary';
import { deliverablesForCourse } from './docs/definitions';

export type SearchKind = 'page' | 'course' | 'week' | 'task' | 'step' | 'procedure' | 'term' | 'form';

export interface SearchItem {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle?: string;
  /** Extra text to match on that is not shown — commands, ids. */
  keywords?: string;
  href: string;
  courseId?: string;
  week?: number;
}

export const KIND_LABEL: Record<SearchKind, string> = {
  page: 'Pages',
  course: 'Courses',
  week: 'Weeks',
  task: 'Tasks',
  step: 'Steps',
  procedure: 'Guide procedures',
  term: 'Glossary',
  form: 'Forms',
};

/** Kinds in the order the palette groups them. */
export const KIND_ORDER: SearchKind[] = ['page', 'course', 'week', 'task', 'step', 'procedure', 'form', 'term'];

/**
 * 0 = no match. Otherwise a score where a prefix beats a word-start match beats
 * a scattered subsequence, and consecutive matched characters add up. Case-
 * insensitive; the query's characters must all appear in order.
 */
export function fuzzyScore(query: string, text: string): number {
  const q = query.trim().toLowerCase();
  const t = text.toLowerCase();
  if (!q) return 1;
  if (!t) return 0;
  if (t.startsWith(q)) return 1000 + q.length * 10 - Math.min(t.length, 200) / 200;
  const at = t.indexOf(q);
  if (at >= 0) {
    const wordStart = at === 0 || /[\s\-_./:(]/.test(t[at - 1]);
    return (wordStart ? 600 : 400) + q.length * 8 - at / 100;
  }
  // Subsequence with bonuses.
  let score = 0;
  let ti = 0;
  let prev = -2;
  for (let qi = 0; qi < q.length; qi++) {
    const idx = t.indexOf(q[qi], ti);
    if (idx < 0) return 0;
    score += idx === prev + 1 ? 6 : 1;
    if (idx === 0 || /[\s\-_./:(]/.test(t[idx - 1])) score += 4;
    prev = idx;
    ti = idx + 1;
  }
  return score;
}

function scoreItem(query: string, it: SearchItem): number {
  const title = fuzzyScore(query, it.title) * 3;
  const sub = it.subtitle ? fuzzyScore(query, it.subtitle) : 0;
  const kw = it.keywords ? fuzzyScore(query, it.keywords) * 2 : 0;
  return Math.max(title, sub, kw);
}

/** The best `limit` items for a query, stable within a score by index order.
 *  An empty query lists the pages, then the courses. */
export function search(items: SearchItem[], query: string, limit = 12): SearchItem[] {
  const q = query.trim();
  if (!q) return items.filter((i) => i.kind === 'page' || i.kind === 'course').slice(0, limit);
  return items
    .map((it, i) => ({ it, i, s: scoreItem(q, it) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.it);
}

/** Group results by kind in the palette's order, dropping empty groups. */
export function groupByKind(items: SearchItem[]): { kind: SearchKind; label: string; items: SearchItem[] }[] {
  return KIND_ORDER.map((kind) => ({ kind, label: KIND_LABEL[kind], items: items.filter((i) => i.kind === kind) })).filter(
    (g) => g.items.length > 0
  );
}

export interface IndexInput {
  courses: Course[];
  signedIn: boolean;
  isInstructor: boolean;
  /** Whether the student has joined a team on this course — forms need one. */
  hasTeam: (courseId: string) => boolean;
}

export function buildIndex({ courses, signedIn, isInstructor, hasTeam }: IndexInput): SearchItem[] {
  const items: SearchItem[] = [];

  items.push({ id: 'page:explore', kind: 'page', title: 'Explore certs', subtitle: 'The catalogue', href: '/explore' });
  if (signedIn) {
    items.push({ id: 'page:dashboard', kind: 'page', title: 'Your dashboard', href: '/dashboard' });
    items.push({ id: 'page:portfolio', kind: 'page', title: 'Portfolio', subtitle: 'What you proved', href: '/portfolio' });
    items.push({ id: 'page:account', kind: 'page', title: 'Account', href: '/account' });
  }
  if (isInstructor) {
    items.push({ id: 'page:instructor', kind: 'page', title: 'Instructor Studio', href: '/instructor' });
  }

  for (const course of courses) {
    const base = `/courses/${course.id}`;
    items.push({ id: `course:${course.id}`, kind: 'course', title: course.title, subtitle: course.certification ?? course.vendor, href: base, courseId: course.id });
    items.push({ id: `guide:${course.id}`, kind: 'page', title: `${course.title} · Guide`, href: `${base}/guide`, courseId: course.id });
    if (hasTeam(course.id)) {
      items.push({ id: `docs:${course.id}`, kind: 'page', title: `${course.title} · Deliverables`, href: `${base}/docs`, courseId: course.id });
      items.push({ id: `ledger:${course.id}`, kind: 'page', title: `${course.title} · Evidence ledger`, href: `${base}/ledger`, courseId: course.id });
    }
    if (isInstructor) {
      items.push({ id: `cohort:${course.id}`, kind: 'page', title: `${course.title} · Cohort`, subtitle: 'Instructor view', href: `/instructor/${course.id}/cohort`, courseId: course.id });
    }

    for (const w of course.weeks) {
      items.push({
        id: `week:${course.id}:${w.number}`,
        kind: 'week',
        title: `Week ${w.number} · ${w.title}`,
        subtitle: w.phase ?? w.theme,
        keywords: course.title,
        href: `${base}?tab=tasks&week=${w.number}`,
        courseId: course.id,
        week: w.number,
      });
    }

    for (const t of course.tasks) {
      items.push({
        id: `task:${t.id}`,
        kind: 'task',
        title: t.title,
        subtitle: `Week ${t.week} · ${course.title}`,
        keywords: t.id,
        href: `${base}?tab=tasks&week=${t.week}&task=${t.id}`,
        courseId: course.id,
        week: t.week,
      });
      for (const s of t.steps) {
        const cmds = [s.command ?? '', ...(s.commands ?? []).map((c) => c.cmd)].filter(Boolean).join(' ');
        items.push({
          id: `step:${s.id}`,
          kind: 'step',
          title: s.title,
          subtitle: `${t.title} · Week ${t.week}`,
          keywords: `${s.id} ${cmds}`.trim(),
          href: `${base}?tab=tasks&week=${t.week}&task=${t.id}&step=${s.id}`,
          courseId: course.id,
          week: t.week,
        });
      }
    }

    if (course.id === 'server-plus') {
      for (const p of PROCEDURES) {
        items.push({
          id: `procedure:${p.id}`,
          kind: 'procedure',
          title: p.title,
          subtitle: `Week ${p.week} · ${p.where}`,
          keywords: p.steps.map((s) => s.cmd ?? '').join(' '),
          href: `${base}/guide#${p.id}`,
          courseId: course.id,
          week: p.week,
        });
      }
    }

    if (hasTeam(course.id)) {
      for (const d of deliverablesForCourse(course.id)) {
        items.push({
          id: `form:${d.id}`,
          kind: 'form',
          title: d.title,
          subtitle: `${d.file} · ${course.title}`,
          href: `${base}/docs?form=${d.id}&week=${d.weeks[0] ?? 1}`,
          courseId: course.id,
        });
      }
    }
  }

  // The glossary is platform-wide; a term opens the first course's guide, where
  // the terms are defined in context.
  const guideBase = courses[0] ? `/courses/${courses[0].id}/guide` : '/explore';
  for (const [term, def] of Object.entries(GLOSSARY)) {
    items.push({ id: `term:${term}`, kind: 'term', title: term, subtitle: def, href: guideBase });
  }

  return items;
}
