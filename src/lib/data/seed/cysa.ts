import { Course, RoleDef, WeekDef } from '../../types';

// CySA+ Capstone Lab — a locked, "coming soon" course shown on the dashboard.
// Content (tasks/gates) is intentionally empty; `locked: true` keeps students out
// until an instructor builds it out. It mirrors the Security+ role/week shape so
// the course card looks real (roles, week count) without any task content yet.

const roles: RoleDef[] = [
  {
    id: 'red',
    name: 'Red (Runners)',
    mission: 'Threat emulation and detection validation.',
    color: '#dc2626',
    icon: 'Target',
    label: '🏃 Red (Runners)',
  },
  {
    id: 'blue',
    name: 'Blue (Analysts)',
    mission: 'Continuous monitoring, threat hunting, and triage.',
    color: '#2563eb',
    icon: 'Shield',
    label: '🛡️ Blue (Analysts)',
  },
  {
    id: 'grc',
    name: 'GRC (Fixers)',
    mission: 'Vulnerability management, metrics, and compliance reporting.',
    color: '#16a34a',
    icon: 'ClipboardList',
    label: '📋 GRC (Fixers)',
  },
];

const weeks: WeekDef[] = [
  { number: 1, title: 'Threat Intelligence', theme: 'Know the adversary', objective: 'Collect and apply threat intelligence.', runs: 'Run 01' },
  { number: 2, title: 'Monitoring & Detection', theme: 'See everything', objective: 'Build detections and hunt for threats.', runs: 'Run 02' },
  { number: 3, title: 'Incident Response', theme: 'Contain & recover', objective: 'Run the incident-response lifecycle.', runs: 'Run 03' },
  { number: 4, title: 'Reporting & Metrics', theme: 'Prove the value', objective: 'Report findings and security metrics.', runs: 'Run 04' },
];

export const CYSA_PLUS: Course = {
  id: 'cysa-plus',
  title: 'CySA+ Capstone Lab',
  slug: 'cysa-plus',
  audience: 'Blue-team analyst track — threat intel, monitoring, detection engineering, and IR.',
  description:
    'A blue-team-focused analyst engagement — threat intelligence, continuous monitoring, detection engineering, and incident response. Coming soon.',
  roles,
  weeks,
  gates: [],
  tasks: [],
  isSeed: true,
  version: 1,
  locked: true,
  teamCount: 16,
  teamCapacity: 6,
};
