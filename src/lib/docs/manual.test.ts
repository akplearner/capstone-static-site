import { describe, it, expect } from 'vitest';
import { MANUAL_SECTIONS, manualCapabilities, manualSectionsFor } from './manual';
import { SECURITY_PLUS } from '../data/seed/securityPlus';
import { MSSP } from '../data/seed/mssp';
import { CYSA_PLUS } from '../data/seed/cysa';
import { SERVER_PLUS } from '../data/seed/serverPlus';
import { CCNA } from '../data/seed/ccna';
import type { Course } from '../types';

const COURSES: Course[] = [SECURITY_PLUS, MSSP, CYSA_PLUS, SERVER_PLUS, CCNA];

/**
 * The manual's sections used to be gated on `course.id === 'server-plus'` and
 * `course.id === 'cysa-plus'`, inline in the component. This is the rule that
 * replaced them — and this test is what says the replacement is the same rule,
 * not merely a plausible one.
 */
describe('manual sections', () => {
  const oldGating = (c: Course): string[] => [
    'lab',
    ...(c.id === 'server-plus' ? ['config-guide'] : []),
    ...(c.id === 'cysa-plus' ? ['tools'] : []),
    ...(c.tasks.some((t) => t.steps.some((s) => !!s.command || (s.commands?.length ?? 0) > 0))
      ? ['terminal']
      : []),
    'evidence',
    'forms',
    ...(c.roles.length > 1 ? ['roles'] : []),
    ...((c.lifecyclePath?.length ?? 0) > 0 ? ['lifecycle'] : []),
    ...(new Set(c.tasks.flatMap((t) => t.frameworks)).size > 0 ? ['frameworks'] : []),
  ];

  it('gives every pre-existing seed course exactly the sections the course-id gating gave it', () => {
    // The four courses that HAD the `course.id === …` gating. A course authored
    // after it was replaced (CCNA) never went through that rule, so asserting it
    // against a reconstruction of the rule would only be asserting the
    // reconstruction. It is checked on its own terms below.
    for (const c of COURSES.filter((x) => x.id !== 'ccna')) {
      expect(manualSectionsFor(c).map((s) => s.id), c.id).toEqual(oldGating(c));
    }
  });

  it('the CCNA course gets only the sections it can actually fill', () => {
    const ids = manualSectionsFor(CCNA).map((s) => s.id);
    // Demonstrated: four focus roles, a lifecycle, frameworks on its tasks, and
    // steps that run commands.
    expect(ids).toEqual(['lab', 'terminal', 'evidence', 'forms', 'roles', 'lifecycle', 'frameworks']);
    // Declared by NEITHER, on purpose: the week-by-week procedures and a SIEM
    // tool manual are later rounds, and a section a course cannot fill would
    // render empty — or, worse, another course's content.
    expect(ids).not.toContain('config-guide');
    expect(ids).not.toContain('tools');
    // Its lab section is therefore "The lab", not the deployment course's "The build".
    expect(manualSectionsFor(CCNA).find((s) => s.id === 'lab')?.title).toBe('The lab');
  });

  it('a course gets each section at most once, and the deployment one is titled for the build', () => {
    for (const c of COURSES) {
      const ids = manualSectionsFor(c).map((s) => s.id);
      expect(new Set(ids).size, c.id).toBe(ids.length);
    }
    expect(manualSectionsFor(SERVER_PLUS).find((s) => s.id === 'lab')?.title).toBe('The build');
    expect(manualSectionsFor(CYSA_PLUS).find((s) => s.id === 'lab')?.title).toBe('The lab');
  });

  it('every section has a title and a blurb, and every capability is reachable', () => {
    for (const s of MANUAL_SECTIONS) {
      expect(s.title, s.id).toBeTruthy();
      expect(s.blurb.length, s.id).toBeGreaterThan(30);
    }
    // A capability no course can have is a section nobody will ever see.
    const everything = COURSES.map(manualCapabilities);
    for (const s of MANUAL_SECTIONS) {
      expect(everything.some((caps) => caps[s.when]), `${s.id}: ${s.when} is never true`).toBe(true);
    }
  });

  it('the declared capabilities come from the courses, not from their ids', () => {
    // The point of the change: a course built FROM the deployment capstone gets
    // its configuration guide because it says it ships one.
    const clone: Course = { ...SERVER_PLUS, id: 'acme-server-build', manualSections: ['config-guide'] };
    expect(manualSectionsFor(clone).map((s) => s.id)).toContain('config-guide');
    const stripped: Course = { ...SERVER_PLUS, manualSections: [] };
    expect(manualSectionsFor(stripped).map((s) => s.id)).not.toContain('config-guide');
    expect(manualSectionsFor(stripped).find((s) => s.id === 'lab')?.title).toBe('The lab');
  });
});
