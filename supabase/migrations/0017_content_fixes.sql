-- 0017_content_fixes.sql — the words of a course can be corrected in place, and every correction has a number (R121).
--
-- WHAT THIS IS. A student reports a typo or a sentence nobody can follow, and the admin
-- should be able to fix it without waiting for a deploy and without forking the course (an
-- edited copy stops receiving the built-in course's later updates). So a correction is a row
-- in a ledger laid OVER the course: "in this task, this step, this field, the text was X and
-- is now Y". The app applies the ledger wherever it reads a course (src/lib/contentFix.ts),
-- the code stays the source of truth, and a developer later folds the live fixes into the code
-- (the Fixes tab downloads exactly where) and marks them In code.
--
-- ONE ROW PER ENTRY, three kinds:
--   fix     changes[] = {taskId, stepId?, field, before, after}
--   revert  the inverse of an earlier fix, as a NEW row — history is never rewritten
--   fold    bookkeeping: these revisions are now in the code; changes no text
--
-- THE VERSION. `revision` counts 1, 2, 3 … per course and is assigned HERE, never by the
-- client: the trigger below takes the next number under a per-course lock, so two admins
-- saving at once cannot take the same one. A course's content version is
-- '{course_documents.version}.{revision}' (the document's version is R122's).
--
-- WHO CAN DO WHAT. Any signed-in member reads (they render the corrected words); only an
-- admin inserts, as themselves (created_by = auth.uid()); nobody updates or deletes — RLS
-- has no such policy, the grants are revoked, and the trigger refuses it for the table
-- owner too. (To remove a row by hand an operator disables `content_fixes_append_only` in
-- the SQL Editor for that one statement.) Erasing an admin's account detaches their id from
-- their entries (`on delete set null`); the entry and the name it was signed with stay.
--
-- INTEGRITY. A revert must name an existing fix of the same course, once; a fold must name
-- existing fixes of the same course; a fix and a revert carry changes, a fold does not.
-- The words themselves (reading budgets, self-check tokens) are the app's to check: the
-- database only guarantees the shape and the history.
--
-- Idempotent for the same reason as 0001–0016.

create table if not exists public.content_fixes (
  id uuid primary key default gen_random_uuid(),
  course_id text not null,
  revision int not null,
  kind text not null check (kind in ('fix', 'revert', 'fold')),
  summary text not null check (char_length(summary) between 1 and 200),
  changes jsonb not null default '[]'::jsonb check (jsonb_typeof(changes) = 'array'),
  issue_ids text[] not null default '{}',
  reverts int,
  folds int[] not null default '{}',
  folded_in text not null default '',
  doc_version int not null default 1 check (doc_version >= 1),
  author_name text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint content_fixes_revision_unique unique (course_id, revision),
  constraint content_fixes_kind_fields check (
    (kind = 'fix'    and jsonb_array_length(changes) > 0 and reverts is null     and cardinality(folds) = 0)
 or (kind = 'revert' and jsonb_array_length(changes) > 0 and reverts is not null and cardinality(folds) = 0)
 or (kind = 'fold'   and jsonb_array_length(changes) = 0 and reverts is null     and cardinality(folds) > 0)
  ),
  constraint content_fixes_reverts_earlier check (reverts is null or reverts < revision)
);

-- A fix is undone once.
create unique index if not exists content_fixes_one_revert
  on public.content_fixes (course_id, reverts) where kind = 'revert';

alter table public.content_fixes enable row level security;

drop policy if exists "content fixes signed-in read" on public.content_fixes;
drop policy if exists "content fixes admin insert"   on public.content_fixes;

create policy "content fixes signed-in read" on public.content_fixes for select
  using (auth.uid() is not null);
create policy "content fixes admin insert" on public.content_fixes for insert
  with check (public.is_admin() and created_by = auth.uid());

-- No policy lets a request role change or remove a row; make the grants say so too, so a
-- policy added by mistake later cannot open it.
revoke update, delete, truncate on public.content_fixes from anon, authenticated;

-- ── The next revision, under a per-course lock; the shape of a revert or a fold ─────────
create or replace function public.content_fix_before_insert()
returns trigger language plpgsql as $$
begin
  perform pg_advisory_xact_lock(hashtext('content_fixes:' || new.course_id));
  select coalesce(max(f.revision), 0) + 1 into new.revision
    from public.content_fixes f where f.course_id = new.course_id;
  new.created_at := now();
  if new.author_name = '' and new.created_by is not null then
    new.author_name := coalesce((select p.display_name from public.profiles p where p.id = new.created_by), '');
  end if;

  if new.kind = 'revert' then
    if not exists (select 1 from public.content_fixes f
                   where f.course_id = new.course_id and f.kind = 'fix' and f.revision = new.reverts) then
      raise exception 'content_fixes: a revert must name an existing fix of the same course';
    end if;
  elsif new.kind = 'fold' then
    if (select count(*) from public.content_fixes f
        where f.course_id = new.course_id and f.kind = 'fix' and f.revision = any (new.folds))
       <> (select count(distinct v) from unnest(new.folds) v) then
      raise exception 'content_fixes: a fold must name existing fixes of the same course';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists content_fixes_assign on public.content_fixes;
create trigger content_fixes_assign
  before insert on public.content_fixes
  for each row execute function public.content_fix_before_insert();

-- ── Append-only, enforced below RLS too ─────────────────────────────────────────────────
create or replace function public.content_fix_forbid_rewrite()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE'
     and old.created_by is not null and new.created_by is null
     and (to_jsonb(new) - 'created_by') = (to_jsonb(old) - 'created_by') then
    return new;
  end if;
  raise exception 'content_fixes is append-only — record a revert instead';
end $$;
drop trigger if exists content_fixes_append_only on public.content_fixes;
create trigger content_fixes_append_only
  before update or delete on public.content_fixes
  for each row execute function public.content_fix_forbid_rewrite();
