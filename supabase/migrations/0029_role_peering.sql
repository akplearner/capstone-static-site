-- 0029_role_peering.sql — a role is led by one; a second joins only as a permitted peer (R154).
--
-- A team keeps its seats and its roles. Each role is LED by one member; a SECOND may join the same role
-- as a co-work peer, but only if the role's current holder has allowed it, and never a third. R154 makes
-- that rule the database's, not just the browser's.
--
--   role_peering           per (course_id, team_id, role): whether a co-work peer may join. Written only
--                          by a current holder of that role on that team (instructors too).
--   membership_role_guard  BEFORE INSERT OR UPDATE on memberships, when the row is new or moves to a
--                          different team or role: count the others already on that (course, team, role)
--                          — two already → refused (the cap); one already → refused unless peering is
--                          allowed there (instructors exempt from the permission, never from the cap);
--                          none → this member leads the role.
--
-- Idempotent, like 0001–0028.

create table if not exists public.role_peering (
  course_id text not null check (char_length(course_id) between 1 and 80),
  team_id   text not null check (char_length(team_id) between 1 and 80),
  role      text not null check (char_length(role) between 1 and 40),
  allowed   boolean not null default false,
  set_by    uuid references auth.users(id) on delete set null,
  set_at    timestamptz not null default now(),
  primary key (course_id, team_id, role)
);
alter table public.role_peering enable row level security;

-- Whether the caller currently holds (course, team, role). A SECURITY DEFINER helper so the policy does
-- not subquery memberships directly (the recursion 0006 fixed; page-shape forbids it in a policy body).
create or replace function public.holds_role(c text, t text, r text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m
    where m.course_id = c and m.team_id = t and m.role = r and m.user_id = auth.uid()
  );
$$;
revoke execute on function public.holds_role(text, text, text) from public;
grant  execute on function public.holds_role(text, text, text) to authenticated, service_role;

drop policy if exists "role peering read" on public.role_peering;
create policy "role peering read" on public.role_peering
  for select using (public.shares_course(course_id));

-- Only a current holder of the role on that team (or an instructor) may open or close its peering.
drop policy if exists "role peering holder write" on public.role_peering;
create policy "role peering holder write" on public.role_peering
  for all
  using (public.is_instructor() or public.holds_role(course_id, team_id, role))
  with check (public.is_instructor() or public.holds_role(course_id, team_id, role));

create or replace function public.membership_role_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_others  integer;
  v_allowed boolean;
  -- A name-only edit, or a move that keeps the same team and role, is not a "join" onto a role.
  v_moved boolean := tg_op = 'INSERT' or new.team_id is distinct from old.team_id or new.role is distinct from old.role;
begin
  if not v_moved then
    return new;
  end if;
  select count(*) into v_others
    from public.memberships m
    where m.course_id = new.course_id and m.team_id = new.team_id and m.role = new.role and m.user_id <> new.user_id;
  if v_others >= 2 then
    raise exception 'that role already has two members on this team' using errcode = '23514';
  end if;
  if v_others = 1 and not public.is_instructor() then
    select allowed into v_allowed from public.role_peering
      where course_id = new.course_id and team_id = new.team_id and role = new.role;
    if coalesce(v_allowed, false) is not true then
      raise exception 'that role is taken; the first member must allow a co-work peer' using errcode = '23514';
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists memberships_role_guard on public.memberships;
create trigger memberships_role_guard
  before insert or update on public.memberships
  for each row execute function public.membership_role_guard();

revoke all on function public.membership_role_guard() from public;
