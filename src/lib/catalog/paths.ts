import { CATALOG, type CatalogEntry } from './entries';

/**
 * Career tracks — the ordered journey a student is working toward.
 *
 * A path is the answer to "what am I actually building toward", which a flat
 * catalog can't give: Security+ means something different as a first cert than
 * as a step toward a SOC role. Each path is an ordered list of catalog entry ids,
 * so a path can point at credentials that have no capstone yet — the roadmap
 * ahead of you is part of the picture, and a coming-soon rung is honest about
 * being coming-soon rather than being hidden.
 *
 * Pure data. Which rung a student is on is derived from their progress, never
 * stored — the same rule the rest of the platform follows.
 */
export interface CareerPath {
  id: string;
  name: string;
  /** The job this path is aimed at, in plain industry wording. */
  role: string;
  blurb: string;
  /** Catalog entry ids, in the order they should be taken. */
  entryIds: string[];
}

export const PATHS: CareerPath[] = [
  {
    id: 'blue-team',
    name: 'Blue Team',
    role: 'SOC Analyst → Incident Responder',
    blurb: 'Defend a live environment: monitor it, spot the intrusion, prove what happened, and shut it down.',
    entryIds: [
      'comptia-network-plus',
      'comptia-security-plus',
      'comptia-cysa-plus',
      'isc2-cissp',
    ],
  },
  {
    id: 'red-team',
    name: 'Offensive Security',
    role: 'Penetration Tester',
    blurb: 'Find the way in before someone else does, then write the report that gets it fixed.',
    entryIds: ['comptia-security-plus', 'comptia-pentest-plus', 'comptia-securityx'],
  },
  {
    id: 'grc',
    name: 'GRC & Audit',
    role: 'Compliance Analyst → Auditor',
    blurb: 'Turn controls into evidence: assess the gaps, implement the controls, survive the audit.',
    entryIds: ['comptia-security-plus', 'engagement-soc2-iso27001', 'isc2-cissp'],
  },
  {
    id: 'cloud-security',
    name: 'Cloud Security',
    role: 'Cloud Security Engineer',
    blurb: 'Secure what runs in the cloud: identity, network, data and the blast radius when a zone dies.',
    entryIds: ['aws-cloud-practitioner', 'aws-saa', 'ms-az-500', 'aws-security-specialty'],
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    role: 'Systems / Network Engineer',
    blurb: 'Build the ground everything else stands on — hosts, networks, and the automation that keeps them honest.',
    entryIds: ['comptia-a-plus', 'comptia-network-plus', 'linux-lpic-1', 'cisco-ccna'],
  },
];

const BY_ID: Record<string, CareerPath> = Object.fromEntries(PATHS.map((p) => [p.id, p]));

export function pathById(id: string): CareerPath | undefined {
  return BY_ID[id];
}

/** One rung of a path, resolved against the catalog. */
export interface PathRung {
  entry: CatalogEntry;
  index: number;
  /** The student has finished this capstone. */
  complete: boolean;
  /** The first incomplete rung that is actually available to start. */
  current: boolean;
}

/**
 * Resolve a path into rungs, marking which are done and which is next.
 *
 * `completedCourseIds` is the set of courses whose capstone the student has
 * delivered. "Current" is the first incomplete rung with a real capstone behind
 * it — pointing someone at a coming-soon cert as their next action would be
 * telling them to do something that doesn't exist.
 */
export function resolvePath(path: CareerPath, completedCourseIds: Set<string>): PathRung[] {
  const rungs = path.entryIds
    .map((id) => CATALOG.find((e) => e.id === id))
    .filter((e): e is CatalogEntry => !!e)
    .map((entry, index) => ({
      entry,
      index,
      complete: !!entry.courseId && completedCourseIds.has(entry.courseId),
      current: false,
    }));

  const next = rungs.find((r) => !r.complete && r.entry.status === 'available');
  if (next) next.current = true;
  return rungs;
}

/** How far along a path the student is, as done/total rungs. */
export function pathProgress(
  path: CareerPath,
  completedCourseIds: Set<string>
): { done: number; total: number } {
  const rungs = resolvePath(path, completedCourseIds);
  return { done: rungs.filter((r) => r.complete).length, total: rungs.length };
}
