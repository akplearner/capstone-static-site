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
  ('00000000-0000-4000-8000-00000000000e', 'zed@example.com', '{}'),
  ('00000000-0000-4000-8000-00000000000f', 'ana@example.com', '{"name":"Ana Admin"}');
update public.profiles set is_instructor = true where id = '00000000-0000-4000-8000-00000000000d';
-- R85: Ana is an ADMIN — everything Ivy can do, plus writing course content.
update public.profiles set is_admin = true where id = '00000000-0000-4000-8000-00000000000f';

-- ── the signup trigger read both providers' shapes ──────────────────────────
do $$ begin
  assert (select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000a') = 'Ada Lovelace', 'google: full_name';
  assert (select avatar_url   from public.profiles where id = '00000000-0000-4000-8000-00000000000a') = 'https://lh3.example/ada.png', 'google: avatar_url';
  assert (select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000b') = 'bob-dev', 'github: user_name';
  assert (select avatar_url   from public.profiles where id = '00000000-0000-4000-8000-00000000000b') = 'https://avatars.example/bob.png', 'github: avatar_url';
  assert (select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000c') = 'cy', 'no metadata: local part of the email, never the whole address';
  assert (select count(*) from public.profiles) = 6, 'one profile per signup';
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

-- ── Ivy (instructor) sets the cohort date and grades; Ana (admin) publishes ─
-- R85 split: running the class is Ivy's; the course document is Ana's.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
insert into public.cohorts (course_id, cohort, starts_on) values ('security-plus', '2026-01', '2026-01-12');
insert into public.deliverable_reviews (course_id, team_id, deliverable_id, week, status)
  values ('security-plus', '2026-01-T01', 'as-built', 1, 'approved');
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000f';
insert into public.course_documents (course_id, schema, doc) values ('security-plus', 'course/1', '{"id":"security-plus"}');
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

-- ── What Bob sees (same team as Ada) — the other direction of every teammate
-- read, plus the co-edit that makes deliverables genuinely shared (R82) ─────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
do $$ begin
  assert (select count(*) from public.step_completions where user_id = '00000000-0000-4000-8000-00000000000a') = 1, 'bob: reads ada''s tick';
  assert (select method from public.step_evidence where user_id = '00000000-0000-4000-8000-00000000000a') = 'verified-output', 'bob: reads ada''s evidence — her gems';
  assert (select count(*) from public.step_flags where user_id = '00000000-0000-4000-8000-00000000000a') = 1, 'bob: sees ada is stuck';
  assert (select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000a') = 'Ada L.', 'bob: ada''s (renamed) profile';
  assert (select count(*) from public.deliverables where team_id = '2026-01-T01') = 1, 'bob: the team''s form';
  assert (select count(*) from public.step_notes) = 0, 'bob: never ada''s notes';
  assert (select count(*) from public.lab_access) = 0, 'bob: never ada''s lab credentials';
  assert (select count(*) from public.user_course_state) = 0, 'bob: never ada''s private state';
end $$;
-- Ada reports an issue on a task (R83).
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
insert into public.task_reports (id, user_id, course_id, task_id, team_id, kind, note)
  values ('00000000-0000-4000-9000-000000000001', '00000000-0000-4000-8000-00000000000a',
          'security-plus', 't1', '2026-01-T01', 'broken', 'nmap flag rejected');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
do $$ begin
  assert (select count(*) from public.task_reports) = 1, 'bob: sees the team''s report';
  assert (select kind from public.task_reports limit 1) = 'broken', 'bob: reads its kind';
  begin
    update public.task_reports set status = 'resolved' where id = '00000000-0000-4000-9000-000000000001';
    if found then raise exception 'bob resolved a report — instructor only'; end if;
  end;
  begin
    insert into public.task_reports (user_id, course_id, task_id, team_id, kind)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't9', '2026-01-T01', 'question');
    raise exception 'bob filed a report as ada';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Bob edits the form Ada started: same row, team-shared.
insert into public.deliverables (course_id, team_id, deliverable_id, data, updated_by)
  values ('security-plus', '2026-01-T01', 'as-built', '{"fields":{"x":"2"}}', '00000000-0000-4000-8000-00000000000b')
  on conflict (course_id, team_id, deliverable_id) do update
    set data = excluded.data, updated_by = excluded.updated_by;
reset role;

-- Ada sees Bob's edit, and who made it.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
do $$ begin
  assert (select data->'fields'->>'x' from public.deliverables where team_id = '2026-01-T01' and deliverable_id = 'as-built') = '2', 'ada: bob''s edit of the shared form';
  assert (select updated_by from public.deliverables where team_id = '2026-01-T01' and deliverable_id = 'as-built') = '00000000-0000-4000-8000-00000000000b', 'ada: sees who edited it';
end $$;
reset role;

-- ── R139: the form's history (0025) — appended by the database, read by the team ──
-- Bob's edit replaced Ada's version: one history row holds what the form held before, and who replaced it.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
do $$ begin
  assert (select count(*) from public.deliverable_history where team_id = '2026-01-T01') = 1, 'ada: one earlier version of the team''s form';
  assert (select data->'fields'->>'x' from public.deliverable_history where team_id = '2026-01-T01') = '1', 'ada: the version holds what the form held BEFORE';
  assert (select replaced_by from public.deliverable_history where team_id = '2026-01-T01') = '00000000-0000-4000-8000-00000000000b', 'ada: who replaced it';
  -- A change by a different author is always a version; a second change by the same author within the sitting is not.
  update public.deliverables set data = '{"fields":{"x":"3"}}', updated_by = '00000000-0000-4000-8000-00000000000a' where team_id = '2026-01-T01' and deliverable_id = 'as-built';
  assert (select count(*) from public.deliverable_history where team_id = '2026-01-T01') = 2, 'ada: her change is a version';
  update public.deliverables set data = '{"fields":{"x":"4"}}', updated_by = '00000000-0000-4000-8000-00000000000a' where team_id = '2026-01-T01' and deliverable_id = 'as-built';
  assert (select count(*) from public.deliverable_history where team_id = '2026-01-T01') = 2, 'ada: a second save in the sitting is not a version';
  -- The same data saved again is no change at all.
  update public.deliverables set data = '{"fields":{"x":"4"}}' where team_id = '2026-01-T01' and deliverable_id = 'as-built';
  assert (select count(*) from public.deliverable_history where team_id = '2026-01-T01') = 2, 'ada: an unchanged save is not a version';
  -- Nobody writes the history by hand.
  begin
    insert into public.deliverable_history (course_id, team_id, deliverable_id, data, updated_at)
      values ('security-plus', '2026-01-T01', 'as-built', '{}', now());
    raise exception 'ada wrote a history row';
  exception when insufficient_privilege then null; end;
  begin
    update public.deliverable_history set data = '{}' where team_id = '2026-01-T01';
    raise exception 'ada rewrote the history';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.deliverable_history where team_id = '2026-01-T01';
    raise exception 'ada erased the history';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ── R140: validation answers (0026) — own insert, team read, append-only ──
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
insert into public.validation_answers (user_id, course_id, team_id, activity_id, checkpoint, kind, record_key, answer_sha256, correct)
  values ('00000000-0000-4000-8000-00000000000a', 'security-plus', '2026-01-T01', 'val:3:recall:asset_inventory.assets[0].ip', 3, 'recall', 'asset_inventory.assets[0].ip', repeat('a', 64), true);
do $$ begin
  assert (select count(*) from public.validation_answers) = 1, 'ada: her answer';
  assert (select at from public.validation_answers) > now() - interval '1 minute', 'ada: the database stamped it';
  begin
    insert into public.validation_answers (user_id, course_id, team_id, activity_id, checkpoint, kind, record_key, answer_sha256, correct)
      values ('00000000-0000-4000-8000-00000000000b', 'security-plus', '2026-01-T01', 'val:3:recall:x', 3, 'recall', 'x', repeat('b', 64), true);
    raise exception 'ada answered as bob';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.validation_answers (user_id, course_id, team_id, activity_id, checkpoint, kind, record_key, answer_sha256, correct)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', '2026-01-T02', 'val:3:recall:x', 3, 'recall', 'x', repeat('b', 64), true);
    raise exception 'ada answered for a team she is not on';
  exception when insufficient_privilege then null; end;
  begin
    update public.validation_answers set correct = false where user_id = '00000000-0000-4000-8000-00000000000a';
    raise exception 'ada rewrote an answer';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.validation_answers where user_id = '00000000-0000-4000-8000-00000000000a';
    raise exception 'ada erased an answer';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.validation_answers (user_id, course_id, team_id, activity_id, checkpoint, kind, record_key, answer_sha256, explanation)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', '2026-01-T01', 'val:3:explain:x', 3, 'explain', 'x', repeat('c', 64), repeat('e', 2001));
    raise exception 'ada saved a 2,001-character explanation';
  exception when check_violation then null; end;
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
do $$ begin
  assert (select count(*) from public.validation_answers) = 1, 'bob: his teammate''s answer';
end $$;
reset role;

-- ── What Cy sees (other team) ───────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
do $$ begin
  assert (select count(*) from public.validation_answers) = 0, 'cy: not team 01''s answers';
  assert (select count(*) from public.deliverable_history) = 0, 'cy: not team 01''s history';
  assert (select count(*) from public.task_reports) = 0, 'cy: never another team''s reports';
  assert (select count(*) from public.memberships) = 3, 'cy: the whole course roster';
  assert (select count(*) from public.step_completions) = 1, 'cy: only his own ticks';
  assert (select count(*) from public.step_evidence) = 1, 'cy: only his own evidence';
  assert (select count(*) from public.step_flags) = 0, 'cy: not team 01''s flags';
  assert (select count(*) from public.deliverables) = 0, 'cy: not team 01''s deliverables';
  assert (select count(*) from public.deliverable_reviews) = 0, 'cy: not team 01''s reviews';
  assert (select count(*) from public.profiles) = 1, 'cy: only his own profile';
  assert (select count(*) from public.lab_access) = 1, 'cy: only his own lab access';
end $$;
do $$ begin
  begin
    insert into public.step_flags (user_id, course_id, task_id, step_id, stuck)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't9', 's9', true);
    raise exception 'cy forged a flag as ada';
  exception when insufficient_privilege then null; end;
  begin
    update public.deliverables set data = '{}'::jsonb where team_id = '2026-01-T01';
    if found then raise exception 'cy edited team 01''s form'; end if;
  end;
end $$;
reset role;

-- ── R84: Ada submits a deliverable; review is blind; history is frozen ──────
-- Ada freezes a submission. The snapshot deliberately carries a teamId key so
-- the packet-stripping assert below is not vacuous.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
insert into public.deliverable_submissions
  (id, course_id, team_id, deliverable_id, week, version, submitted_by, content_sha256, snapshot)
  values ('00000000-0000-4000-9000-000000000100', 'security-plus', '2026-01-T01', 'as-built', 1, 1,
          '00000000-0000-4000-8000-00000000000a', 'abc123',
          '{"teamId":"2026-01-T01","submittedBy":"ada","data":{"fields":{"x":"1"}},"categories":{"completeness":true,"correctness":true,"authenticity":true,"consistency":true}}');
do $$
declare v_eligible integer;
begin
  -- Only Cy is outside Team 01 in this cohort: eligible = 1, and the app takes
  -- the platform-verdict path (< 2 reviewers) — but the one assignment exists.
  select public.assign_peer_reviews('00000000-0000-4000-9000-000000000100') into v_eligible;
  assert v_eligible = 1, 'ada: one eligible reviewer (cy)';
  -- Frozen means frozen, layer 1: with no UPDATE policy, RLS gives Ada's
  -- UPDATE nothing to touch.
  update public.deliverable_submissions set content_sha256 = 'forged'
    where id = '00000000-0000-4000-9000-000000000100';
  if found then raise exception 'ada rewrote a frozen submission'; end if;
end $$;
reset role;

-- Frozen means frozen, layer 2: even the table owner, whom RLS never filters,
-- hits the append-only trigger.
do $$ begin
  begin
    update public.deliverable_submissions set content_sha256 = 'forged'
      where id = '00000000-0000-4000-9000-000000000100';
    raise exception 'the owner rewrote a frozen submission';
  exception when others then
    if sqlerrm not like '%append-only%' then raise; end if;
  end;
end $$;

-- Bob (teammate) sees the team's submission; Cy (other team) must not — Cy
-- reviews through the RPCs, which never say whose work it is.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
do $$ begin
  assert (select count(*) from public.deliverable_submissions) = 1, 'bob: reads the team''s submission';
  assert (select assigned from public.get_submission_progress('00000000-0000-4000-9000-000000000100')) = 1, 'bob: progress counts';
end $$;
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
do $$
declare v_assignment uuid; v_packet jsonb;
begin
  assert (select count(*) from public.deliverable_submissions) = 0, 'cy: never the submission row';
  assert (select count(*) from public.get_review_queue()) = 1, 'cy: one assignment in the queue';
  select assignment_id into v_assignment from public.get_review_queue();
  select public.get_review_packet(v_assignment) into v_packet;
  assert v_packet is not null and v_packet ? 'snapshot', 'cy: the packet serves the snapshot';
  assert not (v_packet->'snapshot' ? 'teamId'), 'cy: blind — no teamId in the packet';
  assert not (v_packet->'snapshot' ? 'submittedBy'), 'cy: blind — no submittedBy in the packet';
  assert not (v_packet ? 'team_id') and not (v_packet ? 'submitted_by'), 'cy: blind — no identifying columns';
  -- Cy cannot write the tables directly (no policies)…
  begin
    insert into public.peer_review_assignments (submission_id, reviewer_id)
      values ('00000000-0000-4000-9000-000000000100', '00000000-0000-4000-8000-00000000000c');
    raise exception 'cy self-assigned a review';
  exception when insufficient_privilege then null; end;
  -- …reviews through the RPC, once.
  perform public.submit_peer_review(v_assignment, '{"q1":true}'::jsonb, true);
  begin
    perform public.submit_peer_review(v_assignment, '{"q1":false}'::jsonb, false);
    raise exception 'cy reviewed twice';
  exception when unique_violation then null; end;
end $$;
reset role;

-- Ada's team follows progress by counts, and reads the anonymous verdict rows.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
do $$
declare p record;
begin
  select * into p from public.get_submission_progress('00000000-0000-4000-9000-000000000100');
  assert p.assigned = 1 and p.reviewed = 1 and p.confirms = 1, 'ada: 1 assigned, 1 reviewed, 1 confirm';
  assert (select count(*) from public.peer_reviews) = 1, 'ada: reads the anonymous review row';
  assert (select count(*) from public.peer_review_assignments) = 0, 'ada: never who reviews';
end $$;
reset role;

-- ── R86: acknowledgements are logged, personal, and permanent ──────────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
insert into public.agreement_acceptances (user_id, agreement_id, version)
  values ('00000000-0000-4000-8000-00000000000a', 'terms', 1);
do $$ begin
  assert (select count(*) from public.agreement_acceptances) = 1, 'ada: reads her own acceptance';
  -- Nobody signs for someone else…
  begin
    insert into public.agreement_acceptances (user_id, agreement_id, version)
      values ('00000000-0000-4000-8000-00000000000b', 'terms', 1);
    raise exception 'ada acknowledged terms as bob';
  exception when insufficient_privilege then null; end;
  -- …and the log only grows: with no update/delete policy there is nothing to touch.
  update public.agreement_acceptances set version = 99 where agreement_id = 'terms';
  if found then raise exception 'ada rewrote the acceptance log'; end if;
  delete from public.agreement_acceptances where agreement_id = 'terms';
  if found then raise exception 'ada erased the acceptance log'; end if;
  -- The heartbeat column is hers to set (0011 column grant).
  update public.profiles set last_seen_at = now() where id = '00000000-0000-4000-8000-00000000000a';
  assert (select last_seen_at from public.profiles where id = '00000000-0000-4000-8000-00000000000a') is not null, 'ada: sets her own last-seen clock';
end $$;
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
do $$ begin
  assert (select count(*) from public.agreement_acceptances) = 0, 'bob: never ada''s acknowledgements';
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
  assert (select count(*) from public.deliverable_submissions) = 0, 'zed: no submissions';
  assert (select count(*) from public.get_review_queue()) = 0, 'zed: an empty review queue';
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
  assert (select count(*) from public.task_reports) = 1, 'ivy: every report';
  assert (select count(*) from public.deliverable_submissions) = 1, 'ivy: every submission';
  assert (select count(*) from public.peer_review_assignments) = 1, 'ivy: every assignment';
  assert (select count(*) from public.peer_reviews) = 1, 'ivy: every review';
  -- R85: the registrations view — every profile, with a name to print.
  assert (select count(*) from public.profiles) = 6, 'ivy: every profile';
  assert (select display_name from public.profiles where id = '00000000-0000-4000-8000-00000000000a') = 'Ada L.', 'ivy: sees student names (as she renamed herself)';
  assert (select public.is_admin()) = false, 'ivy: not an admin';
  assert (select count(*) from public.agreement_acceptances) = 1, 'ivy: the whole acknowledgement log';
end $$;
-- R85: content is the admin's — an instructor can no longer write the course
-- document (insert refused, update touches nothing)…
do $$ begin
  begin
    insert into public.course_documents (course_id, schema, doc) values ('other-course', 'course/1', '{"id":"other-course"}');
    raise exception 'ivy published a course document';
  exception when insufficient_privilege then null; end;
  begin
    update public.course_documents set version = 2 where course_id = 'security-plus';
    if found then raise exception 'ivy edited the course document'; end if;
  end;
end $$;
-- Ivy resolves Ada's report — the one verdict only an instructor can give.
update public.task_reports set status = 'resolved', resolved_at = now(),
  resolved_by = '00000000-0000-4000-8000-00000000000d'
  where id = '00000000-0000-4000-9000-000000000001';
do $$ begin
  assert (select status from public.task_reports where id = '00000000-0000-4000-9000-000000000001') = 'resolved', 'ivy: resolved it';
end $$;
reset role;

-- ── R85: the roster can be fixed — by staff, and only staff ────────────────
-- Zed finally joins (his own write, 0001), on the wrong team by mistake.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000e';
insert into public.memberships (user_id, course_id, team_id, role, display_name, cohort)
  values ('00000000-0000-4000-8000-00000000000e', 'security-plus', '2026-01-T01', 'net', 'Zed', '2026-01');
reset role;

-- A student cannot manage anyone else's membership: the update touches nothing.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
do $$ begin
  update public.memberships set team_id = '2026-01-T09'
    where user_id = '00000000-0000-4000-8000-00000000000b';
  if found then raise exception 'cy moved bob to another team'; end if;
end $$;
reset role;

-- Ivy moves Zed to the right team, then removes him when he drops the course.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
do $$ begin
  update public.memberships set team_id = '2026-01-T02', role = 'sec'
    where user_id = '00000000-0000-4000-8000-00000000000e' and course_id = 'security-plus';
  assert (select team_id from public.memberships where user_id = '00000000-0000-4000-8000-00000000000e') = '2026-01-T02', 'ivy: moved zed';
  delete from public.memberships where user_id = '00000000-0000-4000-8000-00000000000e' and course_id = 'security-plus';
  assert (select count(*) from public.memberships) = 3, 'ivy: removed zed — roster back to three';
end $$;
reset role;

-- ── What Ana (admin) sees and does ──────────────────────────────────────────
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000f';
do $$ begin
  assert (select public.is_admin()), 'ana: is an admin';
  assert (select public.is_instructor()), 'ana: an admin is an instructor everywhere the platform asks';
  assert (select count(*) from public.memberships) = 3, 'ana: every membership';
  assert (select count(*) from public.profiles) = 6, 'ana: every profile';
  assert (select count(*) from public.deliverable_submissions) = 1, 'ana: every submission';
  assert (select count(*) from public.task_reports) = 1, 'ana: every report';
  assert (select count(*) from public.lab_access) = 0, 'ana: NEVER lab access (credentials)';
  update public.course_documents set version = 2 where course_id = 'security-plus';
  if not found then raise exception 'ana could not edit the course document'; end if;
end $$;
reset role;

-- ── R103: the document lifecycle — the team's own rows, append-only ────────
-- Ada (Team 01) records that a form went into review; Bob reads it; Cy never
-- sees it; nobody rewrites it.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
insert into public.deliverable_status (course_id, team_id, deliverable_id, status, changed_by, role, version)
  values ('security-plus', '2026-01-T01', 'as-built', 'in_review', '00000000-0000-4000-8000-00000000000a', 'red', 1);
do $$ begin
  assert (select count(*) from public.deliverable_status) = 1, 'ada: reads her own team''s status row';
  update public.deliverable_status set status = 'approved' where deliverable_id = 'as-built';
  if found then raise exception 'ada rewrote a status row'; end if;
  begin
    insert into public.deliverable_status (course_id, team_id, deliverable_id, status, changed_by, role)
      values ('security-plus', '2026-01-T02', 'as-built', 'in_review', '00000000-0000-4000-8000-00000000000a', 'red');
    raise exception 'ada wrote a status row for another team';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
do $$ begin
  assert (select count(*) from public.deliverable_status) = 1, 'bob: reads the team''s status row';
end $$;
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
do $$ begin
  assert (select count(*) from public.deliverable_status) = 0, 'cy: never another team''s status';
end $$;
reset role;

-- Frozen, layer 2: even the owner hits the append-only trigger.
do $$ begin
  begin
    update public.deliverable_status set status = 'approved' where deliverable_id = 'as-built';
    raise exception 'the owner rewrote a status row';
  exception when others then
    if sqlerrm not like '%append-only%' then raise; end if;
  end;
end $$;

-- ── R110: the text hash, consent grants and outcomes ───────────────────────
-- Ada records which text she accepted, turns the outcome grant on, then off
-- again, and answers the outcome questions. Everything is hers alone, nothing
-- is ever rewritten, and the aggregate stays silent below five members.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
insert into public.agreement_acceptances (user_id, agreement_id, version, text_sha256)
  values ('00000000-0000-4000-8000-00000000000a', 'aup', 2, repeat('a', 64));
do $$ begin
  begin
    insert into public.agreement_acceptances (user_id, agreement_id, version, text_sha256)
      values ('00000000-0000-4000-8000-00000000000a', 'lab', 2, 'not-a-hash');
    raise exception 'ada logged a malformed text hash';
  exception when check_violation then null;
  end;
end $$;
insert into public.consent_grants (user_id, grant_id, granted)
  values ('00000000-0000-4000-8000-00000000000a', 'outcome', true);
insert into public.consent_grants (user_id, grant_id, granted)
  values ('00000000-0000-4000-8000-00000000000a', 'outcome', false);
insert into public.learner_outcomes (user_id, status, role_title, employer, started_on, used_at_work)
  values ('00000000-0000-4000-8000-00000000000a', 'searching', 'SOC analyst', 'Example Ltd', '2026-10', '{"security-plus": true}');
do $$
declare n int;
begin
  assert (select count(*) from public.consent_grants) = 2, 'ada: a grant and a revocation are two rows';
  assert (select count(*) from public.learner_outcomes) = 1, 'ada: reads her own outcome row';
  -- Nobody consents for someone else…
  begin
    insert into public.consent_grants (user_id, grant_id, granted)
      values ('00000000-0000-4000-8000-00000000000b', 'outcome', true);
    raise exception 'ada consented as bob';
  exception when insufficient_privilege or check_violation then null;
  end;
  -- …and nobody rewrites a grant or an answer: with no update policy the
  -- statement reaches no row at all (layer 1), and the trigger below RLS is
  -- proved as the owner further down (layer 2).
  update public.consent_grants set granted = true where grant_id = 'outcome';
  get diagnostics n = row_count;
  assert n = 0, 'ada rewrote her consent log';
  update public.learner_outcomes set status = 'placed';
  get diagnostics n = row_count;
  assert n = 0, 'ada rewrote her outcome row';
  -- The consent helper is the platform's, not a member's.
  begin
    perform public.has_consent('00000000-0000-4000-8000-00000000000b', 'outcome');
    raise exception 'ada read bob''s consent through the helper';
  exception when insufficient_privilege then null;
  end;
  -- A member gets no counts at all.
  assert (select count(*) from public.outcome_counts('security-plus')) = 0, 'ada: no outcome counts for a member';
end $$;
reset role;

-- Bob sees none of it; Ivy sees no rows and, below five answers, no counts.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
do $$ begin
  assert (select count(*) from public.consent_grants) = 0, 'bob: never ada''s consents';
  assert (select count(*) from public.learner_outcomes) = 0, 'bob: never ada''s outcomes';
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
do $$ begin
  assert (select count(*) from public.consent_grants) = 0, 'ivy: no consent rows, ever';
  assert (select count(*) from public.learner_outcomes) = 0, 'ivy: no outcome rows, only counts';
  assert (select count(*) from public.outcome_counts('security-plus')) = 0, 'ivy: the k floor holds below five answers';
end $$;
reset role;

-- Layer 2: even the table owner hits the append-only triggers.
do $$ begin
  begin
    update public.consent_grants set granted = true where grant_id = 'outcome';
    raise exception 'the owner rewrote a consent row';
  exception when others then
    if sqlerrm not like '%append-only%' then raise; end if;
  end;
  begin
    update public.learner_outcomes set status = 'placed';
    raise exception 'the owner rewrote an outcome row';
  exception when others then
    if sqlerrm not like '%append-only%' then raise; end if;
  end;
end $$;

-- ── R113: stamps, receipts and re-hash checks ─────────────────────────────
-- The platform (the service role, as the edge functions run) issues Ada a
-- stamp and logs a receipt for one step. Nobody reads a stamp; Ada, her
-- teammate and the instructor read the receipt; no client writes one; a
-- re-hash check is Ada's own. Nothing is ever rewritten.
set local role service_role;
insert into public.verification_stamps (id, user_id, course_id, task_id, stamp, expires_at)
  values ('00000000-0000-4000-8000-0000000000aa', '00000000-0000-4000-8000-00000000000a',
          'security-plus', 't1', 'CQ-ABC234', now() + interval '20 minutes');
insert into public.verification_receipts (user_id, course_id, task_id, step_id, stamp_id, output_sha256, matched_tokens, total_tokens)
  values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', 's1',
          '00000000-0000-4000-8000-0000000000aa', repeat('b', 64), 3, 3);
do $$ begin
  -- The table itself refuses a look-alike symbol, an endless stamp, a partial
  -- match and a second receipt for one step, whoever writes.
  begin
    insert into public.verification_stamps (user_id, course_id, task_id, stamp, expires_at)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', 'CQ-ABCDEL', now() + interval '20 minutes');
    raise exception 'a stamp with a look-alike letter was stored';
  exception when check_violation then null;
  end;
  begin
    insert into public.verification_stamps (user_id, course_id, task_id, stamp, expires_at)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', 'CQ-ABC235', now() + interval '2 days');
    raise exception 'a stamp that lives for days was stored';
  exception when check_violation then null;
  end;
  begin
    insert into public.verification_receipts (user_id, course_id, task_id, step_id, stamp_id, output_sha256, matched_tokens, total_tokens)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', 's2',
              '00000000-0000-4000-8000-0000000000aa', repeat('b', 64), 2, 3);
    raise exception 'a partial match was receipted';
  exception when check_violation then null;
  end;
  begin
    insert into public.verification_receipts (user_id, course_id, task_id, step_id, stamp_id, output_sha256, matched_tokens, total_tokens)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', 's1',
              '00000000-0000-4000-8000-0000000000aa', repeat('c', 64), 3, 3);
    raise exception 'one stamp receipted one step twice';
  exception when unique_violation then null;
  end;
