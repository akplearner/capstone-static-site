-- 0018_course_document_versions.sql — every save of a course in the studio is a numbered, restorable version (R122).
--
-- WHAT THIS IS. `course_documents` holds ONE row per course, the document the app renders.
-- The studio saved by overwriting it: the version was whatever the browser said (and the
-- browser never counted it up), nothing recorded who saved or what the course said before,
-- and a mistaken save could only be undone by retyping. So the database now numbers and keeps
-- every save, whichever client wrote it:
--   * a trigger on `course_documents` sets `version` to the next number (never lower than the
--     row's own version plus one, or than the client's) and writes the same number INTO the
--     document (`doc.course.version`), so the row, the document and the history agree;
--   * the same trigger snapshots the saved document, with who saved it and when, into
--     `course_document_versions`, which only that trigger writes.
-- Restoring an old version is an ordinary save of that document: it becomes a NEW version
-- and the old one stays where it was.
--
-- WHO CAN DO WHAT. Only an admin reads the history (a snapshot is a whole document, and the
-- studio is the admin's); nobody inserts, updates or deletes a snapshot from a request — the
-- grants are revoked and the trigger is the only writer. Deleting a course keeps its history;
-- if the course is made again its numbering continues. Erasing an admin's account detaches
-- their id from their snapshots (`on delete set null`); the name they were saved under stays.
--
-- The course's CONTENT version is '{this version}.{content fix revision}' (0017): this number
-- counts edits made in the studio, the revision counts corrections made from reports.
--
-- ONE REPAIR, while a migration is open: `course_documents.updated_by` pointed at the account
-- with no ON DELETE action, so an admin who had ever saved a course could not be erased
-- (the delete-account function would fail on the foreign key). It now detaches, like the
-- history does, and the trigger below does not count that detaching as an edit.
--
-- Rows saved before this migration are snapshotted once below, so the history starts with
-- what is live. Idempotent for the same reason as 0001–0017.

create table if not exists public.course_document_versions (
  course_id text not null,
  version int not null check (version >= 1),
  schema text not null,
  doc jsonb not null,
  -- What the history list shows without fetching the (large) documents: the course's title and the document's size.
  title text not null default '',
  bytes int not null default 0,
  saved_by uuid references auth.users(id) on delete set null,
  saved_by_name text not null default '',
  saved_at timestamptz not null default now(),
  primary key (course_id, version)
);

alter table public.course_document_versions enable row level security;

drop policy if exists "course document versions admin read" on public.course_document_versions;
create policy "course document versions admin read" on public.course_document_versions for select
  using (public.is_admin());

-- No policy lets a request write a snapshot; make the grants say so too.
revoke insert, update, delete, truncate on public.course_document_versions from anon, authenticated;

-- ── Erasing an admin's account keeps what they saved ────────────────────────────────────
alter table public.course_documents drop constraint if exists course_documents_updated_by_fkey;
alter table public.course_documents
  add constraint course_documents_updated_by_fkey foreign key (updated_by) references auth.users(id) on delete set null;

-- ── The next version, and the snapshot of what was saved ───────────────────────────────
create or replace function public.course_document_save()
returns trigger language plpgsql security definer set search_path = public as $$
declare top int;
begin
  -- Erasing the account that saved a course detaches its id; that is not an edit.
  if tg_op = 'UPDATE' and old.updated_by is not null and new.updated_by is null
     and (to_jsonb(new) - 'updated_by') = (to_jsonb(old) - 'updated_by') then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtext('course_documents:' || new.course_id));
  select coalesce(max(v.version), 0) into top from public.course_document_versions v where v.course_id = new.course_id;
  new.version := greatest(
    top + 1,
    case when tg_op = 'UPDATE' then old.version + 1 else 1 end,
    coalesce(new.version, 1)
  );
  new.updated_at := now();
  -- The document says which version it is.
  if jsonb_typeof(new.doc -> 'course') = 'object' then
    new.doc := jsonb_set(new.doc, '{course,version}', to_jsonb(new.version));
  end if;
  insert into public.course_document_versions (course_id, version, schema, doc, title, bytes, saved_by, saved_by_name, saved_at)
    values (new.course_id, new.version, new.schema, new.doc, coalesce(new.doc -> 'course' ->> 'title', ''), octet_length(new.doc::text),
            new.updated_by, coalesce((select p.display_name from public.profiles p where p.id = new.updated_by), ''), now());
  return new;
end $$;

drop trigger if exists course_documents_save on public.course_documents;
create trigger course_documents_save
  before insert or update on public.course_documents
  for each row execute function public.course_document_save();

-- ── The history starts with what is live ────────────────────────────────────────────────
insert into public.course_document_versions (course_id, version, schema, doc, title, bytes, saved_by, saved_by_name, saved_at)
  select d.course_id, d.version, d.schema, d.doc, coalesce(d.doc -> 'course' ->> 'title', ''), octet_length(d.doc::text), d.updated_by,
         coalesce((select p.display_name from public.profiles p where p.id = d.updated_by), ''), d.updated_at
    from public.course_documents d
  on conflict (course_id, version) do nothing;

-- ── The history is never rewritten ──────────────────────────────────────────────────────
create or replace function public.course_document_version_forbid_rewrite()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE'
     and old.saved_by is not null and new.saved_by is null
     and (to_jsonb(new) - 'saved_by') = (to_jsonb(old) - 'saved_by') then
    return new;
  end if;
  raise exception 'course_document_versions is append-only — restore an old version as a new save instead';
end $$;
drop trigger if exists course_document_versions_append_only on public.course_document_versions;
create trigger course_document_versions_append_only
  before update or delete on public.course_document_versions
  for each row execute function public.course_document_version_forbid_rewrite();
