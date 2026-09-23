-- 0005_course_documents.sql — the R78-D round: the course document has a table.
--
-- WHAT THIS ADDS. Every table before this one holds student state; course
-- CONTENT — the seeds and anything an instructor authored in the studio — lived
-- only in the browser's localStorage, so an authored course existed on one
-- device. `course_documents` holds one row per course: the whole document the
-- app renders from (`content/courses/<id>.json` has the same shape), keyed by
-- course id. A row with a seed's id overrides that seed, which is how the studio
-- already worked locally.
--
-- WHO SEES IT. Any signed-in user reads (the catalogue and the course pages
-- need it); only an instructor writes, using the predicate 0004 established
-- for `deliverable_reviews` and `cohorts`.
--
-- TWO REPAIRS, while a migration is open:
--   * `step_evidence.method` allowed 'file-hash', a value the app never wrote —
--     `EvidenceMethod` is 'verified-output' | 'self-attested'. The CHECK now
--     says what the type says.
--   * `grc_registers` had no reader and no writer in the app (its localStorage
--     key was never used either), only a realtime subscription. Dropped.
--
-- Idempotent for the same reason as 0001–0004.

-- ── course_documents — one row per course, the document the app renders ─────
create table if not exists public.course_documents (
  course_id text primary key,
  schema text not null,
  doc jsonb not null,
  version int not null default 1,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.course_documents enable row level security;

drop policy if exists "course documents signed-in read"    on public.course_documents;
drop policy if exists "course documents instructor writes" on public.course_documents;

create policy "course documents signed-in read" on public.course_documents for select
  using (auth.uid() is not null);
create policy "course documents instructor writes" on public.course_documents for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor));

-- ── step_evidence.method — the CHECK matches EvidenceMethod ─────────────────
alter table public.step_evidence drop constraint if exists step_evidence_method_check;
alter table public.step_evidence
  add constraint step_evidence_method_check check (method in ('verified-output', 'self-attested'));

-- ── grc_registers — nothing reads it, nothing writes it ─────────────────────
-- Dropping the table removes it from the realtime publication as well.
drop table if exists public.grc_registers;

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- A course an instructor publishes or edits should reach every open client.
do $$
begin
  begin
    execute 'alter publication supabase_realtime add table public.course_documents';
  exception when duplicate_object then null;
  end;
end $$;