end $$;
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
insert into public.rehash_checks (user_id, course_id, sha256, filename, ok)
  values ('00000000-0000-4000-8000-00000000000a', 'security-plus', repeat('d', 64), '20260112_Team01_Nmap_Scan.xml', true);
do $$
declare n int;
begin
  assert (select count(*) from public.verification_stamps) = 0, 'ada: no stamp rows, not even her own';
  assert (select count(*) from public.verification_receipts) = 1, 'ada: reads her receipt';
  assert (select count(*) from public.rehash_checks) = 1, 'ada: reads her re-hash check';
  -- No client writes a receipt or a stamp, not even its own…
  begin
    insert into public.verification_receipts (user_id, course_id, task_id, step_id, stamp_id, output_sha256, matched_tokens, total_tokens)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', 's2',
              '00000000-0000-4000-8000-0000000000aa', repeat('b', 64), 3, 3);
    raise exception 'ada wrote her own receipt';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.verification_stamps (user_id, course_id, task_id, stamp, expires_at)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', 'CQ-ZZZ999', now() + interval '20 minutes');
    raise exception 'ada issued herself a stamp';
  exception when insufficient_privilege then null;
  end;
  -- …and nothing is rewritten or removed: with no policy the statement
  -- reaches no row (layer 1; the owner meets the triggers below, layer 2).
  update public.verification_receipts set receipted_at = now() - interval '1 day';
  get diagnostics n = row_count;
  assert n = 0, 'ada rewrote her receipt';
  delete from public.verification_receipts;
  get diagnostics n = row_count;
  assert n = 0, 'ada deleted her receipt';
  update public.verification_stamps set expires_at = now() + interval '30 minutes';
  get diagnostics n = row_count;
  assert n = 0, 'ada extended a stamp';
  update public.rehash_checks set ok = false;
  get diagnostics n = row_count;
  assert n = 0, 'ada rewrote her re-hash check';
  -- A re-hash check is recorded by its owner, never for someone else.
  begin
    insert into public.rehash_checks (user_id, course_id, sha256, filename, ok)
      values ('00000000-0000-4000-8000-00000000000b', 'security-plus', repeat('d', 64), 'x', true);
    raise exception 'ada recorded a re-hash check as bob';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Bob (same team) reads the receipt; Cy (other team) and Zed read nothing;
