# Capstone Labs — What's needed from you to run a fully functional app

> Everything the code can't do for itself: accounts, secrets, dashboard clicks, and content decisions.
> Split into **(A) ship the MVP live now**, **(B) ongoing inputs**, and **(C) per future phase**.
> I (the build side) handle all code, schema SQL, migrations, and docs; you handle the items below.

---

## A. To make today's MVP fully functional (self-study / team-practice)

The app already runs **with zero setup** in localStorage mode (no accounts, per-device). To get the
**cloud-backed** version (progress that survives across devices + real team visibility), you provide:

### A1. Go-ahead to merge to `main`
The finished work sits on branches (`integration-test` / `mvp-gaps` / `supabase-auth` /
`compact-tasks-commands`), verified conflict-free. **You:** say "merge to main." **I:** merge + push
(triggers the Vercel deploy).

### A2. A Supabase project (free tier is fine)
**You:**
1. Create a project at <https://supabase.com>; copy the **Project URL** and **anon public** key.
2. Run the schema SQL from `SUPABASE_SETUP.md` (tables + RLS) in the SQL editor. *(I provide/maintain it.)*
3. Enable **Realtime** on the listed tables (one screen).

### A3. Sign-in providers (you pick which)
**You** enable in Supabase → Authentication → Providers:
- **Magic-link email** — zero external setup (recommended to start).
- **Google** — needs a Google Cloud OAuth app (client ID + secret).
- **GitHub** — needs a GitHub OAuth app (client ID + secret).
Set Site URL + Redirect URLs to include `http://localhost:3000/auth/callback` and your Vercel
`/auth/callback`.

### A4. Environment variables (local + Vercel)
**You** set:
```
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
```
in `.env.local` and in Vercel → Project → Settings → Environment Variables (Production + Preview).
Without these the app stays in localStorage mode — so this is the switch that turns on cloud.

### A5. Hosting
You already deploy on **Vercel** (`vercel.json` present). Confirm the project is connected to the repo and
the env vars above are set. Nothing else to host — Supabase is the backend.

### A6. The lab environment (out of app, per the self-study model)
The app *guides* lab setup (the new **Lab requirements & setup** guide) but does not provision VMs.
**You / students** provide the actual lab: Kali + Ubuntu(+DVWA) + optional Windows on one isolated
network. (Phase 4 could add cloud labs — deferred.)

> **Minimum to be "fully functional" for students today:** A1 + A2 + A3 (magic-link alone is enough) + A4
> + A5. Roughly 1–2 hours of dashboard work.

---

## B. Ongoing inputs (content & policy — only you can decide)

- **Course content** beyond Security+ (e.g. finishing the CySA+ stub): the tasks/steps/frameworks. I can
  scaffold; you own the curriculum truth.
- **Control-code curation** (Phase 1+): which published codes (NIST/CIS/OWASP/SY0) each task maps to — a
  subject-matter decision.
- **Validator definitions** (Phase 2): what "correct" looks like for each control (the pass condition).
- **Branding / legal:** product name, logo, terms, privacy policy, and the **consent + CLA wording**
  (Phase 1) — needs your/legal sign-off.
- **Instructor accounts:** which accounts get `is_instructor` (one SQL update each, or give me the emails).

---

## C. What each future phase needs from you (preview)

| Phase | I build | You provide |
|------|---------|-------------|
| **1 — Foundations** | events table + dual-write, `tenant_id`+RLS, control catalog, Validator interface, evidence hashing, consent fields, actor type | the **consent/CLA wording**; the initial **control catalog** decisions; approval of schema migrations |
| **2 — Ground truth** | `Environment` definitions, state-reading validators, signed attestations | the **pass conditions** per control; a **signing key** (or approve managed signing); reference baselines |
| **3 — Dual-use** | OSCAL/MSP posture reports, benchmark/eval packaging, read-model API | which **MSP/compliance outputs** matter; any **design-partner** client to validate against |
| **4 — Agent/ecosystem (deferred)** | MCP thin adapter, A2A, marketplace | decision to start; marketplace **legal/payment** setup |

---

## C2. For CertHatch (and other-platform) integration

See [`INTEGRATION_CERTHATCH.md`](./INTEGRATION_CERTHATCH.md). To wire the two platforms together, **you
decide / provide:**
- **Competency-ontology home:** where the shared ontology package lives (a separate repo / private npm
  registry) and **who owns its versioning** (semver, additive-only). Both platforms pin a version.
- **Shared OIDC issuer:** one identity provider both CertHatch and capstone-labs trust, so `subjectId` is the
  same person in both (can be the same Supabase/Auth issuer).
- **LRS host:** who runs the shared xAPI Learning Record Store (managed LRS or a simple statement store to
  start).
- **Consent wording:** sign-off on the `share-cross-platform` consent text and the data-processing roles
  between the two entities.
- **CertHatch side:** CertHatch must emit `CompetencyWeaknessDetected` (and xAPI statements) tagged with the
  shared competency IDs — that's work on the CertHatch repo, not this one.

> None of this blocks the capstone-labs MVP; it turns on once both platforms speak the shared kernel.

## D. Decisions still open (quick answers unblock me)

1. **Merge to `main` now?** (A1) — yes/no.
2. **Which sign-in methods** for launch? (A3) — magic-link only is fine to start.
3. **Product name** for the live app — keep "Capstone Lab", use "Capstone Labs", or other.
4. **CySA+** — leave locked, or prioritize authoring it after the MVP is live.
5. **Start Phase 1 foundations** after the MVP is live, or hold?

Once A1–A5 are done, the app is fully functional for self-study/team-practice. Everything in
[`ROADMAP.md`](./ROADMAP.md) builds on top without a rewrite.
