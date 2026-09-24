#!/usr/bin/env bash
# supabase-configure.sh — steps 2–5 of SUPABASE_SETUP.md, through the APIs.
#
# What a person otherwise does by hand in three dashboards: paste the schema,
# set the site URL and redirect URLs, turn Google and GitHub on and Email off,
# and set the three NEXT_PUBLIC_* values in Vercel. Every input is an environment
# variable (see the table at the end of SUPABASE_SETUP.md); nothing is passed on
# the command line, and nothing secret is ever printed. Each part runs only when
# its variables are present, so it is safe to run with a partial set, and safe
# to re-run: every step is idempotent.
#
#   bash scripts/supabase-configure.sh          do everything the variables allow
#   bash scripts/supabase-configure.sh --check  print the current auth config only
#
# Parts, in order:
#   1. schema     SUPABASE_DB_URL              psql -f supabase/setup.sql, then
#                                              supabase/tests/rls.sql in a rolled-
#                                              back transaction (proves the rules)
#   2. auth       SUPABASE_ACCESS_TOKEN        PATCH /v1/projects/{ref}/config/auth:
#                 SUPABASE_PROJECT_REF         site_url, uri_allow_list, Google,
#                 SITE_URL                     GitHub on, Email off
#                 GOOGLE_OAUTH_CLIENT_ID/_SECRET
#                 GITHUB_OAUTH_CLIENT_ID/_SECRET
#   3. vercel     VERCEL_TOKEN                 upsert the three NEXT_PUBLIC_* env
#                 VERCEL_PROJECT_ID            vars for production + preview
#                 [VERCEL_TEAM_ID]             (needs SUPABASE_ANON_KEY too)
#                 [VERCEL_DEPLOY_HOOK_URL]     …and trigger the redeploy
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MODE="${1:-apply}"
log()  { printf '\033[1;34m[configure]\033[0m %s\n' "$*"; }
skip() { printf '\033[1;33m[configure]\033[0m skip: %s\n' "$*"; }
need() { command -v "$1" >/dev/null 2>&1 || { echo "configure: '$1' is required" >&2; exit 2; }; }
need curl; need python3

API="https://api.supabase.com/v1"
auth_hdr() { printf 'Authorization: Bearer %s' "$SUPABASE_ACCESS_TOKEN"; }

# Redact anything that looks like a secret before it reaches the terminal.
show_auth() {
  python3 - <<'PY'
import json, sys
c = json.load(sys.stdin)
keep = ['site_url', 'uri_allow_list', 'external_email_enabled',
        'external_google_enabled', 'external_google_client_id',
        'external_github_enabled', 'external_github_client_id']
for k in keep:
    v = c.get(k)
    if isinstance(v, str) and k.endswith('client_id') and len(v) > 12:
        v = v[:6] + '…' + v[-4:]
    print(f'  {k:<28} {v}')
for k in ('external_google_secret', 'external_github_secret'):
    print(f'  {k:<28} {"(set)" if c.get(k) else "(empty)"}')
PY
}

# ── --check ─────────────────────────────────────────────────────────────────
if [ "$MODE" = "--check" ]; then
  : "${SUPABASE_ACCESS_TOKEN:?}" "${SUPABASE_PROJECT_REF:?}"
  log "auth config for project $SUPABASE_PROJECT_REF"
  curl -sSf -H "$(auth_hdr)" "$API/projects/$SUPABASE_PROJECT_REF/config/auth" | show_auth
  exit 0
fi

# ── 1. schema ───────────────────────────────────────────────────────────────
if [ -n "${SUPABASE_DB_URL:-}" ]; then
  need psql
  log "schema → supabase/setup.sql"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -f "$REPO/supabase/setup.sql"
  log "row-level security assertions (rolled back) → supabase/tests/rls.sql"
  if psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -q -f "$REPO/supabase/tests/rls.sql"; then
    log "every rule holds on the live project"
  else
    echo "configure: the RLS assertions failed on the live project — stop and read the error above" >&2
    exit 1
  fi
else
  skip "schema (SUPABASE_DB_URL not set) — paste supabase/setup.sql in the SQL Editor instead"
fi

# ── 2. auth config ──────────────────────────────────────────────────────────
if [ -n "${SUPABASE_ACCESS_TOKEN:-}" ] && [ -n "${SUPABASE_PROJECT_REF:-}" ]; then
  : "${SITE_URL:?SITE_URL is required with the access token (https://yourdomain.com)}"
  body="$(python3 - <<'PY'