-- Ivy reads receipts and re-hash checks; nobody but the platform reads stamps.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
do $$ begin
  assert (select count(*) from public.verification_receipts) = 1, 'bob: reads his teammate''s receipt';
  assert (select count(*) from public.verification_stamps) = 0, 'bob: no stamps';
  assert (select count(*) from public.rehash_checks) = 0, 'bob: never ada''s re-hash checks';
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
do $$ begin
  assert (select count(*) from public.verification_receipts) = 0, 'cy: never another team''s receipts';
  assert (select count(*) from public.rehash_checks) = 0, 'cy: never ada''s re-hash checks';
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000e';
do $$ begin
  assert (select count(*) from public.verification_receipts) = 0, 'zed: no receipts';
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
do $$ begin
  assert (select count(*) from public.verification_receipts) = 1, 'ivy: reads every receipt';
  assert (select count(*) from public.rehash_checks) = 1, 'ivy: reads every re-hash check';
  assert (select count(*) from public.verification_stamps) = 0, 'ivy: no stamps either';
end $$;
reset role;
set local role anon;
set local request.jwt.claim.sub = '';
do $$ begin
  assert (select count(*) from public.verification_receipts) = 0, 'anon: no receipts';
  assert (select count(*) from public.verification_stamps) = 0, 'anon: no stamps';
