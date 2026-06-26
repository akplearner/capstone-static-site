// Domain types for the multi-course capstone platform.

// Widened from unions to plain strings/numbers so courses can define any roles,
// any number of weeks, and their own frameworks. The built-in Security+ seed
// still uses 'red' | 'blue' | 'grc', weeks 1-4, and the original framework ids.
export type Role = string;
export type WeekNumber = number;
export type GateStatus = 'locked' | 'ready' | 'passed';
export type Framework = string;

// A role/track within a course (e.g. Red, Blue, GRC — or a single "Student" track).
export interface RoleDef {
  id: string;        // 'red'
  name: string;      // 'Red (Runners)'
  mission: string;   // short description of what this role does
  color: string;     // hex, e.g. '#dc2626' — drives badges, diagrams (works for N roles)
  icon: string;      // lucide icon name from the icons whitelist (src/lib/icons.ts)
  label?: string;    // optional decorated label, e.g. '🏃 Red (Runners)'
}

export interface WeekDef {
  number: number;
  title: string;
  theme: string;
  objective: string;
  runs?: string;
}

// Optional per-course framework override; falls back to the built-in maps in utils.
export interface FrameworkDef {
  id: string;
  label: string;
  color: string;        // tailwind class string
  description?: string;
}

export interface Step {
  id: string;
  title: string;
  description: string;
  /** Explicit, action-oriented instruction ("Do this") shown above the command. */
  instruction?: string;
  command?: string;
  /** Plain-English breakdown of the command and its key options/flags. */
  commandExplanation?: string;
  /** Structured per-flag reference: each flag/operator and what it does. */
  commandFlags?: { flag: string; meaning: string }[];
  expectedOutput?: string;
  /** How to read the output — what each part tells you and what to look for. */
  outputExplanation?: string;
  whatItMeans: string;
  frameworks: Framework[];
  isEvidenceStep?: boolean;
  /** The deliverable filename this step contributes toward (for evidence steps). */
  producesDeliverable?: string;
  /** If set, this step's document is produced by filling a website form (one of
   *  the 8 deliverable forms, named by title) on the Deliverables page — not by a
   *  terminal command. Renders a "fill the form" callout instead of a command. */
  usesForm?: string;
  /** Common failure + fix shown as an "If it doesn't work…" callout. */
  troubleshooting?: string;
  /** Optional steps are shown and tracked but excluded from completion %, week
   *  progress, and gates (e.g. the Windows track alongside the required Linux one). */
  optional?: boolean;
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
  /** What to have ready before starting (e.g. "Read GRC's Hardening Standard"). */
  prerequisites?: string[];
  /** Checklist that defines when the task is truly finished. */
  definitionOfDone?: string[];
  /** Artifacts/notes handed to another role at the end of the task. */
  handoff?: { to: Role; artifact?: string; note: string }[];
  /** Skills/concepts this task teaches (role + week specific). */
  learn?: string[];
  /** Key tools/commands used, shown as a legend. */
  tools?: string[];
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
  /** End-of-week company-sync hand-offs between roles (self-attested today). */
  handoffs?: { from: Role; to: Role; artifact?: string; label: string }[];
}

// A complete course definition. Built-in courses are seeds; instructor-authored
// courses are stored via the CourseRepository and may override a seed by id.
export interface Course {
  id: string;            // 'security-plus'
  title: string;         // 'Security+ Capstone Lab'
  slug: string;          // url segment, usually === id
  description: string;
  roles: RoleDef[];      // variable count (single-track courses may have one)
  weeks: WeekDef[];      // variable count
  gates: Gate[];
  tasks: Task[];
  frameworks?: FrameworkDef[];
  isSeed?: boolean;      // true for built-in courses shipped in code
  version?: number;      // export/import schema version
  updatedAt?: number;
  // Enrollment configuration (instructor-controlled, per course/class):
  locked?: boolean;      // when true, students can't enter the course
  teamCount?: number;    // number of teams available (default 3)
  teamCapacity?: number; // max members per team; 0/undefined = unlimited
}

export interface Member {
  memberId: string;
  courseId: string;
  teamId: string;
  role: Role;
  displayName: string;
  cohort: string;
}

// One student's slot on a team's roster. Lets the join UI enforce team capacity.
// Stored per-course; backend-ready (today it's localStorage, so per-device).
export interface RosterEntry {
  memberId: string;
  teamId: string;
  role: Role;
  displayName: string;
  cohort: string;
  joinedAt: number;
}

export interface TaskCompletion {
  courseId: string;
  taskId: string;
  memberId: string;
  stepId: string;
  completedAt: number;
}

export interface Artifact {
  id: string;
  courseId: string;
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

// GRC Workspace: team-scoped registers (asset inventory, vulns, CTI, risk,
// audit). Rows are simple string maps so one generic table renders every
// register; the column schemas live in src/lib/grc/templates.ts.
export type RegisterRow = Record<string, string>;
export type GrcData = Record<string, RegisterRow[]>; // keyed by register id
