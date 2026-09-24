-- rls.sql — "who can read what", as assertions. Run by scripts/db-check.sh after
-- supabase/setup.sql, inside ONE transaction that is always rolled back, so it
-- leaves no trace on whatever database it ran against.
--
-- Cast: on course 'security-plus' — Ada and Bob are Team 01, Cy is Team 02, Ivy
-- is the instructor, Zed signed up but joined nothing. Each block switches to
-- the `authenticated` role with that person's id in the JWT claim, exactly as
-- PostgREST does per request, then asserts what that person can see and do.
-- SUPABASE_SETUP.md's "Who can read what" table is the prose version of this.
begin;

-- ── people (their metadata is shaped like what Google and GitHub send) ───────
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-00000000000a', 'ada@example.com',
   '{"iss":"https://accounts.google.com","full_name":"Ada Lovelace","name":"Ada Lovelace","avatar_url":"https://lh3.example/ada.png","email":"ada@example.com"}'),
  ('00000000-0000-4000-8000-00000000000b', 'bob@example.com',
   '{"iss":"https://api.github.com","user_name":"bob-dev","preferred_username":"bob-dev","avatar_url":"https://avatars.example/bob.png","email":"bob@example.com"}'),
  ('00000000-0000-4000-8000-00000000000c', 'cy@example.com', '{}'),
  ('00000000-0000-4000-8000-00000000000d', 'ivy@example.com', '{"name":"Ivy Instructor"}'),
  ('00000000-0000-4000-8000-00000000000e', 'zed@example.com', '{}');
update public.profiles set is_instructor = true where id = '00000000-0000-4000-8000-00000000000d';