end $$;
reset role;

-- Layer 2: even the table owner hits the append-only triggers.
do $$ begin
  begin
    update public.verification_receipts set receipted_at = now() - interval '1 day';
    raise exception 'the owner rewrote a receipt';
  exception when others then
    if sqlerrm not like '%append-only%' then raise; end if;
  end;
  begin
    update public.rehash_checks set ok = false;
    raise exception 'the owner rewrote a re-hash check';
  exception when others then
    if sqlerrm not like '%append-only%' then raise; end if;
  end;
end $$;

-- ── R114: candidate links and published employer profiles ──────────────────
-- The platform (as the `share` function runs) stores Ada's link. Ada lists
-- it, never reads the copy or the token hash back, cannot create, extend or
-- un-revoke one, and can revoke and delete it. Nobody else sees it, not even
-- the instructor. Instructors publish employer profiles every member reads.
set local role service_role;
insert into public.profile_shares (id, user_id, token_hash, kind, label, snapshot, measured_against, expires_at)
  values ('00000000-0000-4000-8000-0000000000bb', '00000000-0000-4000-8000-00000000000a', repeat('e', 64),
          'profile', 'For Example Ltd', '{"schema":"capstone-member-profile/1","signature":null}', 'Sample MSSP', now() + interval '30 days');
do $$ begin
  begin
    insert into public.profile_shares (user_id, token_hash, kind, snapshot, expires_at)
      values ('00000000-0000-4000-8000-00000000000a', repeat('f', 64), 'profile', '{}', now() + interval '91 days');
    raise exception 'a link that lives past ninety days was stored';
  exception when check_violation then null;
  end;
end $$;
reset role;

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
do $$
declare n int;
begin
  assert (select count(id) from public.profile_shares) = 1, 'ada: lists her link';
  assert (select label from public.profile_shares) = 'For Example Ltd', 'ada: reads the link''s facts';
  begin
    perform snapshot from public.profile_shares;
    raise exception 'ada read the frozen copy back';
  exception when insufficient_privilege then null;
  end;
  begin
    perform token_hash from public.profile_shares;
    raise exception 'ada read the token hash';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.profile_shares (user_id, token_hash, kind, snapshot, expires_at)
      values ('00000000-0000-4000-8000-00000000000a', repeat('1', 64), 'profile', '{}', now() + interval '7 days');
    raise exception 'ada created a link without the function';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.profile_shares set expires_at = now() + interval '60 days';
    raise exception 'ada extended a link';
  exception when insufficient_privilege then null;
  end;
  -- A revocation is dated by the database clock, whatever the client sends.
  update public.profile_shares set revoked_at = now() - interval '1 day';
  get diagnostics n = row_count;
  assert n = 1, 'ada revokes her link';
  assert (select revoked_at from public.profile_shares) = now(), 'the revocation carries the database clock';
  begin
    update public.profile_shares set revoked_at = null;
    raise exception 'ada un-revoked a link';
  exception when others then
    if sqlerrm not like '%stays revoked%' then raise; end if;
  end;
end $$;
reset role;

-- Nobody else sees or touches it: a teammate, another team, the instructor.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
do $$
declare n int;
begin
  assert (select count(id) from public.profile_shares) = 0, 'bob: never ada''s links';
  update public.profile_shares set revoked_at = now();
  get diagnostics n = row_count;
  assert n = 0, 'bob revoked ada''s link';
  delete from public.profile_shares;
  get diagnostics n = row_count;
  assert n = 0, 'bob deleted ada''s link';
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
do $$ begin
  assert (select count(id) from public.profile_shares) = 0, 'ivy: no instructor reads a member''s links';
end $$;
reset role;
set local role anon;
set local request.jwt.claim.sub = '';
do $$ begin
  begin
    perform id from public.profile_shares;
    raise exception 'anon read the links table';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Ada deletes her link outright: the copy is gone, not just hidden.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
do $$
declare n int;
begin
  delete from public.profile_shares;
  get diagnostics n = row_count;
  assert n = 1, 'ada deletes her link';
end $$;
reset role;
do $$ begin
  assert (select count(*) from public.profile_shares) = 0, 'the deleted copy is gone for the owner of the table too';
end $$;

-- Employer profiles: an instructor publishes, every signed-in member reads,
-- a member cannot publish, nobody edits in place, only the publisher removes.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
insert into public.environment_profiles (id, publisher_user_id, profile)
  values ('profile.acme-soc', '00000000-0000-4000-8000-00000000000d', '{"id":"profile.acme-soc","name":"Acme SOC"}');
do $$
declare n int;
begin
  update public.environment_profiles set profile = '{"id":"profile.acme-soc","name":"Edited"}';
  get diagnostics n = row_count;
  assert n = 0, 'ivy edited a published profile in place';
  begin
    insert into public.environment_profiles (id, publisher_user_id, profile)
      values ('acme', '00000000-0000-4000-8000-00000000000d', '{"id":"acme"}');
    raise exception 'a profile id outside profile.<slug> was stored';
  exception when check_violation then null;
  end;
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
do $$ begin
  assert (select count(*) from public.environment_profiles) = 1, 'ada: reads the published profile';
  begin
    insert into public.environment_profiles (id, publisher_user_id, profile)
      values ('profile.ada-co', '00000000-0000-4000-8000-00000000000a', '{"id":"profile.ada-co"}');
    raise exception 'a member published an employer profile';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000f';
do $$
declare n int;
begin
  delete from public.environment_profiles where id = 'profile.acme-soc';
  get diagnostics n = row_count;
  assert n = 0, 'ana removed a profile she did not publish';
end $$;
reset role;
set local role anon;
set local request.jwt.claim.sub = '';
do $$ begin
  assert (select count(*) from public.environment_profiles) = 0, 'anon: no published profiles';
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
do $$
declare n int;
begin
  delete from public.environment_profiles where id = 'profile.acme-soc';
  get diagnostics n = row_count;
  assert n = 1, 'ivy removes her own profile';
end $$;
reset role;

-- ── R120: a report says where, who and which version — and says it for good ──
-- Ada files a report that names a step, her role and the version she saw.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
insert into public.task_reports (id, user_id, course_id, task_id, team_id, kind, note, step_id, week, reporter_name, reporter_role, content_version)
  values ('00000000-0000-4000-9000-000000000002', '00000000-0000-4000-8000-00000000000a',
          'security-plus', 't1', '2026-01-T01', 'unclear', 'which flag?', 's2', 3, 'Ada Lovelace', 'net', '1.0');
do $$ begin
  assert (select step_id from public.task_reports where id = '00000000-0000-4000-9000-000000000002') = 's2', 'ada: the step she named is kept';
  assert (select reporter_name from public.task_reports where id = '00000000-0000-4000-9000-000000000002') = 'Ada Lovelace', 'ada: who filed it, as filed';
  assert (select content_version from public.task_reports where id = '00000000-0000-4000-9000-000000000002') = '1.0', 'ada: the version she saw';
  -- A student files an OPEN report: closing one is the instructor's act.
  begin
    insert into public.task_reports (user_id, course_id, task_id, team_id, kind, status)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', '2026-01-T01', 'question', 'resolved');
    raise exception 'ada filed a report that was already resolved';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.task_reports (user_id, course_id, task_id, team_id, kind, status)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', '2026-01-T01', 'question', 'in_progress');
    raise exception 'ada filed a report that was already taken';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.task_reports (user_id, course_id, task_id, team_id, kind, resolution_note)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', '2026-01-T01', 'question', 'already answered');
    raise exception 'ada wrote the instructor''s resolution note';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.task_reports (user_id, course_id, task_id, team_id, kind, fix_revision)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', '2026-01-T01', 'question', 3);
    raise exception 'ada named the fix that resolved her own report';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Ivy takes it, then closes it with a reason; every status the app knows is allowed, no other.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
update public.task_reports set status = 'in_progress' where id = '00000000-0000-4000-9000-000000000002';
do $$ begin
  assert (select status from public.task_reports where id = '00000000-0000-4000-9000-000000000002') = 'in_progress', 'ivy: takes the report';
end $$;
update public.task_reports
  set status = 'wont_fix', resolution_note = 'Works as written: the flag is in step 1.',
      resolved_at = now(), resolved_by = '00000000-0000-4000-8000-00000000000d'
  where id = '00000000-0000-4000-9000-000000000002';
do $$ begin
  assert (select resolution_note from public.task_reports where id = '00000000-0000-4000-9000-000000000002') like 'Works as written%', 'ivy: tells the reporter why';
  begin
    update public.task_reports set status = 'closed' where id = '00000000-0000-4000-9000-000000000002';
    raise exception 'ivy set a status that does not exist';
  exception when check_violation then null; end;
  -- Who, what, when and which version are frozen, for staff as for anyone.
  begin
    update public.task_reports set reporter_name = 'Someone Else' where id = '00000000-0000-4000-9000-000000000002';
    raise exception 'ivy rewrote who filed the report';
  exception when others then
    if sqlerrm not like '%frozen%' then raise; end if;
  end;
  begin
    update public.task_reports set content_version = '9.9' where id = '00000000-0000-4000-9000-000000000002';
    raise exception 'ivy rewrote the version the reporter saw';
  exception when others then
    if sqlerrm not like '%frozen%' then raise; end if;
  end;
  begin
    update public.task_reports set note = 'edited by staff' where id = '00000000-0000-4000-9000-000000000002';
    raise exception 'ivy rewrote what the student wrote';
  exception when others then
    if sqlerrm not like '%frozen%' then raise; end if;
  end;
  begin
    update public.task_reports set step_id = 's9' where id = '00000000-0000-4000-9000-000000000002';
    raise exception 'ivy moved the report to another step';
  exception when others then
    if sqlerrm not like '%frozen%' then raise; end if;
  end;
