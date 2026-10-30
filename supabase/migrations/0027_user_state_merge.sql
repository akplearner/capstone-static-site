-- 0027_user_state_merge.sql — merge a patch into the member's own course state (R149).
--
-- WHAT THIS FIXES. `user_course_state.data` is one JSON blob per (member, course): the resume
-- pointer, the task timers, the mine counter and the Week-0 "I'm building the lab at home"
-- acknowledgement. Five places in the app each wrote the WHOLE blob from their own cache, so a
-- second device that loaded before the acknowledgement was given erased it on its next timer tick,
-- and the student was asked again. This function merges a patch into the stored row on the server:
-- each writer sends only the keys it owns, and no device can erase what another recorded.
--
-- SEMANTICS. `data := coalesce(data, '{}') || patch` for every non-null key; a key whose patch value
-- is JSON null is REMOVED (that is how a resume pointer is cleared). The row is created if missing.
-- The function is `security definer` (the house pattern, like `is_instructor()`), so it can read the
-- caller's identity wherever it runs; it scopes EVERY read and write to `auth.uid()` itself, so a member
-- can only ever merge into their own row. Signed-out callers are refused.
--
-- The app falls back to the old whole-blob upsert if this function is absent, so a project that has
-- not run this file keeps working (and keeps the race) until it does.
--
-- Idempotent, like 0001–0026.

create or replace function public.merge_user_course_state(p_course_id text, p_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_data jsonb;
  k text;
begin
  if v_uid is null then
    raise exception 'merge_user_course_state: not signed in' using errcode = '42501';
  end if;
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' then
    raise exception 'merge_user_course_state: the patch must be a JSON object' using errcode = '22023';
  end if;
  if p_course_id is null or char_length(p_course_id) not between 1 and 80 then
    raise exception 'merge_user_course_state: bad course id' using errcode = '22023';
  end if;

  insert into public.user_course_state (user_id, course_id, data, updated_at)
    values (v_uid, p_course_id, '{}'::jsonb, now())
    on conflict (user_id, course_id) do nothing;

  select data into v_data
    from public.user_course_state
   where user_id = v_uid and course_id = p_course_id
   for update;

  v_data := coalesce(v_data, '{}'::jsonb) || jsonb_strip_nulls(p_patch);
  for k in select key from jsonb_each(p_patch) where jsonb_typeof(value) = 'null' loop
    v_data := v_data - k;
  end loop;

  update public.user_course_state
     set data = v_data, updated_at = now()
   where user_id = v_uid and course_id = p_course_id;

  return v_data;
end
$$;

revoke all on function public.merge_user_course_state(text, jsonb) from public;
grant execute on function public.merge_user_course_state(text, jsonb) to authenticated;
