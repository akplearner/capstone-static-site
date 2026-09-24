-- shim.sql — the slice of a hosted Supabase project that the migrations lean on,
-- recreated on a plain Postgres so `supabase/setup.sql` can be applied and its
-- row-level security exercised WITHOUT a hosted project.
--
-- What a real project provides and this file imitates:
--   * the roles `anon`, `authenticated` and `service_role` (PostgREST switches to
--     one of them per request), with the default grants Supabase gives them on
--     `public`;
--   * `auth.users`, the table the profile trigger fires on;
--   * `auth.uid()`, which reads the caller's id out of the request's JWT claims —
--     here, out of the same session settings PostgREST sets;
--   * the `supabase_realtime` publication the migrations add tables to.
--
-- Nothing here is installed on a real project: scripts/db-check.sh applies it only
-- to the throwaway local cluster (or a CI service container).

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema if not exists auth;
create table auth.users (
  id uuid primary key,
  email text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- The hosted definition, verbatim in spirit: the `sub` claim, or null.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

create or replace function auth.role() returns text
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;

create publication supabase_realtime;

grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