end $$;
reset role;

-- ── R121: content fixes — an admin corrects the words, the ledger is numbered by the database and never rewritten ──
-- Zoe is a second admin, used to prove that erasing an account keeps what it signed.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000000010', 'zoe@example.com', '{"name":"Zoe Admin"}');
update public.profiles set is_admin = true, is_instructor = true where id = '00000000-0000-4000-8000-000000000010';

-- Ana (admin) fixes a step. The revision is the database's: she asked for 99 and got 1.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000f';
insert into public.content_fixes (id, course_id, revision, kind, summary, changes, issue_ids, doc_version, author_name, created_by, created_at)
  values ('00000000-0000-4000-a000-000000000001', 'security-plus', 99, 'fix', 'Reword the first step',
          '[{"taskId":"t1","stepId":"s1","field":"title","before":"Open a shell","after":"Open a terminal"}]',
          '{00000000-0000-4000-9000-000000000002}', 2, 'Ana Admin', '00000000-0000-4000-8000-00000000000f', '2000-01-01');
insert into public.content_fixes (id, course_id, kind, summary, changes, created_by)
  values ('00000000-0000-4000-a000-000000000002', 'security-plus', 'fix', 'Reword the second step',
          '[{"taskId":"t1","stepId":"s2","field":"whatItMeans","before":"A","after":"B"}]', '00000000-0000-4000-8000-00000000000f');
insert into public.content_fixes (id, course_id, kind, summary, changes, created_by)
  values ('00000000-0000-4000-a000-000000000003', 'ccna', 'fix', 'Another course counts on its own',
          '[{"taskId":"t1","field":"title","before":"A","after":"B"}]', '00000000-0000-4000-8000-00000000000f');
do $$ begin
  assert (select revision from public.content_fixes where id = '00000000-0000-4000-a000-000000000001') = 1, 'ana: the database numbers the first fix 1, whatever she sent';
  assert (select revision from public.content_fixes where id = '00000000-0000-4000-a000-000000000002') = 2, 'ana: the next is 2';
  assert (select revision from public.content_fixes where id = '00000000-0000-4000-a000-000000000003') = 1, 'ana: another course counts from 1 on its own';
  assert (select created_at from public.content_fixes where id = '00000000-0000-4000-a000-000000000001') > '2020-01-01', 'ana: the time is the database''s, not a backdated one';
  assert (select author_name from public.content_fixes where id = '00000000-0000-4000-a000-000000000002') = 'Ana Admin', 'ana: an entry sent without a name is signed with her profile name';
  assert (select doc_version from public.content_fixes where id = '00000000-0000-4000-a000-000000000001') = 2, 'ana: the document version it was made on is kept';
  assert (select issue_ids from public.content_fixes where id = '00000000-0000-4000-a000-000000000001') = '{00000000-0000-4000-9000-000000000002}', 'ana: the report it answers is kept';

  -- She cannot sign as someone else, or send an entry the database cannot make sense of.
  begin
    insert into public.content_fixes (course_id, kind, summary, changes, created_by)
      values ('security-plus', 'fix', 'as Ivy', '[{"taskId":"t1","field":"title","before":"A","after":"B"}]', '00000000-0000-4000-8000-00000000000d');
    raise exception 'ana wrote a fix as someone else';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.content_fixes (course_id, kind, summary, changes, created_by)
      values ('security-plus', 'fix', 'no changes', '[]', '00000000-0000-4000-8000-00000000000f');
    raise exception 'ana saved a fix that changes nothing';
  exception when check_violation then null; end;
  begin
    insert into public.content_fixes (course_id, kind, summary, changes, created_by)
      values ('security-plus', 'fix', '', '[{"taskId":"t1","field":"title","before":"A","after":"B"}]', '00000000-0000-4000-8000-00000000000f');
    raise exception 'ana saved a fix with no summary';
  exception when check_violation then null; end;
  begin
    insert into public.content_fixes (course_id, kind, summary, changes, created_by)
      values ('security-plus', 'bogus', 'x', '[{"taskId":"t1","field":"title","before":"A","after":"B"}]', '00000000-0000-4000-8000-00000000000f');
    raise exception 'ana saved a kind that does not exist';
  exception when check_violation then null; end;

  -- A revert names an existing fix of this course, and a fix is undone once.
  begin
    insert into public.content_fixes (course_id, kind, summary, changes, reverts, created_by)
      values ('security-plus', 'revert', 'undo nothing', '[{"taskId":"t1","field":"title","before":"B","after":"A"}]', 7, '00000000-0000-4000-8000-00000000000f');
    raise exception 'ana reverted a fix that does not exist';
  exception when others then
    if sqlerrm not like '%existing fix%' then raise; end if;
  end;
  begin
    insert into public.content_fixes (course_id, kind, summary, changes, reverts, created_by)
      values ('ccna', 'revert', 'undo a fix of another course', '[{"taskId":"t1","field":"title","before":"B","after":"A"}]', 2, '00000000-0000-4000-8000-00000000000f');
    raise exception 'ana reverted another course''s fix';
  exception when others then
    if sqlerrm not like '%existing fix%' then raise; end if;
  end;
end $$;
insert into public.content_fixes (id, course_id, kind, summary, changes, reverts, created_by)
  values ('00000000-0000-4000-a000-000000000004', 'security-plus', 'revert', 'Revert revision 2',
          '[{"taskId":"t1","stepId":"s2","field":"whatItMeans","before":"B","after":"A"}]', 2, '00000000-0000-4000-8000-00000000000f');
do $$ begin
  assert (select revision from public.content_fixes where id = '00000000-0000-4000-a000-000000000004') = 3, 'ana: a revert is a revision of its own';
  begin
    insert into public.content_fixes (course_id, kind, summary, changes, reverts, created_by)
      values ('security-plus', 'revert', 'undo it twice', '[{"taskId":"t1","stepId":"s2","field":"whatItMeans","before":"B","after":"A"}]', 2, '00000000-0000-4000-8000-00000000000f');
    raise exception 'ana reverted the same fix twice';
  exception when unique_violation then null; end;
  begin
    insert into public.content_fixes (course_id, kind, summary, changes, reverts, created_by)
      values ('security-plus', 'revert', 'a revert with nothing to restore', '[]', 1, '00000000-0000-4000-8000-00000000000f');
    raise exception 'ana saved a revert that restores nothing';
  exception when check_violation then null; end;

  -- A fold names existing fixes, and changes no text.
  begin
    insert into public.content_fixes (course_id, kind, summary, folds, created_by)
      values ('security-plus', 'fold', 'in code', '{1,42}', '00000000-0000-4000-8000-00000000000f');
    raise exception 'ana folded a fix that does not exist';
  exception when others then
    if sqlerrm not like '%existing fixes%' then raise; end if;
  end;
  begin
    insert into public.content_fixes (course_id, kind, summary, folds, created_by)
      values ('security-plus', 'fold', 'in code', '{}', '00000000-0000-4000-8000-00000000000f');
    raise exception 'ana folded nothing';
  exception when check_violation then null; end;
  begin
    insert into public.content_fixes (course_id, kind, summary, changes, folds, created_by)
      values ('security-plus', 'fold', 'a fold that edits text', '[{"taskId":"t1","field":"title","before":"A","after":"B"}]', '{1}', '00000000-0000-4000-8000-00000000000f');
    raise exception 'ana folded and edited in one entry';
  exception when check_violation then null; end;
end $$;
insert into public.content_fixes (id, course_id, kind, summary, folds, folded_in, created_by)
  values ('00000000-0000-4000-a000-000000000005', 'security-plus', 'fold', 'In code: revision 1', '{1}', 'deploy 2026-10-20', '00000000-0000-4000-8000-00000000000f');
do $$ begin
  assert (select revision from public.content_fixes where id = '00000000-0000-4000-a000-000000000005') = 4, 'ana: a fold counts in the version too';
  -- Nobody rewrites the ledger from a request, not even its author: the grant is revoked, not just unpolicied.
  begin
    update public.content_fixes set summary = 'rewritten' where id = '00000000-0000-4000-a000-000000000001';
    raise exception 'ana rewrote an entry';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.content_fixes where id = '00000000-0000-4000-a000-000000000001';
    raise exception 'ana deleted an entry';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Not an admin, not an author: Ivy (instructor), Ada (student) and Zed (joined nothing) read, and cannot write.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
do $$ begin
  assert (select count(*) from public.content_fixes where course_id = 'security-plus') = 4, 'ivy: reads the ledger';
  begin
    insert into public.content_fixes (course_id, kind, summary, changes, created_by)
      values ('security-plus', 'fix', 'an instructor''s fix', '[{"taskId":"t1","field":"title","before":"A","after":"B"}]', '00000000-0000-4000-8000-00000000000d');
    raise exception 'ivy, an instructor and not an admin, wrote a fix';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
do $$ begin
  assert (select count(*) from public.content_fixes) = 5, 'ada: a student reads every course''s ledger: it is the corrected words they render';
  begin
    insert into public.content_fixes (course_id, kind, summary, changes, created_by)
      values ('security-plus', 'fix', 'a student''s fix', '[{"taskId":"t1","field":"title","before":"A","after":"B"}]', '00000000-0000-4000-8000-00000000000a');
    raise exception 'ada, a student, wrote a fix';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.content_fixes where id = '00000000-0000-4000-a000-000000000001';
    raise exception 'ada deleted a fix';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000e';
do $$ begin
  assert (select count(*) from public.content_fixes) = 5, 'zed: signed in, reads the ledger';
end $$;
reset role;
set local role anon;
set local request.jwt.claim.sub = '';
do $$ begin
  assert (select count(*) from public.content_fixes) = 0, 'anon: not even the ledger (signed-in read)';
  begin
    insert into public.content_fixes (course_id, kind, summary, changes)
      values ('security-plus', 'fix', 'an anonymous fix', '[{"taskId":"t1","field":"title","before":"A","after":"B"}]');
    raise exception 'anon wrote a fix';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- The table owner is held to it too, and erasing an account keeps what it signed.
