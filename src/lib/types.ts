// Domain types for the capstone platform

export type Role = 'red' | 'blue' | 'grc';
export type WeekNumber = 1 | 2 | 3 | 4;
export type GateStatus = 'locked' | 'ready' | 'passed';
export type Framework = 'NIST_CSF' | 'CIS' | 'OWASP' | 'CVSS' | 'NIST_800_61' | 'NIST_800_115' | 'ISO_27001' | 'STRIDE';

export interface Member {
  memberId: string;
  teamId: string;
  role: Role;
  displayName: string;
  cohort: string;
}

export interface Step {
  id: string;
  title: string;
  description: string;
  command?: string;
  expectedOutput?: string;
  whatItMeans: string;
  frameworks: Framework[];
  isEvidenceStep?: boolean;
}

export interface Task {
  id: string;
  role: Role;
  week: WeekNumber;
  title: string;
  objective: string;
  steps: Step[];
  frameworks: Framework[];
  deliverables: string[];
  estimatedTime?: string;
}

export interface Week {
  number: WeekNumber;
  title: string;
  theme: string;
  objective: string;
  runs: string;
}

export interface Gate {
  id: number;
  week: WeekNumber;
  title: string;
  description: string;
  requiredArtifactTypes: string[];
  requiredTasks: string[]; // task IDs that must be completed
}

export interface TaskCompletion {
  taskId: string;
  memberId: string;
  stepId: string;
  completedAt: number;
}

export interface Artifact {
  id: string;
  teamId: string;
  week: WeekNumber;
  role: Role;
  type: 'pdf' | 'log' | 'pcap' | 'screenshot' | 'other';
  filename: string;
  uploadedAt: number;
  uploadedBy: string;
}

export interface GateCheckResult {
  gateId: number;
  status: GateStatus;
  completedTasks: string[];
  remainingTasks: string[];
  submittedArtifacts: string[];
  canUnlock: boolean;
}

export interface CollaborationNote {
  id: string;
  role: Role;
  author: string;
  content: string;
  createdAt: number;
  type: 'note' | 'pitfall' | 'tip' | 'qa';
}
