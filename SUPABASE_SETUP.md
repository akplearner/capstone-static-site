# Turning on student accounts

Right now the platform saves work in the browser only. Do the six steps below and
students sign in with **Google or GitHub**, and everything they produce is saved to
a real database: progress, the gems they earn, team deliverables, the evidence
ledger, and where they left off — on any device, visible to their teammates.

**No email is involved anywhere.** Google or GitHub verifies the student and hands
back their name and picture, so there is no mail server to configure, no
confirmation step, and no password to reset. That is the whole reason this is short.

**Nothing changes until step 6.** Until the environment variables are set and the
site is redeployed, the platform behaves exactly as it does today.

**Time: about 35 minutes**, 15 of it inside Google Cloud and 5 inside GitHub.

Have three browser tabs open: your **Supabase** project, your **Vercel** project,
and **GitHub**.

> **Prefer to hand the clicks off?** Steps 2–5 can be run for you by the setup
> script (`scripts/supabase-configure.sh`) — or by Claude in a session that has
> the right secrets. Do step 1, create the two OAuth apps (steps 4b and 4d), then
> see [Let the script do steps 2–5](#let-the-script-do-steps-2-5) at the end.

---

## Step 1 · Copy two values from Supabase — 2 min

In your Supabase project: **Project Settings** (the gear, bottom of the left
sidebar) → **API**.

Copy these two somewhere you can paste from in step 6:

| Label on the page | Looks like |
|---|---|
| **Project URL** | `https://abcdefghijkl.supabase.co` |
| **anon** **public** key | a very long string starting `eyJ…` |

The anon key is *meant* to be public — it goes in the browser. What protects your
data is the security rules step 2 installs, not the secrecy of this key. Ignore
the **`service_role`** key; nothing here uses it.

While you are here, note the **project ref** — the `abcdefghijkl` part of the
Project URL. Step 4 needs it.

---

## Step 2 · Create the database tables — 3 min

This is the step that was hard to find. In the **left sidebar** of your Supabase
project there is an icon labelled **SQL Editor** (it looks like `</>`, roughly
halfway down, under Table Editor). Click it.

1. Click **New query** (top left of that panel).
2. Open the file **`supabase/setup.sql`** from this repository, select all of it,
   and paste it into the query box. It is long — around 400 lines. That is
   expected; paste the whole thing.
3. Click **Run** (bottom right, or Ctrl/Cmd + Enter).

You should see **"Success. No rows returned."** in the results panel. That *is*
success — these statements create tables rather than return rows.

> **Do this before anyone signs in.** This installs the rule that creates a
> profile for each new account. Anyone who signs in before this step will end up
> without one; the fix is to delete that user under **Authentication → Users** and
> sign in again.

The file is safe to run twice — if you are unsure whether it worked, just run it
again. To confirm, open **Table Editor** in the sidebar: you should see tables
including `profiles`, `memberships`, `deliverables` and `step_completions`.

---

## Step 3 · Tell Supabase your web address — 2 min

**Authentication** (sidebar) → **URL Configuration**.

- **Site URL:** `https://yourdomain.com` — your live Vercel address.
- **Redirect URLs:** click **Add URL** and add **both** of these, exactly, with
  the `/**` on the end:

  ```
  https://yourdomain.com/**
  http://localhost:3000/**
  ```

> ⚠️ **The `/**` matters more than anything else on this page.** After Google
> signs a student in, the platform sends them to
> `…/auth/callback?next=/the-page-they-were-on`. A plain `…/auth/callback` entry
> does not match that, and every single sign-in silently dumps the student back on
> the homepage, still signed out. If you only remember one warning from this
> guide, make it this one.

---

## Step 4 · Create the Google sign-in credentials — 15 min

This part is entirely inside [Google Cloud Console](https://console.cloud.google.com),
and it is the longest stretch. Create or pick any project at the top of the page.

**4a — the consent screen** (what students see when they click Google):

1. **APIs & Services → OAuth consent screen**.
2. Choose **External**, then fill in the app name (e.g. *Capstone Quarry*), your
   support email, and your developer email. The default scopes are all you need —
   they are not "sensitive", so Google will not put you through a review.
3. **Publish** the app. If you leave it in *Testing*, every student gets a red
   "Google hasn't verified this app" warning.

**4b — the credentials:**

1. **APIs & Services → Credentials → Create credentials → OAuth client ID**.
2. Application type: **Web application**.
3. Under **Authorised redirect URIs**, click **Add URI** and paste this — replacing
   `<project-ref>` with the value from step 1:

   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```

   > **This is Supabase's address, not yours.** Putting your own domain here is the
   > single most common mistake in the whole setup. Google hands the student to
   > Supabase, and Supabase hands them to your site.

4. Click **Create**. Google shows you a **Client ID** and a **Client secret** —
   keep that dialog open for the next step.

**4c — paste them into Supabase:**

Supabase → **Authentication** → **Providers** (or *Sign In / Providers*) → find
**Google** in the list → toggle it **on** → paste the Client ID and Client secret
→ **Save**.

**4d — the GitHub app** (5 min, no consent screen, no publishing):

1. GitHub → your avatar → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. **Application name:** *Capstone Quarry*. **Homepage URL:** your domain.
   **Authorization callback URL:** the *same* Supabase address as step 4b —

   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```

3. **Register application**, then **Generate a new client secret**. Copy the
   **Client ID** and the new **secret** (the secret is shown once).
4. Supabase → **Authentication → Providers → GitHub** → toggle it **on** → paste
   both → **Save**.

Both buttons are on by default in the platform — there is no setting to add.

---

## Step 5 · Turn off email sign-in — 1 min

Supabase → **Authentication → Providers → Email** → toggle it **off** → Save.

The platform only ever shows the Google and GitHub buttons, but until you do this,
someone could still create a password account by talking to your database's API
directly. This step is what makes "Google and GitHub only" actually true.

---

## Step 6 · Add the settings to Vercel and redeploy — 5 min

In Vercel: your project → **Settings** → **Environment Variables**.

Add these three. For each one, make sure **Production** and **Preview** are both
ticked:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | the Project URL from step 1 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon public key from step 1 |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` |

That is all three. There is **no** setting to turn Google or GitHub on — both
are the default.

Now the part that is easy to miss:

> ⚠️ **Go to Deployments → the most recent one → ⋯ → Redeploy.**
> These values are baked in when the site is built, so setting them changes
> nothing until a new build runs. If the platform still looks like it did before,
> this is almost always why.

---

## Check it worked

**1. Is it connected?** Visit `https://yourdomain.com/api/health` in a browser:

| What you see | What it means |
|---|---|
| `"mode":"cloud","supabase":"reachable"` | ✅ Connected. Carry on. |
| `"mode":"local","supabase":"not-configured"` | Still in browser-only mode — step 6, and check you redeployed. |
| `"status":"degraded"` | Variables are set but Supabase did not answer — check the URL for typos. |

**2. Can you sign in?** Open your site, click **Sign in / Create account**,
choose Google. You should land on the dashboard with your name in the corner.
Sign out and do it again with GitHub. `/api/health` also lists
`"authMethods":["google","github"]`.

**3. Does work actually save?** This is the one that proves the database, not just
the login. Join a course, tick a step, then **hard-refresh the page**. The tick
must still be there. If it is, you are done.

**4. Make yourself the instructor.** Sign in once first (that creates your
profile), then Supabase → **SQL Editor** → New query → run:

```sql
update public.profiles set is_instructor = true
where id = (select id from auth.users where email = 'you@example.com');
```

---

## If something is not working

Find what you are actually seeing:

| What you see | What is wrong | Fix |
|---|---|---|
| Sign-in returns you to the homepage, still signed out | Redirect URL is missing the `/**` | **Step 3** |
| Homepage says the sign-in link expired | The link was already used, or it timed out | Just sign in again |
| A yellow box: "Accounts aren't configured on this deployment" | The site cannot see the variables | **Step 6** — then redeploy |
| `/api/health` says `"mode":"local"` | Same as above: unset, or set but never redeployed | **Step 6** — then redeploy |
| An error mentioning an unsupported provider | Google or GitHub is not switched on in Supabase | **Step 4c / 4d** |
| GitHub says "The redirect_uri MUST match the registered callback URL" | The callback is your domain, not Supabase's | **Step 4d** |
| Signed in with GitHub, but no name or picture shows | The GitHub account has no public name — the login is used instead; the picture needs the app's default `read:user` scope, which it has | Change the name on `/account` |
| Google warns "this app isn't verified" | The consent screen is still in Testing | **Step 4a** — publish it |
| Signed in fine, but ticks vanish on refresh | The tables were never created | **Step 2** |
| Signed in, but the platform acts like you have no account | You signed in before step 2 ran | Delete the user in **Authentication → Users**, sign in again |
| `redirect_uri_mismatch` from Google | The redirect URI is your domain, not Supabase's | **Step 4b** |

Still stuck? `/api/health` tells you which half of the setup to look at: if it says
`local`, the problem is Vercel (step 6). If it says `cloud`, the problem is in
Supabase (steps 2–5).

---
---

# Optional extras

Everything below is genuinely optional. The setup above is complete without it.

## Only one of the two buttons

Both are the default. To offer just one, add a variable in Vercel and redeploy:

```
NEXT_PUBLIC_AUTH_METHODS=google
```

## Other sign-in methods

Emailed sign-in links and email + password are both implemented:

```
NEXT_PUBLIC_AUTH_METHODS=google,github,magic
NEXT_PUBLIC_AUTH_METHODS=google,github,magic,password
```

Both need the **Email** provider switched back on (undoing step 5) — and both need
real email delivery. Supabase's built-in mailer is capped at a few messages an hour
and labelled test-only, so before real students you would also need custom SMTP
(**Project Settings → Authentication → SMTP Settings**) with a provider like Resend,
your sending domain's SPF/DKIM records verified, and the rate limit raised.

Avoiding all of that is exactly why the default is Google and GitHub.

## Let students delete their account

The privacy policy promises account deletion. Removing the login itself needs the
`service_role` key, which must never reach a browser, so it lives in a small
server-side function:

```bash
supabase functions deploy delete-account
supabase secrets set SERVICE_ROLE_KEY=<service_role key>
```

Until this is deployed, `/account` still deletes all of a student's work and then
honestly reports that the login itself could not be removed.

## Live teammate updates

Teammates seeing each other's progress update without refreshing is already
configured by step 2. Confirm under **Database → Replication** if you want to check.
`lab_access`, `user_course_state` and `step_notes` are deliberately excluded — they
are private to one student, so there is nobody to notify. Reviews, the cohort
calendar and stuck flags (`deliverable_reviews`, `cohorts`, `step_flags`) are
included, so a review appears on the team's Deliverables page as it is saved.

---

## Checking the privacy rules actually hold

The rules below are **tested on every push**: `npm run db:check` applies
`supabase/setup.sql` to a real Postgres and runs `supabase/tests/rls.sql`, which
plays four students and an instructor and asserts each line of the table. CI runs
the same on a `postgres:16` container. That is where the schema's first real run
found a self-referencing policy (every team join failed) and a column a student
could flip to make themselves an instructor — both fixed in migration 0006.

Still worth ten minutes on the live site before real students:

1. Sign in as student A, tick a step, confirm it appears on a second device.
2. As student B **on a different team**, confirm you see **nothing** of A's lab
   notes, ticks or gems. Use a second browser.

### Who can read what

| Data | Who can read it |
|---|---|
| Profiles | you, plus teammates (name and picture); only you may change them, and not the instructor flag |
| Team membership | anyone on the same course |
| Step completions | you and your teammates |
| Evidence ledger (what earns each gem) | you and your teammates — hashes and counts, never pasted output |
| Deliverables, gate status | your team |
| Personal state (where you left off, the mine), evidence files, chosen path | **you only** |
| Lab access notes | **you only** — not teammates, not instructors |
| Step notes | **you only** |
| "I'm stuck" flags | you, your teammates, and the instructor |
| Instructor reviews of a form | your team (read); the instructor writes |
| Cohort calendar (start date) | anyone signed in (read); the instructor writes |
| The course document | anyone signed in (read); the instructor writes |

Lab notes are the strictest on purpose: that is where students record lab details.
Instructors can read membership, completions, deliverables, the evidence ledger
(hashes and counts, never pasted output) and gate status — that is what the
cohort dashboard at `/instructor/<course>/cohort` is built from. Never lab
credentials, never a student's step notes.

A team is a team **within one class session**: Team 1 of the January cohort and
Team 1 of March are separate teams with separate documents.

---

## What students experience

| | Before setup | After setup |
|---|---|---|
| Sign-in | not offered | Continue with Google or GitHub |
| Course overview page | open to anyone | open to anyone |
| Weekly tasks, guide, deliverables | open | needs an account **and** a team |
| Saving work | this browser only | saved to their account |
| Another device | starts empty | everything is there, including the gems and the mine |
| Teammates see their work | no | yes — progress, gems, name and picture |

---

## Let the script do steps 2–5

`scripts/supabase-configure.sh` does the schema paste, the URL configuration and
the provider toggles through Supabase's own API, so nothing is typed into a
dashboard. It reads everything from environment variables and prints a redacted
summary; it never prints a secret. Run it yourself, or add the variables as
secrets to a Claude Code environment and ask Claude to run it.

| Variable | Where it comes from |
|---|---|
| `SUPABASE_PROJECT_REF` | the `abcdefghijkl` part of the Project URL (step 1) |
| `SUPABASE_ACCESS_TOKEN` | Supabase → your avatar → **Account → Access Tokens → Generate new token** |
| `SUPABASE_DB_URL` | Supabase → **Connect** (top bar) → **Session pooler** URI, with your database password filled in |
| `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` | step 4b |
| `GITHUB_OAUTH_CLIENT_ID`, `GITHUB_OAUTH_CLIENT_SECRET` | step 4d |
| `SITE_URL` | `https://yourdomain.com` |
| `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` (optional; `VERCEL_TEAM_ID` if the project is in a team) | Vercel → **Account → Tokens**; project → **Settings → General** |
| `VERCEL_DEPLOY_HOOK_URL` (optional) | project → **Settings → Git → Deploy Hooks** |

```bash
bash scripts/supabase-configure.sh          # everything the variables allow
bash scripts/supabase-configure.sh --check  # read the current auth config only
```

With the Vercel variables present it also sets the three `NEXT_PUBLIC_*` values
for Production and Preview and, with the deploy hook, triggers the redeploy that
step 6 warns about. Without them it prints the three values for you to paste.

Course overview pages stay public on purpose, so someone considering the course can
see what it involves. The material opens once a student joins a team and a role.

On a student's first sign-in, if that browser already holds work from before, they
are offered a one-time import. It is only marked done once the server confirms the
work arrived, so a failed import can be retried and never silently loses anything.

For day-two running — monitoring, incidents, open decisions — see
[`docs/OPERATIONS.md`](./docs/OPERATIONS.md).