do $$ begin
  begin
    update public.content_fixes set summary = 'rewritten' where id = '00000000-0000-4000-a000-000000000001';
    raise exception 'the owner rewrote an entry';
  exception when others then
    if sqlerrm not like '%append-only%' then raise; end if;
  end;
  begin
    delete from public.content_fixes where id = '00000000-0000-4000-a000-000000000001';
    raise exception 'the owner deleted an entry';
  exception when others then
    if sqlerrm not like '%append-only%' then raise; end if;
  end;
end $$;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000010';
insert into public.content_fixes (id, course_id, kind, summary, changes, created_by)
  values ('00000000-0000-4000-a000-000000000006', 'aws-devops', 'fix', 'Zoe''s fix',
          '[{"taskId":"t1","field":"title","before":"A","after":"B"}]', '00000000-0000-4000-8000-000000000010');
reset role;
do $$ begin
  assert (select author_name from public.content_fixes where id = '00000000-0000-4000-a000-000000000006') = 'Zoe Admin', 'zoe: signed with her profile name';
end $$;
delete from auth.users where id = '00000000-0000-4000-8000-000000000010';
do $$ begin
  assert (select created_by from public.content_fixes where id = '00000000-0000-4000-a000-000000000006') is null, 'erasing an account detaches its id from its entries';
  assert (select author_name from public.content_fixes where id = '00000000-0000-4000-a000-000000000006') = 'Zoe Admin', 'and keeps the name the entry was signed with';
  assert (select summary from public.content_fixes where id = '00000000-0000-4000-a000-000000000006') = 'Zoe''s fix', 'and the entry itself';
end $$;

-- ── R122: every save of a course is a numbered, restorable version — and only an admin reads the history ──
-- Yan is a third admin, used to prove that erasing an account keeps what it saved.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000000011', 'yan@example.com', '{"name":"Yan Admin"}');
update public.profiles set is_admin = true, is_instructor = true where id = '00000000-0000-4000-8000-000000000011';

-- security-plus was published by Ana (version 1) and edited once above (her R85 update, which asked for 2): two saves, two snapshots.
do $$ begin
  assert (select version from public.course_documents where course_id = 'security-plus') = 2, 'two saves: version 2';
  assert (select array_agg(version order by version) from public.course_document_versions where course_id = 'security-plus') = array[1, 2], 'and the history holds both';
  assert (select doc ->> 'id' from public.course_document_versions where course_id = 'security-plus' and version = 1) = 'security-plus', 'including the first';
end $$;

-- Yan publishes a course; Ana edits it twice, the second time claiming a lower number than the database holds.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000011';
insert into public.course_documents (course_id, schema, doc, version, updated_by)
  values ('ccna', 'capstone-course-dto/1', '{"course":{"id":"ccna","title":"CCNA","version":1}}', 1, '00000000-0000-4000-8000-000000000011');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000f';
update public.course_documents
  set doc = '{"course":{"id":"ccna","title":"CCNA edited","version":1}}', version = 1, updated_by = '00000000-0000-4000-8000-00000000000f'
  where course_id = 'ccna';
update public.course_documents
  set doc = '{"course":{"id":"ccna","title":"CCNA edited again","version":1}}', version = 1, updated_by = '00000000-0000-4000-8000-00000000000f'
  where course_id = 'ccna';
do $$ begin
  assert (select version from public.course_documents where course_id = 'ccna') = 3, 'ana: the database counts the saves, whatever number the client sent';
  assert (select (doc -> 'course' ->> 'version')::int from public.course_documents where course_id = 'ccna') = 3, 'the document says which version it is';
  assert (select count(*) from public.course_document_versions where course_id = 'ccna') = 3, 'ana: one snapshot per save';
  assert (select doc -> 'course' ->> 'title' from public.course_document_versions where course_id = 'ccna' and version = 1) = 'CCNA', 'ana: version 1 is what Yan saved';
  assert (select doc -> 'course' ->> 'title' from public.course_document_versions where course_id = 'ccna' and version = 2) = 'CCNA edited', 'ana: version 2 is the first edit';
  assert (select saved_by_name from public.course_document_versions where course_id = 'ccna' and version = 1) = 'Yan Admin', 'the snapshot says who saved it';
  assert (select saved_by_name from public.course_document_versions where course_id = 'ccna' and version = 3) = 'Ana Admin', 'and who saved the next';
  assert (select (doc -> 'course' ->> 'version')::int from public.course_document_versions where course_id = 'ccna' and version = 2) = 2, 'each snapshot carries its own number';
  assert (select title from public.course_document_versions where course_id = 'ccna' and version = 2) = 'CCNA edited', 'the list can show the title without the document';
  assert (select bytes from public.course_document_versions where course_id = 'ccna' and version = 2) = octet_length((select doc::text from public.course_document_versions where course_id = 'ccna' and version = 2)), 'and its size';
end $$;
-- A client may skip ahead (a built-in course forked at its shipped version carries that number on), never behind.
update public.course_documents set doc = '{"course":{"id":"ccna","title":"Forked at ten"}}', version = 10, updated_by = '00000000-0000-4000-8000-00000000000f' where course_id = 'ccna';
-- Restoring is an ordinary save of an old document: a new version, and the old ones stay.
update public.course_documents
  set doc = (select v.doc from public.course_document_versions v where v.course_id = 'ccna' and v.version = 1), updated_by = '00000000-0000-4000-8000-00000000000f'
  where course_id = 'ccna';
do $$ begin
  assert (select version from public.course_documents where course_id = 'ccna') = 11, 'ana: a restore is the next version';
  assert (select doc -> 'course' ->> 'title' from public.course_documents where course_id = 'ccna') = 'CCNA', 'ana: the words of version 1 are live again';
  assert (select (doc -> 'course' ->> 'version')::int from public.course_documents where course_id = 'ccna') = 11, 'under the new number';
  assert (select count(*) from public.course_document_versions where course_id = 'ccna') = 5, 'ana: nothing was lost: 1, 2, 3, 10 and 11';
  assert (select array_agg(version order by version) from public.course_document_versions where course_id = 'ccna') = array[1, 2, 3, 10, 11], 'ana: the numbers, in order';
  -- The history is not hers to write, from a request.
  begin
    insert into public.course_document_versions (course_id, version, schema, doc) values ('ccna', 99, 'x', '{}');
    raise exception 'ana wrote a snapshot';
  exception when insufficient_privilege then null; end;
  begin
    update public.course_document_versions set doc = '{}' where course_id = 'ccna' and version = 1;
    raise exception 'ana rewrote a snapshot';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.course_document_versions where course_id = 'ccna' and version = 1;
    raise exception 'ana deleted a snapshot';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Only an admin reads the history: an instructor, a student, a signed-in nobody and the signed-out do not.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
do $$ begin
  assert (select count(*) from public.course_document_versions) = 0, 'ivy: an instructor is not an admin; no history';
  assert (select count(*) from public.course_documents) = 2, 'ivy: still reads the courses themselves';
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
do $$ begin
  assert (select count(*) from public.course_document_versions) = 0, 'ada: a student reads no history';
end $$;
reset role;
set local role anon;
set local request.jwt.claim.sub = '';
do $$ begin
  assert (select count(*) from public.course_document_versions) = 0, 'anon: no history';
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000011';
do $$ begin
  assert (select count(*) from public.course_document_versions) = 7, 'yan: another admin reads every course''s history';
end $$;
reset role;

-- The owner is held to it too; a deleted course keeps its history and, made again, carries the numbering on.
do $$ begin
  begin
    update public.course_document_versions set saved_by_name = 'someone else' where course_id = 'ccna' and version = 1;
    raise exception 'the owner rewrote a snapshot';
  exception when others then
    if sqlerrm not like '%append-only%' then raise; end if;
  end;
  begin
    delete from public.course_document_versions where course_id = 'ccna' and version = 1;
    raise exception 'the owner deleted a snapshot';
  exception when others then
    if sqlerrm not like '%append-only%' then raise; end if;
  end;
end $$;
delete from public.course_documents where course_id = 'ccna';
do $$ begin
  assert (select count(*) from public.course_document_versions where course_id = 'ccna') = 5, 'a deleted course keeps its history';
end $$;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000f';
insert into public.course_documents (course_id, schema, doc, updated_by)
  values ('ccna', 'capstone-course-dto/1', '{"course":{"id":"ccna","title":"CCNA made again"}}', '00000000-0000-4000-8000-00000000000f');
do $$ begin
  assert (select version from public.course_documents where course_id = 'ccna') = 12, 'made again, the numbering carries on';
end $$;
reset role;

-- Erasing an account keeps what it saved, and is not an edit.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000011';
insert into public.course_documents (course_id, schema, doc, updated_by)
  values ('aws-cloud-practitioner', 'capstone-course-dto/1', '{"course":{"id":"aws-cloud-practitioner","title":"AWS"}}', '00000000-0000-4000-8000-000000000011');
reset role;
delete from auth.users where id = '00000000-0000-4000-8000-000000000011';
do $$ begin
  assert (select count(*) from public.course_documents where course_id = 'aws-cloud-practitioner') = 1, 'erasing the admin who saved a course does not erase the course';
  assert (select updated_by from public.course_documents where course_id = 'aws-cloud-practitioner') is null, 'it detaches their id';
  assert (select version from public.course_documents where course_id = 'aws-cloud-practitioner') = 1, 'and is not counted as an edit';
  assert (select count(*) from public.course_document_versions where course_id = 'aws-cloud-practitioner') = 1, 'nor snapshotted';
  assert (select saved_by from public.course_document_versions where course_id = 'aws-cloud-practitioner') is null, 'the snapshot is detached too';
  assert (select saved_by_name from public.course_document_versions where course_id = 'aws-cloud-practitioner') = 'Yan Admin', 'and keeps the name it was saved under';
end $$;

-- ── Signed out (anon key, no session) ───────────────────────────────────────
set local role anon;
set local request.jwt.claim.sub = '';  -- no session: auth.uid() is null
do $$ begin
  assert (select count(*) from public.memberships) = 0, 'anon: nothing';
  assert (select count(*) from public.course_documents) = 0, 'anon: not even the course (signed-in read)';
  assert (select count(*) from public.profiles) = 0, 'anon: no profiles';
