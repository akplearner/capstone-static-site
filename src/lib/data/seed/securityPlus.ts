import { Course, RoleDef, Task, WeekDef } from '../../types';
import { WEEKS, GATES, ALL_TASKS, STEP_DELIVERABLES } from '../../content-data';

// The original Security+ capstone, migrated into the generic Course model.
// Task/step/gate ids are preserved so existing student progress survives the
// move to course-scoped storage (see the migration in localStorageProgressRepo).

const roles: RoleDef[] = [
  {
    id: 'red',
    name: 'Offensive Security (Red Team)',
    mission: 'Reconnaissance, enumeration and exploitation of the in-scope hosts, with proof.',
    color: '#dc2626',
    icon: 'Target',
  },
  {
    id: 'blue',
    name: 'Defensive Operations (Blue Team)',
    mission: 'Hardening, detection and incident response across the lab hosts.',
    color: '#2563eb',
    icon: 'Shield',
  },
  {
    id: 'grc',
    name: 'Governance & Compliance (GRC)',
    mission: 'Governance, risk, compliance and the reports the client reads.',
    color: '#16a34a',
    icon: 'ClipboardList',
  },
];

// `Week` is now `WeekDef & { runs: string }`, so a spread carries every field —
// including ones added later. The old hand-copied field list silently dropped
// anything new from this course.
const weeks: WeekDef[] = Object.values(WEEKS)
  .map((w) => ({ ...w }))
  .sort((a, b) => a.number - b.number);

// Fold the STEP_DELIVERABLES side map into each step's producesDeliverable.
const tasks: Task[] = ALL_TASKS.map((t) => ({
  ...t,
  steps: t.steps.map((s) => ({
    ...s,
    producesDeliverable: s.producesDeliverable ?? STEP_DELIVERABLES[s.id],
  })),
}));

export const SECURITY_PLUS: Course = {
  id: 'security-plus',
  title: 'Security+ Capstone Lab',
  slug: 'security-plus',
  vendor: 'CompTIA',
  certification: 'Security+',
  level: 'associate',
  audience: 'Hands-on offensive + defensive lab — you play Red, Blue, or GRC on a live range.',
  description:
    'Four weeks on a live range as Red, Blue or GRC: reconnaissance, hardening, a staged breach, and the report you hand to a client.',
  roles,
  weeks,
  gates: GATES,
  tasks,
  topologyPicture: 'arch',
  isSeed: true,
  version: 1,
  locked: false,
  teamCount: 16,
  teamCapacity: 6,
};
