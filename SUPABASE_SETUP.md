# Supabase setup — auth, saved progress & team visibility

This app saves each student's progress to their account (Google / GitHub / magic-link
email) and lets teammates see each other's progress and the team's deliverable forms.
The backend is **Supabase** (managed Postgres + Auth + Row-Level Security). No separate
server to run.

Until the two env vars below are set, the app runs exactly as before — fully in the
browser's localStorage, no sign-in. Setting them switches the data layer to Supabase.

---

## 1. Create the project & get keys

1. Create a project at <https://supabase.com> (free tier is fine).
2. **Settings → API**: copy the **Project URL** and the **anon public** key.
3. Put them in `.env.local` (copy `.env.local.example`) and in **Vercel → Project →
   Settings → Environment Variables** (Production + Preview):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

   Only the anon key is needed — never expose the service-role key in the app.

## 2. Enable sign-in methods

**Authentication → Providers**:
- **Email**: enable. Magic link works by default. (Optionally disable "Confirm email"
  to make the very first link also sign-up.)
- **Google**: enable, paste OAuth client ID + secret from a Google Cloud OAuth app.
- **GitHub**: enable, paste client ID + secret from a GitHub OAuth app.

**Authentication → URL Configuration**:
- **Site URL**: your Vercel production URL (e.g. `https://your-app.vercel.app`).
- **Redirect URLs**: add both
  - `http://localhost:3000/auth/callback`
  - `https://your-app.vercel.app/auth/callback`

  (In each provider's own console, set the callback to Supabase's
  `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.)

## 3. Database schema + Row-Level Security

**SQL Editor → New query**, paste and run all of this:

```sql
-- 1. profiles (1:1 with auth.users) ----------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_instructor boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles self read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
-- teammates may read each other's display name
create policy "profiles teammates read" on public.profiles for select using (
  exists (select 1 from public.memberships m1
          join public.memberships m2
            on m1.course_id = m2.course_id and m1.team_id = m2.team_id
          where m1.user_id = auth.uid() and m2.user_id = profiles.id)
);

-- auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', new.email));
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- 2. memberships (roster). user_id replaces the old synthesized memberId -----
create table public.memberships (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  team_id text not null,
  role text not null,
  display_name text not null,
  cohort text not null,
  joined_at timestamptz not null default now(),
  primary key (user_id, course_id)              -- one team per user per course
);
alter table public.memberships enable row level security;
create policy "memberships self write" on public.memberships for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "memberships course read" on public.memberships for select using (
  exists (select 1 from public.memberships me
          where me.user_id = auth.uid() and me.course_id = memberships.course_id)
);

-- 3. step_completions --------------------------------------------------------
create table public.step_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null,
  task_id text not null,
  step_id text not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, course_id, task_id, step_id)
);
alter table public.step_completions enable row level security;
create policy "completions self write" on public.step_completions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "completions teammates read" on public.step_completions for select using (
  exists (select 1 from public.memberships me
          join public.memberships them
            on me.course_id = them.course_id and me.team_id = them.team_id
          where me.user_id = auth.uid()
            and them.user_id = step_completions.user_id
            and them.course_id = step_completions.course_id)
);

-- 4. deliverables (team-scoped form data) -----------------------------------
create table public.deliverables (
  course_id text not null,
  team_id text not null,
  deliverable_id text not null,
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (course_id, team_id, deliverable_id)
);
alter table public.deliverables enable row level security;
create policy "deliverables team rw" on public.deliverables for all
  using (exists (select 1 from public.memberships me
                 where me.user_id = auth.uid()
                   and me.course_id = deliverables.course_id
                   and me.team_id = deliverables.team_id))
  with check (exists (select 1 from public.memberships me
                 where me.user_id = auth.uid()
                   and me.course_id = deliverables.course_id
                   and me.team_id = deliverables.team_id));

-- 5. gate_status (team-scoped) ----------------------------------------------
create table public.gate_status (
  course_id text not null,
  team_id text not null,
  gate_id int not null,
  status text not null check (status in ('locked','ready','passed')),
  updated_at timestamptz not null default now(),
  primary key (course_id, team_id, gate_id)
);
alter table public.gate_status enable row level security;
create policy "gate team rw" on public.gate_status for all
  using (exists (select 1 from public.memberships me
                 where me.user_id = auth.uid()
                   and me.course_id = gate_status.course_id
                   and me.team_id = gate_status.team_id))
  with check (exists (select 1 from public.memberships me
                 where me.user_id = auth.uid()
                   and me.course_id = gate_status.course_id
                   and me.team_id = gate_status.team_id));

-- instructors may read everything (optional, for a future dashboard)
create policy "instructor reads memberships"  on public.memberships     for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor));
create policy "instructor reads completions"  on public.step_completions for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor));
create policy "instructor reads deliverables" on public.deliverables     for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_instructor));
```

### Optional: atomic per-team capacity (RPC)

The `(user_id, course_id)` primary key already prevents a user from occupying two
teams. The app also checks team capacity against the cached roster. If you want the
server to enforce per-team capacity atomically, add:

```sql
create or replace function public.join_team(
  p_course_id text, p_team_id text, p_role text,
  p_name text, p_cohort text, p_cap int
) returns void language plpgsql security definer as $$
begin
  if p_cap > 0 and (
    select count(*) from public.memberships
    where course_id = p_course_id and team_id = p_team_id and user_id <> auth.uid()
  ) >= p_cap then
    raise exception 'team-full';
  end if;
  insert into public.memberships (user_id, course_id, team_id, role, display_name, cohort)
  values (auth.uid(), p_course_id, p_team_id, p_role, p_name, p_cohort)
  on conflict (user_id, course_id)
  do update set team_id = excluded.team_id, role = excluded.role,
                display_name = excluded.display_name, cohort = excluded.cohort;
end; $$;
```

(The current client uses a plain `memberships` upsert; switch `joinTeam` to call this
RPC if you adopt it.)

## 4. Enable Realtime (live teammate updates)

**Database → Replication** (or **Realtime**): add these tables to the
`supabase_realtime` publication so teammates' changes stream in live:
`step_completions`, `deliverables`, `memberships`, `gate_status`.

SQL equivalent:

```sql
alter publication supabase_realtime add table public.step_completions;
alter publication supabase_realtime add table public.deliverables;
alter publication supabase_realtime add table public.memberships;
alter publication supabase_realtime add table public.gate_status;
```

## 5. Grant instructor access

For each instructor account (after they've signed in once so the profile exists):

```sql
update public.profiles set is_instructor = true where id =
  (select id from auth.users where email = 'instructor@example.com');
```

---

## How it behaves

- **No env vars** → localStorage mode (today's behavior); no sign-in shown.
- **Env vars set** → joining a team, saving step progress, and editing deliverable
  forms require sign-in. Data syncs across devices; teammates on the same team see
  each other's progress and shared forms on the team page. First sign-in on a device
  with old local progress offers a one-time import.
- RLS guarantees a student can only read their own + same-team data; other teams are
  invisible even to a crafted query.
