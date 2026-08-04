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
  /** Plain-language "here's what you're really doing this week and why it matters,
   *  like a real analyst" — 1–2 sentences with a light analogy, for non-technical
   *  students. Rendered as a callout above the week's tasks. */
  plain?: string;
  /** Lab/course setup rather than graded work. Setup weeks start collapsed and
   *  are skipped when resolving where a student left off, so an opt-in build
   *  track never presents itself as "the week you're on". Defaults to week 0. */
  setup?: boolean;
  /** How hard this week is, 1 (gentlest) to 4 (hardest). Rendered as stars in
   *  the week milestone header so students can pace themselves. */
  difficulty?: 1 | 2 | 3 | 4;
  /** The one-line completion test: "you have cleared this week when …".
   *  This is the week's milestone, stated in student-facing language. */
  milestone?: string;
  /** Ordered, short labels for how the week's work flows, e.g.
   *  ['Install', 'Enroll', 'Verify', 'Prove']. Rendered as a chain. */
  flow?: string[];
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
  /** Structured multi-statement command: one entry per shell statement, each with
   *  its own plain-English explanation and optional per-flag breakdown. When set, the
   *  UI renders each statement on its own copyable line (plus a Copy-all) instead of
   *  one opaque block — clearer than a single `&&`-chained string, and lets beginners
   *  see what each flag does right under the command. Use `command` for single-statement
   *  steps. `flags` reuses the same `{flag, meaning}` shape as step-level `commandFlags`. */
  commands?: { cmd: string; explain?: string; flags?: { flag: string; meaning: string }[] }[];
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
  /** Substrings that should appear in the student's REAL command output. When set
   *  (and the step has a command), the UI shows a "paste your output to verify" box
   *  that turns the step green only when every token is present — real-tool
   *  self-verification instead of a static expected-output block. */
  verify?: string[];
  /** Optional steps are shown and tracked but excluded from completion %, week
   *  progress, and gates (e.g. the Windows track alongside the required Linux one). */
  optional?: boolean;
  /** Where the step is performed (e.g. "Your Ubuntu server — SSH in"). Renders as
   *  a "WHERE" chip in the step header. */
  where?: string;
  /** A tiny node→arrow→node "follow the path" diagram for this step. Alternating
   *  entries: even indices are node keys (see StepFlow's NODES), odd indices are
   *  the arrow labels between them — e.g. ['you','ssh + paste','ubuntu','reports in','soc']. */
  path?: string[];
  /** Files/downloads/configs this step needs before it will work — the missing
   *  pre-setup that otherwise makes a step silently fail. Each entry names the
   *  artifact, why it's needed, and (optionally) where to get it: a shell command
   *  (rendered as a copyable line), a URL, or a plain instruction. Renders as a
   *  "Files you'll need" callout above the command. */
  files?: { name: string; purpose: string; source?: string }[];
  /** An example of the files/folders this step should produce on disk, shown as a
   *  small directory tree so students can see what "done" looks like (e.g. the
   *  hashed capture under ~/team-artifacts/week-2/). Rendered by FolderTree's
   *  generic TreeNode. */
  tree?: FolderNode;
  /** An annotated, code-drawn walkthrough of a tool's UI (no external image) —
   *  a simplified mock of the screen with numbered callout markers, so a beginner
   *  can see *where* to click before doing it. `screen` picks a layout preset in
   *  WazuhWalkthrough; `markers` are the numbered captions overlaid on it. Renders
   *  above the command block. Used mainly for the Wazuh dashboard. */
  walkthrough?: {
    screen:
      | 'agents'
      | 'security-events'
      | 'deploy-agent'
      | 'vuln-sca'
      | 'mitre'
      | 'ossec-conf'
      | 'wireshark'
      | 'generic';
    title?: string;
    markers: { n: number; label: string }[];
  };
  /** Real screenshot slots for a step. Each entry is a figure with alt text and an
   *  optional caption. When `placeholder` is true (or the asset isn't in place yet)
   *  the UI renders a labelled dashed box naming the file to drop into
   *  public/screenshots/ — so slots render cleanly before real images exist. */
  images?: { src: string; alt: string; caption?: string; placeholder?: boolean }[];
  /** Which parts of `expectedOutput` actually matter, and why. Each `text` is a
   *  literal substring of the expected output; the UI highlights it in place and
   *  numbers it, so students see *which component of the output* they're looking
   *  for rather than a wall of sample text with a paragraph underneath. Tokens in
   *  `verify` are highlighted automatically; use this to add the explanation. */
  outputHighlights?: { text: string; label: string }[];
  /** Override how `expectedOutput` is rendered. 'console' = text the student
   *  captured off a terminal, shown in terminal chrome with the targeted tokens
   *  marked; 'result' = a described outcome, shown as plain readable prose.
   *  Omit to let the renderer decide (multi-line ⇒ console, one line ⇒ result). */
  outputKind?: 'console' | 'result';
}

/** A node in a small illustrative directory tree (see Step.tree / FolderTree). */
export interface FolderNode {
  label: string;
  kind: 'root' | 'folder' | 'file';
  owner?: Role;
  format?: 'md' | 'csv' | 'img';
  children?: FolderNode[];
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
  /** This task only applies to students building the lab at home — in class the
   *  SOC already exists. Expanding it asks for confirmation first, and it is
   *  never offered as "your next task". Replaces a hardcoded 'cr-w0' check. */
  homeLabOnly?: boolean;
}

export interface Week {
  number: WeekNumber;
  title: string;
  theme: string;
  objective: string;
  runs: string;
  /** Plain-language "what you're really doing this week, and why" for non-technical
   *  students (mirrors WeekDef.plain). Rendered as a callout above the week's tasks. */
  plain?: string;
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
  /** One-line "who this is for / what you'll do" tagline shown on the home card to
   *  differentiate courses at a glance. */
  audience?: string;
  /** The repeating case/engagement lifecycle stages ("every case follows the same
   *  path": Detect → Triage → … → Report), rendered as a chain on the overview.
   *  Each stage is a plain label, or `{label, detail}` to show a one-line
   *  explanation under it. */
  lifecyclePath?: (string | { label: string; detail?: string })[];
  /** How the shell frames the course. 'engagement' renders phase labels (from
   *  Week.runs) + an engagement banner and drops class/cohort language — used by
   *  the MSSP course. Defaults to 'course' (Week N / cohort). */
  framing?: 'course' | 'engagement';
  /** When true, weeks never lock and the gate chips/checklists are hidden — every
   *  week is open from the start and hand-offs between roles are shown as guidance,
   *  not requirements. Used by CySA+ to keep the flow simple for beginners. */
  noGatekeeping?: boolean;
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