-- ── the signup trigger read both providers' shapes ──────────────────────────
do $$ begin
  assert (select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000a') = 'Ada Lovelace', 'google: full_name';
  assert (select avatar_url   from public.profiles where id = '00000000-0000-4000-8000-00000000000a') = 'https://lh3.example/ada.png', 'google: avatar_url';
  assert (select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000b') = 'bob-dev', 'github: user_name';
  assert (select avatar_url   from public.profiles where id = '00000000-0000-4000-8000-00000000000b') = 'https://avatars.example/bob.png', 'github: avatar_url';
  assert (select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000c') = 'cy', 'no metadata: local part of the email, never the whole address';
  assert (select count(*) from public.profiles) = 5, 'one profile per signup';
end $$;

-- ── Ada joins Team 01, ticks a step, verifies it, saves private state ────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
insert into public.memberships (user_id, course_id, team_id, role, display_name, cohort)
  values ('00000000-0000-4000-8000-00000000000a', 'security-plus', '2026-01-T01', 'net', 'Ada', '2026-01');
insert into public.step_completions (user_id, course_id, task_id, step_id)
  values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', 's1');
insert into public.step_evidence (user_id, course_id, task_id, step_id, verified, method)
  values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', 's1', true, 'verified-output');
insert into public.user_course_state (user_id, course_id, data)
  values ('00000000-0000-4000-8000-00000000000a', 'security-plus', '{"mineSeen":1}');
insert into public.lab_access (user_id, course_id, data)
  values ('00000000-0000-4000-8000-00000000000a', 'security-plus', '{"notes":"lab password: hunter2"}');
insert into public.step_notes (user_id, course_id, task_id, step_id, note)
  values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', 's1', 'private note');
insert into public.step_flags (user_id, course_id, task_id, step_id, stuck)
  values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', 's1', true);
insert into public.deliverables (course_id, team_id, deliverable_id, data)
  values ('security-plus', '2026-01-T01', 'as-built', '{"fields":{"x":"1"}}');
reset role;

-- ── Bob joins Team 01 too; Cy joins Team 02 ─────────────────────────────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
insert into public.memberships (user_id, course_id, team_id, role, display_name, cohort)
  values ('00000000-0000-4000-8000-00000000000b', 'security-plus', '2026-01-T01', 'sec', 'Bob', '2026-01');
insert into public.step_completions (user_id, course_id, task_id, step_id)
  values ('00000000-0000-4000-8000-00000000000b', 'security-plus', 't1', 's1');
insert into public.step_evidence (user_id, course_id, task_id, step_id, verified, method)
  values ('00000000-0000-4000-8000-00000000000b', 'security-plus', 't1', 's1', false, 'self-attested');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
insert into public.memberships (user_id, course_id, team_id, role, display_name, cohort)
  values ('00000000-0000-4000-8000-00000000000c', 'security-plus', '2026-01-T02', 'net', 'Cy', '2026-01');
insert into public.step_completions (user_id, course_id, task_id, step_id)
  values ('00000000-0000-4000-8000-00000000000c', 'security-plus', 't1', 's1');
insert into public.step_evidence (user_id, course_id, task_id, step_id, verified, method)
  values ('00000000-0000-4000-8000-00000000000c', 'security-plus', 't1', 's1', true, 'verified-output');
insert into public.lab_access (user_id, course_id, data)
  values ('00000000-0000-4000-8000-00000000000c', 'security-plus', '{"notes":"cy secret"}');
reset role;

-- ── Ivy (instructor) sets the cohort date and publishes a course ────────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
insert into public.cohorts (course_id, cohort, starts_on) values ('security-plus', '2026-01', '2026-01-12');
insert into public.course_documents (course_id, schema, doc) values ('security-plus', 'course/1', '{"id":"security-plus"}');
insert into public.deliverable_reviews (course_id, team_id, deliverable_id, week, status)
  values ('security-plus', '2026-01-T01', 'as-built', 1, 'approved');
reset role;

-- ── What Ada sees ───────────────────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
do $$ begin
  assert (select count(*) from public.memberships) = 3, 'ada: the whole course roster';
  assert (select count(*) from public.step_completions) = 2, 'ada: her own and bob''s ticks, not cy''s';
  assert (select count(*) from public.step_completions where user_id = '00000000-0000-4000-8000-00000000000c') = 0, 'ada: never cy''s ticks';
  assert (select count(*) from public.step_evidence) = 2, 'ada: her own and bob''s evidence (badges), not cy''s';
  assert (select method from public.step_evidence where user_id = '00000000-0000-4000-8000-00000000000b') = 'self-attested', 'ada: sees bob''s method';
  assert (select count(*) from public.step_flags) = 1, 'ada: team flags';
  assert (select count(*) from public.profiles) = 2, 'ada: her profile and her teammate''s';
  assert (select avatar_url from public.profiles where id = '00000000-0000-4000-8000-00000000000b') is not null, 'ada: bob''s picture';
  assert (select count(*) from public.profiles where id = '00000000-0000-4000-8000-00000000000c') = 0, 'ada: not cy''s profile';
  assert (select count(*) from public.lab_access) = 1, 'ada: only her own lab access';
  assert (select count(*) from public.user_course_state) = 1, 'ada: only her own state';
  assert (select count(*) from public.step_notes) = 1, 'ada: only her own notes';
  assert (select count(*) from public.deliverables) = 1, 'ada: her team''s deliverable';
  assert (select count(*) from public.deliverable_reviews) = 1, 'ada: her team''s review';
  assert (select count(*) from public.cohorts) = 1, 'ada: the cohort date';
  assert (select count(*) from public.course_documents) = 1, 'ada: the published course';
  assert (select public.is_instructor()) = false, 'ada: not an instructor';
end $$;
-- …and what she cannot do. RLS refuses with 42501; anything else is a bug.
do $$ begin
  begin
    insert into public.step_completions (user_id, course_id, task_id, step_id)
      values ('00000000-0000-4000-8000-00000000000b', 'security-plus', 't9', 's9');
    raise exception 'ada wrote a tick as bob';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.deliverables (course_id, team_id, deliverable_id, data)
      values ('security-plus', '2026-01-T02', 'as-built', '{}');
    raise exception 'ada wrote another team''s deliverable';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.cohorts (course_id, cohort, starts_on) values ('security-plus', 'x', '2026-01-01');
    raise exception 'ada set a cohort date';
  exception when insufficient_privilege then null; end;
  begin
    update public.course_documents set version = 2 where course_id = 'security-plus';
    if found then raise exception 'ada edited the course document'; end if;
  end;
  begin
    update public.profiles set is_instructor = true where id = '00000000-0000-4000-8000-00000000000a';
    raise exception 'ada promoted herself';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.profiles (id, display_name, is_instructor)
      values ('00000000-0000-4000-8000-00000000000a', 'Ada', true)
      on conflict (id) do update set is_instructor = true;
    raise exception 'ada promoted herself via upsert';
  exception when insufficient_privilege then null; end;
  -- …while the two columns that are hers stay hers.
  update public.profiles set display_name = 'Ada L.', avatar_url = null where id = '00000000-0000-4000-8000-00000000000a';
  assert (select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000a') = 'Ada L.', 'ada: renamed herself';
  assert (select public.is_instructor()) = false, 'ada: still not an instructor';
end $$;
reset role;

-- The self-promotion attempts above are the hole a row policy alone leaves
-- open: a user may UPDATE their own profile row, and `is_instructor` is a column
-- on it. 0006 closes it with column grants; keep these failing loudly.

-- ── What Cy sees (other team) ───────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
do $$ begin
  assert (select count(*) from public.memberships) = 3, 'cy: the whole course roster';
  assert (select count(*) from public.step_completions) = 1, 'cy: only his own ticks';
  assert (select count(*) from public.step_evidence) = 1, 'cy: only his own evidence';
  assert (select count(*) from public.step_flags) = 0, 'cy: not team 01''s flags';
  assert (select count(*) from public.deliverables) = 0, 'cy: not team 01''s deliverables';
  assert (select count(*) from public.deliverable_reviews) = 0, 'cy: not team 01''s reviews';
  assert (select count(*) from public.profiles) = 1, 'cy: only his own profile';
  assert (select count(*) from public.lab_access) = 1, 'cy: only his own lab access';
end $$;
reset role;

-- ── What Zed sees (signed in, joined nothing) ───────────────────────────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000e';
do $$ begin
  assert (select count(*) from public.memberships) = 0, 'zed: no roster before joining';
  assert (select count(*) from public.step_completions) = 0, 'zed: nothing';
  assert (select count(*) from public.profiles) = 1, 'zed: his own profile only';
  assert (select count(*) from public.course_documents) = 1, 'zed: may read the course';
end $$;
reset role;

-- ── What Ivy sees (instructor) ──────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
do $$ begin
  assert (select public.is_instructor()), 'ivy: is an instructor';
  assert (select count(*) from public.memberships) = 3, 'ivy: every membership';
  assert (select count(*) from public.step_completions) = 3, 'ivy: every tick';
  assert (select count(*) from public.step_evidence) = 3, 'ivy: every evidence row';
  assert (select count(*) from public.step_flags) = 1, 'ivy: every flag';
  assert (select count(*) from public.deliverables) = 1, 'ivy: every deliverable';
  assert (select count(*) from public.gate_status) = 0, 'ivy: gates (none yet)';
  assert (select count(*) from public.lab_access) = 0, 'ivy: NEVER lab access (credentials)';
  assert (select count(*) from public.step_notes) = 0, 'ivy: never private notes';
  assert (select count(*) from public.user_course_state) = 0, 'ivy: never private state';
end $$;
reset role;

-- ── Signed out (anon key, no session) ───────────────────────────────────────
set local role anon;
set local request.jwt.claim.sub = '';  -- no session: auth.uid() is null
do $$ begin
  assert (select count(*) from public.memberships) = 0, 'anon: nothing';
  assert (select count(*) from public.course_documents) = 0, 'anon: not even the course (signed-in read)';
  assert (select count(*) from public.profiles) = 0, 'anon: no profiles';
end $$;
reset role;

rollback;