import json, os
site = os.environ['SITE_URL'].rstrip('/')
cfg = {
  'site_url': site,
  'uri_allow_list': ','.join([f'{site}/**', 'http://localhost:3000/**']),
  'external_email_enabled': False,
}
g = os.environ.get('GOOGLE_OAUTH_CLIENT_ID'); gs = os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET')
if g and gs:
  cfg.update(external_google_enabled=True, external_google_client_id=g, external_google_secret=gs)
h = os.environ.get('GITHUB_OAUTH_CLIENT_ID'); hs = os.environ.get('GITHUB_OAUTH_CLIENT_SECRET')
if h and hs:
  cfg.update(external_github_enabled=True, external_github_client_id=h, external_github_secret=hs)
print(json.dumps(cfg))
PY
)"
  log "auth config → site url, redirect urls, providers"
  [ -n "${GOOGLE_OAUTH_CLIENT_ID:-}" ] || skip "Google (GOOGLE_OAUTH_CLIENT_ID/_SECRET not set)"
  [ -n "${GITHUB_OAUTH_CLIENT_ID:-}" ] || skip "GitHub (GITHUB_OAUTH_CLIENT_ID/_SECRET not set)"
  curl -sSf -X PATCH -H "$(auth_hdr)" -H 'Content-Type: application/json' \
    --data "$body" "$API/projects/$SUPABASE_PROJECT_REF/config/auth" >/dev/null
  log "now on the project:"
  curl -sSf -H "$(auth_hdr)" "$API/projects/$SUPABASE_PROJECT_REF/config/auth" | show_auth
else
  skip "auth config (SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECT_REF not set) — steps 3–5 by hand"
fi

# ── 3. vercel ───────────────────────────────────────────────────────────────
if [ -n "${SUPABASE_PROJECT_REF:-}" ]; then
  echo
  log "the three values for Vercel (Production + Preview), then redeploy:"
  printf '  NEXT_PUBLIC_SUPABASE_URL      = https://%s.supabase.co\n' "$SUPABASE_PROJECT_REF"
  printf '  NEXT_PUBLIC_SUPABASE_ANON_KEY = %s\n' "${SUPABASE_ANON_KEY:+(from SUPABASE_ANON_KEY)}${SUPABASE_ANON_KEY:-<Project Settings → API → anon public>}"
  printf '  NEXT_PUBLIC_SITE_URL          = %s\n' "${SITE_URL:-https://yourdomain.com}"
fi
if [ -n "${VERCEL_TOKEN:-}" ] && [ -n "${VERCEL_PROJECT_ID:-}" ]; then
  : "${SUPABASE_PROJECT_REF:?}" "${SUPABASE_ANON_KEY:?SUPABASE_ANON_KEY is required to set Vercel env vars}" "${SITE_URL:?}"
  team="${VERCEL_TEAM_ID:+?teamId=$VERCEL_TEAM_ID&upsert=true}"
  team="${team:-?upsert=true}"
  set_env() {
    curl -sSf -X POST -H "Authorization: Bearer $VERCEL_TOKEN" -H 'Content-Type: application/json' \
      --data "$(python3 -c 'import json,sys; print(json.dumps({"key": sys.argv[1], "value": sys.argv[2], "type": "plain", "target": ["production", "preview"]}))' "$1" "$2")" \
      "https://api.vercel.com/v10/projects/$VERCEL_PROJECT_ID/env$team" >/dev/null
    log "vercel env: $1"
  }
  set_env NEXT_PUBLIC_SUPABASE_URL "https://$SUPABASE_PROJECT_REF.supabase.co"
  set_env NEXT_PUBLIC_SUPABASE_ANON_KEY "$SUPABASE_ANON_KEY"
  set_env NEXT_PUBLIC_SITE_URL "${SITE_URL%/}"
  if [ -n "${VERCEL_DEPLOY_HOOK_URL:-}" ]; then
    curl -sSf -X POST "$VERCEL_DEPLOY_HOOK_URL" >/dev/null && log "redeploy triggered"
  else
    skip "redeploy (VERCEL_DEPLOY_HOOK_URL not set) — Deployments → ⋯ → Redeploy"
  fi
else
  skip "vercel (VERCEL_TOKEN / VERCEL_PROJECT_ID not set) — set the three values above by hand"
fi
log "done"
