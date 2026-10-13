import type { ProfileRow, SkillPortfolio, SkillProfile } from '@/lib/skillProfile';
import type { SkillsContent } from '@/lib/content/read';
import { LevelPill } from './LevelPill';

/**
 * R107: the portfolio's skills sections, props only. Six sections, each a
 * list of what the member reached across courses: skills proved, tools used,
 * procedures followed to standard, standards practised, exam domains per
 * course, tactics and practices. The page reads the words off a document.
 */
export interface CourseProfile {
  courseId: string;
  title: string;
  profile: SkillProfile;
}

type Dim = 'skills' | 'tools' | 'procedures' | 'standards' | 'tactics' | 'practices';

function best(courses: CourseProfile[], dim: Dim): (ProfileRow & { courses: string[] })[] {
  const by = new Map<string, ProfileRow & { courses: string[] }>();
  for (const c of courses) {
    for (const r of c.profile.rows[dim]) {
      const prev = by.get(r.id);
      const rank = ['not-started', 'practised', 'verified', 'reviewed'].indexOf(r.level);
      const prevRank = prev ? ['not-started', 'practised', 'verified', 'reviewed'].indexOf(prev.level) : -1;
      if (!prev || rank > prevRank) by.set(r.id, { ...r, courses: [...(prev?.courses ?? []), c.title] });
      else prev.courses.push(c.title);
    }
  }
  return [...by.values()].filter((r) => r.level !== 'not-started');
}

export function SkillsSections({ courses, portfolio, content }: { courses: CourseProfile[]; portfolio: SkillPortfolio; content: Pick<SkillsContent, 'COPY' | 'LEVEL_LABEL' | 'DIMENSION_LABEL'> }) {
  const { COPY, LEVEL_LABEL } = content;
  const list = (dim: Dim, atLeast: 'practised' | 'verified') => {
    const rows = best(courses, dim).filter((r) => atLeast === 'practised' || r.level === 'verified' || r.level === 'reviewed');
    if (!rows.length) return <p className="text-sm text-muted">{COPY.emptyDimension}</p>;
    return (
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2" data-skills-list={dim}>
        {rows.map((r) => (
          <li key={r.id} data-id={r.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
            <span className="font-medium text-ink">{r.label}</span>
            <LevelPill level={r.level} label={LEVEL_LABEL[dim][r.level]} />
            {r.standardRefs && r.standardRefs.length > 0 && <span className="font-mono text-2xs text-muted">{r.standardRefs.join(' · ')}</span>}
            <span className="text-2xs text-muted">{r.courses.join(' · ')}</span>
          </li>
        ))}
      </ul>
    );
  };
  const section = (key: keyof typeof COPY.portfolioSections, body: React.ReactNode, sub?: string) => (
    <section key={key} data-skills-section={key} className="break-inside-avoid">
      <h3 className="text-lg font-bold text-ink">{COPY.portfolioSections[key]}</h3>
      {sub && <p className="text-sm text-muted">{sub}</p>}
      {body}
    </section>
  );
  const anyTactics = courses.some((c) => c.profile.rows.tactics.length > 0);
  return (
    <>
      {section('skills', list('skills', 'verified'), `${portfolio.skillsVerified.length} ${LEVEL_LABEL.skills.verified.toLowerCase()} · ${portfolio.skillsPractised.length} ${LEVEL_LABEL.skills.practised.toLowerCase()}`)}
      {section('tools', list('tools', 'practised'))}
      {section('procedures', list('procedures', 'verified'), COPY.procedureFollowed)}
      {section('standards', list('standards', 'practised'), COPY.standardsEffectiveness)}
      {section(
        'domains',
        <div className="mt-3 space-y-2" data-skills-domains>
          {courses.map((c) => (
            <div key={c.courseId} className="text-sm">
              <span className="font-medium text-ink">{c.title}</span>
              <span className="ml-2 inline-flex flex-wrap gap-1 align-middle">
                {c.profile.rows.domains.map((r) => (
                  <LevelPill key={r.id} level={r.level} label={`${r.label}: ${LEVEL_LABEL.domains[r.level]}`} />
                ))}
              </span>
            </div>
          ))}
        </div>,
        `${portfolio.domainsVerified}/${portfolio.domainsTotal} ${LEVEL_LABEL.domains.verified.toLowerCase()}`
      )}
      {section('tactics', <>{anyTactics ? list('tactics', 'practised') : <p className="text-sm text-muted">{COPY.noTactics}</p>}{list('practices', 'practised')}</>)}
    </>
  );
}
