import { Course, RoleDef, Task, WeekDef } from '../../types';
import { WEEKS, GATES, ALL_TASKS, STEP_DELIVERABLES } from '../../content-data';

// The original Security+ capstone, migrated into the generic Course model.
// Task/step/gate ids are preserved so existing student progress survives the
// move to course-scoped storage (see the migration in localStorageProgressRepo).

const roles: RoleDef[] = [
  {
    id: 'red',
    name: 'Red (Runners)',
    mission: 'Reconnaissance, enumeration, and exploitation.',
    color: '#dc2626',
    icon: 'Target',
    label: '🏃 Red (Runners)',
  },
  {
    id: 'blue',
    name: 'Blue (Wardens)',
    mission: 'Hardening, detection, and incident response.',
    color: '#2563eb',
    icon: 'Shield',
    label: '🛡️ Blue (Wardens)',
  },
  {
    id: 'grc',
    name: 'GRC (Fixers)',
    mission: 'Governance, risk, compliance, and reporting.',
    color: '#16a34a',
    icon: 'ClipboardList',
    label: '📋 GRC (Fixers)',
  },
];

const weeks: WeekDef[] = Object.values(WEEKS)
  .map((w) => ({
    number: w.number,
    title: w.title,
    theme: w.theme,
    objective: w.objective,
    runs: w.runs,
  }))
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
  description:
    'A 4-week, industry-style security engagement with Red, Blue, and GRC roles — recon, hardening, breach, and final reporting.',
  roles,
  weeks,
  gates: GATES,
  tasks,
  isSeed: true,
  version: 1,
  locked: false,
  teamCount: 16,
  teamCapacity: 6,
};
