#!/usr/bin/env bash
# db-check.sh — apply supabase/setup.sql to a real Postgres and prove the
# row-level security does what SUPABASE_SETUP.md promises.
#
# Why this exists: the schema was written without a Supabase project to run it
# on, and RLS policies fail in ways a code review cannot see (a policy on
# `memberships` that subqueries `memberships` is accepted at CREATE POLICY time
# and only raises "infinite recursion detected" on the first SELECT). This runs
# the whole schema, then supabase/tests/rls.sql — a script of assertions written
# as four students and an instructor — and fails loudly if any of them is wrong.
#
# Three ways to run it:
#   npm run db:check                 spin up a throwaway Postgres 16 in $TMPDIR,
#                                    apply the shim + setup.sql, run the checks,
#                                    tear it down (needs initdb/pg_ctl/psql).
#   PGURL=postgres://… npm run db:check
#                                    against an EMPTY database you provide (CI
#                                    uses a postgres:16 service): shim + schema +
#                                    checks. Do not point this at a real project.
#   SETUP_SQL=path npm run db:check  apply a different flattened schema — used to
#                                    prove the checks are non-vacuous (an older
#                                    schema must FAIL them).
#
# supabase/tests/rls.sql runs inside one transaction that is always rolled back,
# so it is also safe against a real project through scripts/supabase-configure.sh.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SETUP_SQL="${SETUP_SQL:-$REPO/supabase/setup.sql}"
SHIM_SQL="$REPO/supabase/tests/shim.sql"
RLS_SQL="${RLS_SQL:-$REPO/supabase/tests/rls.sql}"
PGBIN="${PGBIN:-}"
if [ -z "$PGBIN" ]; then
  for d in /usr/lib/postgresql/*/bin /usr/local/pgsql/bin /opt/homebrew/opt/postgresql@16/bin; do
    [ -x "$d/initdb" ] && PGBIN="$d"
  done
fi
if [ -z "$PGBIN" ] && command -v initdb >/dev/null 2>&1; then PGBIN="$(dirname "$(command -v initdb)")"; fi

log() { printf '\033[1;34m[db-check]\033[0m %s\n' "$*"; }

run_checks() {
  # $1 = psql connection args (string), applied to an empty database.
  local conn="$1"
  log "shim (roles, auth.users, auth.uid, realtime publication)"
  psql $conn -v ON_ERROR_STOP=1 -q -f "$SHIM_SQL"
  log "schema: $SETUP_SQL"
  psql $conn -v ON_ERROR_STOP=1 -q -f "$SETUP_SQL"
  log "row-level security assertions: supabase/tests/rls.sql"
  psql $conn -v ON_ERROR_STOP=1 -q -f "$RLS_SQL"
  log "all assertions passed"
}

if [ -n "${PGURL:-}" ]; then
  run_checks "$PGURL"
  exit 0
fi

if [ -z "$PGBIN" ] || [ ! -x "$PGBIN/initdb" ]; then
  echo "db-check: no Postgres server binaries found (initdb). Install postgresql-16 or set PGURL." >&2
  exit 2
fi

WORK="${TMPDIR:-/tmp}/cq-dbcheck-$$"
PORT="${DBCHECK_PORT:-54329}"
mkdir -p "$WORK"
# initdb refuses to run as root; hand the cluster to the postgres user if we are.
AS=""
if [ "$(id -u)" = "0" ]; then
  if id postgres >/dev/null 2>&1; then
    chown postgres "$WORK"
    AS="runuser -u postgres --"
  else
    echo "db-check: running as root and no 'postgres' user to drop to" >&2
    exit 2
  fi
fi

cleanup() {
  $AS "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

log "initdb → $WORK (port $PORT, unix socket only)"
$AS "$PGBIN/initdb" -D "$WORK/data" -U postgres --auth=trust -E UTF8 >"$WORK/initdb.log" 2>&1
$AS "$PGBIN/pg_ctl" -D "$WORK/data" -l "$WORK/postgres.log" \
  -o "-p $PORT -k $WORK -c listen_addresses='' -c wal_level=logical -c fsync=off -c synchronous_commit=off" -w start >/dev/null
CONN="-h $WORK -p $PORT -U postgres -d postgres"
run_checks "$CONN"
