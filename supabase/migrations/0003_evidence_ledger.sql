-- 0003_evidence_ledger.sql — persist the proof of work the app already computes.
--
-- Until now a "completed" capstone was a column of self-ticked checkboxes. The
-- app computed real signals and then threw every one of them away:
--   * the student's pasted command output and whether it matched the step's
--     `verify` tokens — React state in OutputVerify, gone on unmount;
--   * the SHA-256 of each real evidence file — computed in EvidenceHasher and
--     WeekEvidencePackager, then copied to the clipboard or into a downloaded
--     zip and forgotten.
--
-- These three tables keep those signals. Together they are the difference
-- between "the student says they did it" and "here is a hashed, timestamped
-- record of what they produced" — see docs/adr/0004-content-addressed-evidence.md
-- ("self-study keeps files local; the hash + custody record is what the platform
-- owns") and ROADMAP.md Phase 1.
--
-- WHAT THIS DOES NOT CLAIM. `step_evidence` records that output matching the
-- expected tokens was pasted, hashed and timestamped by this account. It is not
-- proof a command truly ran on a real machine — the check is client-side and a
-- determined student can defeat it. It is honest self-verification with an audit
-- trail, and the UI wording must say exactly that and no more. State-reading
-- validators (roadmap Phase 2) are what would make it proof.
--
-- PRIVACY. We deliberately store the SHA-256 of the pasted output and the match
-- counts, never the raw terminal text: that text routinely carries internal IPs,
-- hostnames and sometimes credentials. The hash is still tamper-evident — ask a
-- student to re-produce the output and it must hash identically — while the
-- platform never holds the sensitive bytes. Raw text stays in the browser.
--
-- Idempotent for the same reason as 0001 and 0002.

-- ── step_evidence — per-step verification record ─────────────────────────────
-- One row per (student, step). `method` distinguishes the two ways a step can be
-- finished, which is the single most useful fact on the whole dashboard:
--   'verified-output' — pasted output contained every `verify` token
--   'self-attested'   — the student ticked the box; no matching output
--   'file-hash'       — completion evidenced by a hashed artifact
-- `attempts` counts pastes, so a step solved on the fifth try is visible as real
-- troubleshooting rather than being flattened to a tick. Effort is MEASURED AND
-- NEVER REWARDED — the rubric is not speed (see ARCHITECTURE.md §3).
--
-- Owner-only, like user_course_state. No teammate or instructor policy: this
-- round the student's verification record is private to them and leaves only via
-- the portfolio export they choose to generate.
create table if not exists public.step_evidence (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  task_id text not null,
  step_id text not null,
  verified boolean not null default false,
  method text not null default 'self-attested'
    check (method in ('verified-output', 'self-attested', 'file-hash')),
  matched_tokens int not null default 0,
  total_tokens int not null default 0,
  output_sha256 text,
  attempts int not null default 0,
  first_attempt_at timestamptz,
  verified_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_id, task_id, step_id)
);
alter table public.step_evidence enable row level security;

drop policy if exists "step evidence self rw" on public.step_evidence;

create policy "step evidence self rw" on public.step_evidence for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── evidence_artifacts — the content-addressed custody record ────────────────
-- Keyed by the hash itself, so re-hashing the same file is idempotent and the
-- same artifact can never be double-counted. The FILE IS NOT STORED — only its
-- hash, name, size and where it belongs. That is the whole point of ADR-0004 for
-- self-study: the student keeps the pcap, the platform keeps the proof it
-- existed, unchanged, at a point in time.
--
-- `name_ok` records whether the filename matched the course convention
-- (YYYYMMDD_TeamXX_Tool_Action.ext, validateEvidenceFileName in src/lib/utils.ts)
-- at the moment of hashing, so evidence-naming compliance is measurable.
create table if not exists public.evidence_artifacts (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  sha256 text not null,
  filename text not null,
  size_bytes bigint not null default 0,
  week int,
  deliverable_id text,
  name_ok boolean not null default false,
  hashed_at timestamptz not null default now(),
  primary key (user_id, course_id, sha256)
);
alter table public.evidence_artifacts enable row level security;

drop policy if exists "evidence artifacts self rw" on public.evidence_artifacts;

create policy "evidence artifacts self rw" on public.evidence_artifacts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── user_paths — the career track the student is working toward ──────────────
-- The first genuinely GLOBAL per-user row in the schema: a path spans courses
-- (Security+ → CySA+ → CISSP), so unlike every other student table it is not
-- course-scoped. Note for whoever adds the next one: hydrateCourse() in
-- src/lib/data/supabaseCache.ts filters every query by course_id and therefore
-- cannot fetch this. It is loaded by hydrateUser() instead.
create table if not exists public.user_paths (
  user_id uuid primary key references auth.users(id) on delete cascade,
  path_id text not null,
  chosen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_paths enable row level security;

drop policy if exists "user path self rw" on public.user_paths;

create policy "user path self rw" on public.user_paths for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Deliberately nothing here. All three tables are single-user, so there is no
-- second party to notify, and streaming a student's verification record would
-- put their evidence on a channel for no benefit — the same reasoning that keeps
-- lab_access unpublished in 0002.
