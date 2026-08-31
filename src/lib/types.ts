// Domain types for the multi-course capstone platform.

// Widened from unions to plain strings/numbers so courses can define any roles,
// any number of weeks, and their own frameworks. The built-in Security+ seed
// still uses 'red' | 'blue' | 'grc', weeks 1-4, and the original framework ids.
export type Role = string;
export type WeekNumber = number;
export type GateStatus = 'locked' | 'ready' | 'passed';
export type Framework = string;

/** Credential tier, ordered surface→deep for the catalog. A course declares the
 *  level of the credential it prepares for; the Explore catalog groups by it.
 *  This is the *credential's* standing, deliberately separate from a week/task's
 *  `difficulty` (pacing stars) — an expert cert can still open with an easy week. */
export type Level = 'entry' | 'associate' | 'professional' | 'expert';

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
  /** Which cut of the Capstone Stone finishing this week produces (see
   *  src/lib/quarry.ts). Authoring this makes the expedition arc explicit
   *  instead of inferring it from how many weeks happen to be cleared — which
   *  is what left one stage permanently unreachable. Stage 5 (Master) is never
   *  authored here: it additionally requires the capstone deliverable to be
   *  filed, so it is derived rather than granted by a week. */
  stage?: 0 | 1 | 2 | 3 | 4 | 5;
  /** The expedition verb for this week — "Survey & Deploy", "Respond & Defend".
   *  Defaults to the phase of the stage above, which suits a build-shaped
   *  capstone. Override it when a course's domain has its own arc: a SOC
   *  operations course detects and responds, it does not "build & establish",
   *  and mislabelling the work to fit a template helps nobody. */
  phase?: string;
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
  /** The instruction as discrete actions, rendered as a numbered list. Prefer this
   *  over a long `instruction` whenever the prose is really a sequence or a set of
   *  sources/criteria — a 100-word paragraph in a half-width column is the single
   *  biggest readability problem a step can have. When both are set, `instruction`
   *  is the one-line lead and this is the breakdown under it. */
  instructionList?: string[];
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
  /** A warning that must be read BEFORE the instructions, because the step is
   *  destructive or irreversible — deleting a RAID virtual disk, choosing the
   *  install target that gets wiped. Rendered above everything else in the step,
   *  in the warning tone. Reserve it for real consequences: a warning on every
   *  step is a warning on none. */
  danger?: string;
  /** Common failure + fix shown as an "If it doesn't work…" callout. */
  troubleshooting?: string;
  /** Several independent failure modes, each with its own fix. Prefer this over a
   *  `troubleshooting` paragraph that packs three symptoms into one run-on: a
   *  student scanning for their symptom needs to find it, not read a paragraph. */
  fixes?: { symptom: string; fix: string }[];
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
  /** The mirror of `handoff`: what this task needs handed *to* it, and by whom.
   *  Without it the crew graph only points forward — a student could see who
   *  they hand to but never who they are waiting on, which is the half that
   *  actually blocks people. `from` is a role id; the receiving role is this
   *  task's own `role`. */
  consumes?: { from: Role; artifact?: string; note: string }[];
  /** How hard this specific task is, 1-4. Falls back to the week's difficulty,
   *  which is often too coarse — one week can hold a 20-minute check and a
   *  90-minute build. */
  difficulty?: 1 | 2 | 3 | 4;
  /** Skills/concepts this task teaches (role + week specific). */
  learn?: string[];
  /** Key tools/commands used, shown as a legend. */
  tools?: string[];
  /** This task only applies to students building the lab at home — in class the
   *  SOC already exists. Expanding it asks for confirmation first, and it is
   *  never offered as "your next task". Replaces a hardcoded 'cr-w0' check. */
  homeLabOnly?: boolean;
  /** Every member works this task, whatever focus/role they picked. Used by
   *  shared-track courses (see `Course.sharedTrack`): the build itself is one
   *  shared lane and the role only decides what you document deeper, so the
   *  build tasks are authored once rather than copied per role. */
  shared?: boolean;
}

/** The legacy shape used by `content-data.ts` (Security+). It was a hand-copied
 *  duplicate of `WeekDef`, so every field added to one had to be added to the
 *  other or the older course silently couldn't use it. It is now the same type
 *  with `runs` required — `securityPlus.ts` still remaps it field-by-field. */
export type Week = WeekDef & { runs: string };

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
  /** Who awards/owns this credential, e.g. 'CompTIA'. Drives the base colour of
   *  the course theme so a student can tell at a glance which product they're
   *  in. Omitted for engagement-framed courses that aren't a certification. */
  vendor?: string;
  /** The specific credential, e.g. 'Security+' or 'CySA+ (CS0-003)'. Two certs
   *  from the same vendor share a family but get distinct accents. */
  certification?: string;
  /** The credential tier this capstone prepares for. Read by the Explore catalog
   *  to place the course on the ladder; must match its catalog entry's level. */
  level?: Level;
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
  /** One shared build, four focus roles. Every member works the tasks flagged
   *  `Task.shared` plus their own role's smaller deep-dive task, and every
   *  deliverable flagged `shared` is filled by everyone — a role is a
   *  documentation focus, not a separate lane of work. Without this the course
   *  page shows you only `task.role === your role`, which for a shared build
   *  would leave three of four students with an empty week. Used by Server+. */
  sharedTrack?: boolean;
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