end $$;
reset role;

-- ── R125: what a member has earned is kept, and only ever added to and raised ──
-- Ada earns a skill and a tool. The client's idea of the time is ignored: the database stamps them.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
insert into public.earned_skills (user_id, dimension, skill_id, course_id, level, first_at, level_at, via) values
  ('00000000-0000-4000-8000-00000000000a', 'skills', 'comp.recon.osint', 'security-plus', 'practised', '2000-01-01', '2000-01-01', '[{"taskId":"t1","stepIds":["s1"]}]'),
  ('00000000-0000-4000-8000-00000000000a', 'tools', 'tool.nmap', 'security-plus', 'verified', '2000-01-01', '2000-01-01', '[]');
do $$ begin
  assert (select count(*) from public.earned_skills) = 2, 'ada: her two rows';
  assert (select min(first_at) from public.earned_skills) > '2020-01-01', 'the database stamps first_at, whatever the client sent';
  assert (select min(level_at) from public.earned_skills) > '2020-01-01', 'and level_at';
end $$;

-- A lower level, or a rewrite of the same one, changes nothing: not the level, the steps, the course or either time.
do $$
declare b record;
begin
  select * into b from public.earned_skills where skill_id = 'tool.nmap';
  update public.earned_skills
    set level = 'practised', via = '[{"taskId":"x","stepIds":["y"]}]', level_at = '2001-01-01', first_at = '2001-01-01', course_id = 'ccna'
    where skill_id = 'tool.nmap';
  assert (select level from public.earned_skills where skill_id = 'tool.nmap') = 'verified', 'ada: a reset cannot lower a skill';
  assert (select via from public.earned_skills where skill_id = 'tool.nmap') = b.via, 'ada: nor rewrite the steps behind it';
  assert (select first_at from public.earned_skills where skill_id = 'tool.nmap') = b.first_at, 'ada: nor re-date when it was first reached';
  assert (select level_at from public.earned_skills where skill_id = 'tool.nmap') = b.level_at, 'ada: nor when it got to its level';
  assert (select course_id from public.earned_skills where skill_id = 'tool.nmap') = 'security-plus', 'ada: nor move it to another course';
  update public.earned_skills set level = 'verified', via = '[{"taskId":"z","stepIds":["z"]}]' where skill_id = 'tool.nmap';
  assert (select via from public.earned_skills where skill_id = 'tool.nmap') = b.via, 'ada: an equal level rewrites nothing either';
end $$;

-- A raise moves the level, its time and its steps; who, what, where and when it was first reached stay.
do $$
declare b record;
begin
  select * into b from public.earned_skills where skill_id = 'comp.recon.osint';
  update public.earned_skills
    set level = 'verified', via = '[{"taskId":"t1","stepIds":["s1","s2"]}]', course_id = 'ccna', first_at = '2001-01-01', user_id = '00000000-0000-4000-8000-00000000000b'
    where skill_id = 'comp.recon.osint';
  assert (select level from public.earned_skills where skill_id = 'comp.recon.osint') = 'verified', 'ada: practised is raised to verified';
  assert (select via from public.earned_skills where skill_id = 'comp.recon.osint') = '[{"taskId":"t1","stepIds":["s1","s2"]}]'::jsonb, 'ada: with the steps behind the new level';
  assert (select first_at from public.earned_skills where skill_id = 'comp.recon.osint') = b.first_at, 'ada: first reached stays';
  assert (select level_at from public.earned_skills where skill_id = 'comp.recon.osint') > b.level_at, 'ada: the new level is stamped by the database';
  assert (select course_id from public.earned_skills where skill_id = 'comp.recon.osint') = 'security-plus', 'ada: where it was first reached stays';
  assert (select user_id from public.earned_skills where skill_id = 'comp.recon.osint') = '00000000-0000-4000-8000-00000000000a', 'ada: and whose it is';
end $$;

-- Upsert, the way the app writes: a lower level changes nothing, a higher one raises.
insert into public.earned_skills (user_id, dimension, skill_id, course_id, level, via) values ('00000000-0000-4000-8000-00000000000a', 'skills', 'comp.recon.osint', 'security-plus', 'practised', '[]')
  on conflict (user_id, dimension, skill_id) do update set level = excluded.level, via = excluded.via, course_id = excluded.course_id;
do $$ begin
  assert (select level from public.earned_skills where skill_id = 'comp.recon.osint') = 'verified', 'ada: an upsert with a lower level changes nothing';
end $$;
insert into public.earned_skills (user_id, dimension, skill_id, course_id, level, via) values ('00000000-0000-4000-8000-00000000000a', 'skills', 'comp.recon.osint', 'security-plus', 'reviewed', '[]')
  on conflict (user_id, dimension, skill_id) do update set level = excluded.level, via = excluded.via, course_id = excluded.course_id;
do $$ begin
  assert (select level from public.earned_skills where skill_id = 'comp.recon.osint') = 'reviewed', 'ada: an upsert with a higher level raises';
  -- Only well-formed rows, and only her own.
  begin
    insert into public.earned_skills (user_id, dimension, skill_id, course_id, level) values ('00000000-0000-4000-8000-00000000000a', 'skills', 'comp.x', 'security-plus', 'expert');
    raise exception 'ada added a level that does not exist';
  exception when check_violation then null; end;
  begin
    insert into public.earned_skills (user_id, dimension, skill_id, course_id, level) values ('00000000-0000-4000-8000-00000000000a', 'ability', 'comp.x', 'security-plus', 'verified');
    raise exception 'ada added a dimension that is not earned';
  exception when check_violation then null; end;
  begin
    insert into public.earned_skills (user_id, dimension, skill_id, course_id, level) values ('00000000-0000-4000-8000-00000000000b', 'skills', 'comp.x', 'security-plus', 'verified');
    raise exception 'ada added a row for bob';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Bob earns his own; each reads only theirs; an instructor reads every member's; a signed-in nobody and the signed-out read none.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
insert into public.earned_skills (user_id, dimension, skill_id, course_id, level) values ('00000000-0000-4000-8000-00000000000b', 'skills', 'comp.recon.osint', 'security-plus', 'practised');
do $$
declare n int;
begin
  assert (select count(*) from public.earned_skills) = 1, 'bob: reads only his own';
  assert (select count(*) from public.earned_skills where user_id = '00000000-0000-4000-8000-00000000000a') = 0, 'bob: none of ada''s';
  -- He cannot touch hers, raise or erase.
  update public.earned_skills set level = 'reviewed' where user_id = '00000000-0000-4000-8000-00000000000a';
  get diagnostics n = row_count;
  assert n = 0, 'bob: cannot raise ada''s';
  delete from public.earned_skills where user_id = '00000000-0000-4000-8000-00000000000a';
  get diagnostics n = row_count;
  assert n = 0, 'bob: cannot erase ada''s';
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
do $$
declare n int;
begin
  assert (select count(*) from public.earned_skills) = 3, 'ivy: an instructor reads every member''s rows (ada 2, bob 1)';
  update public.earned_skills set level = 'reviewed' where user_id = '00000000-0000-4000-8000-00000000000a' and skill_id = 'tool.nmap';
  get diagnostics n = row_count;
  assert n = 0, 'ivy: reads them all and raises none of them';
end $$;
reset role;
do $$ begin
  assert (select level from public.earned_skills where user_id = '00000000-0000-4000-8000-00000000000a' and skill_id = 'tool.nmap') = 'verified', 'an instructor does not raise a student''s skill';
end $$;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
do $$ begin
  assert (select count(*) from public.earned_skills) = 0, 'cy: a student of another team reads none';
end $$;
reset role;
set local role anon;
set local request.jwt.claim.sub = '';
do $$ begin
  assert (select count(*) from public.earned_skills) = 0, 'anon: none';
  begin
    insert into public.earned_skills (user_id, dimension, skill_id, course_id, level) values ('00000000-0000-4000-8000-00000000000a', 'skills', 'comp.z', 'security-plus', 'verified');
    raise exception 'anon wrote a row';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Erasing: a member erases their own rows (the account page does, with the other tables), and removing the login takes them too.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
delete from public.earned_skills where skill_id = 'tool.nmap';
do $$ begin
  assert (select count(*) from public.earned_skills) = 1, 'ada: erased one of her own';
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000e';
insert into public.earned_skills (user_id, dimension, skill_id, course_id, level) values ('00000000-0000-4000-8000-00000000000e', 'skills', 'comp.recon.osint', 'security-plus', 'verified');
reset role;
do $$ begin
  assert (select count(*) from public.earned_skills where user_id = '00000000-0000-4000-8000-00000000000e') = 1, 'zed: has a row';
  delete from auth.users where id = '00000000-0000-4000-8000-00000000000e';
  assert (select count(*) from public.earned_skills where user_id = '00000000-0000-4000-8000-00000000000e') = 0, 'removing the login removes the ledger with it';
end $$;

-- ── R129: the support log is written by the person it is about and read by an admin only ──
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
insert into public.client_errors (support_code, user_id, user_email, area, reason, db_code, message)
  values ('E-ABC234', '00000000-0000-4000-8000-00000000000a', 'ada@example.com', 'agreements', 'permission', '42501', 'new row violates row-level security policy');
do $$ begin
  begin
    insert into public.client_errors (support_code, user_id, area) values ('E-ABC235', '00000000-0000-4000-8000-00000000000b', 'agreements');
    raise exception 'ada logged an error as bob';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.client_errors (support_code, user_id, area) values ('bad code', '00000000-0000-4000-8000-00000000000a', 'agreements');
    raise exception 'a malformed support code was accepted';
  exception when check_violation then null; end;
  assert (select count(*) from public.client_errors) = 0, 'ada: cannot read the log, not even her own rows';
  begin
    update public.client_errors set area = 'x';
    raise exception 'ada rewrote the log';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.client_errors;
    raise exception 'ada erased the log';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
do $$ begin
  assert (select count(*) from public.client_errors) = 0, 'ivy (instructor, not admin): cannot read the support log';
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000f';
do $$ begin
  assert (select count(*) from public.client_errors where support_code = 'E-ABC234') = 1, 'ana (admin): reads it, with the detail';
  assert (select db_code from public.client_errors where support_code = 'E-ABC234') = '42501', 'ana: the database code is there';
end $$;
reset role;

-- ── R135: the limits an open-sign-up platform needs ─────────────────────────
-- Zed signed up and joined nothing; he has a profile row from the trigger. Nobody inserts a profile
-- by request any more — not even their own — so a user with no row cannot write one with is_admin.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000e';
do $$ begin
  begin
    delete from public.profiles where id = '00000000-0000-4000-8000-00000000000e';
    insert into public.profiles (id, display_name, is_admin) values ('00000000-0000-4000-8000-00000000000e', 'Zed', true);
    raise exception 'zed inserted his own profile row';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.profiles (id, display_name) values ('00000000-0000-4000-8000-00000000000e', 'Zed');
    raise exception 'zed inserted a plain profile row';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- An avatar is https or nothing: a plain-http or javascript: URL is refused, a long https one too.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
do $$ begin
  update public.profiles set avatar_url = 'https://lh3.googleusercontent.com/a/ada=s96' where id = '00000000-0000-4000-8000-00000000000a';
  assert (select avatar_url from public.profiles where id = '00000000-0000-4000-8000-00000000000a') like 'https://%', 'ada: an https avatar is kept';
  begin
    update public.profiles set avatar_url = 'http://lh3.googleusercontent.com/a/ada' where id = '00000000-0000-4000-8000-00000000000a';
    raise exception 'ada set a plain-http avatar';
  exception when check_violation then null; end;
  begin
    update public.profiles set avatar_url = 'javascript:alert(1)' where id = '00000000-0000-4000-8000-00000000000a';
    raise exception 'ada set a javascript: avatar';
  exception when check_violation then null; end;
  begin
    update public.profiles set avatar_url = 'https://x.example/' || repeat('a', 2000) where id = '00000000-0000-4000-8000-00000000000a';
    raise exception 'ada set a 2 KB avatar url';
  exception when check_violation then null; end;
  update public.profiles set avatar_url = null where id = '00000000-0000-4000-8000-00000000000a';
end $$;

-- A deliverable write names its author as the writer, or not at all — never as a teammate.
do $$ begin
  update public.deliverables set updated_by = '00000000-0000-4000-8000-00000000000a' where team_id = '2026-01-T01' and deliverable_id = 'as-built';
  begin
    update public.deliverables set updated_by = '00000000-0000-4000-8000-00000000000b' where team_id = '2026-01-T01' and deliverable_id = 'as-built';
    raise exception 'ada signed a form as bob';
  exception when insufficient_privilege then null; end;
  -- Sizes: a form past 512 KB, a step note past 4,000 characters, a report note past 2,000.
  begin
    update public.deliverables set data = jsonb_build_object('blob', repeat('x', 600000)) where team_id = '2026-01-T01' and deliverable_id = 'as-built';
    raise exception 'ada saved a 600 KB form';
  exception when check_violation then null; end;
  begin
    update public.step_notes set note = repeat('n', 4001) where user_id = '00000000-0000-4000-8000-00000000000a';
    raise exception 'ada saved a 4,001-character note';
  exception when check_violation then null; end;
  begin
    insert into public.task_reports (user_id, course_id, task_id, team_id, kind, note)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', '2026-01-T01', 'question', repeat('r', 2001));
    raise exception 'ada filed a 2,001-character report';
  exception when check_violation then null; end;
  -- A report names a team she is on.
  begin
    insert into public.task_reports (user_id, course_id, task_id, team_id, kind)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', '2026-01-T02', 'question');
    raise exception 'ada filed a report under team 02';
  exception when insufficient_privilege then null; end;
end $$;

-- The daily report cap: Ada has filed 2 reports above; 48 more are fine, the 51st is refused.
do $$
declare i int;
begin
  for i in 1..48 loop
    insert into public.task_reports (user_id, course_id, task_id, team_id, kind)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', '2026-01-T01', 'question');
  end loop;
  begin
    insert into public.task_reports (user_id, course_id, task_id, team_id, kind)
      values ('00000000-0000-4000-8000-00000000000a', 'security-plus', 't1', '2026-01-T01', 'question');
    raise exception 'ada filed a 51st report in one day';
  exception when check_violation then null; end;
  assert (select count(*) from public.task_reports where user_id = '00000000-0000-4000-8000-00000000000a') = 50, 'ada: exactly 50 reports today';
end $$;

-- The support log carries the account's own email, whatever the client wrote.
insert into public.client_errors (support_code, user_id, user_email, area)
  values ('E-R13500', '00000000-0000-4000-8000-00000000000a', 'someone-else@example.com', 'agreements');
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000f';
do $$ begin
  assert (select user_email from public.client_errors where support_code = 'E-R13500') = 'ada@example.com', 'ana: the email on the row is the account''s own, not the body''s';
end $$;
reset role;

-- `reviewed` needs a review: Cy's team (02) has none, so his claim is stored as `verified`;
-- Ada's team (01) was graded, so hers stands (asserted above).
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000c';
insert into public.earned_skills (user_id, dimension, skill_id, course_id, level) values ('00000000-0000-4000-8000-00000000000c', 'skills', 'comp.recon.osint', 'security-plus', 'reviewed');
do $$ begin
  assert (select level from public.earned_skills where user_id = '00000000-0000-4000-8000-00000000000c') = 'verified', 'cy: reviewed without a review is verified';
  update public.earned_skills set level = 'reviewed' where user_id = '00000000-0000-4000-8000-00000000000c';
  assert (select level from public.earned_skills where user_id = '00000000-0000-4000-8000-00000000000c') = 'verified', 'cy: nor by a raise';
end $$;
reset role;

-- R139: the instructor reads every team's history; the signed-out read none of it.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000d';
do $$ begin
  assert (select count(*) from public.deliverable_history) = 2, 'ivy: every team''s history';
  assert (select count(*) from public.validation_answers) = 1, 'ivy: every answer';
end $$;
reset role;
set local role anon;
do $$ begin
  assert not has_table_privilege('anon', 'public.deliverable_history', 'select'), 'anon: no history';
  assert not has_table_privilege('anon', 'public.validation_answers', 'select'), 'anon: no answers';
  assert not has_table_privilege('anon', 'public.validation_answers', 'insert'), 'anon: no answering';
end $$;
reset role;

-- The signed-out call none of the review functions.
set local role anon;
do $$ begin
  assert not has_function_privilege('anon', 'public.get_review_queue()', 'execute'), 'anon: no review queue';
  assert not has_function_privilege('anon', 'public.submit_peer_review(uuid, jsonb, boolean)', 'execute'), 'anon: no review submit';
  assert not has_function_privilege('anon', 'public.team_has_review(uuid, text)', 'execute'), 'anon: no review check';
end $$;
reset role;

-- Every trigger function pins its search_path.
do $$
declare f record;
begin
  for f in select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.prorettype = 'trigger'::regtype loop
    assert exists (select 1 from pg_proc p2 where p2.proname = f.proname and p2.pronamespace = 'public'::regnamespace
                   and exists (select 1 from unnest(coalesce(p2.proconfig, '{}')) c where c like 'search_path=%')),
      'trigger function ' || f.proname || ' has no search_path';
  end loop;
end $$;

-- ── R149: the state blob is merged on the server, one key at a time ─────────
-- Two devices each patch only the keys they own; neither erases the other's. A null removes a key.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000a';
do $$
declare d jsonb;
begin
  perform public.merge_user_course_state('security-plus', '{"homeBuildAck": true}'::jsonb);
  perform public.merge_user_course_state('security-plus', '{"resume": {"week": 1, "taskId": "t1", "stepId": "s1", "at": 1}}'::jsonb);
  select data into d from public.user_course_state where course_id = 'security-plus';
  assert d ? 'homeBuildAck' and d ? 'resume' and d ? 'mineSeen', 'ada: merge keeps every key the devices wrote: ' || d::text;
  perform public.merge_user_course_state('security-plus', '{"resume": null}'::jsonb);
  select data into d from public.user_course_state where course_id = 'security-plus';
  assert not (d ? 'resume') and (d ? 'homeBuildAck'), 'ada: a null patch removes only that key: ' || d::text;
  -- A merge into a course she has no row for creates her own row, never anyone else's.
  perform public.merge_user_course_state('cysa-plus', '{"mineSeen": 3}'::jsonb);
  assert (select count(*) from public.user_course_state where course_id = 'cysa-plus' and user_id = '00000000-0000-4000-8000-00000000000a') = 1, 'ada: merge creates her own row';
end $$;
reset role;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-00000000000b';
do $$ begin
  perform public.merge_user_course_state('security-plus', '{"mineSeen": 9}'::jsonb);
  -- Bob's merge landed in Bob's row; Ada's row is untouched (RLS scopes the function's writes to the caller).
  assert (select data->>'mineSeen' from public.user_course_state where user_id = '00000000-0000-4000-8000-00000000000b' and course_id = 'security-plus') = '9', 'bob: merged his own row';
  assert (select count(*) from public.user_course_state where user_id = '00000000-0000-4000-8000-00000000000a') = 0, 'bob: never reads ada''s state';
end $$;
reset role;
-- Bob's extra row goes, so the later counts hold.
delete from public.user_course_state where user_id = '00000000-0000-4000-8000-00000000000b';
delete from public.user_course_state where course_id = 'cysa-plus';
-- Signed out: no claim, so `auth.uid()` is null and the function refuses (and anon may not execute it).
set local role anon;
set local request.jwt.claim.sub = '';
do $$ begin
  begin
    perform public.merge_user_course_state('security-plus', '{"x": 1}'::jsonb);
    raise exception 'merge ran with no session';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- ── The realtime publication carries every stream the app subscribes to ────
-- (Run as the table owner — RLS does not apply to this catalog view.)
do $$
declare t text;
begin
  foreach t in array array['step_completions','deliverables','memberships','gate_status',
                           'deliverable_reviews','step_flags','cohorts','course_documents',
                           'step_evidence','task_reports',
                           'deliverable_submissions','peer_reviews','deliverable_status',
                           'deliverable_review_marks','step_flag_events'] loop
    assert (select count(*) from pg_publication_tables
            where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) = 1,
      'realtime publication is missing ' || t || ' (step_evidence is 0007)';
  end loop;
end $$;

rollback;
